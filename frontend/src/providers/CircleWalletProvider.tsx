/**
 * Circle Wallet Provider
 * Provides user-controlled wallet functionality with social login
 * No MetaMask required - users can sign in with Google, Facebook, or Apple
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Type definitions for Circle SDK (will be replaced when SDK types are available)
interface CircleWalletSDK {
  setAuthentication: (params: { userToken: string; encryptionKey: string }) => Promise<void>;
  createWallet: () => Promise<{ walletAddress: string }>;
  recoverWallet: (params: { pin: string }) => Promise<void>;
  executeTransaction: (params: any) => Promise<{ txHash: string }>;
}

interface CircleWallet {
  address: string;
  id: string;
  userId: string;
  createDate: string;
}

interface CircleWalletContextType {
  // SDK instance
  sdk: CircleWalletSDK | null;
  isInitialized: boolean;

  // Wallet state
  wallet: CircleWallet | null;
  isConnected: boolean;
  loading: boolean;
  error: Error | null;

  // Authentication
  userToken: string | null;
  encryptionKey: string | null;

  // Wallet operations
  createWallet: (userId: string, email: string) => Promise<string>;
  connectWallet: (walletAddress: string) => Promise<void>;
  disconnectWallet: () => void;
  recoverWallet: (pin: string) => Promise<void>;

  // Transaction
  sendTransaction: (params: any) => Promise<string>;
}

const CircleWalletContext = createContext<CircleWalletContextType | null>(null);

export interface CircleWalletProviderProps {
  children: ReactNode;
  appId?: string;
  apiKey?: string;
}

/**
 * Circle Wallet Provider Component
 * Wraps app to provide Circle Wallet functionality
 *
 * @example
 * ```tsx
 * // In app layout or root component
 * <CircleWalletProvider appId={process.env.NEXT_PUBLIC_CIRCLE_APP_ID}>
 *   <YourApp />
 * </CircleWalletProvider>
 * ```
 */
export function CircleWalletProvider({
  children,
  appId,
  apiKey,
}: CircleWalletProviderProps) {
  const [sdk, setSdk] = useState<CircleWalletSDK | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [wallet, setWallet] = useState<CircleWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);

  const isConnected = wallet !== null;

  // Initialize Circle SDK
  useEffect(() => {
    const initSDK = async () => {
      try {
        // TODO: Replace with actual Circle SDK initialization when available
        // const W3SSdk = (await import('@circle-fin/user-controlled-wallets')).W3SSdk;
        // const w3sSdk = new W3SSdk({
        //   appSettings: {
        //     appId: appId || process.env.NEXT_PUBLIC_CIRCLE_APP_ID!,
        //   },
        // });

        // For now, create a mock SDK for development
        const mockSdk: CircleWalletSDK = {
          setAuthentication: async (params) => {
            console.log('Mock: Setting authentication', params);
            setUserToken(params.userToken);
            setEncryptionKey(params.encryptionKey);
          },
          createWallet: async () => {
            console.log('Mock: Creating wallet');
            const mockAddress = `0x${Math.random().toString(16).slice(2, 42)}`;
            return { walletAddress: mockAddress };
          },
          recoverWallet: async (params) => {
            console.log('Mock: Recovering wallet', params);
          },
          executeTransaction: async (params) => {
            console.log('Mock: Executing transaction', params);
            const mockTxHash = `0x${Math.random().toString(16).slice(2, 66)}`;
            return { txHash: mockTxHash };
          },
        };

        setSdk(mockSdk);
        setIsInitialized(true);

        console.log('✅ Circle SDK initialized (mock mode for development)');
        console.log('⚠️  Replace with actual Circle SDK in production');
      } catch (err) {
        console.error('Failed to initialize Circle SDK:', err);
        setError(err as Error);
      }
    };

    initSDK();
  }, [appId]);

  /**
   * Create a new Circle wallet for a user
   * Called after social login
   */
  const createWallet = useCallback(
    async (userId: string, email: string): Promise<string> => {
      if (!sdk) {
        throw new Error('Circle SDK not initialized');
      }

      setLoading(true);
      setError(null);

      try {
        // 1. Get authentication tokens from backend
        const authResponse = await fetch('/api/circle/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, email }),
        });

        if (!authResponse.ok) {
          throw new Error('Failed to get authentication tokens');
        }

        const { userToken, encryptionKey } = await authResponse.json();

        // 2. Set authentication in SDK
        await sdk.setAuthentication({ userToken, encryptionKey });

        // 3. Create wallet via API
        const walletResponse = await fetch('/api/circle/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, email }),
        });

        if (!walletResponse.ok) {
          throw new Error('Failed to create wallet');
        }

        const walletData = await walletResponse.json();

        // 4. Set wallet in state
        setWallet({
          address: walletData.wallet.address,
          id: walletData.wallet.id,
          userId,
          createDate: walletData.wallet.createDate,
        });

        return walletData.wallet.address;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sdk]
  );

  /**
   * Connect to an existing Circle wallet
   */
  const connectWallet = useCallback(
    async (walletAddress: string) => {
      setLoading(true);
      setError(null);

      try {
        // Fetch wallet details from backend
        const response = await fetch(
          `/api/circle/wallet?address=${walletAddress}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch wallet details');
        }

        const walletData = await response.json();

        setWallet({
          address: walletData.wallet.address,
          id: walletData.wallet.id,
          userId: walletData.wallet.userId || '',
          createDate: walletData.wallet.createDate,
        });

        // Save to localStorage for persistence
        localStorage.setItem('circle_wallet_address', walletAddress);
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Disconnect Circle wallet
   */
  const disconnectWallet = useCallback(() => {
    setWallet(null);
    setUserToken(null);
    setEncryptionKey(null);
    localStorage.removeItem('circle_wallet_address');
  }, []);

  /**
   * Recover wallet with PIN
   */
  const recoverWallet = useCallback(
    async (pin: string) => {
      if (!sdk) {
        throw new Error('Circle SDK not initialized');
      }

      setLoading(true);
      setError(null);

      try {
        await sdk.recoverWallet({ pin });
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sdk]
  );

  /**
   * Send transaction using Circle wallet
   */
  const sendTransaction = useCallback(
    async (params: any): Promise<string> => {
      if (!sdk) {
        throw new Error('Circle SDK not initialized');
      }

      if (!wallet) {
        throw new Error('No wallet connected');
      }

      setLoading(true);
      setError(null);

      try {
        const result = await sdk.executeTransaction({
          ...params,
          from: wallet.address,
        });

        return result.txHash;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sdk, wallet]
  );

  // Auto-connect on mount if wallet address in localStorage
  useEffect(() => {
    const savedAddress = localStorage.getItem('circle_wallet_address');
    if (savedAddress && !wallet) {
      connectWallet(savedAddress).catch(console.error);
    }
  }, [connectWallet, wallet]);

  const contextValue: CircleWalletContextType = {
    sdk,
    isInitialized,
    wallet,
    isConnected,
    loading,
    error,
    userToken,
    encryptionKey,
    createWallet,
    connectWallet,
    disconnectWallet,
    recoverWallet,
    sendTransaction,
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
 *   const { wallet, isConnected, disconnectWallet } = useCircleWallet();
 *
 *   if (!isConnected) return <div>Not connected</div>;
 *
 *   return (
 *     <div>
 *       <p>Address: {wallet?.address}</p>
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
 *
 *   return (
 *     <div>
 *       <button>Connect MetaMask</button>
 *       {isCircleAvailable && (
 *         <button>Connect with Social Login</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIsCircleWalletAvailable(): boolean {
  const { isInitialized } = useCircleWallet();
  return isInitialized;
}
