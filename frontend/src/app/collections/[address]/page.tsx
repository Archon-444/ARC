'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Filter, RefreshCcw, Search, Sparkles, X } from 'lucide-react';
import NFTCard from '@/components/NFTCard';
import { Card } from '@/components/ui';
import { fetchGraphQL } from '@/lib/graphql-client';
import { GET_COLLECTION } from '@/graphql/queries';
import { formatUSDC } from '@/hooks/useMarketplace';

const statusFilters = [
  { id: 'buy-now', label: 'Buy Now', predicate: (nft: any) => nft.listing?.active },
  { id: 'auction', label: 'On Auction', predicate: (nft: any) => nft.auction && !nft.auction.settled },
  { id: 'new', label: 'Recently Minted', predicate: (nft: any) => Date.now() / 1000 - Number(nft.createdAt || 0) < 86400 * 7 },
  { id: 'offers', label: 'Has Offers', predicate: (nft: any) => (nft.offers?.length || 0) > 0 },
];

const sortOptions = [
  { value: 'recent', label: 'Recently Listed' },
  { value: 'ending', label: 'Ending Soon' },
  { value: 'low-high', label: 'Price: Low to High' },
  { value: 'high-low', label: 'Price: High to Low' },
  { value: 'oldest', label: 'Oldest' },
];

