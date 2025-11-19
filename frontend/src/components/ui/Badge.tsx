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
      // Rarity variants
      common:
        'border-neutral-300 bg-neutral-100 text-neutral-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
      rare:
        'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
      epic:
        'border-purple-300 bg-purple-100 text-purple-700 dark:border-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
      legendary:
        'border-orange-300 bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 dark:border-orange-600 dark:from-yellow-900/30 dark:to-orange-900/30 dark:text-orange-300',
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
