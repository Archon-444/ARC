'use client';

import { useEffect, useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { NFTCard, NFTCardSkeleton } from '@/components/nft/NFTCard';

type NFTVirtualGridProps<TItem> = {
  items: TItem[];
  isLoading?: boolean;
  hasMore?: boolean;
  onEndReached?: () => void;
  renderItem?: (item: TItem) => React.ReactNode;
};

const DEFAULT_COLUMNS = 4;

function getColumnsForWidth(width: number) {
  if (width >= 1280) return 4;
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

export function NFTVirtualGrid<TItem>({
  items,
  isLoading = false,
  hasMore = false,
  onEndReached,
  renderItem,
}: NFTVirtualGridProps<TItem>) {
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateColumns = () => setColumns(getColumnsForWidth(window.innerWidth));
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const rows = useMemo(() => {
    const result: TItem[][] = [];
    for (let i = 0; i < items.length; i += columns) {
      result.push(items.slice(i, i + columns));
    }
    return result;
  }, [items, columns]);

  const renderCard =
    renderItem ||
    ((item: TItem) => {
      return <NFTCard nft={item as any} />;
    });

  return (
    <Virtuoso
      useWindowScroll
      data={rows}
      totalCount={rows.length}
      endReached={hasMore ? onEndReached : undefined}
      overscan={200}
      itemContent={(_, row) => (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
          {row.map((item, idx) => (
            <div key={(item as any)?.id ?? idx}>{renderCard(item)}</div>
          ))}
          {row.length < columns &&
            Array.from({ length: columns - row.length }).map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}
        </div>
      )}
      components={{
        Footer: () =>
          isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
              {Array.from({ length: columns }).map((_, idx) => (
                <NFTCardSkeleton key={idx} />
              ))}
            </div>
          ) : null,
      }}
      style={{ minHeight: '60vh' }}
    />
  );
}
