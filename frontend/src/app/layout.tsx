'use client';

import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { SessionProvider } from 'next-auth/react';
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
                              <div className="container mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
                                    ARC shell
                                  </div>
                                  <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                                    Primary navigation now keeps exploration, launchpad, studio, stats, and rewards in one place while wallet and profile stay in the utility area.
                                  </div>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                  One owner per destination
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
