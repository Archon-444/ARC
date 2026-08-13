import {
  ArrowRight,
  Coins,
  Layers3,
  Radio,
  Rocket,
  Shield,
  TrendingUp,
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
    label: 'Creator paycheck',
    value: 'Earn on every trade',
    hint: 'Half of the 2.5% fee accrues to you. Collect it on the token page.',
    icon: Coins,
  },
  {
    label: 'Live curve',
    value: 'Buy and sell in USDC',
    hint: 'Price is the bonding curve. Share the token link; that is the market.',
    icon: TrendingUp,
  },
  {
    label: 'Cannot-rug',
    value: 'Curve funds stay put',
    hint: 'No AMM withdraw of USDC. Unsold supply cannot be yanked as a rug.',
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
    subtitle: 'Tokens with the strongest recent momentum.',
  },
  graduating: {
    title: 'Near graduation',
    subtitle: 'Markets closing in on the bonding-curve threshold.',
  },
};

export const CONNECTED_SURFACES = [
  {
    title: 'Launch a token',
    description: 'Name, ticker, image, description. You earn on every trade from the first buy.',
    href: '/launch',
    cta: 'Open launch',
    icon: Rocket,
  },
  {
    title: 'Explore tokens',
    description: 'Board of coins: new, trending, recent activity, nearing graduation.',
    href: '/explore?tab=tokens',
    cta: 'Browse tokens',
    icon: Layers3,
  },
];

export const READINESS_ITEMS = [
  {
    title: 'Launch',
    detail: 'Pay a USDC creation fee. The whole supply goes to the curve. You cannot yank it.',
    icon: Rocket,
  },
  {
    title: 'Share',
    detail: 'The token URL is the product. One link for buyers.',
    icon: ArrowRight,
  },
  {
    title: 'Trade',
    detail: 'Quote plus 1% minOut. 2.5% fee; half to the creator.',
    icon: TrendingUp,
  },
  {
    title: 'Get paid',
    detail: 'Collect accrued fees anytime. Graduation is a later 50% of remaining curve USDC — not the only paycheck.',
    icon: Radio,
  },
];
