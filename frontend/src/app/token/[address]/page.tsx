import Link from 'next/link';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import {
  ArrowUpRight,
  BarChart3,
  Clock3,
  Flame,
  Globe,
  MessageSquare,
  Rocket,
  Shield,
  TrendingUp,
  Wallet,
} from 'lucide-react';

const demoTrades = [
  { wallet: '0x8f2c…91d4', side: 'Buy', amount: '$1,280', tokens: '12,840', age: '18s ago' },
  { wallet: '0x13aa…42bc', side: 'Buy', amount: '$640', tokens: '6,155', age: '44s ago' },
  { wallet: '0x2c71…d111', side: 'Sell', amount: '$310', tokens: '2,420', age: '2m ago' },
  { wallet: '0xf9b4…7710', side: 'Buy', amount: '$2,480', tokens: '21,005', age: '4m ago' },
];

const holderBands = [
  { label: 'Top holder', value: '6.4%' },
  { label: 'Top 10 holders', value: '28.7%' },
  { label: 'Creator allocation', value: '5.0%' },
  { label: 'Graduation target', value: '80.0%' },
];

export default async function TokenDetailPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;

  if (!address) {
    notFound();
  }

  const shortAddress = `${address.slice(0, 6)}…${address.slice(-4)}`;
  const symbolSeed = address.slice(2, 6).toUpperCase() || 'ARC';
  const projectName = `ARC ${symbolSeed}`;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 lg:py-10">
      <div className="mb-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300">
              <Rocket className="h-3.5 w-3.5" />
              Live launch market
            </div>
            <div className="mb-4 flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-400 text-2xl font-bold text-white shadow-lg shadow-blue-500/20">
                {symbolSeed.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold text-neutral-900 dark:text-white lg:text-4xl">{projectName}</h1>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                    ${symbolSeed}
                  </span>
                  <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">
                    Bonding curve active
                  </span>
                </div>
                <p className="max-w-2xl text-neutral-600 dark:text-neutral-400">
                  A trader-facing token page designed for immediate action: curve progress, live social proof, creator trust signals, and a buy flow that keeps momentum high after launch.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                  <Badge icon={<Wallet className="h-3.5 w-3.5" />}>{shortAddress}</Badge>
                  <Badge icon={<Shield className="h-3.5 w-3.5" />}>Creator verified links</Badge>
                  <Badge icon={<Globe className="h-3.5 w-3.5" />}>Trading page ready</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/explore?tab=tokens" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                    <TrendingUp className="h-4 w-4" />
                    Browse token markets
                  </Link>
                  <Link href="/launch" className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white">
                    Launch another token
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-neutral-50/90 p-5 dark:border-white/10 dark:bg-slate-950/60">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Curve completion</span>
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">63.4%</span>
            </div>
            <div className="mb-4 h-3 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" style={{ width: '63.4%' }} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <HeroMetric label="Current price" value="$0.0148" hint="+48.0% from launch" />
              <HeroMetric label="Market cap" value="$148,000" hint="Based on live curve price" />
              <HeroMetric label="Liquidity raised" value="$94,600" hint="Before graduation" />
              <HeroMetric label="Unique traders" value="326" hint="24h active wallets" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Market snapshot</h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                <BarChart3 className="h-3.5 w-3.5" />
                Updated live
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SnapshotCard title="24h volume" value="$82,400" delta="+12.8%" />
              <SnapshotCard title="Buys / sells" value="214 / 49" delta="Buy pressure strong" />
              <SnapshotCard title="Graduation ETA" value="~6 hrs" delta="At current pace" />
              <SnapshotCard title="Holders" value="492" delta="+37 today" />
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Recent trades</h2>
              <Link href="/stats" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                Full analytics
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-white/10">
              <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:bg-slate-950/60 dark:text-neutral-400">
                <span>Wallet</span>
                <span>Side</span>
                <span>Value</span>
                <span>Time</span>
              </div>
              {demoTrades.map((trade) => (
                <div key={`${trade.wallet}-${trade.age}`} className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] items-center border-t border-neutral-200 px-4 py-3 text-sm dark:border-white/10">
                  <div>
                    <div className="font-medium text-neutral-900 dark:text-white">{trade.wallet}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{trade.tokens} tokens</div>
                  </div>
                  <div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${trade.side === 'Buy' ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'}`}>
                      {trade.side}
                    </span>
                  </div>
                  <div className="font-semibold text-neutral-900 dark:text-white">{trade.amount}</div>
                  <div className="text-neutral-500 dark:text-neutral-400">{trade.age}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Creator and trust signals</h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                <Shield className="h-3.5 w-3.5" />
                Social-first launch
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                <div className="mb-2 text-sm font-semibold text-neutral-900 dark:text-white">Creator profile</div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">0xA9d3…be27</div>
                <div className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center justify-between"><span>Past launches</span><span className="font-medium text-neutral-900 dark:text-white">4</span></div>
                  <div className="flex items-center justify-between"><span>Graduated</span><span className="font-medium text-neutral-900 dark:text-white">3</span></div>
                  <div className="flex items-center justify-between"><span>Repeat traders</span><span className="font-medium text-neutral-900 dark:text-white">38%</span></div>
                </div>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                <div className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Why this page matters</div>
                <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                  <p>This token detail layout turns a raw contract address into a trading destination with context, momentum, and immediate action paths.</p>
                  <p>It gives ARC a stronger bridge between launch and liquidity by combining creator proof, live metrics, and transaction visibility on one page.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Trade panel</h2>
              <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">
                Ready for wallet hook-in
              </span>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {['$50', '$250', '$1000'].map((amount) => (
                  <button key={amount} className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-700 hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-200">
                    {amount}
                  </button>
                ))}
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">You pay</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">$250 USDC</span>
                </div>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Estimated received</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">16,891 {symbolSeed}</span>
                </div>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Slippage</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">0.85%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Fee</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">0.90%</span>
                </div>
              </div>
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-base font-semibold text-white hover:bg-blue-700">
                <TrendingUp className="h-5 w-5" />
                Buy now
              </button>
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-4 text-base font-semibold text-neutral-900 hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white">
                <Flame className="h-5 w-5" />
                Sell tokens
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-white">Distribution risk view</h2>
            <div className="space-y-3">
              {holderBands.map((row) => (
                <div key={row.label} className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-white/10 dark:bg-slate-950/60">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">{row.label}</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">{row.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Community pulse</h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                <MessageSquare className="h-3.5 w-3.5" />
                Social hooks next
              </span>
            </div>
            <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
              <CommunityRow author="0x22aa…71d0" text="Clean launch, curve feels fair so far." />
              <CommunityRow author="0x7b19…c014" text="Watching for graduation tonight." />
              <CommunityRow author="0x0f44…90c9" text="Creator shipped links and docs fast, bullish." />
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
              <Clock3 className="h-4 w-4" />
              Build sequence
            </div>
            <ol className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
              <li>1. Connect live subgraph metrics into the snapshot cards.</li>
              <li>2. Wire buy and sell actions to the bonding-curve contracts.</li>
              <li>3. Replace community placeholders with real comments and creator updates.</li>
              <li>4. Route post-launch success screens directly into this page.</li>
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}

function HeroMetric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/80">
      <div className="text-sm text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{value}</div>
      <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{hint}</div>
    </div>
  );
}

function SnapshotCard({ title, value, delta }: { title: string; value: string; delta: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
      <div className="text-sm text-neutral-500 dark:text-neutral-400">{title}</div>
      <div className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{value}</div>
      <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{delta}</div>
    </div>
  );
}

function Badge({ children, icon }: { children: ReactNode; icon: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 dark:border-white/10 dark:bg-slate-950/60">
      {icon}
      {children}
    </span>
  );
}

function CommunityRow({ author, text }: { author: string; text: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{author}</div>
      <div>{text}</div>
    </div>
  );
}