export default function CollectionPage() {
  const params = useParams();
  const address = params?.address as string;

  const [collection, setCollection] = useState<any>(null);
  const [nfts, setNfts] = useState<any[]>([]);
  const [filteredNFTs, setFilteredNFTs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    if (address) {
      loadCollection();
    }
  }, [address]);

  useEffect(() => {
    applyFilters();
  }, [nfts, searchTerm, priceRange, selectedStatuses, selectedTraits, sortBy]);

  const loadCollection = async () => {
    setLoading(true);
    try {
      const data: any = await fetchGraphQL(GET_COLLECTION, {
        id: address.toLowerCase(),
      });
      if (data.collection) {
        setCollection(data.collection);
        setNfts(data.collection.nfts || []);
      }
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const traitSummary = useMemo(() => {
    const summary: Record<string, Record<string, number>> = {};
    nfts.forEach((nft) => {
      nft.attributes?.forEach((attr: any) => {
        if (!summary[attr.trait_type]) {
          summary[attr.trait_type] = {};
        }
        summary[attr.trait_type][attr.value] = (summary[attr.trait_type][attr.value] || 0) + 1;
      });
    });
    return summary;
  }, [nfts]);

  const applyFilters = () => {
    let result = [...nfts];

    if (searchTerm) {
      result = result.filter((nft) => nft.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (priceRange.min || priceRange.max) {
      const min = priceRange.min ? BigInt(parseFloat(priceRange.min) * 1e6) : BigInt(0);
      const max = priceRange.max ? BigInt(parseFloat(priceRange.max) * 1e6) : BigInt(Number.MAX_SAFE_INTEGER);
      result = result.filter((nft) => {
        const price = nft.listing?.active
          ? BigInt(nft.listing.price)
          : nft.auction
          ? BigInt(nft.auction.highestBid || nft.auction.reservePrice)
          : BigInt(0);
        return (!priceRange.min || price >= min) && (!priceRange.max || price <= max);
      });
    }

    if (selectedStatuses.length > 0) {
      result = result.filter((nft) =>
        selectedStatuses.some((status) => statusFilters.find((f) => f.id === status)?.predicate(nft))
      );
    }

    Object.entries(selectedTraits).forEach(([traitType, values]) => {
      if (values.length === 0) return;
      result = result.filter((nft) => {
        const nftTraits = nft.attributes || [];
        return values.some((value) => nftTraits.some((attr: any) => attr.trait_type === traitType && attr.value === value));
      });
    });

    switch (sortBy) {
      case 'low-high':
        result.sort((a, b) => Number(a.listing?.price || a.auction?.reservePrice || 0) - Number(b.listing?.price || b.auction?.reservePrice || 0));
        break;
      case 'high-low':
        result.sort((a, b) => Number(b.listing?.price || b.auction?.reservePrice || 0) - Number(a.listing?.price || a.auction?.reservePrice || 0));
        break;
      case 'ending':
        result.sort((a, b) => Number(a.auction?.endTime || Number.MAX_SAFE_INTEGER) - Number(b.auction?.endTime || Number.MAX_SAFE_INTEGER));
        break;
      case 'oldest':
        result.sort((a, b) => Number(a.listing?.createdAt || 0) - Number(b.listing?.createdAt || 0));
        break;
      default:
        result.sort((a, b) => Number(b.listing?.createdAt || 0) - Number(a.listing?.createdAt || 0));
    }

    setFilteredNFTs(result);
  };

  const toggleStatus = (statusId: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(statusId) ? prev.filter((status) => status !== statusId) : [...prev, statusId]
    );
  };

  const toggleTrait = (traitType: string, value: string) => {
    setSelectedTraits((prev) => {
      const existing = prev[traitType] || [];
      const updated = existing.includes(value) ? existing.filter((v) => v !== value) : [...existing, value];
      return { ...prev, [traitType]: updated };
    });
  };

  const resetFilters = () => {
    setSelectedStatuses([]);
    setSelectedTraits({});
    setPriceRange({ min: '', max: '' });
    setSearchTerm('');
    setSortBy('recent');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="skeleton h-20 w-20 rounded-full" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
        <Sparkles className="h-10 w-10 text-neutral-400" />
        <p className="text-xl font-semibold">Collection not found</p>
      </div>
    );
  }

  const stats = {
    totalVolume: collection.totalVolume ? formatUSDC(BigInt(collection.totalVolume)) : '0',
    totalSales: collection.totalSales || '0',
    floorPrice: collection.floorPrice ? formatUSDC(BigInt(collection.floorPrice)) : 'N/A',
    items: collection.nfts?.length || 0,
    listed: nfts.filter((nft) => nft.listing?.active).length,
  };

  const appliedFilters = [
    ...selectedStatuses.map((status) => ({
      label: statusFilters.find((f) => f.id === status)?.label || '',
      onRemove: () => toggleStatus(status),
    })),
    ...Object.entries(selectedTraits)
      .flatMap(([traitType, values]) =>
        values.map((value) => ({
          label: `${traitType}: ${value}`,
          onRemove: () => toggleTrait(traitType, value),
        }))
      )
      .filter((entry) => entry.label),
  ];

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-500 to-accent-500 p-10 text-white">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-wide text-white/70">Verified collection</p>
          <h1 className="mt-2 text-4xl font-bold">{collection.name || 'Unknown Collection'}</h1>
          <p className="mt-4 text-white/80">{collection.description || 'Explore rare items and live market data.'}</p>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-3 lg:grid-cols-6">
          <Card className="bg-white/10 p-4 text-sm">
            <p className="text-white/70">Floor</p>
            <p className="text-xl font-bold text-white">{stats.floorPrice}</p>
          </Card>
          <Card className="bg-white/10 p-4 text-sm">
            <p className="text-white/70">Total Volume</p>
            <p className="text-xl font-bold text-white">{stats.totalVolume}</p>
          </Card>
          <Card className="bg-white/10 p-4 text-sm">
            <p className="text-white/70">Items</p>
            <p className="text-xl font-bold text-white">{stats.items}</p>
          </Card>
          <Card className="bg-white/10 p-4 text-sm">
            <p className="text-white/70">Owners</p>
            <p className="text-xl font-bold text-white">{collection.owners || '--'}</p>
          </Card>
          <Card className="bg-white/10 p-4 text-sm">
            <p className="text-white/70">Listed</p>
            <p className="text-xl font-bold text-white">{stats.listed}</p>
          </Card>
          <Card className="bg-white/10 p-4 text-sm">
            <p className="text-white/70">Total Sales</p>
            <p className="text-xl font-bold text-white">{stats.totalSales}</p>
          </Card>
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Filters</h3>
            <button onClick={resetFilters} className="text-sm text-primary-600">
              Reset
            </button>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">Search</label>
            <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 px-3 py-2 dark:border-neutral-700">
              <Search className="h-4 w-4 text-neutral-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name"
                className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-white"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">Status</p>
            <div className="mt-3 space-y-2">
              {statusFilters.map((filter) => (
                <label key={filter.id} className="flex cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(filter.id)}
                    onChange={() => toggleStatus(filter.id)}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  {filter.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">Price Range (USDC)</p>
            <div className="mt-3 flex gap-3">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(event) => setPriceRange((prev) => ({ ...prev, min: event.target.value }))}
                className="input"
              />
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(event) => setPriceRange((prev) => ({ ...prev, max: event.target.value }))}
                className="input"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">Traits</p>
            <div className="mt-3 space-y-4">
              {Object.entries(traitSummary)
                .slice(0, 4)
                .map(([traitType, values]) => (
                  <div key={traitType}>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">{traitType}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(values)
                        .slice(0, 6)
                        .map(([value, count]) => (
                          <button
                            key={value}
                            onClick={() => toggleTrait(traitType, value)}
                            className={`chip ${selectedTraits[traitType]?.includes(value) ? 'border-primary-500 text-primary-600' : ''}`}
                          >
                            {value} · {Math.round((count / nfts.length) * 100) || 1}%
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-neutral-400" />
              <p className="text-sm text-neutral-500">{filteredNFTs.length} results</p>
              {appliedFilters.map((filter) => (
                <span key={filter.label} className="filter-chip">
                  {filter.label}
                  <button onClick={filter.onRemove}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-neutral-500">Sort by</label>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-full border border-neutral-200 px-4 py-2 text-sm dark:border-neutral-700"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="nft-grid">
            {filteredNFTs.map((nft) => (
              <NFTCard key={nft.id} nft={nft} />
            ))}
            {filteredNFTs.length === 0 && (
              <div className="col-span-full flex flex-col items-center rounded-3xl border border-dashed border-neutral-200 p-12 text-center dark:border-neutral-700">
                <RefreshCcw className="h-8 w-8 text-neutral-400" />
                <p className="mt-3 text-lg font-semibold">No items match these filters</p>
                <p className="text-sm text-neutral-500">Adjust filters to widen your search.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
