'use client';

import { useQuery, gql } from 'urql';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { formatUSDC } from '@/lib/utils';

const ANALYTICS_QUERY = gql`
  query GetCollectionAnalytics($collectionId: String!) {
    collection(id: $collectionId) {
      id
      totalVolume
      floorPrice
    }
    listings(
      first: 100
      where: { 
        token_: { collection: $collectionId },
        status: SOLD 
      }
      orderBy: soldAtTimestamp
      orderDirection: desc
    ) {
      price
      soldAtTimestamp
    }
  }
`;

interface AnalyticsDashboardProps {
  collectionId: string;
}

export function AnalyticsDashboard({ collectionId }: AnalyticsDashboardProps) {
  const [result] = useQuery({
    query: ANALYTICS_QUERY,
    variables: { collectionId },
  });

  const { data, fetching } = result;

  if (fetching) return <div className="h-64 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />;
  if (!data?.collection) return null;

  // Process data for charts (group by day)
  const sales = data.listings || [];
  const volumeByDay = sales.reduce((acc: any, sale: any) => {
    const date = new Date(parseInt(sale.soldAtTimestamp) * 1000).toLocaleDateString();
    if (!acc[date]) acc[date] = 0;
    acc[date] += parseInt(sale.price);
    return acc;
  }, {});

  const chartData = Object.entries(volumeByDay)
    .map(([date, volume]) => ({
      date,
      volume: Number(BigInt(volume as string) / BigInt(1e6)), // Convert to USDC
    }))
    .reverse();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Total Volume"
          value={`${formatUSDC(data.collection.totalVolume)} USDC`}
        />
        <MetricCard
          label="Floor Price"
          value={`${formatUSDC(data.collection.floorPrice)} USDC`}
        />
        <MetricCard
          label="24h Sales"
          value={sales.filter((s: any) => parseInt(s.soldAtTimestamp) > Date.now() / 1000 - 86400).length.toString()}
        />
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="mb-6 text-lg font-semibold text-neutral-900 dark:text-white">Volume History</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#525252" opacity={0.2} />
              <XAxis
                dataKey="date"
                stroke="#a3a3a3"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#a3a3a3"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#171717',
                  border: '1px solid #262626',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                cursor={{ fill: '#262626', opacity: 0.4 }}
              />
              <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
    </div>
  );
}
