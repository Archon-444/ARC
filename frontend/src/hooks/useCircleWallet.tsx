/**
 * Circle Wallet Hook
 *
 * Manages Circle User-Controlled Wallets state and operations
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { W3SSdk } from '@circle-fin/user-controlled-wallets';
import {
  initializeCircleSDK,
  CircleWallet,
  CircleUser,
  CircleChallenge,
  CircleWalletError,
  CIRCLE_APP_ID,
} from '@/lib/circle';
import { useToast } from './useToast';

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
  login: (userToken: string, encryptionKey: string) => Promise<void>;
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
   * Login with Circle user token
   */
  const login = useCallback(
    async (userToken: string, encryptionKey: string) => {
      if (!sdk) {
        throw new CircleWalletError('SDK not initialized');
      }

      setIsLoading(true);
      try {
        // In a real implementation, you would call Circle API to get user details
        // For now, we'll create a mock user
        const mockUser: CircleUser = {
          userId: userToken,
          wallets: [],
        };

        setUser(mockUser);
        setIsAuthenticated(true);
        localStorage.setItem('circle_user', JSON.stringify(mockUser));

        // Fetch user's wallets
        await refreshWallets();

        showSuccess('Connected to Circle Wallet');
      } catch (error) {
        console.error('Login failed:', error);
        showError('Failed to connect', 'Please try again');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [sdk, showError, showSuccess]
  );

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

    showSuccess('Disconnected from Circle Wallet');
  }, [showSuccess]);

  /**
   * Create new wallet
   */
  const createWallet = useCallback(async (): Promise<CircleWallet | null> => {
    if (!sdk || !user) {
      throw new CircleWalletError('SDK not initialized or user not logged in');
    }

    setIsCreatingWallet(true);
    try {
      // In a real implementation, you would call Circle API to create wallet
      // For now, we'll create a mock wallet
      const mockWallet: CircleWallet = {
        id: `wallet_${Date.now()}`,
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        blockchain: 'ARC',
        state: 'LIVE',
        createDate: new Date().toISOString(),
        updateDate: new Date().toISOString(),
      };

      const updatedWallets = [...wallets, mockWallet];
      setWallets(updatedWallets);
      setCurrentWallet(mockWallet);

      localStorage.setItem('circle_wallets', JSON.stringify(updatedWallets));
      localStorage.setItem('circle_current_wallet', JSON.stringify(mockWallet));

      showSuccess('Wallet created successfully');
      return mockWallet;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      showError('Failed to create wallet', 'Please try again');
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
   * Refresh wallets from Circle API
   */
  const refreshWallets = useCallback(async () => {
    if (!sdk || !user) return;

    setIsLoading(true);
    try {
      // In a real implementation, you would fetch wallets from Circle API
      // For now, we'll use the wallets from state
      const savedWallets = localStorage.getItem('circle_wallets');
      if (savedWallets) {
        setWallets(JSON.parse(savedWallets));
      }
    } catch (error) {
      console.error('Failed to refresh wallets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sdk, user]);

  /**
   * Execute challenge (for transaction signing)
   */
  const executeChallenge = useCallback(
    async (challengeId: string): Promise<boolean> => {
      if (!sdk) {
        throw new CircleWalletError('SDK not initialized');
      }

      try {
        // In a real implementation, you would execute the challenge via SDK
        // For now, we'll return true to simulate success
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
        login,
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
