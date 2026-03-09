export type ProfileGatewayState =
  | 'disconnected'
  | 'connected'
  | 'loading'
  | 'switching'
  | 'empty'
  | 'error';

export type ProfileSnapshot = {
  holdingsCount: number;
  listingsCount: number;
  activityCount: number;
  rewardsCount?: number;
  walletScore?: number;
};

export type QuickAction = {
  key: 'profile' | 'rewards' | 'settings' | 'launch' | 'explore';
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};

export function getProfileSnapshot(input: {
  holdings?: unknown[];
  listings?: unknown[];
  activity?: unknown[];
  rewardsCount?: number;
  walletScore?: number;
}): ProfileSnapshot {
  return {
    holdingsCount: input.holdings?.length ?? 0,
    listingsCount: input.listings?.length ?? 0,
    activityCount: input.activity?.length ?? 0,
    rewardsCount: input.rewardsCount ?? 0,
    walletScore: input.walletScore,
  };
}

export function isEmptyProfileSnapshot(snapshot?: ProfileSnapshot) {
  if (!snapshot) return true;

  return (
    snapshot.holdingsCount === 0 &&
    snapshot.listingsCount === 0 &&
    snapshot.activityCount === 0
  );
}

export function formatProfileAddress(address?: string) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
