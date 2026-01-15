/**
 * Circle Wallet Provider
 * Provides user-controlled wallet functionality with social login
 * No MetaMask required - users can sign in with Google, Facebook, or Apple
 *
 * This provider communicates with our backend Circle API routes,
 * which use the Circle User-Controlled Wallets SDK server-side.
 * The Web SDK is used for PIN/challenge handling in the browser.
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { W3SSdk } from '@circle-fin/w3s-pw-web-sdk';
import { CIRCLE_APP_ID, CircleWalletError } from '@/lib/circle';

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
  // Web SDK
  sdk: W3SSdk | null;
  isSDKReady: boolean;

  // Wallet state
  wallets: CircleWallet[];
  currentWallet: CircleWallet | null;
  isAuthenticated: boolean;
  isConnected: boolean;
  isLoading: boolean;
  isCreatingWallet: boolean;
  error: Error | null;

  // Authentication
  userToken: string | null;
  encryptionKey: string | null;

  // Wallet operations
  createUser: () => Promise<void>;
  createWallet: (blockchains?: string[], accountType?: string) => Promise<CircleWallet | null>;
  loadWallets: () => Promise<CircleWallet[]>;
  selectWallet: (walletId: string) => void;
  logout: () => void;
  disconnectWallet: () => void;

  // Challenge execution (for PIN setup)
  executeChallenge: (challengeId: string) => Promise<boolean>;
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

  // Web SDK state
  const [sdk, setSdk] = useState<W3SSdk | null>(null);
  const [isSDKReady, setIsSDKReady] = useState(false);

  // Wallet state
  const [wallets, setWallets] = useState<CircleWallet[]>([]);
  const [currentWallet, setCurrentWallet] = useState<CircleWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [isVaultMode, setIsVaultMode] = useState(false);

  const isAuthenticated = sessionStatus === 'authenticated';
  const isConnected = isAuthenticated && currentWallet !== null;
  const isLoading = loading || sessionStatus === 'loading';

  // Initialize Web SDK on mount
  useEffect(() => {
    if (!CIRCLE_APP_ID) {
      console.warn('Circle App ID not configured. Set NEXT_PUBLIC_CIRCLE_APP_ID in .env');
      return;
    }

    try {
      const webSDK = new W3SSdk();

      // Configure SDK
      webSDK.setAppSettings({
        appId: CIRCLE_APP_ID,
      });

      setSdk(webSDK);
      setIsSDKReady(true);
      console.log('✅ Circle Web SDK initialized');
    } catch (err) {
      console.error('Failed to initialize Circle Web SDK:', err);
      setError(err as Error);
    }
  }, []);

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
      setIsVaultMode(Boolean(data.vaultMode));

      if (!data.userToken || !data.encryptionKey) {
        return null;
      }

      setUserToken(data.userToken);
      setEncryptionKey(data.encryptionKey);

      // Configure Web SDK with authentication tokens
      if (sdk && isSDKReady) {
        sdk.setAuthentication({
          userToken: data.userToken,
          encryptionKey: data.encryptionKey,
        });
        console.log('✅ Circle SDK authenticated');
      }

      return {
        userToken: data.userToken,
        encryptionKey: data.encryptionKey,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get authentication tokens');
      console.error('Failed to get auth tokens:', err);
      setError(error);
      return null;
    }
  }, [session, sdk, isSDKReady]);

  const persistActiveWalletId = useCallback((walletId: string | null) => {
    if (typeof window === 'undefined') return;
    if (walletId) {
      localStorage.setItem('circle_active_wallet_id', walletId);
    } else {
      localStorage.removeItem('circle_active_wallet_id');
    }
  }, []);

  /**
   * Load wallets for the current user
   */
  const loadWallets = useCallback(async (): Promise<CircleWallet[]> => {
    if (!session?.user) {
      setWallets([]);
      setCurrentWallet(null);
      persistActiveWalletId(null);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const tokens =
        userToken && encryptionKey
          ? { userToken, encryptionKey }
          : await getAuthTokens();

      if (!isVaultMode && !tokens) {
        throw new Error('Failed to authenticate with Circle');
      }

      const userId = (session.user as any).userId || session.user.email;
      const walletQuery = new URLSearchParams({ userId });
      if (tokens?.userToken) {
        walletQuery.set('userToken', tokens.userToken);
      }

      const response = await fetch(`/api/circle/wallet?${walletQuery.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load wallets');
      }

      const data = await response.json();
      const walletList: CircleWallet[] = data.wallets || [];

      setWallets(walletList);

      const savedWalletId =
        typeof window !== 'undefined' ? localStorage.getItem('circle_active_wallet_id') : null;

      let nextWallet: CircleWallet | null = null;
      if (walletList.length > 0) {
        nextWallet =
          (savedWalletId && walletList.find((wallet) => wallet.id === savedWalletId)) ||
          walletList[0];
      }

      setCurrentWallet(nextWallet);
      persistActiveWalletId(nextWallet ? nextWallet.id : null);

      return walletList;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load wallets');
      console.error('Failed to load wallets:', err);
      setError(error);
      setWallets([]);
      setCurrentWallet(null);
      persistActiveWalletId(null);
      return [];
    } finally {
      setLoading(false);
    }
  }, [session, userToken, encryptionKey, isVaultMode, getAuthTokens, persistActiveWalletId]);

  /**
   * Execute a Circle challenge (PIN setup, transaction signing, etc.)
   *
   * This opens the Circle Web SDK UI for the user to complete the challenge
   */
  const executeChallenge = useCallback(
    async (challengeId: string): Promise<boolean> => {
      if (!sdk || !isSDKReady) {
        console.warn('Circle Web SDK not initialized. Challenge must be handled manually.');
        return false;
      }

      return new Promise((resolve) => {
        try {
          sdk.execute(challengeId, (executionError, result) => {
            if (executionError) {
              console.error('Challenge execution error:', executionError);
              setError(new Error(executionError.message || 'Challenge failed'));
              resolve(false);
              return;
            }

            console.log('Challenge completed successfully:', result);
            resolve(true);
          });
        } catch (err) {
          console.error('Failed to execute challenge:', err);
          setError(err as Error);
          resolve(false);
        }
      });
    },
    [sdk, isSDKReady]
  );

  /**
   * Ensure a Circle user exists and tokens are cached locally.
   */
  const createUser = useCallback(async () => {
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const tokens = await getAuthTokens();
      if (!tokens) {
        throw new Error('Failed to authenticate with Circle');
      }

      await loadWallets();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create Circle user');
      console.error('Failed to create Circle user:', err);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [session, getAuthTokens, loadWallets]);

  /**
   * Select an active wallet by ID.
   */
  const selectWallet = useCallback(
    (walletId: string) => {
      const wallet = wallets.find((item) => item.id === walletId) || null;
      setCurrentWallet(wallet);
      persistActiveWalletId(wallet ? wallet.id : null);
    },
    [wallets, persistActiveWalletId]
  );

  /**
   * Clear all wallet-related state and credentials.
   */
  const logout = useCallback(() => {
    setWallets([]);
    setCurrentWallet(null);
    setUserToken(null);
    setEncryptionKey(null);
    setIsVaultMode(false);
    persistActiveWalletId(null);
  }, [persistActiveWalletId]);

  /**
   * Disconnect wallet alias (kept for backwards compatibility).
   */
  const disconnectWallet = useCallback(() => {
    logout();
  }, [logout]);

  /**
   * Create a new Circle wallet for the user.
   */
  const createWallet = useCallback(
    async (blockchains: string[] = ['ETH'], accountType: string = 'EOA'): Promise<CircleWallet | null> => {
      if (!session?.user) {
        throw new Error('User not authenticated');
      }

      setIsCreatingWallet(true);
      setError(null);

      try {
        const tokens =
          userToken && encryptionKey
            ? { userToken, encryptionKey }
            : await getAuthTokens();

        if (!isVaultMode && !tokens) {
          throw new Error('Failed to authenticate with Circle');
        }

        const userId = (session.user as any).userId || session.user.email;

        const payload: Record<string, unknown> = {
          userId,
          blockchains,
          accountType,
        };

        if (tokens?.userToken) {
          payload.userToken = tokens.userToken;
        }

        const response = await fetch('/api/circle/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create wallet');
        }

        const data = await response.json();
        const challengeId: string | undefined = data.challengeId;
        const challengeToken: string | undefined = data.challengeToken;
        const challengeEncryptionKey: string | undefined = data.challengeEncryptionKey;

        if (challengeId) {
          if (sdk && isSDKReady && challengeToken && challengeEncryptionKey) {
            sdk.setAuthentication({
              userToken: challengeToken,
              encryptionKey: challengeEncryptionKey,
            });
          }

          const challengeCompleted = await executeChallenge(challengeId);
          if (!challengeCompleted) {
            throw new Error('Circle challenge execution failed');
          }
        }

        const previousIds = new Set(wallets.map((wallet) => wallet.id));
        const updatedWallets = await loadWallets();
        const newWallet =
          updatedWallets.find((wallet) => !previousIds.has(wallet.id)) ||
          updatedWallets.find((wallet) => wallet.state === 'LIVE') ||
          updatedWallets[0] ||
          null;

        if (newWallet) {
          selectWallet(newWallet.id);
        }

        return newWallet;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create wallet');
        console.error('Failed to create wallet:', err);
        setError(error);
        throw error;
      } finally {
        setIsCreatingWallet(false);
      }
    },
    [
      session,
      userToken,
      encryptionKey,
      isVaultMode,
      getAuthTokens,
      executeChallenge,
      loadWallets,
      wallets,
      selectWallet,
    ]
  );

  // Auto-load wallets when user session is established
  useEffect(() => {
    if (sessionStatus === 'authenticated' && session) {
      loadWallets();
    } else if (sessionStatus === 'unauthenticated') {
      logout();
    }
  }, [sessionStatus, session, loadWallets, logout]);

  const contextValue: CircleWalletContextType = {
    sdk,
    isSDKReady,
    wallets,
    currentWallet,
    isAuthenticated,
    isConnected,
    isLoading,
    isCreatingWallet,
    error,
    userToken,
    encryptionKey,
    createUser,
    createWallet,
    loadWallets,
    selectWallet,
    logout,
    disconnectWallet,
    executeChallenge,
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
 *   const { currentWallet, isConnected, disconnectWallet } = useCircleWallet();
 *
 *   if (!isConnected) return <div>Not connected</div>;
 *
 *   return (
 *     <div>
 *       <p>Address: {currentWallet?.address}</p>
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
