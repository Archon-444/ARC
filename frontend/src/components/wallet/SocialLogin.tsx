/**
 * Social Login Component
 * Provides Google, Facebook, and Apple login for Circle Wallets
 * No MetaMask required - users get a wallet automatically
 * Uses NextAuth.js for REAL OAuth authentication (NO MOCKS)
 */

'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useCircleWallet } from '@/hooks/useCircleWallet';

interface SocialLoginProps {
  onSuccess?: (walletAddress: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

/**
 * Social Login Component
 *
 * Provides seamless social login with automatic wallet creation
 * Users can sign in with Google, Facebook, or Apple and get a Circle wallet
 *
 * @example
 * ```tsx
 * function LoginModal() {
 *   return (
 *     <div>
 *       <h2>Sign in to ArcMarket</h2>
 *       <SocialLogin
 *         onSuccess={(address) => {
 *           console.log('Wallet created:', address);
 *           router.push('/profile');
 *         }}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function SocialLogin({ onSuccess, onError, className = '' }: SocialLoginProps) {
  const { data: session, status } = useSession();
  const { createWallet, activeWallet, isSDKReady } = useCircleWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);

  // When OAuth session is established, create Circle wallet
  useEffect(() => {
    if (session && provider && !activeWallet) {
      handleCreateWallet();
    }
  }, [session, provider, activeWallet]);

  /**
   * Create Circle wallet after successful OAuth
   */
  const handleCreateWallet = async () => {
    if (!session?.user?.email) {
      setError('No user email found in session');
      return;
    }

    setLoading(true);
    try {
      // Create Circle wallet (user creation is handled automatically)
      const challengeId = await createWallet();

      if (challengeId) {
        // Wallet creation initiated successfully
        console.log('✅ OAuth + Circle wallet creation initiated');
        onSuccess?.(''); // Wallet address will be available after challenge completion
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      onError?.(error);
      console.error('Wallet creation failed:', error);
    } finally {
      setLoading(false);
      setProvider(null);
    }
  };

  /**
   * Handle Google OAuth login
   * Uses NextAuth.js Google provider
   */
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setProvider('google');

    try {
      // Trigger NextAuth Google OAuth flow
      await signIn('google', {
        redirect: false,
        callbackUrl: window.location.href,
      });
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      onError?.(error);
      console.error('Google OAuth failed:', error);
      setLoading(false);
      setProvider(null);
    }
  };

  /**
   * Handle Facebook OAuth login
   * Uses NextAuth.js Facebook provider
   */
  const handleFacebookLogin = async () => {
    setLoading(true);
    setError(null);
    setProvider('facebook');

    try {
      // Trigger NextAuth Facebook OAuth flow
      await signIn('facebook', {
        redirect: false,
        callbackUrl: window.location.href,
      });
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      onError?.(error);
      console.error('Facebook OAuth failed:', error);
      setLoading(false);
      setProvider(null);
    }
  };

  /**
   * Handle Apple OAuth login
   * Uses NextAuth.js Apple provider
   */
  const handleAppleLogin = async () => {
    setLoading(true);
    setError(null);
    setProvider('apple');

    try {
      // Trigger NextAuth Apple OAuth flow
      await signIn('apple', {
        redirect: false,
        callbackUrl: window.location.href,
      });
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      onError?.(error);
      console.error('Apple OAuth failed:', error);
      setLoading(false);
      setProvider(null);
    }
  };

  const isLoading = loading || status === 'loading';
  const isDisabled = !isSDKReady || isLoading;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Sign in with Social
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No wallet or seed phrases required
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {session && activeWallet && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-sm text-green-800 dark:text-green-200">
            ✅ Signed in as {session.user?.email}
          </p>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            Wallet: {activeWallet.address.slice(0, 6)}...{activeWallet.address.slice(-4)}
          </p>
        </div>
      )}

      {/* Google Login */}
      <button
        onClick={handleGoogleLogin}
        disabled={isDisabled}
        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 rounded-lg px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
      >
        {/* Google Icon */}
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {isLoading ? 'Connecting...' : 'Continue with Google'}
      </button>

      {/* Facebook Login */}
      <button
        onClick={handleFacebookLogin}
        disabled={isDisabled}
        className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white rounded-lg px-6 py-3 hover:bg-[#166FE5] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
      >
        {/* Facebook Icon */}
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        {isLoading ? 'Connecting...' : 'Continue with Facebook'}
      </button>

      {/* Apple Login */}
      <button
        onClick={handleAppleLogin}
        disabled={isDisabled}
        className="w-full flex items-center justify-center gap-3 bg-black dark:bg-white text-white dark:text-black rounded-lg px-6 py-3 hover:bg-gray-900 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
      >
        {/* Apple Icon */}
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
        {isLoading ? 'Connecting...' : 'Continue with Apple'}
      </button>

      {/* Circle Security Info */}
      <div className="pt-4 text-center border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          🔒 Your wallet is secured by{' '}
          <a
            href="https://www.circle.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Circle
          </a>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          No seed phrases to remember or lose
        </p>
      </div>

      {/* OAuth Setup Notice */}
      {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            ⚠️ OAuth providers not configured. Set up Google/Facebook/Apple credentials in .env.local
          </p>
        </div>
      )}

      {/* Traditional Wallet Option */}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Have a wallet?{' '}
          <button
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            onClick={() => {
              // This would trigger traditional wallet connection
              console.log('Connect traditional wallet');
            }}
          >
            Connect MetaMask
          </button>
        </p>
      </div>
    </div>
  );
}

/**
 * Wallet Selector Component
 * Shows both Circle social login and traditional wallet options
 *
 * @example
 * ```tsx
 * function ConnectModal() {
 *   return (
 *     <div>
 *       <WalletSelector
 *         onSocialLogin={(address) => console.log('Social:', address)}
 *         onMetaMaskConnect={() => console.log('MetaMask')}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function WalletSelector({
  onSocialLogin,
  onMetaMaskConnect,
  className = '',
}: {
  onSocialLogin?: (address: string) => void;
  onMetaMaskConnect?: () => void;
  className?: string;
}) {
  const [showSocial, setShowSocial] = useState(true);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Toggle Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <button
          onClick={() => setShowSocial(true)}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${showSocial
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
        >
          Social Login
        </button>
        <button
          onClick={() => setShowSocial(false)}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${!showSocial
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
        >
          Wallet
        </button>
      </div>

      {/* Content */}
      {showSocial ? (
        <SocialLogin onSuccess={onSocialLogin} />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Connect your existing wallet
          </p>
          <button
            onClick={onMetaMaskConnect}
            className="w-full flex items-center justify-center gap-3 bg-orange-500 text-white rounded-lg px-6 py-3 hover:bg-orange-600 transition-all duration-200 font-medium"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.05 0L13.68 6.16l1.55-3.63L22.05 0z" />
              <path d="M1.95 0l8.3 6.22-1.48-3.69L1.95 0zM18.8 17.35l-2.24 3.43 4.78 1.32 1.37-4.68-3.91-.07zM.28 17.42l1.36 4.68 4.78-1.32-2.24-3.43-3.9.07z" />
            </svg>
            Connect MetaMask
          </button>
        </div>
      )}
    </div>
  );
}
