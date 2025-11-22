'use client';

import { useQuery, gql } from 'urql';
import { motion } from 'framer-motion';
import { formatUSDC, truncateAddress } from '@/lib/utils';
import Link from 'next/link';
import { ShoppingCart, Activity } from 'lucide-react';

const ACTIVITY_QUERY = gql`
  query GetRecentSales {
    listings(
      first: 10
      where: { status: SOLD }
      orderBy: soldAtTimestamp
      orderDirection: desc
    ) {
      id
      price
      soldAtTimestamp
      token {
        id
        tokenId
        uri
        collection {
          id
          name
        }
      }
      buyer {
        id
      }
    }
  }
`;

export function ActivityFeed() {
    const [result] = useQuery({
        query: ACTIVITY_QUERY,
        requestPolicy: 'cache-and-network',
        pollInterval: 5000, // Poll every 5 seconds for "live" feel
    });

    const { data, fetching, error } = result;
    const sales = data?.listings || [];

    if (fetching && !data) return null;
    if (error) return null;
    if (sales.length === 0) return null;

    return (
        <div className="w-full border-b border-neutral-200 bg-white/50 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/50">
            <div className="flex items-center overflow-hidden py-2">
                <div className="flex shrink-0 items-center gap-2 px-4 text-xs font-medium text-primary-600 dark:text-primary-400">
                    <Activity className="h-3 w-3" />
                    <span>LIVE</span>
                </div>

                <div className="relative flex flex-1 overflow-hidden">
                    {/* Gradient Masks */}
                    <div className="absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-white to-transparent dark:from-neutral-900" />
                    <div className="absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-white to-transparent dark:from-neutral-900" />

                    {/* Scrolling Content */}
                    <motion.div
                        className="flex gap-8 px-4"
                        animate={{
                            x: [0, -1000],
                        }}
                        transition={{
                            x: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: 30,
                                ease: "linear",
                            },
                        }}
                    >
                        {[...sales, ...sales, ...sales].map((sale: any, i: number) => (
                            <div key={`${sale.id}-${i}`} className="flex items-center gap-2 text-xs whitespace-nowrap">
                                <span className="text-neutral-500 dark:text-neutral-400">
                                    Sold
                                </span>
                                <Link
                                    href={`/nft/${sale.token.collection.id}/${sale.token.tokenId}`}
                                    className="font-medium text-neutral-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
                                >
                                    {sale.token.collection.name} #{sale.token.tokenId}
                                </Link>
                                <span className="text-neutral-400">for</span>
                                <span className="font-bold text-neutral-900 dark:text-white">
                                    {formatUSDC(sale.price)} USDC
                                </span>
                                <span className="text-neutral-400">to</span>
                                <Link
                                    href={`/profile/${sale.buyer.id}`}
                                    className="font-medium text-neutral-700 hover:text-primary-600 dark:text-neutral-300"
                                >
                                    {truncateAddress(sale.buyer.id)}
                                </Link>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
