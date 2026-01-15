import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'common' | 'rare' | 'epic' | 'legendary';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      icon,
      dot = false,
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary:
        'border-primary-100 bg-primary-50 text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-200',
      success:
        'border-success-100 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-200',
      warning:
        'border-warning-100 bg-warning-50 text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-100',
      error:
        'border-error-100 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-200',
      neutral:
        'border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200',
      // Rarity variants - more distinct colors
      common:
        'border-neutral-300 bg-neutral-100 text-neutral-600 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
      rare:
        'border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-500/50 dark:bg-primary-900/40 dark:text-primary-300',
      epic:
        'border-accent-300 bg-accent-50 text-accent-700 dark:border-accent-500/50 dark:bg-accent-900/40 dark:text-accent-300',
      legendary:
        'border-amber-400 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 text-amber-700 dark:border-amber-500/60 dark:from-amber-900/50 dark:via-yellow-900/40 dark:to-orange-900/50 dark:text-amber-300 shadow-sm dark:shadow-amber-500/20',
    } satisfies Record<NonNullable<BadgeProps['variant']>, string>;

    const sizeStyles = {
      sm: 'text-[0.65rem] px-2 py-0.5',
      md: 'text-xs px-3 py-1',
      lg: 'text-sm px-4 py-1.5',
    } satisfies Record<NonNullable<BadgeProps['size']>, string>;

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border font-semibold tracking-tight transition-colors duration-200',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
        )}
        {icon && <span className="inline-flex text-current" aria-hidden="true">{icon}</span>}
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
