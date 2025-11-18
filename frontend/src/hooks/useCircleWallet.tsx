/**
 * Circle Wallet Hook
 *
 * Manages Circle User-Controlled Wallets state and operations
 * NOW WITH REAL API INTEGRATION (no mocks!)
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { W3SSdk } from '@circle-fin/user-controlled-wallets';
import {
  initializeCircleSDK,
  CircleWallet,
  CircleUser,
  CircleWalletError,
  CIRCLE_APP_ID,
} from '@/lib/circle';
import { useToast } from './useToast';
import { useAccount } from 'wagmi';

interface CircleWalletContextValue {
  // SDK
  sdk: W3SSdk | null;
  isSDKReady: boolean;

  // User & Wallets
  user: CircleUser | null;
  wallets: CircleWallet[];
  currentWallet: CircleWallet | null;
  isAuthenticated: boolean;

  // Loading states
  isLoading: boolean;
  isCreatingWallet: boolean;

  // Operations
  createUser: () => Promise<void>;
  logout: () => void;
  createWallet: () => Promise<CircleWallet | null>;
  selectWallet: (walletId: string) => void;
  refreshWallets: () => Promise<void>;

  // Challenges (for transactions)
  executeChallenge: (challengeId: string) => Promise<boolean>;
}

const CircleWalletContext = createContext<CircleWalletContextValue | undefined>(undefined);

export function CircleWalletProvider({ children }: { children: ReactNode }) {
  const { error: showError, success: showSuccess } = useToast();
  const { address: connectedAddress } = useAccount();

  // SDK
  const [sdk, setSdk] = useState<W3SSdk | null>(null);
  const [isSDKReady, setIsSDKReady] = useState(false);

  // User & Wallets
  const [user, setUser] = useState<CircleUser | null>(null);
  const [wallets, setWallets] = useState<CircleWallet[]>([]);
  const [currentWallet, setCurrentWallet] = useState<CircleWallet | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  // Initialize SDK on mount
  useEffect(() => {
    if (!CIRCLE_APP_ID) {
      console.warn('Circle App ID not configured');
      return;
    }

    const initializedSDK = initializeCircleSDK();
    if (initializedSDK) {
      setSdk(initializedSDK);
      setIsSDKReady(true);
    }
  }, []);

  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('circle_user');
    const savedWallets = localStorage.getItem('circle_wallets');
    const savedCurrentWallet = localStorage.getItem('circle_current_wallet');

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Failed to parse saved user:', err);
      }
    }

    if (savedWallets) {
      try {
        setWallets(JSON.parse(savedWallets));
      } catch (err) {
        console.error('Failed to parse saved wallets:', err);
      }
    }

    if (savedCurrentWallet) {
      try {
        setCurrentWallet(JSON.parse(savedCurrentWallet));
      } catch (err) {
        console.error('Failed to parse saved current wallet:', err);
      }
    }
  }, []);

  /**
   * Create Circle user (REAL API CALL)
   */
  const createUser = useCallback(async () => {
    if (!sdk) {
      throw new CircleWalletError('SDK not initialized');
    }

    setIsLoading(true);
    try {
      // Use connected wallet address as userId (or generate unique ID)
      const userId = connectedAddress || `user_${Date.now()}`;

      // Call backend API to create Circle user
      const response = await fetch('/api/circle/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new CircleWalletError(errorData.error || 'Failed to create user');
      }

      const data = await response.json();

      // Set SDK authentication
      sdk.setAppSettings({
        appId: CIRCLE_APP_ID!,
      });
      sdk.setAuthentication({
        userToken: data.userToken,
        encryptionKey: data.encryptionKey,
      });

      // Save user
      const circleUser: CircleUser = {
        userId: data.userId,
        wallets: [],
      };

      setUser(circleUser);
      setIsAuthenticated(true);
      localStorage.setItem('circle_user', JSON.stringify(circleUser));
      localStorage.setItem('circle_user_token', data.userToken);
      localStorage.setItem('circle_encryption_key', data.encryptionKey);

      // Fetch existing wallets
      await refreshWallets();

      showSuccess('Circle account created');
    } catch (error) {
      console.error('User creation failed:', error);
      showError('Failed to create account', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sdk, connectedAddress, showError, showSuccess]);

  /**
   * Logout
   */
  const logout = useCallback(() => {
    setUser(null);
    setWallets([]);
    setCurrentWallet(null);
    setIsAuthenticated(false);

    localStorage.removeItem('circle_user');
    localStorage.removeItem('circle_wallets');
    localStorage.removeItem('circle_current_wallet');
    localStorage.removeItem('circle_user_token');
    localStorage.removeItem('circle_encryption_key');

    showSuccess('Disconnected from Circle Wallet');
  }, [showSuccess]);

  /**
   * Create new wallet (REAL API CALL)
   */
  const createWallet = useCallback(async (): Promise<CircleWallet | null> => {
    if (!sdk || !user) {
      throw new CircleWalletError('SDK not initialized or user not logged in');
    }

    const userToken = localStorage.getItem('circle_user_token');
    if (!userToken) {
      throw new CircleWalletError('User token not found. Please log in again.');
    }

    setIsCreatingWallet(true);
    try {
      // Call backend API to create wallet challenge
      const response = await fetch('/api/circle/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          userToken,
          blockchain: 'MATIC-AMOY', // Polygon Amoy testnet (Arc not yet supported)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new CircleWalletError(errorData.error || 'Failed to create wallet');
      }

      const { challengeId } = await response.json();

      // Execute challenge with SDK (user PIN + biometric)
      const success = await executeChallenge(challengeId);

      if (!success) {
        throw new CircleWalletError('Challenge execution failed');
      }

      // Refresh wallets to get the new wallet
      await refreshWallets();

      // Get the newly created wallet
      const newWallet = wallets[wallets.length - 1];

      if (newWallet) {
        setCurrentWallet(newWallet);
        localStorage.setItem('circle_current_wallet', JSON.stringify(newWallet));
        showSuccess('Wallet created successfully');
        return newWallet;
      }

      return null;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      showError('Failed to create wallet', error instanceof Error ? error.message : 'Unknown error');
      return null;
    } finally {
      setIsCreatingWallet(false);
    }
  }, [sdk, user, wallets, showError, showSuccess]);

  /**
   * Select wallet
   */
  const selectWallet = useCallback(
    (walletId: string) => {
      const wallet = wallets.find((w) => w.id === walletId);
      if (wallet) {
        setCurrentWallet(wallet);
        localStorage.setItem('circle_current_wallet', JSON.stringify(wallet));
      }
    },
    [wallets]
  );

  /**
   * Refresh wallets from Circle API (REAL API CALL)
   */
  const refreshWallets = useCallback(async () => {
    if (!sdk || !user) return;

    const userToken = localStorage.getItem('circle_user_token');
    if (!userToken) return;

    setIsLoading(true);
    try {
      // Call backend API to get wallets
      const response = await fetch(
        `/api/circle/wallets?userId=${user.userId}&userToken=${encodeURIComponent(userToken)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new CircleWalletError(errorData.error || 'Failed to fetch wallets');
      }

      const { wallets: fetchedWallets } = await response.json();

      setWallets(fetchedWallets);
      localStorage.setItem('circle_wallets', JSON.stringify(fetchedWallets));

      // Set first wallet as current if none selected
      if (!currentWallet && fetchedWallets.length > 0) {
        setCurrentWallet(fetchedWallets[0]);
        localStorage.setItem('circle_current_wallet', JSON.stringify(fetchedWallets[0]));
      }
    } catch (error) {
      console.error('Failed to refresh wallets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sdk, user, currentWallet]);

  /**
   * Execute challenge (REAL SDK CALL)
   */
  const executeChallenge = useCallback(
    async (challengeId: string): Promise<boolean> => {
      if (!sdk) {
        throw new CircleWalletError('SDK not initialized');
      }

      try {
        // Execute challenge via SDK - this will prompt user for PIN + biometric
        await sdk.execute(challengeId, (error, result) => {
          if (error) {
            console.error('Challenge execution error:', error);
            return false;
          }
          return true;
        });

        return true;
      } catch (error) {
        console.error('Challenge execution failed:', error);
        return false;
      }
    },
    [sdk]
  );

  return (
    <CircleWalletContext.Provider
      value={{
        sdk,
        isSDKReady,
        user,
        wallets,
        currentWallet,
        isAuthenticated,
        isLoading,
        isCreatingWallet,
        createUser,
        logout,
        createWallet,
        selectWallet,
        refreshWallets,
        executeChallenge,
      }}
    >
      {children}
    </CircleWalletContext.Provider>
  );
}

export function useCircleWallet() {
  const context = useContext(CircleWalletContext);
  if (context === undefined) {
    throw new Error('useCircleWallet must be used within a CircleWalletProvider');
  }
  return context;
}
