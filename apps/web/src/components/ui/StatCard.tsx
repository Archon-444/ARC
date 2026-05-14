import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatCard({ label, value, icon: Icon, size = 'md', className }: StatCardProps) {
  const isSm = size === 'sm';

  return (
    <div
      className={cn(
        'rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900',
        isSm ? 'p-3' : 'p-4 shadow-sm',
        className
      )}
    >
      {Icon && (
        <div className={isSm ? 'mb-1' : 'mb-2'}>
          <Icon
            className={cn(
              isSm
                ? 'h-4 w-4 text-neutral-400'
                : 'h-5 w-5 text-primary-600 dark:text-primary-400'
            )}
          />
        </div>
      )}
      <p className={cn(
        isSm ? 'text-xs text-neutral-500' : 'text-sm text-neutral-600 dark:text-neutral-400 mb-1'
      )}>
        {label}
      </p>
      <p className={cn(
        'font-bold text-neutral-900 dark:text-white',
        isSm ? 'text-lg truncate' : 'text-2xl'
      )}>
        {value}
      </p>
    </div>
  );
}
