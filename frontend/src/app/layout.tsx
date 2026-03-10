'use client';

import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CommandPalette from '@/components/navigation/CommandPalette';
import { SkipLink } from '@/components/ui/SkipLink';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { WebVitalsReporter } from '@/components/analytics/WebVitalsReporter';
import { OrganizationSchema, WebsiteSchema } from '@/components/seo/StructuredData';
import RootProviders from '@/providers/RootProviders';

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
        <RootProviders>
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
        </RootProviders>
      </body>
    </html>
  );
}
