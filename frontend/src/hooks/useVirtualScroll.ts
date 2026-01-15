'use client';

import { useEffect } from 'react';

export function useVirtualScroll(storageKey: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      const y = Number(saved);
      if (!Number.isNaN(y)) {
        window.scrollTo({ top: y });
      }
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      window.localStorage.setItem(storageKey, String(window.scrollY));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [storageKey]);
}
