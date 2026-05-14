/**
 * Skip Link Component
 *
 * Provides keyboard users a way to skip directly to main content
 * WCAG 2.1 Level A requirement
 */

'use client';

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-full focus:bg-primary-500 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}
