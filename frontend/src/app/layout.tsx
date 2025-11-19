'use client';

import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tantml:tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { SessionProvider } from 'next-auth/react';
import { config } from '@/lib/wagmi';
import Navbar from '@/components/Navbar';
import { ToastProvider } from '@/hooks/useToast';
import { CircleWalletProvider } from '@/hooks/useCircleWallet';

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#2081E2" />
        <meta name="description" content="Premier NFT marketplace on Circle Arc blockchain with instant USDC settlements" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <title>ArcMarket - NFT Marketplace</title>
      </head>
      <body className="antialiased">
        <SessionProvider>
          <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
              <RainbowKitProvider>
                <CircleWalletProvider>
                  <ToastProvider>
                    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
                      <Navbar />
                      <main>
                        {children}
                      </main>
                    </div>
                  </ToastProvider>
                </CircleWalletProvider>
              </RainbowKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
