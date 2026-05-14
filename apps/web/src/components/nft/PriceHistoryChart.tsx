import { formatUSDC } from '@/hooks/useMarketplace';
import type { Sale } from '@/types';

type PriceHistoryChartProps = {
  sales: Sale[];
};

export function PriceHistoryChart({ sales }: PriceHistoryChartProps) {
  if (!sales || sales.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
        No sales history available.
      </div>
    );
  }

  const points = sales
    .slice()
    .reverse()
    .map((sale) => Number(sale.price || 0));

  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(max - min, 1);

  const height = 120;
  const width = 300;
  const step = points.length > 1 ? width / (points.length - 1) : width;

  const path = points
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">All-time sales</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatUSDC(String(max))} USDC
          </p>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p>Low</p>
          <p className="font-medium text-gray-900">{formatUSDC(String(min))} USDC</p>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <path d={path} fill="none" stroke="#2563eb" strokeWidth="2" />
      </svg>
    </div>
  );
}
