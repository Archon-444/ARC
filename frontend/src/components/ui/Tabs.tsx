/**
 * Tabs Component
 *
 * Accessible tab navigation for switching between different content sections
 * Used on collection pages, NFT detail pages, and profile pages
 */

'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs compound components must be used within Tabs');
  }
  return context;
}

/* -------------------------------------------------------------------------------------------------
 * Tabs Root
 * ---------------------------------------------------------------------------------------------- */

export interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue ?? internalValue;

  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider
      value={{ activeTab: value, setActiveTab: handleValueChange }}
    >
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

/* -------------------------------------------------------------------------------------------------
 * TabsList
 * ---------------------------------------------------------------------------------------------- */

export interface TabsListProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'pills';
}

export function TabsList({
  children,
  className,
  variant = 'default',
}: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'relative flex items-center',
        variant === 'default' &&
          'border-b border-neutral-200 dark:border-neutral-800',
        variant === 'pills' && 'gap-2 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800',
        className
      )}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------------------------------
 * TabsTrigger
 * ---------------------------------------------------------------------------------------------- */

export interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'pills';
}

export function TabsTrigger({
  value,
  children,
  className,
  disabled = false,
  variant = 'default',
}: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={cn(
        'relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && [
          isActive
            ? 'text-primary-600 dark:text-primary-400'
            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200',
        ],
        variant === 'pills' && [
          'rounded-md',
          isActive
            ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white'
            : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200',
        ],
        className
      )}
    >
      {children}

      {/* Active indicator for default variant */}
      {variant === 'default' && isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 30,
          }}
        />
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------------------------------
 * TabsContent
 * ---------------------------------------------------------------------------------------------- */

export interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
  forceMount?: boolean;
}

export function TabsContent({
  value,
  children,
  className,
  forceMount = false,
}: TabsContentProps) {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === value;

  if (!isActive && !forceMount) {
    return null;
  }

  return (
    <motion.div
      id={`tabpanel-${value}`}
      role="tabpanel"
      aria-labelledby={`tab-${value}`}
      initial={{ opacity: 0, y: 10 }}
      animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        !isActive && 'hidden',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Compound Export
 * ---------------------------------------------------------------------------------------------- */

Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;
