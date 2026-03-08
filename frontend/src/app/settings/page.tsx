'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Palette,
  Rocket,
  Search,
  Settings,
  Shield,
  Sparkles,
  Trophy,
  User,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'notifications' | 'privacy' | 'appearance';

function shortenAddress(address?: string) {
  if (!address) return 'No wallet connected';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const settingsRoutes = [
  {
    title: 'Open profile',
    description: 'Move from account configuration into your wallet-based ARC identity surface.',
    href: '/profile',
    icon: <User className="h-4 w-4" />,
  },
  {
    title: 'Open token markets',
    description: 'Jump into launched-token discovery and live ARC market flows.',
    href: '/explore?tab=tokens',
    icon: <Wallet className="h-4 w-4" />,
  },
  {
    title: 'Review stats',
    description: 'Check ARC analytics before returning to account and preference workflows.',
    href: '/stats',
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    title: 'Open rewards',
    description: 'Track loyalty, quests, and progression from the same connected shell.',
    href: '/rewards',
    icon: <Trophy className="h-4 w-4" />,
  },
];

export default function SettingsPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [saleNotifications, setSaleNotifications] = useState(true);
  const [bidNotifications, setBidNotifications] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [showCollections, setShowCollections] = useState(true);

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'privacy' as const, label: 'Privacy', icon: Shield },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen px-4 py-12 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                <Settings className="h-3.5 w-3.5" />
                ARC settings
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white lg:text-5xl">
                Connect your wallet to manage ARC preferences.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-neutral-600 dark:text-neutral-400 lg:text-lg">
                Settings bring profile identity, notifications, privacy controls, and appearance guidance into one wallet-linked ARC account surface.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600"
                >
                  <Search className="h-4 w-4" />
                  Explore markets
                </Link>
                <Link
                  href="/launch"
                  className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-3 font-semibold text-neutral-900 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
                >
                  <Rocket className="h-4 w-4" />
                  Launch a token
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:p-8">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500">
                <Wallet className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">What settings cover</h2>
              <div className="mt-5 space-y-4">
                <FeatureCard
                  icon={<User className="h-4 w-4" />}
                  title="Profile identity"
                  description="Set a display name, bio, and recovery email around your connected ARC wallet identity."
                />
                <FeatureCard
                  icon={<Bell className="h-4 w-4" />}
                  title="Notification control"
                  description="Tune sales, bids, price alerts, and broader account messaging from one place."
                />
                <FeatureCard
                  icon={<Shield className="h-4 w-4" />}
                  title="Privacy and appearance"
                  description="Control visibility of activity and collections while keeping the ARC shell experience consistent."
                />
              </div>
            </div>
          </div>

          <div className="mb-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:p-6">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                    <Settings className="h-4 w-4" />
                    Settings state
                  </div>
                  <div className="text-lg font-semibold text-neutral-900 dark:text-white">Wallet connection required</div>
                  <p className="mt-1 max-w-3xl text-sm text-current">
                    This settings entry surface now acts as a clearer shell handoff, explaining the wallet requirement while keeping users connected to profile, rewards, analytics, and token-market routes.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/profile" className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-black">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link href="/rewards" className="inline-flex items-center gap-2 rounded-2xl border border-current/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-current dark:bg-white/5">
                    <Trophy className="h-4 w-4" />
                    Rewards
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <OverviewCard label="Settings access" value="Wallet-based" hint="Connect to manage preferences" />
            <OverviewCard label="Profile route" value="Live route" hint="Open account identity" />
            <OverviewCard label="Rewards route" value="Live route" hint="Open loyalty and quests" />
            <OverviewCard label="Analytics route" value="Live route" hint="Review stats before action" />
          </div>

          <section className="mt-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Account routes</h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Move into core ARC surfaces while settings access is waiting on wallet connection.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {settingsRoutes.map((route) => (
                <RouteCard key={route.title} {...route} />
              ))}
            </div>
          </section>

          <p className="mt-6 text-sm text-neutral-500 dark:text-neutral-400">
            Connect from the navigation bar, then return here to configure preferences tied to your active wallet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6 lg:py-10">
        <div className="mb-8 grid gap-6 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              <Settings className="h-3.5 w-3.5" />
              Wallet-linked ARC settings
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white lg:text-5xl">Manage your ARC account preferences.</h1>
            <p className="mt-4 max-w-2xl text-base text-neutral-600 dark:text-neutral-400 lg:text-lg">
              Keep profile identity, notifications, privacy, and shell appearance aligned with your connected ARC wallet experience.
            </p>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-neutral-50/80 p-5 dark:border-white/10 dark:bg-slate-950/60">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-neutral-900 dark:text-white">Connected wallet</div>
                <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{shortenAddress(address)}</div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">
                <Wallet className="h-3.5 w-3.5" />
                Active
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link href="/profile" className="inline-flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 transition hover:border-primary-400 hover:text-primary-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-white">
                Open profile
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/studio" className="inline-flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 transition hover:border-primary-400 hover:text-primary-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-white">
                Open studio
                <Sparkles className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:p-6">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-900 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                  <Settings className="h-4 w-4" />
                  Settings state
                </div>
                <div className="text-lg font-semibold text-neutral-900 dark:text-white">Connected preferences active</div>
                <p className="mt-1 max-w-3xl text-sm text-current">
                  This settings surface now behaves more like a shell-level account hub, with clearer continuity into profile, rewards, analytics, and token-market workflows.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/explore?tab=tokens" className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-black">
                  <Wallet className="h-4 w-4" />
                  Token markets
                </Link>
                <Link href="/stats" className="inline-flex items-center gap-2 rounded-2xl border border-current/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-current dark:bg-white/5">
                  <BarChart3 className="h-4 w-4" />
                  Stats
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewCard label="Connected wallet" value={shortenAddress(address)} hint="Active account context" />
          <OverviewCard label="Profile route" value="Ready" hint="Open wallet identity" />
          <OverviewCard label="Rewards route" value="Ready" hint="Review quests and loyalty" />
          <OverviewCard label="Theme control" value="Navbar toggle" hint="Light and dark shell modes" />
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <nav className="space-y-1 rounded-3xl border border-neutral-200/60 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400'
                      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-3xl border border-neutral-200/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
              {activeTab === 'profile' && (
                <div className="p-6 lg:p-8">
                  <h2 className="mb-6 text-xl font-semibold text-neutral-900 dark:text-white">Profile settings</h2>

                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Wallet address
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
                          <code className="text-sm text-neutral-600 dark:text-neutral-400">{address}</code>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Display name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter a display name"
                        className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-neutral-500">
                        This name appears across your ARC profile and marketplace surfaces.
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Bio
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Tell the ARC community about yourself"
                        className="w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Email address
                      </label>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-neutral-500">
                        Used for notifications and account recovery.
                      </p>
                    </div>

                    <button className="rounded-2xl bg-primary-500 px-6 py-3 font-medium text-white transition hover:bg-primary-600">
                      Save preferences
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="p-6 lg:p-8">
                  <h2 className="mb-6 text-xl font-semibold text-neutral-900 dark:text-white">Notification preferences</h2>

                  <div className="space-y-6">
                    <ToggleOption
                      label="Email notifications"
                      description="Receive major ARC account and market updates by email."
                      enabled={emailNotifications}
                      onChange={setEmailNotifications}
                    />
                    <ToggleOption
                      label="Push notifications"
                      description="Receive live alerts in your browser while using ARC."
                      enabled={pushNotifications}
                      onChange={setPushNotifications}
                    />
                    <div className="border-t border-neutral-200 pt-6 dark:border-neutral-700">
                      <h3 className="mb-4 font-medium text-neutral-900 dark:text-white">Activity alerts</h3>
                      <div className="space-y-4">
                        <ToggleOption
                          label="Sales"
                          description="When one of your listed assets sells."
                          enabled={saleNotifications}
                          onChange={setSaleNotifications}
                        />
                        <ToggleOption
                          label="Bids and offers"
                          description="When you receive a bid or offer on an asset."
                          enabled={bidNotifications}
                          onChange={setBidNotifications}
                        />
                        <ToggleOption
                          label="Price alerts"
                          description="When tracked items or markets shift in price."
                          enabled={priceAlerts}
                          onChange={setPriceAlerts}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="p-6 lg:p-8">
                  <h2 className="mb-6 text-xl font-semibold text-neutral-900 dark:text-white">Privacy settings</h2>

                  <div className="space-y-6">
                    <ToggleOption
                      label="Show activity"
                      description="Allow others to view your ARC marketplace activity."
                      enabled={showActivity}
                      onChange={setShowActivity}
                    />
                    <ToggleOption
                      label="Show collections"
                      description="Display your collections and holdings on your public profile."
                      enabled={showCollections}
                      onChange={setShowCollections}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="p-6 lg:p-8">
                  <h2 className="mb-6 text-xl font-semibold text-neutral-900 dark:text-white">Appearance</h2>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                      <div className="font-medium text-neutral-900 dark:text-white">Theme control</div>
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Use the navigation-bar theme toggle to move between light and dark ARC shell modes.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                      <div className="font-medium text-neutral-900 dark:text-white">Consistent shell experience</div>
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        ARC keeps navigation, footer, and discovery surfaces aligned so your account context stays consistent across the platform.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Shell routes</h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Move directly from settings into the highest-value ARC product surfaces.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {settingsRoutes.map((route) => (
              <RouteCard key={route.title} {...route} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
          {icon}
        </div>
        <div>
          <div className="font-medium text-neutral-900 dark:text-white">{title}</div>
          <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</div>
        </div>
      </div>
    </div>
  );
}

function OverviewCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
      <div className="text-sm text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="mt-1 text-3xl font-bold text-neutral-900 dark:text-white">{value}</div>
      <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{hint}</div>
    </div>
  );
}

function RouteCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: JSX.Element;
}) {
  return (
    <Link href={href} className="block rounded-2xl border border-neutral-200 bg-neutral-50 p-4 transition hover:border-primary-400 hover:bg-white dark:border-white/10 dark:bg-slate-950/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
            {icon}
          </div>
          <div className="font-semibold text-neutral-900 dark:text-white">{title}</div>
          <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</div>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 text-neutral-400" />
      </div>
    </Link>
  );
}

function ToggleOption({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-medium text-neutral-900 dark:text-white">{label}</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          enabled ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-600'
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
            enabled && 'translate-x-5'
          )}
        />
      </button>
    </div>
  );
}
