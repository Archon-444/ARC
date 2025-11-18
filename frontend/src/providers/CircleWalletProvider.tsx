/**
 * Circle Wallet Provider
 * Provides user-controlled wallet functionality with social login
 * No MetaMask required - users can sign in with Google, Facebook, or Apple
 *
 * This provider communicates with our backend Circle API routes,
 * which use the Circle User-Controlled Wallets SDK server-side.
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface CircleWallet {
  address: string;
  id: string;
  blockchain: string;
  state: string;
  createDate: string;
  updateDate?: string;
  name?: string;
  refId?: string;
}

interface CircleWalletContextType {
  // Wallet state
  wallets: CircleWallet[];
  activeWallet: CircleWallet | null;
  isConnected: boolean;
  loading: boolean;
  error: Error | null;

  // Authentication
  userToken: string | null;
  encryptionKey: string | null;

  // Wallet operations
  createWallet: (blockchains?: string[], accountType?: string) => Promise<string>;
  loadWallets: () => Promise<void>;
  setActiveWallet: (wallet: CircleWallet) => void;
  disconnectWallet: () => void;
}

const CircleWalletContext = createContext<CircleWalletContextType | null>(null);

export interface CircleWalletProviderProps {
  children: ReactNode;
}

/**
 * Circle Wallet Provider Component
 * Wraps app to provide Circle Wallet functionality
 *
 * @example
 * ```tsx
 * // In app layout or root component
 * <CircleWalletProvider>
 *   <YourApp />
 * </CircleWalletProvider>
 * ```
 */
export function CircleWalletProvider({ children }: CircleWalletProviderProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [wallets, setWallets] = useState<CircleWallet[]>([]);
  const [activeWallet, setActiveWalletState] = useState<CircleWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);

  const isConnected = activeWallet !== null && session !== null;

  /**
   * Get authentication tokens from backend
   */
  const getAuthTokens = useCallback(async (): Promise<{ userToken: string; encryptionKey: string } | null> => {
    if (!session?.user) {
      return null;
    }

    try {
      const userId = (session.user as any).userId || session.user.email;
      const email = session.user.email!;

      const response = await fetch('/api/circle/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get authentication tokens');
      }

      const data = await response.json();
      setUserToken(data.userToken);
      setEncryptionKey(data.encryptionKey);

      return {
        userToken: data.userToken,
        encryptionKey: data.encryptionKey,
      };
    } catch (err) {
      console.error('Failed to get auth tokens:', err);
      return null;
    }
  }, [session]);

  /**
   * Load wallets for the current user
   */
  const loadWallets = useCallback(async () => {
    if (!session?.user) {
      setWallets([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get auth tokens first
      let tokens = userToken ? { userToken, encryptionKey: encryptionKey! } : await getAuthTokens();

      if (!tokens) {
        throw new Error('Failed to authenticate');
      }

      // Fetch wallets from backend
      const response = await fetch(
        `/api/circle/wallet?userToken=${tokens.userToken}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load wallets');
      }

      const data = await response.json();
      setWallets(data.wallets || []);

      // Set first wallet as active if none selected
      if (data.wallets?.length > 0 && !activeWallet) {
        setActiveWalletState(data.wallets[0]);
      }
    } catch (err) {
      console.error('Failed to load wallets:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [session, userToken, encryptionKey, activeWallet, getAuthTokens]);

  /**
   * Create a new Circle wallet for the user
   *
   * NOTE: This initiates a challenge that requires the user to set up a PIN.
   * You will need to integrate Circle's Web SDK to complete the challenge.
   */
  const createWallet = useCallback(
    async (blockchains: string[] = ['ETH'], accountType: string = 'EOA'): Promise<string> => {
      if (!session?.user) {
        throw new Error('User not authenticated');
      }

      setLoading(true);
      setError(null);

      try {
        // Get auth tokens first
        let tokens = userToken ? { userToken, encryptionKey: encryptionKey! } : await getAuthTokens();

        if (!tokens) {
          throw new Error('Failed to authenticate');
        }

        const userId = (session.user as any).userId || session.user.email;

        // Create wallet via backend API
        const response = await fetch('/api/circle/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            userToken: tokens.userToken,
            blockchains,
            accountType,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create wallet');
        }

        const data = await response.json();

        console.log(`✅ Wallet creation initiated. Challenge ID: ${data.challengeId}`);
        console.log('⚠️  User must complete PIN setup to finalize wallet creation');

        // TODO: Integrate Circle's Web SDK to handle the challenge
        // For now, we'll reload wallets after a delay to check if wallet was created
        setTimeout(() => {
          loadWallets();
        }, 2000);

        return data.challengeId;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [session, userToken, encryptionKey, getAuthTokens, loadWallets]
  );

  /**
   * Set the active wallet
   */
  const setActiveWallet = useCallback((wallet: CircleWallet) => {
    setActiveWalletState(wallet);
    localStorage.setItem('circle_active_wallet_id', wallet.id);
  }, []);

  /**
   * Disconnect Circle wallet
   */
  const disconnectWallet = useCallback(() => {
    setActiveWalletState(null);
    setUserToken(null);
    setEncryptionKey(null);
    localStorage.removeItem('circle_active_wallet_id');
  }, []);

  // Auto-load wallets when user session is established
  useEffect(() => {
    if (sessionStatus === 'authenticated' && session) {
      loadWallets();
    } else if (sessionStatus === 'unauthenticated') {
      setWallets([]);
      setActiveWalletState(null);
      setUserToken(null);
      setEncryptionKey(null);
    }
  }, [sessionStatus, session]);

  // Restore active wallet from localStorage on mount
  useEffect(() => {
    const savedWalletId = localStorage.getItem('circle_active_wallet_id');
    if (savedWalletId && wallets.length > 0) {
      const wallet = wallets.find(w => w.id === savedWalletId);
      if (wallet) {
        setActiveWalletState(wallet);
      }
    }
  }, [wallets]);

  const contextValue: CircleWalletContextType = {
    wallets,
    activeWallet,
    isConnected,
    loading,
    error,
    userToken,
    encryptionKey,
    createWallet,
    loadWallets,
    setActiveWallet,
    disconnectWallet,
  };

  return (
    <CircleWalletContext.Provider value={contextValue}>
      {children}
    </CircleWalletContext.Provider>
  );
}

/**
 * Hook to use Circle Wallet context
 *
 * @example
 * ```tsx
 * function WalletInfo() {
 *   const { activeWallet, isConnected, disconnectWallet } = useCircleWallet();
 *
 *   if (!isConnected) return <div>Not connected</div>;
 *
 *   return (
 *     <div>
 *       <p>Address: {activeWallet?.address}</p>
 *       <button onClick={disconnectWallet}>Disconnect</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useCircleWallet() {
  const context = useContext(CircleWalletContext);

  if (!context) {
    throw new Error('useCircleWallet must be used within CircleWalletProvider');
  }

  return context;
}

/**
 * Hook to check if Circle Wallet is available
 * Useful for conditional rendering
 *
 * @example
 * ```tsx
 * function LoginOptions() {
 *   const isCircleAvailable = useIsCircleWalletAvailable();
 *   const { wallets } = useCircleWallet();
 *
 *   return (
 *     <div>
 *       <button>Connect MetaMask</button>
 *       {isCircleAvailable && wallets.length > 0 && (
 *         <button>Connect with Circle Wallet</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIsCircleWalletAvailable(): boolean {
  const { wallets } = useCircleWallet();
  return wallets.length > 0;
}
