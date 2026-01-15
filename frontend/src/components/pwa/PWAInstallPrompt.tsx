/**
 * PWA Install Prompt Component
 *
 * Prompts users to install the app as a PWA
 * Shows banner with install button for supported browsers
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user has dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // Don't show for 7 days after dismissal
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed');
      setShowPrompt(false);
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md sm:left-auto sm:right-4"
      >
        <div className="overflow-hidden rounded-xl border border-primary-200 bg-white shadow-2xl dark:border-primary-800 dark:bg-neutral-900">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-white/20 p-2">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Install ArcMarket</h3>
                <p className="mt-1 text-sm text-white/90">
                  Get the app for a faster, native experience
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="rounded-lg p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="Dismiss"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex gap-3 p-4">
            <Button variant="outline" onClick={handleDismiss} className="flex-1">
              Maybe Later
            </Button>
            <Button onClick={handleInstall} className="flex-1" leftIcon={<Download className="h-4 w-4" />}>
              Install
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * PWA Status Indicator
 * Shows if app is installed and running in standalone mode
 */
export function PWAStatusIndicator() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
  }, []);

  if (!isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
      App Mode
    </div>
  );
}
