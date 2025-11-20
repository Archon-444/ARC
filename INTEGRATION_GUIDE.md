# Component Integration Guide

## Overview

This guide provides step-by-step instructions for integrating all 29 UI components into the ArcMarket application. Each section includes specific file paths, code examples, and testing instructions.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Root Layout Setup](#root-layout-setup)
3. [API Layer Setup](#api-layer-setup)
4. [Blockchain Layer Setup](#blockchain-layer-setup)
5. [Page Integrations](#page-integrations)
6. [Component Integrations](#component-integrations)
7. [Testing Guide](#testing-guide)

---

## Prerequisites

### Required Dependencies

Ensure all dependencies are installed:

```bash
cd frontend

# Core dependencies (should already be installed)
npm install framer-motion recharts react-virtuoso

# Additional dependencies for remaining features
npm install react-zoom-pan-pinch @react-three/fiber @react-three/drei three
npm install ethers@^6.0.0

# Development dependencies
npm install -D @types/node
```

### Environment Variables

Create or update `frontend/.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.arcmarket.io
NEXT_PUBLIC_WS_URL=wss://api.arcmarket.io

# Blockchain Configuration
NEXT_PUBLIC_CHAIN_ID=41455 # Arc testnet
NEXT_PUBLIC_RPC_URL=https://rpc.arcmarket.io
NEXT_PUBLIC_USDC_ADDRESS=0x... # Arc testnet USDC contract
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x... # Arc marketplace contract

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://arcmarket.io

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## Root Layout Setup

### Step 1: Update Root Layout

**File:** `frontend/src/app/layout.tsx`

Replace the entire file with:

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Accessibility
import { SkipLinks } from '@/components/accessibility/SkipLinks';

// Error Handling
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

// PWA
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';

// Providers
import { WalletProvider } from '@/contexts/WalletContext';
import { ToastProvider } from '@/components/ui/Toast';

// Performance Monitoring
import { PerformanceMonitor } from '@/components/PerformanceMonitor';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ArcMarket - NFT Marketplace',
  description: 'Buy, sell, and discover NFTs on Arc blockchain',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Skip Links for Accessibility */}
        <SkipLinks
          links={[
            { href: '#main-content', label: 'Skip to main content' },
            { href: '#footer', label: 'Skip to footer' },
            { href: '#navigation', label: 'Skip to navigation' },
          ]}
        />

        {/* Error Boundary */}
        <ErrorBoundary
          onError={(error, errorInfo) => {
            // Send to error tracking service
            console.error('Application error:', error, errorInfo);
            // Example: Sentry.captureException(error, { extra: errorInfo });
          }}
        >
          {/* Providers */}
          <WalletProvider>
            <ToastProvider>
              {/* PWA Install Prompt */}
              <PWAInstallPrompt />

              {/* Performance Monitoring */}
              <PerformanceMonitor />

              {/* Main Content */}
              {children}
            </ToastProvider>
          </WalletProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

---

### Step 2: Create Performance Monitor Component

**File:** `frontend/src/components/PerformanceMonitor.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { initPerformanceMonitoring } from '@/lib/performance';

export function PerformanceMonitor() {
  useEffect(() => {
    // Initialize performance monitoring on mount
    initPerformanceMonitoring();
  }, []);

  // This component doesn't render anything
  return null;
}
```

---

### Step 3: Create Wallet Provider (if not exists)

**File:** `frontend/src/contexts/WalletContext.tsx`

```typescript
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

interface WalletContextType {
  address: string | null;
  signer: JsonRpcSigner | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);

  const connect = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();

      setAddress(accounts[0]);
      setSigner(signer);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const disconnect = () => {
    setAddress(null);
    setSigner(null);
  };

  // Auto-connect if previously connected
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            connect();
          }
        });
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        signer,
        isConnected: !!address,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
```

---

### Step 4: Create Toast Provider

**File:** `frontend/src/components/ui/Toast.tsx` (already exists)

Update to add provider:

```typescript
// Add to existing Toast.tsx

'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type: Toast['type'], duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast['type'], duration = 5000) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} onClose={() => {
              setToasts((prev) => prev.filter((t) => t.id !== toast.id));
            }} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
```

---

## API Layer Setup

### Step 1: Create Base API Client

**File:** `frontend/src/lib/api/client.ts`

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(
      error.message || 'Request failed',
      response.status,
      error
    );
  }

  return response.json();
}
```

---

### Step 2: Create Search API

**File:** `frontend/src/lib/api/search.ts`

```typescript
import { apiClient } from './client';

export interface SearchResult {
  nfts: Array<{
    id: string;
    name: string;
    image: string;
    collectionName: string;
    price?: string;
  }>;
  collections: Array<{
    id: string;
    name: string;
    image: string;
    verified: boolean;
    floorPrice?: string;
  }>;
  users: Array<{
    address: string;
    username?: string;
    avatar?: string;
    verified: boolean;
  }>;
}

export async function searchAutocomplete(
  query: string,
  types: ('nft' | 'collection' | 'user')[] = ['nft', 'collection', 'user']
): Promise<SearchResult> {
  return apiClient<SearchResult>('/api/search/autocomplete', {
    method: 'POST',
    body: JSON.stringify({ query, types, limit: 10 }),
  });
}

export async function searchNFTs(params: {
  query?: string;
  collectionId?: string;
  priceMin?: string;
  priceMax?: string;
  traits?: Record<string, string[]>;
  sort?: string;
  limit?: number;
  offset?: number;
}) {
  return apiClient('/api/search/nfts', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}
```

---

### Step 3: Create NFT API

**File:** `frontend/src/lib/api/nft.ts`

```typescript
import { apiClient } from './client';

export interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  name: string;
  description: string;
  image: string;
  collection: {
    id: string;
    name: string;
    verified: boolean;
  };
  owner: string;
  creator?: string;
  attributes: Array<{
    trait_type: string;
    value: string;
    rarity?: number;
  }>;
  price?: string;
  listingId?: string;
}

export async function fetchNFT(id: string): Promise<NFT> {
  return apiClient<NFT>(`/api/nft/${id}`);
}

export async function fetchNFTsByCollection(
  collectionId: string,
  params?: { limit?: number; offset?: number }
) {
  const query = new URLSearchParams(params as any).toString();
  return apiClient(`/api/collection/${collectionId}/nfts?${query}`);
}

export async function fetchPriceHistory(
  contractAddress: string,
  tokenId: string,
  period: '7d' | '30d' | '90d' | '1y' | 'all' = '30d'
) {
  return apiClient(
    `/api/nft/${contractAddress}/${tokenId}/price-history?period=${period}`
  );
}
```

---

### Step 4: Create Offers API

**File:** `frontend/src/lib/api/offers.ts`

```typescript
import { apiClient } from './client';

export interface Offer {
  id: string;
  nftId: string;
  offerer: string;
  offererUsername?: string;
  offererAvatar?: string;
  price: string;
  expiresAt: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
}

export async function fetchOffers(nftId: string): Promise<Offer[]> {
  return apiClient<Offer[]>(`/api/nft/${nftId}/offers`);
}

export async function createOffer(params: {
  nftId: string;
  contractAddress: string;
  tokenId: string;
  price: string;
  expirationDays: number;
  signature?: string;
}) {
  return apiClient('/api/offers', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function acceptOffer(offerId: string) {
  return apiClient(`/api/offers/${offerId}/accept`, {
    method: 'POST',
  });
}

export async function cancelOffer(offerId: string) {
  return apiClient(`/api/offers/${offerId}/cancel`, {
    method: 'POST',
  });
}
```

---

### Step 5: Create Activity API

**File:** `frontend/src/lib/api/activity.ts`

```typescript
import { apiClient } from './client';

export type ActivityEvent =
  | 'sale'
  | 'listing'
  | 'transfer'
  | 'offer'
  | 'offer_accepted'
  | 'bid'
  | 'cancel_listing';

export interface Activity {
  id: string;
  type: ActivityEvent;
  nftId: string;
  from: { address: string; username?: string };
  to: { address: string; username?: string };
  price?: string;
  timestamp: number;
  txHash: string;
}

export async function fetchActivity(params: {
  nftId?: string;
  collectionId?: string;
  type?: ActivityEvent;
  limit?: number;
  offset?: number;
}): Promise<{ activities: Activity[]; hasMore: boolean; total: number }> {
  const query = new URLSearchParams(params as any).toString();
  return apiClient(`/api/activity?${query}`);
}
```

---

### Step 6: Create Analytics API

**File:** `frontend/src/lib/api/analytics.ts`

```typescript
import { apiClient } from './client';

export async function fetchVolumeData(period: '7d' | '30d' | '90d' | '1y' | 'all') {
  return apiClient(`/api/analytics/volume?period=${period}`);
}

export async function fetchSalesDistribution() {
  return apiClient('/api/analytics/sales-distribution');
}

export async function fetchHolderStats() {
  return apiClient('/api/analytics/holder-stats');
}

export async function fetchTopSales(limit = 10) {
  return apiClient(`/api/analytics/top-sales?limit=${limit}`);
}
```

---

## Blockchain Layer Setup

### Step 1: Create Contract ABIs

**File:** `frontend/src/lib/blockchain/abis.ts`

```typescript
export const USDC_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

export const MARKETPLACE_ABI = [
  'function makeOffer(address nftContract, uint256 tokenId, uint256 price, uint256 expirationTime) returns (uint256)',
  'function acceptOffer(uint256 offerId)',
  'function cancelOffer(uint256 offerId)',
  'function buy(uint256 listingId) payable',
  'event OfferMade(uint256 indexed offerId, address indexed offerer, uint256 price)',
  'event OfferAccepted(uint256 indexed offerId)',
  'event Sale(uint256 indexed listingId, address indexed buyer, uint256 price)',
];

export const ERC721_ABI = [
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
];
```

---

### Step 2: Create USDC Utilities

**File:** `frontend/src/lib/blockchain/usdc.ts`

```typescript
import { ethers, BrowserProvider, Contract } from 'ethers';
import { USDC_ABI } from './abis';

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS!;
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS!;

export async function getUSDCBalance(address: string): Promise<bigint> {
  const provider = new BrowserProvider(window.ethereum);
  const usdc = new Contract(USDC_ADDRESS, USDC_ABI, provider);
  return await usdc.balanceOf(address);
}

export function formatUSDC(amount: bigint): string {
  return ethers.formatUnits(amount, 6); // USDC has 6 decimals
}

export function parseUSDC(amount: string): bigint {
  return ethers.parseUnits(amount, 6);
}

export async function checkUSDCAllowance(
  userAddress: string,
  requiredAmount: bigint
): Promise<{ hasAllowance: boolean; currentAllowance: bigint }> {
  const provider = new BrowserProvider(window.ethereum);
  const usdc = new Contract(USDC_ADDRESS, USDC_ABI, provider);

  const currentAllowance: bigint = await usdc.allowance(
    userAddress,
    MARKETPLACE_ADDRESS
  );

  return {
    hasAllowance: currentAllowance >= requiredAmount,
    currentAllowance,
  };
}

export async function approveUSDC(amount: bigint): Promise<string> {
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const usdc = new Contract(USDC_ADDRESS, USDC_ABI, signer);

  const tx = await usdc.approve(MARKETPLACE_ADDRESS, amount);
  const receipt = await tx.wait();

  return receipt.hash;
}
```

---

### Step 3: Create Marketplace Utilities

**File:** `frontend/src/lib/blockchain/marketplace.ts`

```typescript
import { ethers, BrowserProvider, Contract } from 'ethers';
import { MARKETPLACE_ABI } from './abis';

const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS!;

export async function submitOffer(params: {
  nftContract: string;
  tokenId: string;
  price: bigint;
  expirationDays: number;
}): Promise<{ txHash: string; offerId: string }> {
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const marketplace = new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

  const expirationTime =
    Math.floor(Date.now() / 1000) + params.expirationDays * 24 * 60 * 60;

  const tx = await marketplace.makeOffer(
    params.nftContract,
    params.tokenId,
    params.price,
    expirationTime
  );

  const receipt = await tx.wait();

  // Extract offerId from event
  const event = receipt.logs
    .map((log: any) => {
      try {
        return marketplace.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((event: any) => event?.name === 'OfferMade');

  const offerId = event?.args?.offerId.toString();

  return { txHash: receipt.hash, offerId };
}

export async function acceptOfferOnChain(offerId: string): Promise<string> {
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const marketplace = new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

  const tx = await marketplace.acceptOffer(offerId);
  const receipt = await tx.wait();

  return receipt.hash;
}

export async function cancelOfferOnChain(offerId: string): Promise<string> {
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const marketplace = new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

  const tx = await marketplace.cancelOffer(offerId);
  const receipt = await tx.wait();

  return receipt.hash;
}

export async function buyNFT(listingId: string, price: bigint): Promise<string> {
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const marketplace = new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

  const tx = await marketplace.buy(listingId);
  const receipt = await tx.wait();

  return receipt.hash;
}
```

---

### Step 4: Create NFT Metadata Utilities

**File:** `frontend/src/lib/blockchain/nft.ts`

```typescript
import { ethers, JsonRpcProvider, Contract } from 'ethers';
import { ERC721_ABI } from './abis';

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL!;

export async function fetchNFTMetadata(
  contractAddress: string,
  tokenId: string
) {
  const provider = new JsonRpcProvider(RPC_URL);
  const nft = new Contract(contractAddress, ERC721_ABI, provider);

  const tokenURI = await nft.tokenURI(tokenId);

  // Handle IPFS URLs
  const metadataURL = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');

  const response = await fetch(metadataURL);
  if (!response.ok) {
    throw new Error('Failed to fetch metadata');
  }

  const metadata = await response.json();

  return {
    name: metadata.name,
    description: metadata.description,
    image: metadata.image?.replace('ipfs://', 'https://ipfs.io/ipfs/') || '',
    attributes: metadata.attributes || [],
  };
}

export async function getOwner(
  contractAddress: string,
  tokenId: string
): Promise<string> {
  const provider = new JsonRpcProvider(RPC_URL);
  const nft = new Contract(contractAddress, ERC721_ABI, provider);
  return await nft.ownerOf(tokenId);
}
```

---

## Page Integrations

### Integration 1: NFT Detail Page

**File:** `frontend/src/app/nft/[id]/page.tsx`

```typescript
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { fetchNFT } from '@/lib/api/nft';
import { NFTSEO } from '@/components/seo/SEO';
import { NFTDetailLayout } from '@/components/nft/NFTDetailLayout';
import { NFTDetailSkeleton } from '@/components/nft/NFTDetailSkeleton';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const nft = await fetchNFT(params.id);

  return {
    title: `${nft.name} - ${nft.collection.name} | ArcMarket`,
    description: nft.description,
  };
}

export default async function NFTPage({ params }: { params: { id: string } }) {
  let nft;

  try {
    nft = await fetchNFT(params.id);
  } catch (error) {
    notFound();
  }

  return (
    <>
      {/* SEO */}
      <NFTSEO
        name={nft.name}
        description={nft.description}
        image={nft.image}
        collectionName={nft.collection.name}
        tokenId={nft.tokenId}
        owner={nft.owner}
        price={nft.price}
        creator={nft.creator}
      />

      {/* Main Content */}
      <main id="main-content" className="container mx-auto px-4 py-8">
        <Suspense fallback={<NFTDetailSkeleton />}>
          <NFTDetailLayout nft={nft} />
        </Suspense>
      </main>
    </>
  );
}
```

**Create Skeleton:**
**File:** `frontend/src/components/nft/NFTDetailSkeleton.tsx`

```typescript
export function NFTDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Image Skeleton */}
      <div className="aspect-square animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />

      {/* Details Skeleton */}
      <div className="space-y-6">
        <div className="h-8 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}
```

---

### Integration 2: Collection Page

**File:** `frontend/src/app/collection/[slug]/page.tsx`

```typescript
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { CollectionSEO } from '@/components/seo/SEO';
import { CollectionPageLayout } from '@/components/collection/CollectionPageLayout';

// Mock function - replace with real API call
async function fetchCollection(slug: string) {
  // TODO: Implement API call
  return {
    id: slug,
    name: 'Collection Name',
    description: 'Collection description',
    // ... other fields
  };
}

async function fetchCollectionNFTs(slug: string) {
  // TODO: Implement API call
  return [];
}

export default async function CollectionPage({
  params,
}: {
  params: { slug: string };
}) {
  let collection, nfts;

  try {
    [collection, nfts] = await Promise.all([
      fetchCollection(params.slug),
      fetchCollectionNFTs(params.slug),
    ]);
  } catch (error) {
    notFound();
  }

  return (
    <>
      {/* SEO */}
      <CollectionSEO
        name={collection.name}
        description={collection.description}
        image={collection.image}
        slug={params.slug}
        floorPrice={collection.floorPrice}
        totalVolume={collection.totalVolume}
        itemCount={collection.itemCount}
      />

      {/* Main Content */}
      <main id="main-content">
        <Suspense fallback={<div>Loading...</div>}>
          <CollectionPageLayout collection={collection} nfts={nfts} />
        </Suspense>
      </main>
    </>
  );
}
```

---

### Integration 3: Home Page with Search

**File:** `frontend/src/app/page.tsx`

Update to include SearchInput in header:

```typescript
import { Header } from '@/components/layout/Header';
import { FeaturedCollections } from '@/components/home/FeaturedCollections';
import { TrendingNFTs } from '@/components/home/TrendingNFTs';

export default function HomePage() {
  return (
    <>
      <Header />

      <main id="main-content" className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="py-12 text-center">
          <h1 className="text-5xl font-bold">
            Discover, collect, and sell NFTs
          </h1>
          <p className="mt-4 text-xl text-neutral-600 dark:text-neutral-400">
            The premier NFT marketplace on Arc blockchain
          </p>
        </section>

        {/* Featured Collections */}
        <FeaturedCollections />

        {/* Trending NFTs */}
        <TrendingNFTs />
      </main>
    </>
  );
}
```

---

### Integration 4: Create Header Component

**File:** `frontend/src/components/layout/Header.tsx`

```typescript
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SearchInput } from '@/components/search/SearchInput';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { useWallet } from '@/contexts/WalletContext';
import { useKeyboardShortcuts } from '@/components/accessibility/SkipLinks';
import { searchAutocomplete } from '@/lib/api/search';

export function Header() {
  const { address, isConnected, connect, disconnect } = useWallet();
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Keyboard shortcut: Cmd/Ctrl + K for command palette
  useKeyboardShortcuts(
    {
      'meta+k': () => setShowCommandPalette(true),
      'ctrl+k': () => setShowCommandPalette(true),
    },
    true
  );

  const handleSearch = async (query: string) => {
    return await searchAutocomplete(query);
  };

  return (
    <header id="navigation" className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold">
          ArcMarket
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-2xl mx-8">
          <SearchInput
            placeholder="Search NFTs, collections, and users"
            onSearch={handleSearch}
            onFocus={() => setShowCommandPalette(false)}
          />
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          <Link href="/explore">Explore</Link>
          <Link href="/create">Create</Link>

          {/* Wallet Button */}
          {isConnected ? (
            <button
              onClick={disconnect}
              className="rounded-lg bg-primary-600 px-4 py-2 text-white"
            >
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </button>
          ) : (
            <button
              onClick={connect}
              className="rounded-lg bg-primary-600 px-4 py-2 text-white"
            >
              Connect Wallet
            </button>
          )}
        </nav>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />
    </header>
  );
}
```

---

## Component Integrations

### Integration 5: Wire OptimizedImage to NFTCard

**File:** `frontend/src/components/nft/NFTCard.tsx`

**Lines to change:** ~90-100

```diff
- import Image from 'next/image';
+ import { NFTImage } from '@/components/ui/OptimizedImage';

  {/* NFT Image */}
  <div className="relative aspect-square overflow-hidden rounded-t-xl bg-neutral-100 dark:bg-neutral-800">
-   <Image
+   <NFTImage
      src={image}
      alt={name}
      fill
      className="object-cover transition-transform duration-300 group-hover:scale-110"
-     sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
```

---

### Integration 6: Wire VirtualizedNFTGrid to CollectionPageLayout

**File:** `frontend/src/components/collection/CollectionPageLayout.tsx`

**Lines to change:** ~180-200

```diff
+ import { VirtualizedNFTGrid } from '@/components/nft/VirtualizedNFTGrid';

  {/* NFT Grid */}
- <div className={gridClassName}>
-   {filteredNFTs.map((nft) => (
-     <NFTCard key={nft.id} {...nft} />
-   ))}
- </div>
+ <VirtualizedNFTGrid
+   nfts={filteredNFTs}
+   columns={viewMode === 'list' ? 1 : 4}
+   hasMore={false}
+   className="min-h-screen"
+ />
```

---

### Integration 7: Wire MakeOfferModal with Blockchain

**File:** `frontend/src/components/marketplace/MakeOfferModal.tsx`

**Update handleSubmit function:**

```typescript
import { checkUSDCAllowance, approveUSDC, formatUSDC, parseUSDC } from '@/lib/blockchain/usdc';
import { submitOffer } from '@/lib/blockchain/marketplace';
import { createOffer } from '@/lib/api/offers';
import { useWallet } from '@/contexts/WalletContext';
import { useToast } from '@/components/ui/Toast';

// Inside component:
const { address, signer } = useWallet();
const { showToast } = useToast();

const handleSubmit = async () => {
  if (!address || !offerPrice) return;

  try {
    // Step 1: Check USDC allowance
    setStep('submitting');
    setError(null);

    const { hasAllowance } = await checkUSDCAllowance(address, offerPrice);

    // Step 2: Request approval if needed
    if (!hasAllowance) {
      showToast('Requesting USDC approval...', 'info');
      const approvalTx = await approveUSDC(offerPrice);
      showToast('Approval granted! Proceeding with offer...', 'success');
    }

    // Step 3: Submit offer to blockchain
    const { txHash, offerId } = await submitOffer({
      nftContract: nft.contractAddress,
      tokenId: nft.tokenId,
      price: offerPrice,
      expirationDays,
    });

    // Step 4: Record offer in database
    await createOffer({
      nftId: nft.id,
      contractAddress: nft.contractAddress,
      tokenId: nft.tokenId,
      price: formatUSDC(offerPrice),
      expirationDays,
    });

    setStep('success');
    showToast('Offer submitted successfully!', 'success');

    // Refresh offers
    if (onSuccess) {
      onSuccess();
    }
  } catch (err: any) {
    setStep('error');
    setError(err.message || 'Failed to submit offer');
    showToast(err.message || 'Failed to submit offer', 'error');
  }
};
```

---

### Integration 8: Wire OfferTable with Accept/Cancel

**File:** `frontend/src/components/marketplace/OfferTable.tsx`

```typescript
import { acceptOfferOnChain, cancelOfferOnChain } from '@/lib/blockchain/marketplace';
import { acceptOffer, cancelOffer } from '@/lib/api/offers';
import { useToast } from '@/components/ui/Toast';

// Inside component:
const { showToast } = useToast();

const handleAccept = async (offerId: string) => {
  try {
    showToast('Accepting offer...', 'info');

    // Submit to blockchain
    const txHash = await acceptOfferOnChain(offerId);

    // Update database
    await acceptOffer(offerId);

    showToast('Offer accepted!', 'success');

    // Refresh offers
    if (onRefresh) {
      onRefresh();
    }
  } catch (err: any) {
    showToast(err.message || 'Failed to accept offer', 'error');
  }
};

const handleDecline = async (offerId: string) => {
  try {
    showToast('Cancelling offer...', 'info');

    // Submit to blockchain
    const txHash = await cancelOfferOnChain(offerId);

    // Update database
    await cancelOffer(offerId);

    showToast('Offer cancelled!', 'success');

    // Refresh offers
    if (onRefresh) {
      onRefresh();
    }
  } catch (err: any) {
    showToast(err.message || 'Failed to cancel offer', 'error');
  }
};
```

---

### Integration 9: Wire PriceHistoryChart with API

**File:** `frontend/src/components/charts/PriceHistoryChart.tsx`

```typescript
import { useEffect, useState } from 'react';
import { fetchPriceHistory } from '@/lib/api/nft';

// Inside component:
const [data, setData] = useState<PriceHistoryData[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function loadData() {
    try {
      setLoading(true);
      const result = await fetchPriceHistory(
        contractAddress,
        tokenId,
        period
      );
      setData(result.data);
    } catch (err) {
      console.error('Failed to load price history:', err);
    } finally {
      setLoading(false);
    }
  }

  loadData();
}, [contractAddress, tokenId, period]);

if (loading) {
  return <div className="animate-pulse h-96 bg-neutral-200 rounded-lg" />;
}
```

---

### Integration 10: Wire ActivityTable with Real-time Updates

**File:** `frontend/src/components/activity/ActivityTable.tsx`

```typescript
import { useEffect, useState } from 'react';
import { fetchActivity } from '@/lib/api/activity';

// WebSocket hook for real-time updates
function useActivityFeed(nftId?: string, collectionId?: string) {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL!;
    const path = nftId
      ? `/ws/activity/nft/${nftId}`
      : `/ws/activity/collection/${collectionId}`;

    const ws = new WebSocket(`${wsUrl}${path}`);

    ws.onmessage = (event) => {
      const newActivity = JSON.parse(event.data);
      setActivities((prev) => [newActivity, ...prev]);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => ws.close();
  }, [nftId, collectionId]);

  return activities;
}

// Inside component:
const [staticActivities, setStaticActivities] = useState<Activity[]>([]);
const realtimeActivities = useActivityFeed(nftId, collectionId);

useEffect(() => {
  async function loadActivities() {
    try {
      const result = await fetchActivity({ nftId, collectionId, limit: 50 });
      setStaticActivities(result.activities);
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
  }

  loadActivities();
}, [nftId, collectionId]);

// Merge real-time and static activities
const allActivities = [...realtimeActivities, ...staticActivities];
```

---

## Testing Guide

### Unit Testing

Create test files for each component:

**Example:** `frontend/src/components/nft/NFTCard.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { NFTCard } from './NFTCard';

describe('NFTCard', () => {
  const mockNFT = {
    id: '1',
    name: 'Test NFT',
    image: '/test.jpg',
    price: '100',
    collection: { name: 'Test Collection' },
  };

  it('renders NFT name', () => {
    render(<NFTCard {...mockNFT} />);
    expect(screen.getByText('Test NFT')).toBeInTheDocument();
  });

  it('displays price when provided', () => {
    render(<NFTCard {...mockNFT} />);
    expect(screen.getByText('100 USDC')).toBeInTheDocument();
  });
});
```

---

### Integration Testing

Test complete flows:

**Example:** `frontend/src/__tests__/offer-flow.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MakeOfferModal } from '@/components/marketplace/MakeOfferModal';

describe('Offer Flow', () => {
  it('submits offer successfully', async () => {
    const onSuccess = jest.fn();

    render(
      <MakeOfferModal
        isOpen={true}
        onClose={jest.fn()}
        nft={mockNFT}
        onSuccess={onSuccess}
      />
    );

    // Enter price
    const priceInput = screen.getByLabelText('Offer Price');
    fireEvent.change(priceInput, { target: { value: '100' } });

    // Submit
    const submitButton = screen.getByText('Make Offer');
    fireEvent.click(submitButton);

    // Wait for success
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
```

---

### E2E Testing

Use Playwright or Cypress:

**Example:** `e2e/offer-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('user can make offer on NFT', async ({ page }) => {
  // Connect wallet (mocked)
  await page.goto('/');
  await page.click('button:has-text("Connect Wallet")');

  // Navigate to NFT
  await page.goto('/nft/test-nft-id');

  // Open offer modal
  await page.click('button:has-text("Make Offer")');

  // Fill form
  await page.fill('input[name="price"]', '100');
  await page.click('button:has-text("Make Offer")');

  // Wait for success
  await expect(page.locator('text=Offer submitted successfully')).toBeVisible();
});
```

---

## Verification Checklist

After completing all integrations, verify:

### Root Layout
- [ ] SkipLinks appear on Tab focus
- [ ] ErrorBoundary catches errors without crashing
- [ ] PWAInstallPrompt shows on mobile
- [ ] Performance monitoring initializes

### API Layer
- [ ] All API functions return expected data shape
- [ ] Error handling works (try with network offline)
- [ ] Loading states display during fetch

### Blockchain Layer
- [ ] Wallet connects successfully
- [ ] USDC balance displays correctly
- [ ] Approval transactions complete
- [ ] Offer transactions submit to chain

### Pages
- [ ] NFT detail page renders with SEO meta tags
- [ ] Collection page displays all NFTs
- [ ] Search works in header

### Components
- [ ] OptimizedImage lazy loads
- [ ] VirtualizedNFTGrid scrolls smoothly with 10k+ items
- [ ] MakeOfferModal submits offers
- [ ] OfferTable shows real offers
- [ ] PriceHistoryChart displays historical data
- [ ] ActivityTable shows real-time updates

---

## Deployment

### Build Production Bundle

```bash
cd frontend
npm run build
npm start
```

### Environment Variables for Production

Ensure all production env vars are set:

```env
NEXT_PUBLIC_API_URL=https://api.arcmarket.io
NEXT_PUBLIC_WS_URL=wss://api.arcmarket.io
NEXT_PUBLIC_CHAIN_ID=41455
NEXT_PUBLIC_RPC_URL=https://rpc.arcmarket.io
NEXT_PUBLIC_USDC_ADDRESS=0x... # Production contract
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x... # Production contract
NEXT_PUBLIC_SITE_URL=https://arcmarket.io
```

---

## Support

For questions or issues:
1. Check INTEGRATION_GAPS.md for known limitations
2. Review FEATURE_MAP.md for component details
3. File issues in project repository

---

**Document Version:** 1.0
**Last Updated:** 2025-11-20
**Status:** Ready for implementation
