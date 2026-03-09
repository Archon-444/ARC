import {
  ArrowRight,
  BarChart3,
  Clock3,
  Layers3,
  Radio,
  Rocket,
  Shield,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';

export interface MarketplaceStats {
  totalVolume: string;
  dailyVolume: string;
  totalSales: number;
  dailySales: number;
  activeListings: number;
  activeAuctions: number;
}

export type FeedTab = 'new' | 'hot' | 'graduating';

export const HERO_KPIS = [
  {
    label: 'Launch to market',
    value: 'Creator flow already live',
    hint: 'Start from launch, resolve into token routes, and carry context forward.',
    icon: Rocket,
  },
  {
    label: 'Discovery shell',
    value: 'Homepage as command center',
    hint: 'Move between fresh launches, momentum, stats, and next-step routes without friction.',
    icon: Radio,
  },
  {
    label: 'Trust + action',
    value: 'Signals before execution',
    hint: 'Market pulse, route continuity, and trader cues reduce hesitation before entry.',
    icon: Shield,
  },
];

export const FEED_LABELS: Record<FeedTab, { title: string; subtitle: string }> = {
  new: {
    title: 'New launches',
    subtitle: 'Fresh markets with the earliest price discovery.',
  },
  hot: {
    title: 'Hot right now',
    subtitle: 'Tokens and collections with the strongest recent momentum.',
  },
  graduating: {
    title: 'Near graduation',
    subtitle: 'Markets closing in on the bonding-curve threshold.',
  },
};

export const CONNECTED_SURFACES = [
  {
    title: 'Launch flow',
    description: 'Open the guided creator route and move directly into live token markets.',
    href: '/launch',
    cta: 'Open launch',
    icon: Rocket,
  },
  {
    title: 'Explore',
    description: 'Jump into the broader discovery surface for listings, auctions, and token routes.',
    href: '/explore',
    cta: 'Browse markets',
    icon: Layers3,
  },
  {
    title: 'Stats',
    description: 'Track the macro picture behind ARC activity and use it to frame trading decisions.',
    href: '/stats',
    cta: 'View stats',
    icon: BarChart3,
  },
  {
    title: 'Rewards',
    description: 'Stay connected to retention and participation loops after discovery and trading.',
    href: '/rewards',
    cta: 'Open rewards',
    icon: Wallet,
  },
];

export const READINESS_ITEMS = [
  {
    title: 'Entry route upgraded',
    detail: 'Homepage now behaves like a shell surface, not just a feed teaser.',
    icon: Sparkles,
  },
  {
    title: 'Action paths nearby',
    detail: 'Launch, explore, stats, and rewards stay one click away from the primary entry point.',
    icon: ArrowRight,
  },
  {
    title: 'Signals before conviction',
    detail: 'Pulse metrics, live tape, and feed segmentation help frame urgency and momentum.',
    icon: TrendingUp,
  },
  {
    title: 'Next in order',
    detail: 'After homepage, Phase 1 continues into the shared layout shell and then stats.',
    icon: Clock3,
  },
];
