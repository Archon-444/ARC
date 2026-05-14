/**
 * FilterPanel Component
 *
 * Advanced filtering for collection pages with:
 * - Price range slider
 * - Trait filtering with frequency %
 * - Status filters (Buy Now, Auction, etc.)
 * - Sort options
 */

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TraitValue {
  value: string;
  count: number;
  percentage: number;
}

interface Trait {
  name: string;
  values: TraitValue[];
}

interface FilterPanelProps {
  traits?: Trait[];
  onFilterChange?: (filters: CollectionFilters) => void;
  className?: string;
}

export interface CollectionFilters {
  priceMin?: number;
  priceMax?: number;
  traits: Record<string, string[]>;
  status: string[];
}

export function FilterPanel({ traits = [], onFilterChange, className }: FilterPanelProps) {
  const [filters, setFilters] = useState<CollectionFilters>({
    traits: {},
    status: [],
  });
  const [expandedTraits, setExpandedTraits] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState<{min: string; max: string}>({ min: '', max: '' });

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const newRange = { ...priceRange, [type]: value };
    setPriceRange(newRange);

    const updated = {
      ...filters,
      priceMin: newRange.min ? parseFloat(newRange.min) : undefined,
      priceMax: newRange.max ? parseFloat(newRange.max) : undefined,
    };
    setFilters(updated);
    onFilterChange?.(updated);
  };

  const handleTraitToggle = (traitName: string, value: string) => {
    const currentValues = filters.traits[traitName] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    const updated = {
      ...filters,
      traits: {
        ...filters.traits,
        [traitName]: newValues.length > 0 ? newValues : undefined as any,
      },
    };

    // Remove empty trait arrays
    Object.keys(updated.traits).forEach((key) => {
      if (!updated.traits[key] || updated.traits[key].length === 0) {
        delete updated.traits[key];
      }
    });

    setFilters(updated);
    onFilterChange?.(updated);
  };

  const handleStatusToggle = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];

    const updated = { ...filters, status: newStatus };
    setFilters(updated);
    onFilterChange?.(updated);
  };

  const toggleTraitExpansion = (traitName: string) => {
    const newExpanded = new Set(expandedTraits);
    if (newExpanded.has(traitName)) {
      newExpanded.delete(traitName);
    } else {
      newExpanded.add(traitName);
    }
    setExpandedTraits(newExpanded);
  };

  const clearAllFilters = () => {
    setFilters({ traits: {}, status: [] });
    setPriceRange({ min: '', max: '' });
    onFilterChange?.({ traits: {}, status: [] });
  };

  const hasActiveFilters =
    Object.keys(filters.traits).length > 0 ||
    filters.status.length > 0 ||
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Status Filters */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Status</h4>
        <div className="space-y-2">
          {['Buy Now', 'On Auction', 'Has Offers'].map((status) => (
            <label key={status} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.status.includes(status)}
                onChange={() => handleStatusToggle(status)}
                className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm">{status}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Price Range (USDC)
        </h4>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => handlePriceChange('min', e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
          <span className="flex items-center text-neutral-400">to</span>
          <input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => handlePriceChange('max', e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-800"
          />
        </div>
      </div>

      {/* Traits */}
      {traits.map((trait) => (
        <div key={trait.name} className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
          <button
            onClick={() => toggleTraitExpansion(trait.name)}
            className="flex w-full items-center justify-between text-sm font-semibold text-neutral-700 dark:text-neutral-300"
          >
            <span className="flex items-center gap-2">
              {trait.name}
              {filters.traits[trait.name] && filters.traits[trait.name].length > 0 && (
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  {filters.traits[trait.name].length}
                </span>
              )}
            </span>
            {expandedTraits.has(trait.name) ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {expandedTraits.has(trait.name) && (
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              {trait.values.map((value) => (
                <label
                  key={value.value}
                  className="flex items-center justify-between cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded p-1"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      checked={filters.traits[trait.name]?.includes(value.value) || false}
                      onChange={() => handleTraitToggle(trait.name, value.value)}
                      className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-sm truncate">{value.value}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span>{value.count}</span>
                    <span className="text-neutral-400">({value.percentage.toFixed(1)}%)</span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
          <h4 className="mb-2 text-sm font-semibold">Active Filters</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters.traits).map(([traitName, values]) =>
              values.map((value) => (
                <button
                  key={`${traitName}-${value}`}
                  onClick={() => handleTraitToggle(traitName, value)}
                  className="flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                >
                  {value}
                  <X className="h-3 w-3" />
                </button>
              ))
            )}
            {filters.status.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusToggle(status)}
                className="flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
              >
                {status}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
