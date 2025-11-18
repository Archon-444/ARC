/**
 * Circle Wallet Hook
 *
 * Re-exports the Circle Wallet hook from the provider
 * Use this hook to access Circle wallet functionality in your components
 *
 * The provider integrates:
 * - NextAuth for social login (Google/Facebook/Apple)
 * - Backend Circle SDK for user/wallet management
 * - Frontend Web SDK for PIN/challenge handling
 *
 * @example
 * ```tsx
 * import { useCircleWallet } from '@/hooks/useCircleWallet';
 *
 * function MyComponent() {
 *   const {
 *     wallets,
 *     activeWallet,
 *     isConnected,
 *     loading,
 *     createWallet,
 *     executeChallenge,
 *     sdk,
 *     isSDKReady
 *   } = useCircleWallet();
 *
 *   const handleCreateWallet = async () => {
 *     try {
 *       const challengeId = await createWallet(['ETH']);
 *       console.log('Wallet creation initiated:', challengeId);
 *       // Challenge is automatically executed by the provider
 *     } catch (error) {
 *       console.error('Failed to create wallet:', error);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {isConnected && (
 *         <p>Wallet: {activeWallet?.address}</p>
 *       )}
 *       <button onClick={handleCreateWallet} disabled={loading}>
 *         Create Wallet
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */

export {
  CircleWalletProvider,
  useCircleWallet,
  useIsCircleWalletAvailable,
  type CircleWalletProviderProps,
} from '@/providers/CircleWalletProvider';
