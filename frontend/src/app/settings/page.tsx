'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Wallet,
  Mail,
  Eye,
  EyeOff,
  Check,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'notifications' | 'privacy' | 'appearance';

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

  // Show connect wallet prompt if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-6">
            <Settings className="h-10 w-10 text-neutral-400" />
          </div>

          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Connect Your Wallet
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">
            Connect your wallet to access your settings and preferences.
          </p>

          <div className="space-y-4">
            <Link
              href="/explore"
              className="block w-full px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition"
            >
              Explore NFTs
            </Link>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Or connect your wallet using the button in the navigation bar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Settings className="h-8 w-8 text-primary-500" />
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Settings</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
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

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">
                    Profile Settings
                  </h2>

                  <div className="space-y-6">
                    {/* Wallet Address */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Wallet Address
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
                          <code className="text-sm text-neutral-600 dark:text-neutral-400">
                            {address}
                          </code>
                        </div>
                      </div>
                    </div>

                    {/* Display Name */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter a display name"
                        className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-neutral-500">
                        This name will be displayed on your profile and in the marketplace.
                      </p>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Tell us about yourself"
                        className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white resize-none"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-neutral-500">
                        Used for notifications and account recovery.
                      </p>
                    </div>

                    <button className="px-6 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition">
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">
                    Notification Preferences
                  </h2>

                  <div className="space-y-6">
                    <ToggleOption
                      label="Email Notifications"
                      description="Receive updates via email"
                      enabled={emailNotifications}
                      onChange={setEmailNotifications}
                    />
                    <ToggleOption
                      label="Push Notifications"
                      description="Receive push notifications in your browser"
                      enabled={pushNotifications}
                      onChange={setPushNotifications}
                    />
                    <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
                      <h3 className="font-medium text-neutral-900 dark:text-white mb-4">
                        Activity Notifications
                      </h3>
                      <div className="space-y-4">
                        <ToggleOption
                          label="Sales"
                          description="When one of your NFTs sells"
                          enabled={saleNotifications}
                          onChange={setSaleNotifications}
                        />
                        <ToggleOption
                          label="Bids & Offers"
                          description="When you receive a bid or offer"
                          enabled={bidNotifications}
                          onChange={setBidNotifications}
                        />
                        <ToggleOption
                          label="Price Alerts"
                          description="When items in your watchlist change price"
                          enabled={priceAlerts}
                          onChange={setPriceAlerts}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Settings */}
              {activeTab === 'privacy' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">
                    Privacy Settings
                  </h2>

                  <div className="space-y-6">
                    <ToggleOption
                      label="Show Activity"
                      description="Allow others to see your marketplace activity"
                      enabled={showActivity}
                      onChange={setShowActivity}
                    />
                    <ToggleOption
                      label="Show Collections"
                      description="Display your NFT collections on your profile"
                      enabled={showCollections}
                      onChange={setShowCollections}
                    />
                  </div>
                </div>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">
                    Appearance
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                        Theme
                      </label>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                        You can change the theme using the toggle in the navigation bar.
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
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-neutral-900 dark:text-white">{label}</p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          enabled ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-600'
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm",
            enabled && 'translate-x-5'
          )}
        />
      </button>
    </div>
  );
}
