'use client';

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import {
  ProfileGatewayState,
  ProfileSnapshot,
  getProfileSnapshot,
  isEmptyProfileSnapshot,
} from '@/lib/profile';

export type UseProfileGatewayResult = {
  state: ProfileGatewayState;
  walletAddress?: string;
  snapshot?: ProfileSnapshot;
  isConnected: boolean;
  isLoading: boolean;
  shouldOfferHandoff: boolean;
  openMyProfileHref?: string;
  connectWallet: () => Promise<void>;
};

export function useProfileGateway(): UseProfileGatewayResult {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();

  const isWalletReady = !(isConnecting || isReconnecting);
  const isSwitchingWallet = isReconnecting;

  const snapshot = useMemo(() => {
    if (!address) return undefined;

    return getProfileSnapshot({
      holdings: [],
      listings: [],
      activity: [],
      rewardsCount: 0,
    });
  }, [address]);

  const state: ProfileGatewayState = useMemo(() => {
    if (!isWalletReady) return 'loading';
    if (isSwitchingWallet) return 'switching';
    if (!address || !isConnected) return 'disconnected';
    if (isEmptyProfileSnapshot(snapshot)) return 'empty';
    return 'connected';
  }, [address, isConnected, isSwitchingWallet, isWalletReady, snapshot]);

  return {
    state,
    walletAddress: address,
    snapshot,
    isConnected: Boolean(address && isConnected),
    isLoading: state === 'loading' || state === 'switching',
    shouldOfferHandoff: state === 'connected' || state === 'empty',
    openMyProfileHref: address ? `/profile/${address}` : undefined,
    connectWallet: async () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  };
}
