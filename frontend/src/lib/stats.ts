import { shortenAddress } from '@/lib/rewards';

export type AnalyticsLens = 'overview' | 'inventory' | 'flow' | 'shell';

export const LENS_LABELS: Record<AnalyticsLens, string> = {
  overview: 'Overview',
  inventory: 'Inventory',
  flow: 'Flow',
  shell: 'Shell routes',
};

// Re-export shortenAddress so stats consumers can import from here
export { shortenAddress };
