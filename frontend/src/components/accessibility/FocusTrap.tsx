/**
 * FocusTrap Component
 *
 * Traps focus within a container (useful for modals, dialogs)
 * Ensures keyboard navigation stays within the component
 * WCAG 2.1 AA compliant focus management
 */

'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

export interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
  initialFocus?: React.RefObject<HTMLElement>;
  className?: string;
}

export function FocusTrap({
  children,
  active = true,
  autoFocus = true,
  restoreFocus = true,
  initialFocus,
  className,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store currently focused element
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    // Focus initial element or first focusable element
    if (autoFocus) {
      const elementToFocus = initialFocus?.current || getFirstFocusableElement(containerRef.current);
      elementToFocus?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !containerRef.current) return;

      const focusableElements = getFocusableElements(containerRef.current);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        // Shift + Tab
        if (activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup: restore focus
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (restoreFocus && previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [active, autoFocus, restoreFocus, initialFocus]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];

  const selector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => {
      // Check if element is visible and not hidden
      return el.offsetParent !== null && !el.hasAttribute('aria-hidden');
    }
  );
}

/**
 * Get first focusable element
 */
function getFirstFocusableElement(container: HTMLElement | null): HTMLElement | null {
  const elements = getFocusableElements(container);
  return elements[0] || null;
}

/**
 * useFocusTrap Hook
 * Alternative hook-based API for focus trapping
 */
export function useFocusTrap(active = true) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const firstFocusable = getFirstFocusableElement(containerRef.current);
    firstFocusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !containerRef.current) return;

      const focusableElements = getFocusableElements(containerRef.current);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active]);

  return containerRef;
}

/**
 * useRestoreFocus Hook
 * Stores and restores focus when component unmounts
 */
export function useRestoreFocus() {
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    return () => {
      previouslyFocusedElement.current?.focus();
    };
  }, []);
}

/**
 * useFocusVisible Hook
 * Adds :focus-visible polyfill for browsers that don't support it
 */
export function useFocusVisible() {
  useEffect(() => {
    let hadKeyboardEvent = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === 'Space') {
        hadKeyboardEvent = true;
      }
    };

    const handlePointerDown = () => {
      hadKeyboardEvent = false;
    };

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (hadKeyboardEvent) {
        target.classList.add('focus-visible');
      } else {
        target.classList.remove('focus-visible');
      }
    };

    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      target.classList.remove('focus-visible');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, []);
}

/**
 * useAriaAnnouncement Hook
 * Announces messages to screen readers dynamically
 */
export function useAriaAnnouncement() {
  const [message, setMessage] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  const announce = (text: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setMessage('');
    timeoutRef.current = setTimeout(() => {
      setMessage(text);
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { announce, message };
}
