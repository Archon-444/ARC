'use client';

import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import Link from 'next/link';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { SessionProvider } from 'next-auth/react';
import { BarChart3, Home, Layers3, Rocket, Trophy, User } from 'lucide-react';
import { WagmiProvider } from 'wagmi';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ToastProvider } from '@/hooks/useToast';
import { CircleWalletProvider } from '@/hooks/useCircleWallet';
import CommandPalette from '@/components/navigation/CommandPalette';
import { CommandPaletteProvider } from '@/hooks/useCommandPalette';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SkipLink } from '@/components/ui/SkipLink';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { WebVitalsReporter } from '@/components/analytics/WebVitalsReporter';
import { OrganizationSchema, WebsiteSchema } from '@/components/seo/StructuredData';
import { config } from '@/lib/wagmi';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const SHELL_ROUTES = [
  { title: 'Home', href: '/', icon: Home },
  { title: 'Launch', href: '/launch', icon: Rocket },
  { title: 'Explore', href: '/explore', icon: Layers3 },
  { title: 'Stats', href: '/stats', icon: BarChart3 },
  { title: 'Rewards', href: '/rewards', icon: Trophy },
  { title: 'Profile', href: '/profile', icon: User },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#6366f1" />
        <meta
          name="description"
          content="ARC brings marketplace discovery, token launches, stats, rewards, and live token-market activity into one wallet-native platform."
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <title>ARC | Connected Marketplace, Launchpad, and Token Discovery</title>
      </head>
      <body>
        <div
          id="animated-bg"
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
        <ThemeProvider>
          <ErrorBoundary>
            <SessionProvider>
              <WagmiProvider config={config}>
                <QueryClientProvider client={queryClient}>
                  <RainbowKitProvider>
                    <CircleWalletProvider>
                      <ToastProvider>
                        <CommandPaletteProvider>
                          <SkipLink />
                          <div className="relative z-10 min-h-screen bg-transparent">
                            <Navbar />
                            <div className="border-b border-neutral-200/70 bg-white/75 backdrop-blur dark:border-white/10 dark:bg-slate-900/65">
                              <div className="container mx-auto max-w-7xl px-4 py-3">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                  <div>
                                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
                                      ARC shell
                                    </div>
                                    <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                                      Launch, explore, stats, rewards, and profile routes stay connected across the app.
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {SHELL_ROUTES.map((route) => {
                                      const Icon = route.icon;
                                      return (
                                        <Link
                                          key={route.title}
                                          href={route.href}
                                          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-200 dark:hover:border-blue-500/40 dark:hover:text-blue-300"
                                        >
                                          <Icon className="h-4 w-4" />
                                          {route.title}
                                        </Link>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <CommandPalette />
                            <main id="main-content" className="relative pb-24">
                              {children}
                            </main>
                            <Footer />
                            <InstallPrompt />
                            <WebVitalsReporter />
                            <OrganizationSchema />
                            <WebsiteSchema />
                          </div>
                        </CommandPaletteProvider>
                      </ToastProvider>
                    </CircleWalletProvider>
                  </RainbowKitProvider>
                </QueryClientProvider>
              </WagmiProvider>
            </SessionProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
