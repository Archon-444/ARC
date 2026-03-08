'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  Palette,
  Rocket,
  Search,
  Settings,
  Shield,
  Sparkles,
  User,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'notifications' | 'privacy' | 'appearance';

function shortenAddress(address?: string) {
  if (!address) return 'No wallet connected';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

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
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              <Settings className="h-3.5 w-3.5" />
              Account settings
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white lg:text-5xl">
              Connect your wallet to manage ARC preferences.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-neutral-600 dark:text-neutral-400 lg:text-lg">
              Settings bring profile identity, notifications, privacy controls, and appearance guidance into one wallet-linked account surface.
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

            <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
              Connect from the navigation bar, then return here to configure preferences tied to your active wallet.
            </p>
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
                description="Set a display name, bio, and recovery email around your connected wallet identity."
              />
              <FeatureCard
                icon={<Bell className="h-4 w-4" />}
                title="Notification control"
                description="Tune sales, bids, price alerts, and broader account messaging from one place."
              />
              <FeatureCard
                icon={<Shield className="h-4 w-4" />}
                title="Privacy and appearance"
                description="Control visibility of activity and collections while keeping the shell experience consistent."
              />
            </div>
          </div>
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
              Wallet-linked settings
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white lg:text-5xl">Manage your ARC account preferences.</h1>
            <p className="mt-4 max-w-2xl text-base text-neutral-600 dark:text-neutral-400 lg:text-lg">
              Keep profile identity, notifications, privacy, and shell appearance aligned with your connected wallet experience.
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
                        This name appears across your profile and marketplace surfaces.
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
                      description="Receive major account and market updates by email."
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
                      description="Allow others to view your marketplace activity."
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
                        Use the navigation-bar theme toggle to move between light and dark shell modes.
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
