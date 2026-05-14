'use client';

import { useState } from 'react';
import type { ActivityEventType } from '@/lib/activity-types';
import { ACTIVITY_EVENT_LABELS } from '@/lib/activity-types';

interface ActivityFiltersProps {
  selectedTypes: ActivityEventType[];
  onTypeChange: (types: ActivityEventType[]) => void;
  selectedUser?: string;
  onUserChange?: (user: string) => void;
  priceRange?: [number, number];
  onPriceRangeChange?: (range: [number, number]) => void;
}

export function ActivityFilters({
  selectedTypes,
  onTypeChange,
  selectedUser,
  onUserChange,
  priceRange,
  onPriceRangeChange,
}: ActivityFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const eventTypes: ActivityEventType[] = ['sale', 'transfer', 'listing', 'bid', 'mint', 'cancel'];

  const toggleEventType = (type: ActivityEventType) => {
    const next = selectedTypes.includes(type)
      ? selectedTypes.filter((item) => item !== type)
      : [...selectedTypes, type];
    onTypeChange(next);
  };

  const clearAll = () => {
    onTypeChange([]);
    onUserChange?.('');
    onPriceRangeChange?.([0, 0]);
  };

  const hasActiveFilters =
    selectedTypes.length > 0 ||
    Boolean(selectedUser) ||
    Boolean(priceRange && (priceRange[0] > 0 || priceRange[1] > 0));

  return (
    <div className="space-y-4 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Event Type</h3>
          {hasActiveFilters ? (
            <button
              onClick={clearAll}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Clear All
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onTypeChange([])}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              selectedTypes.length === 0
                ? 'bg-blue-600 text-white'
                : 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600'
            }`}
          >
            All Events
          </button>
          {eventTypes.map((type) => (
            <button
              key={type}
              onClick={() => toggleEventType(type)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                selectedTypes.includes(type)
                  ? 'bg-blue-600 text-white'
                  : 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600'
              }`}
            >
              {ACTIVITY_EVENT_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setShowAdvanced((prev) => !prev)}
        className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        {showAdvanced ? '− Hide' : '+ Show'} Advanced Filters
      </button>

      {showAdvanced ? (
        <div className="space-y-4 border-t border-neutral-200 pt-4 dark:border-neutral-700">
          {onUserChange ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                User Address
              </label>
              <input
                type="text"
                placeholder="0x... or ENS"
                value={selectedUser || ''}
                onChange={(event) => onUserChange(event.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder-neutral-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </div>
          ) : null}

          {onPriceRangeChange ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Price Range (USDC)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange?.[0] || ''}
                  onChange={(event) =>
                    onPriceRangeChange([Number(event.target.value), priceRange?.[1] || 0])
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
                />
                <span className="text-neutral-500">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange?.[1] || ''}
                  onChange={(event) =>
                    onPriceRangeChange([priceRange?.[0] || 0, Number(event.target.value)])
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
