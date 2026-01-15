'use client';

import { useState, useEffect } from 'react';
import { useQuery, gql } from 'urql';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Sliders, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatUSDC } from '@/lib/utils';

const FLOOR_ITEMS_QUERY = gql`
  query GetFloorItems($collectionId: String!, $first: Int!) {
    listings(
      first: $first
      where: { 
        token_: { collection: $collectionId },
        status: ACTIVE 
      }
      orderBy: price
      orderDirection: asc
    ) {
      id
      price
      token {
        id
        tokenId
        image
      }
    }
  }
`;

interface SweepWidgetProps {
    collectionId: string;
    onSweep: (listingIds: string[]) => void;
}

export function SweepWidget({ collectionId, onSweep }: SweepWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);

    // Fetch up to 50 floor items
    const [result] = useQuery({
        query: FLOOR_ITEMS_QUERY,
        variables: { collectionId, first: 50 },
        pause: !isOpen,
    });

    const { data, fetching } = result;
    const listings = data?.listings || [];

    // Calculate totals
    const selectedListings = listings.slice(0, quantity);
    const totalPrice = selectedListings.reduce((acc: bigint, item: any) => acc + BigInt(item.price), BigInt(0));
    const avgPrice = quantity > 0 ? totalPrice / BigInt(quantity) : BigInt(0);

    return (
        <div className="fixed bottom-6 right-6 z-40">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-80 rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-bold text-neutral-900 dark:text-white">Sweep Floor</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            >
                                <X className="h-4 w-4 text-neutral-500" />
                            </button>
                        </div>

                        <div className="mb-6 space-y-4">
                            <div>
                                <div className="mb-2 flex justify-between text-sm">
                                    <span className="text-neutral-500">Items</span>
                                    <span className="font-medium">{quantity}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max={Math.min(listings.length, 20) || 1}
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-200 accent-primary-600 dark:bg-neutral-800"
                                />
                            </div>

                            <div className="flex justify-between rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/50">
                                <span className="text-sm text-neutral-500">Total Price</span>
                                <div className="text-right">
                                    <div className="font-bold text-neutral-900 dark:text-white">
                                        {formatUSDC(totalPrice)} USDC
                                    </div>
                                    <div className="text-xs text-neutral-500">
                                        ~{formatUSDC(avgPrice)} avg
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            fullWidth
                            size="lg"
                            onClick={() => onSweep(selectedListings.map((l: any) => l.id))}
                            disabled={fetching || listings.length === 0}
                        >
                            {fetching ? 'Loading...' : `Sweep ${quantity} Items`}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/30 transition-colors hover:bg-primary-700"
            >
                {isOpen ? <Sliders className="h-6 w-6" /> : <ShoppingBag className="h-6 w-6" />}
            </motion.button>
        </div>
    );
}
