'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock cart data - in production this would come from a cart context/store
const mockCartItems = [
  {
    id: '1',
    name: 'Cosmic Dreamer #142',
    collection: 'Cosmic Dreams',
    image: '/placeholder-nft.png',
    price: 150,
    tokenId: '142',
    collectionAddress: '0x1234...5678',
  },
  {
    id: '2',
    name: 'Pixel Punk #87',
    collection: 'Pixel Punks',
    image: '/placeholder-nft.png',
    price: 75,
    tokenId: '87',
    collectionAddress: '0xabcd...efgh',
  },
];

export default function CartPage() {
  const [cartItems, setCartItems] = useState(mockCartItems);

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const platformFee = subtotal * 0.025; // 2.5% platform fee
  const total = subtotal + platformFee;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="h-8 w-8 text-primary-500" />
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Your Cart</h1>
          {cartItems.length > 0 && (
            <span className="rounded-full bg-primary-100 dark:bg-primary-500/20 px-3 py-1 text-sm font-medium text-primary-600 dark:text-primary-400">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart State */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-6">
              <ShoppingBag className="h-12 w-12 text-neutral-400" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              Your cart is empty
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-center max-w-md">
              Looks like you haven't added any NFTs to your cart yet. Start exploring to find something you love!
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition"
            >
              Explore NFTs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          /* Cart with Items */
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  {/* NFT Image */}
                  <div className="w-24 h-24 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-primary-400 to-accent-400" />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/nft/${item.collectionAddress}/${item.tokenId}`}
                      className="font-semibold text-neutral-900 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 transition"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {item.collection}
                    </p>
                    <p className="mt-2 text-lg font-bold text-neutral-900 dark:text-white">
                      {item.price} <span className="text-sm font-normal text-neutral-500">USDC</span>
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition"
                    title="Remove from cart"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                  Order Summary
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Subtotal</span>
                    <span className="text-neutral-900 dark:text-white">{subtotal.toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">Platform fee (2.5%)</span>
                    <span className="text-neutral-900 dark:text-white">{platformFee.toFixed(2)} USDC</span>
                  </div>
                  <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-neutral-900 dark:text-white">Total</span>
                      <span className="font-bold text-lg text-neutral-900 dark:text-white">
                        {total.toFixed(2)} USDC
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3 font-semibold text-white hover:bg-primary-600 transition"
                >
                  Complete Purchase
                  <ArrowRight className="h-4 w-4" />
                </button>

                <p className="mt-4 text-xs text-center text-neutral-500 dark:text-neutral-400">
                  By completing this purchase, you agree to our Terms of Service.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
