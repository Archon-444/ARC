/**
 * SkipLinks Component
 *
 * Provides keyboard navigation shortcuts for screen readers
 * and keyboard users to skip to main content areas
 */

'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface SkipLink {
  href: string;
  label: string;
}

export interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

const defaultLinks: SkipLink[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#footer', label: 'Skip to footer' },
  { href: '#navigation', label: 'Skip to navigation' },
];

export function SkipLinks({ links = defaultLinks, className }: SkipLinksProps) {
  return (
    <div className={cn('skip-links', className)}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

/**
 * VisuallyHidden Component
 * Hides content visually but keeps it accessible to screen readers
 */
export interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
}

export function VisuallyHidden({ children, as: Component = 'span', className }: VisuallyHiddenProps) {
  return <Component className={cn('sr-only', className)}>{children}</Component>;
}

/**
 * Accessible Icon Button
 * Icon button with required aria-label
 */
export interface AccessibleIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  className?: string;
}

export function AccessibleIconButton({
  icon,
  label,
  className,
  ...props
}: AccessibleIconButtonProps) {
  return (
    <button
      {...props}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:hover:bg-neutral-800',
        className
      )}
    >
      {icon}
      <VisuallyHidden>{label}</VisuallyHidden>
    </button>
  );
}

/**
 * LiveRegion Component
 * Announces dynamic content changes to screen readers
 */
export interface LiveRegionProps {
  children: React.ReactNode;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  role?: string;
  className?: string;
}

export function LiveRegion({
  children,
  'aria-live': ariaLive = 'polite',
  'aria-atomic': ariaAtomic = true,
  role = 'status',
  className,
}: LiveRegionProps) {
  return (
    <div
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      role={role}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
}

/**
 * useAnnouncement Hook
 * Programmatically announce messages to screen readers
 */
export function useAnnouncement() {
  const [announcement, setAnnouncement] = React.useState('');

  const announce = React.useCallback((message: string) => {
    setAnnouncement(''); // Clear first to trigger re-announcement of same message
    setTimeout(() => {
      setAnnouncement(message);
    }, 100);
  }, []);

  const AnnouncementRegion = React.useCallback(
    () => (
      <LiveRegion aria-live="assertive">
        {announcement}
      </LiveRegion>
    ),
    [announcement]
  );

  return { announce, AnnouncementRegion };
}

/**
 * KeyboardShortcut Display Component
 */
export interface KeyboardShortcutProps {
  keys: string[];
  className?: string;
}

export function KeyboardShortcut({ keys, className }: KeyboardShortcutProps) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {keys.map((key, index) => (
        <React.Fragment key={key}>
          {index > 0 && <span className="text-neutral-400">+</span>}
          <kbd className="rounded border border-neutral-300 bg-neutral-100 px-2 py-1 font-mono text-xs font-semibold text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {key}
          </kbd>
        </React.Fragment>
      ))}
    </span>
  );
}

/**
 * Global keyboard shortcuts handler
 */
export function useKeyboardShortcuts(
  shortcuts: Record<string, () => void>,
  enabled = true
) {
  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = [
        event.ctrlKey && 'ctrl',
        event.metaKey && 'meta',
        event.shiftKey && 'shift',
        event.altKey && 'alt',
        event.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join('+');

      const handler = shortcuts[key];
      if (handler) {
        event.preventDefault();
        handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

import React from 'react';
