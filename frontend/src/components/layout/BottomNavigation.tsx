/**
 * BottomNavigation Component
 *
 * Mobile bottom navigation bar for quick access to main app sections
 * Only visible on mobile/tablet devices
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Search, PlusCircle, Activity, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  highlight?: boolean;
}

const defaultNavItems: NavItem[] = [
  {
    href: '/',
    icon: Home,
    label: 'Home',
  },
  {
    href: '/explore',
    icon: Search,
    label: 'Explore',
  },
  {
    href: '/create',
    icon: PlusCircle,
    label: 'Create',
    highlight: true,
  },
  {
    href: '/activity',
    icon: Activity,
    label: 'Activity',
  },
  {
    href: '/profile',
    icon: User,
    label: 'Profile',
  },
];

export interface BottomNavigationProps {
  items?: NavItem[];
  className?: string;
}

export function BottomNavigation({
  items = defaultNavItems,
  className,
}: BottomNavigationProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white/90 backdrop-blur-lg dark:border-neutral-800 dark:bg-neutral-900/90 md:hidden',
        className
      )}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto max-w-screen-xl">
        <ul className="flex items-center justify-around" role="list">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-1 py-3 transition-colors',
                    isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -top-[1px] left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-primary-600 dark:bg-primary-400"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}

                  {/* Icon container with highlight effect for Create button */}
                  <div
                    className={cn(
                      'relative flex items-center justify-center',
                      item.highlight &&
                        'rounded-full bg-primary-600 p-2 text-white dark:bg-primary-500'
                    )}
                  >
                    <Icon
                      className={cn(
                        'transition-all',
                        item.highlight ? 'h-6 w-6' : 'h-5 w-5',
                        isActive && !item.highlight && 'scale-110'
                      )}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      'text-[10px] font-medium transition-all',
                      isActive ? 'font-semibold' : 'font-normal'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Safe area for devices with bottom notch (iOS) */}
      <div className="h-safe-area-inset-bottom bg-inherit" />
    </nav>
  );
}

/**
 * Spacer component to prevent content from being hidden behind bottom nav
 * Use this at the bottom of your mobile pages
 */
export function BottomNavSpacer() {
  return <div className="h-16 md:hidden" aria-hidden="true" />;
}
