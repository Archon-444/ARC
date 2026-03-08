'use client';

import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { SessionProvider } from 'next-auth/react';
import { config } from '@/lib/wagmi';
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
        <meta name="description" content="Premier NFT marketplace on Circle Arc blockchain with instant USDC settlements" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <title>ArcMarket - NFT Marketplace</title>
      </head>
      <body>
        {/* ===== ANIMATED BACKGROUND — fixed layer, always behind all content ===== */}
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
