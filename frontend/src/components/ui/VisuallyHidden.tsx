/**
 * Visually Hidden Component
 *
 * Hides content visually but keeps it accessible to screen readers
 * Useful for providing context to assistive technologies
 */

import React from 'react';

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: React.ElementType;
}

export function VisuallyHidden({ children, as: Component = 'span' }: VisuallyHiddenProps) {
  return <Component className="sr-only">{children}</Component>;
}

/**
 * Screen reader only utility
 * Alias for VisuallyHidden for semantic clarity
 */
export const SrOnly = VisuallyHidden;
