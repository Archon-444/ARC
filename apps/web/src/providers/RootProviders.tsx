'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { SessionProvider } from 'next-auth/react';
import { WagmiProvider } from 'wagmi';
import { ToastProvider } from '@/hooks/useToast';
import { CircleWalletProvider } from '@/hooks/useCircleWallet';
import { CommandPaletteProvider } from '@/hooks/useCommandPalette';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { config } from '@/lib/wagmi';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <SessionProvider>
          <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
              <RainbowKitProvider>
                <CircleWalletProvider>
                  <ToastProvider>
                    <CommandPaletteProvider>
                      {children}
                    </CommandPaletteProvider>
                  </ToastProvider>
                </CircleWalletProvider>
              </RainbowKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </SessionProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
