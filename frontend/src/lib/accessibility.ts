/**
 * Accessibility Utilities
 *
 * Provides utilities for WCAG 2.1 compliance:
 * - Focus management
 * - Screen reader announcements
 * - Keyboard navigation helpers
 */

/**
 * Announce message to screen readers using aria-live region
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement is made
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Trap focus within an element (for modals, dialogs)
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const focusableElements = element.querySelectorAll<HTMLElement>(focusableSelectors);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);
  firstFocusable?.focus();

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Return focus to previously focused element
 */
export function createFocusReturn(): () => void {
  const previouslyFocused = document.activeElement as HTMLElement | null;

  return () => {
    previouslyFocused?.focus();
  };
}

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0;
export function generateId(prefix = 'aria'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: more)').matches;
}

/**
 * Keyboard navigation helpers
 */
export const KeyCodes = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const;

/**
 * Handle keyboard navigation for list items
 */
export function handleListNavigation(
  e: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  onSelect?: (index: number) => void
): number {
  let newIndex = currentIndex;

  switch (e.key) {
    case KeyCodes.ARROW_DOWN:
      e.preventDefault();
      newIndex = Math.min(currentIndex + 1, items.length - 1);
      break;
    case KeyCodes.ARROW_UP:
      e.preventDefault();
      newIndex = Math.max(currentIndex - 1, 0);
      break;
    case KeyCodes.HOME:
      e.preventDefault();
      newIndex = 0;
      break;
    case KeyCodes.END:
      e.preventDefault();
      newIndex = items.length - 1;
      break;
    case KeyCodes.ENTER:
    case KeyCodes.SPACE:
      e.preventDefault();
      onSelect?.(currentIndex);
      break;
  }

  if (newIndex !== currentIndex) {
    items[newIndex]?.focus();
  }

  return newIndex;
}

/**
 * Format price for screen readers
 */
export function formatPriceForScreenReader(price: string | number, currency = 'USDC'): string {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `${numericPrice.toFixed(2)} ${currency}`;
}

/**
 * Format relative time for screen readers
 */
export function formatTimeForScreenReader(timestamp: number | Date): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
}
