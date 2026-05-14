/**
 * InstallPrompt Component
 *
 * Banner to prompt PWA installation
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWA';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

export function InstallPrompt() {
    const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if user previously dismissed
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            setIsDismissed(true);
        }
    }, []);

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    const handleInstall = async () => {
        const installed = await promptInstall();
        if (installed) {
            setIsDismissed(true);
        }
    };

    if (!isInstallable || isInstalled || isDismissed) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:w-96"
            >
                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/20">
                            <Smartphone className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                                Install ARC Marketplace
                            </h3>
                            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                                Get the app experience with offline support and faster loading
                            </p>

                            <div className="mt-3 flex gap-2">
                                <Button
                                    onClick={handleInstall}
                                    size="sm"
                                    variant="primary"
                                    className="gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Install
                                </Button>
                                <Button
                                    onClick={handleDismiss}
                                    size="sm"
                                    variant="outline"
                                >
                                    Not now
                                </Button>
                            </div>
                        </div>

                        <button
                            onClick={handleDismiss}
                            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
