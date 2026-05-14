'use client';

import { useMemo } from 'react';
import { useRarityData } from '@/hooks/useRarityData';
import type { Trait } from '@/lib/rarity/calculator';

type TraitRarityTableProps = {
  traits: Trait[];
  collectionAddress: string;
};

export function TraitRarityTable({ traits, collectionAddress }: TraitRarityTableProps) {
  const { data: rarityData } = useRarityData({ collectionAddress });

  const traitStats = useMemo(() => {
    if (!rarityData || rarityData.length === 0) return [];
    return traits
      .map((trait) => {
        const normalizedValue = String(trait.value);
        const count = rarityData.filter((nft) =>
          nft.attributes?.some(
            (attr) =>
              attr.trait_type === trait.trait_type && String(attr.value) === normalizedValue
          )
        ).length;
        const frequency = (count / rarityData.length) * 100;
        return {
          ...trait,
          value: normalizedValue,
          count,
          frequency,
          isRare: frequency <= 5,
        };
      })
      .sort((a, b) => a.frequency - b.frequency);
  }, [rarityData, traits]);

  if (!traits.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Trait Rarity</h3>
      </div>
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Trait
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Value
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Rarity
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {traitStats.map((trait, index) => (
            <tr key={`${trait.trait_type}-${index}`} className={trait.isRare ? 'bg-purple-50' : ''}>
              <td className="px-4 py-3 font-medium text-gray-900">{trait.trait_type}</td>
              <td className="px-4 py-3 text-gray-700">{trait.value}</td>
              <td className="px-4 py-3 text-right">
                <span className={trait.isRare ? 'text-purple-700 font-semibold' : 'text-gray-600'}>
                  {trait.frequency.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
          {traitStats.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-4 text-sm text-gray-500 text-center">
                Trait rarity data unavailable.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
