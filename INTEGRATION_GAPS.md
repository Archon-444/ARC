# Integration Gaps & Action Plan

## Executive Summary

All 29 UI components have been implemented (100% complete). However, several critical integrations are missing to achieve full OpenSea parity. This document identifies specific gaps and provides actionable steps to complete each integration.

**Status Overview:**
- ✅ UI Components: 100% (29/29)
- ⚠️ API Integrations: 0% (0/8)
- ⚠️ Blockchain Integrations: 0% (0/5)
- ⚠️ Component Wiring: 40% (4/10)
- ⚠️ Real-time Features: 0% (0/3)

---

## 1. API Integration Gaps

### 1.1 Search API (HIGH PRIORITY)
**Components Affected:** CommandPalette, SearchInput
**Current State:** Using mock data
**Required API:** `POST /api/search/autocomplete`

**Expected Request:**
```typescript
{
  query: string;
  types: ('nft' | 'collection' | 'user')[];
  limit: number;
}
```

**Expected Response:**
```typescript
{
  nfts: Array<{ id: string; name: string; image: string; collectionName: string; }>;
  collections: Array<{ id: string; name: string; image: string; verified: boolean; }>;
  users: Array<{ address: string; username: string; avatar: string; verified: boolean; }>;
}
```

**Integration Steps:**
1. Create `frontend/src/lib/api/search.ts`
2. Implement `searchAutocomplete(query: string)` function
3. Update `CommandPalette.tsx` line 42 to call API
4. Update `SearchInput.tsx` line 85 to call API
5. Add error handling and loading states

**Code Example:**
```typescript
// frontend/src/lib/api/search.ts
export async function searchAutocomplete(query: string, types: string[] = ['nft', 'collection', 'user']) {
  const response = await fetch('/api/search/autocomplete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, types, limit: 10 }),
  });

  if (!response.ok) throw new Error('Search failed');
  return response.json();
}

// In CommandPalette.tsx, replace mock filtering with:
const { nfts, collections, users } = await searchAutocomplete(searchQuery);
```

---

### 1.2 Analytics API (HIGH PRIORITY)
**Components Affected:** AnalyticsDashboard
**Current State:** Using static mock data
**Required APIs:**
- `GET /api/analytics/volume?period=7d|30d|90d|1y|all`
- `GET /api/analytics/sales-distribution`
- `GET /api/analytics/holder-stats`
- `GET /api/analytics/top-sales?limit=10`

**Expected Response for Volume:**
```typescript
{
  data: Array<{
    date: string; // ISO date
    volume: number; // USDC amount
    sales: number; // Number of sales
    avgPrice: number; // Average sale price
  }>;
  summary: {
    totalVolume: string;
    totalSales: number;
    avgPrice: string;
    change24h: number; // Percentage
  };
}
```

**Integration Steps:**
1. Create `frontend/src/lib/api/analytics.ts`
2. Implement API functions for each endpoint
3. Update `AnalyticsDashboard.tsx` to use real data
4. Add loading skeletons during fetch
5. Implement error boundaries

---

### 1.3 Price History API (HIGH PRIORITY)
**Components Affected:** PriceHistoryChart
**Current State:** Using generated mock data
**Required API:** `GET /api/nft/{contractAddress}/{tokenId}/price-history?period=7d|30d|90d|1y|all`

**Expected Response:**
```typescript
{
  data: Array<{
    timestamp: number; // Unix timestamp
    price: string; // USDC amount
    eventType: 'sale' | 'listing';
    txHash: string;
  }>;
  stats: {
    minPrice: string;
    maxPrice: string;
    avgPrice: string;
    currentPrice: string;
    priceChange: number; // Percentage
  };
}
```

**Integration Steps:**
1. Add price history function to `frontend/src/lib/api/nft.ts`
2. Update `PriceHistoryChart.tsx` to fetch real data
3. Add period selector to API call
4. Handle empty states (no sales yet)

---

### 1.4 Activity Feed API (HIGH PRIORITY)
**Components Affected:** ActivityTable
**Current State:** Using static mock events
**Required API:** `GET /api/activity?nftId={id}&type={event_type}&limit=50&offset=0`

**Expected Response:**
```typescript
{
  activities: Array<{
    id: string;
    type: 'sale' | 'listing' | 'transfer' | 'offer' | 'bid' | 'cancel_listing' | 'cancel_offer';
    from: { address: string; username?: string; };
    to: { address: string; username?: string; };
    price?: string; // USDC amount
    timestamp: number;
    txHash: string;
  }>;
  hasMore: boolean;
  total: number;
}
```

**Integration Steps:**
1. Create activity API functions
2. Update `ActivityTable.tsx` to use real data
3. Add pagination support
4. Implement event type filtering

---

### 1.5 Offer Management API (HIGH PRIORITY)
**Components Affected:** OfferTable, MakeOfferModal
**Current State:** Mock data and no submission
**Required APIs:**
- `GET /api/nft/{id}/offers` - List all offers
- `POST /api/offers` - Create new offer
- `POST /api/offers/{id}/accept` - Accept offer (owner only)
- `POST /api/offers/{id}/cancel` - Cancel offer (offerer only)

**Expected Request for Create Offer:**
```typescript
{
  nftId: string;
  contractAddress: string;
  tokenId: string;
  price: string; // USDC amount in 6 decimals (e.g., "1000000" = 1 USDC)
  expirationDays: number;
  signature?: string; // If required for verification
}
```

**Expected Response:**
```typescript
{
  offerId: string;
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
  requiresApproval: boolean; // If USDC approval needed
  approvalTxData?: {
    to: string;
    data: string;
    value: string;
  };
}
```

**Integration Steps:**
1. Create `frontend/src/lib/api/offers.ts`
2. Update `MakeOfferModal.tsx` to call API on submit
3. Update `OfferTable.tsx` to fetch real offers
4. Implement accept/cancel actions
5. Add WebSocket for real-time offer updates

---

### 1.6 Collection Statistics API (MEDIUM PRIORITY)
**Components Affected:** CollectionHero, CollectionPageLayout
**Current State:** Props passed manually
**Required API:** `GET /api/collection/{slug}/stats`

**Expected Response:**
```typescript
{
  floorPrice: string;
  totalVolume: string;
  owners: number;
  items: number;
  listed: number;
  royalty: number; // Percentage
  change24h: {
    floorPrice: number;
    volume: number;
    sales: number;
  };
}
```

---

### 1.7 User Profile API (MEDIUM PRIORITY)
**Components Affected:** ProfileSEO, future Profile page
**Required API:** `GET /api/user/{address}`

**Expected Response:**
```typescript
{
  address: string;
  username?: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  verified: boolean;
  social?: {
    twitter?: string;
    discord?: string;
    website?: string;
  };
  stats: {
    owned: number;
    created: number;
    favorited: number;
    volumeTraded: string;
  };
}
```

---

### 1.8 Filtering & Sorting API (MEDIUM PRIORITY)
**Components Affected:** CollectionPageLayout
**Current State:** Client-side filtering only
**Required API:** `POST /api/collection/{slug}/nfts/filter`

**Expected Request:**
```typescript
{
  filters: {
    status: ('listed' | 'auction' | 'has_offer')[];
    priceMin?: string;
    priceMax?: string;
    traits: Record<string, string[]>; // { "Background": ["Blue", "Red"] }
  };
  sort: 'price_low' | 'price_high' | 'recently_listed' | 'recently_created' | 'most_viewed' | 'ending_soon';
  limit: number;
  offset: number;
}
```

**Why Needed:** Client-side filtering doesn't scale beyond 1000 items. Server-side filtering is required for large collections.

---

## 2. Blockchain Integration Gaps

### 2.1 USDC Approval Flow (HIGH PRIORITY)
**Components Affected:** MakeOfferModal, BuyNowModal (future)
**Current State:** No blockchain interaction
**Required:** Smart contract integration for USDC.approve()

**Integration Steps:**
1. Check current USDC allowance for marketplace contract
2. If insufficient, request approval transaction
3. Wait for approval confirmation
4. Proceed with offer/purchase transaction

**Code Example:**
```typescript
// frontend/src/lib/blockchain/usdc.ts
import { ethers } from 'ethers';

const USDC_ADDRESS = '0x...'; // Arc testnet USDC
const MARKETPLACE_ADDRESS = '0x...'; // Arc marketplace

export async function checkUSDCAllowance(
  userAddress: string,
  requiredAmount: bigint
): Promise<{ hasAllowance: boolean; currentAllowance: bigint }> {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);

  const currentAllowance = await usdc.allowance(userAddress, MARKETPLACE_ADDRESS);

  return {
    hasAllowance: currentAllowance >= requiredAmount,
    currentAllowance,
  };
}

export async function approveUSCD(amount: bigint) {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);

  const tx = await usdc.approve(MARKETPLACE_ADDRESS, amount);
  await tx.wait();

  return tx.hash;
}
```

**Update MakeOfferModal.tsx:**
```typescript
// In handleSubmit function
const { hasAllowance, currentAllowance } = await checkUSDCAllowance(
  userAddress,
  offerPrice
);

if (!hasAllowance) {
  setStep('approval');
  const txHash = await approveUSCD(offerPrice);
  // Wait for confirmation
}

setStep('submitting');
// Now submit offer via API
```

---

### 2.2 Offer Submission Transaction (HIGH PRIORITY)
**Components Affected:** MakeOfferModal
**Current State:** No transaction submission
**Required:** Call marketplace contract's `makeOffer()` function

**Smart Contract Method:**
```solidity
function makeOffer(
    address nftContract,
    uint256 tokenId,
    uint256 price,
    uint256 expirationTime
) external returns (uint256 offerId)
```

**Integration Steps:**
1. Check USDC allowance (see 2.1)
2. Call marketplace.makeOffer() with signed transaction
3. Wait for transaction confirmation
4. Update UI with new offer

**Code Example:**
```typescript
// frontend/src/lib/blockchain/marketplace.ts
export async function submitOffer(params: {
  nftContract: string;
  tokenId: string;
  price: bigint;
  expirationDays: number;
}) {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

  const expirationTime = Math.floor(Date.now() / 1000) + (params.expirationDays * 24 * 60 * 60);

  const tx = await marketplace.makeOffer(
    params.nftContract,
    params.tokenId,
    params.price,
    expirationTime
  );

  const receipt = await tx.wait();

  // Extract offerId from events
  const event = receipt.logs.find((log: any) => log.eventName === 'OfferMade');
  const offerId = event?.args?.offerId;

  return { txHash: receipt.hash, offerId };
}
```

---

### 2.3 Buy Now Transaction (HIGH PRIORITY)
**Components Affected:** NFTDetailLayout (future BuyNowModal)
**Current State:** Placeholder onBuy handler
**Required:** Call marketplace contract's `buy()` function

**Integration Steps:**
1. Check USDC allowance
2. Call marketplace.buy() with listing ID
3. Wait for confirmation
4. Update ownership in UI

---

### 2.4 NFT Metadata Fetching (MEDIUM PRIORITY)
**Components Affected:** NFTCard, NFTDetailLayout
**Current State:** Assumes metadata is pre-fetched
**Required:** Fetch token URI and parse metadata

**Code Example:**
```typescript
// frontend/src/lib/blockchain/nft.ts
export async function fetchNFTMetadata(contractAddress: string, tokenId: string) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const nft = new ethers.Contract(contractAddress, ERC721_ABI, provider);

  const tokenURI = await nft.tokenURI(tokenId);

  // Handle IPFS URLs
  const metadataURL = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');

  const response = await fetch(metadataURL);
  const metadata = await response.json();

  return {
    name: metadata.name,
    description: metadata.description,
    image: metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/'),
    attributes: metadata.attributes,
  };
}
```

---

### 2.5 Wallet Balance Checking (MEDIUM PRIORITY)
**Components Affected:** MakeOfferModal
**Current State:** Mock balance check
**Required:** Real-time USDC balance fetching

**Code Example:**
```typescript
export async function getUSDCBalance(address: string): Promise<bigint> {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
  return await usdc.balanceOf(address);
}
```

---

## 3. Component Wiring Gaps

### 3.1 OptimizedImage Not Used in NFTCard (HIGH PRIORITY)
**Current State:** NFTCard uses next/image directly
**Required:** Switch to OptimizedImage for performance benefits

**File:** `frontend/src/components/nft/NFTCard.tsx`
**Lines:** 90-100

**Change Required:**
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

**Benefits:** Lazy loading, blur placeholders, error fallbacks

---

### 3.2 VirtualizedNFTGrid Not Used in CollectionPageLayout (HIGH PRIORITY)
**Current State:** CollectionPageLayout uses standard grid
**Required:** Switch to VirtualizedNFTGrid for large collections

**File:** `frontend/src/components/collection/CollectionPageLayout.tsx`
**Lines:** 180-200

**Change Required:**
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
+ />
```

**Benefits:** 50x performance improvement for 10k+ item collections

---

### 3.3 SearchInput Not Integrated in Header (HIGH PRIORITY)
**Current State:** SearchInput component exists but not used
**Required:** Add to Header/Navbar

**File:** Create or update `frontend/src/components/layout/Header.tsx`

**Code Example:**
```typescript
import { SearchInput } from '@/components/search/SearchInput';
import { searchAutocomplete } from '@/lib/api/search';

export function Header() {
  const handleSearch = async (query: string) => {
    const results = await searchAutocomplete(query);
    return results;
  };

  return (
    <header>
      {/* Logo */}

      {/* Search */}
      <div className="flex-1 max-w-2xl mx-4">
        <SearchInput
          placeholder="Search NFTs, collections, and users"
          onSearch={handleSearch}
        />
      </div>

      {/* Wallet Connect */}
    </header>
  );
}
```

---

### 3.4 AnalyticsDashboard Not Accessible (MEDIUM PRIORITY)
**Current State:** Component exists but no route
**Required:** Create analytics page or collection stats tab

**Option 1: Collection Analytics Tab**
Update `CollectionPageLayout.tsx`:
```typescript
<Tabs defaultValue="items">
  <Tabs.List>
    <Tabs.Trigger value="items">Items</Tabs.Trigger>
    <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
+   <Tabs.Trigger value="analytics">Analytics</Tabs.Trigger>
  </Tabs.List>

+  <Tabs.Content value="analytics">
+    <AnalyticsDashboard collectionId={collection.id} />
+  </Tabs.Content>
</Tabs>
```

**Option 2: Dedicated Analytics Page**
Create `frontend/src/app/collection/[slug]/analytics/page.tsx`

---

### 3.5 ErrorBoundary Not Wrapping App (HIGH PRIORITY)
**Current State:** ErrorBoundary component exists but not used
**Required:** Wrap root layout

**File:** `frontend/src/app/layout.tsx`

**Change Required:**
```diff
+ import { ErrorBoundary } from '@/components/error/ErrorBoundary';

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="en">
        <body>
+         <ErrorBoundary>
            {children}
+         </ErrorBoundary>
        </body>
      </html>
    );
  }
```

---

### 3.6 SEO Components Not Used in Pages (HIGH PRIORITY)
**Current State:** SEO components exist but not integrated
**Required:** Add to all NFT, collection, and profile pages

**Example for NFT Page:**
```typescript
// frontend/src/app/nft/[id]/page.tsx
import { NFTSEO } from '@/components/seo/SEO';

export default function NFTPage({ params }: { params: { id: string } }) {
  const nft = await fetchNFT(params.id);

  return (
    <>
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

      <NFTDetailLayout nft={nft} />
    </>
  );
}
```

---

### 3.7 SkipLinks Not in Root Layout (MEDIUM PRIORITY)
**Current State:** SkipLinks component exists but not used
**Required:** Add to root layout for accessibility

**File:** `frontend/src/app/layout.tsx`

```diff
+ import { SkipLinks } from '@/components/accessibility/SkipLinks';

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="en">
        <body>
+         <SkipLinks />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </body>
      </html>
    );
  }
```

---

### 3.8 PWAInstallPrompt Not Rendered (MEDIUM PRIORITY)
**Current State:** Component exists but not used
**Required:** Add to root layout

```diff
+ import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="en">
        <body>
          <SkipLinks />
+         <PWAInstallPrompt />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </body>
      </html>
    );
  }
```

---

### 3.9 Performance Monitoring Not Initialized (MEDIUM PRIORITY)
**Current State:** Performance utilities exist but not called
**Required:** Initialize in root layout or app entry

**File:** `frontend/src/app/layout.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { initPerformanceMonitoring } from '@/lib/performance';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPerformanceMonitoring();
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

---

### 3.10 Toast Provider Not Set Up (LOW PRIORITY)
**Current State:** Toast system exists but needs provider
**Required:** Add ToastProvider to root layout

**File:** Create `frontend/src/components/ui/ToastProvider.tsx` and add to layout

---

## 4. Real-time Features Gaps

### 4.1 WebSocket for Activity Feed (HIGH PRIORITY)
**Components Affected:** ActivityTable
**Current State:** Static data only
**Required:** WebSocket connection for real-time events

**Why Needed:** Users should see sales, listings, and offers in real-time without refresh

**Integration Steps:**
1. Establish WebSocket connection to backend
2. Subscribe to NFT/collection-specific events
3. Update ActivityTable when events received
4. Show toast notifications for important events

**Code Example:**
```typescript
// frontend/src/lib/websocket.ts
import { useEffect, useState } from 'react';

export function useActivityFeed(nftId: string) {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const ws = new WebSocket(`wss://api.arcmarket.io/ws/activity/${nftId}`);

    ws.onmessage = (event) => {
      const newActivity = JSON.parse(event.data);
      setActivities((prev) => [newActivity, ...prev]);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => ws.close();
  }, [nftId]);

  return activities;
}

// In ActivityTable.tsx:
const realtimeActivities = useActivityFeed(nftId);
const allActivities = [...realtimeActivities, ...activities];
```

---

### 4.2 WebSocket for Offer Updates (HIGH PRIORITY)
**Components Affected:** OfferTable
**Current State:** Static offers
**Required:** Real-time offer notifications

**Why Needed:** Sellers need to see new offers immediately, buyers need to see when offers are accepted/cancelled

---

### 4.3 Live Floor Price Updates (MEDIUM PRIORITY)
**Components Affected:** CollectionHero, NFTDetailLayout
**Current State:** Static floor price
**Required:** Real-time floor price updates

---

## 5. Missing Features

### 5.1 Fullscreen Image Viewer (HIGH PRIORITY)
**Components Affected:** NFTDetailLayout
**Current State:** No fullscreen option
**Required:** Lightbox component with zoom, pan, and keyboard navigation

**Implementation:**
Create `frontend/src/components/ui/Lightbox.tsx`:
```typescript
export function Lightbox({ src, alt, isOpen, onClose }: LightboxProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white"
            aria-label="Close fullscreen"
          >
            <X className="h-8 w-8" />
          </button>

          <TransformWrapper>
            <TransformComponent>
              <img src={src} alt={alt} className="max-h-screen max-w-screen" />
            </TransformComponent>
          </TransformWrapper>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Dependencies:** `npm install react-zoom-pan-pinch`

---

### 5.2 3D Model & Video NFT Support (MEDIUM PRIORITY)
**Components Affected:** NFTCard, NFTDetailLayout, OptimizedImage
**Current State:** Only supports images
**Required:** Support for .glb, .gltf, .mp4, .webm

**Implementation:**
Create media type detector and conditional renderers:
```typescript
export function NFTMediaViewer({ src, mediaType }: NFTMediaViewerProps) {
  if (mediaType === 'video') {
    return <video src={src} controls autoPlay loop muted />;
  }

  if (mediaType === 'model-3d') {
    return <Model3DViewer src={src} />;
  }

  return <OptimizedImage src={src} />;
}
```

**Dependencies:**
- `npm install @react-three/fiber @react-three/drei three` for 3D models
- Built-in HTML5 video for videos

---

### 5.3 Bulk Actions (MEDIUM PRIORITY)
**Components Affected:** VirtualizedNFTGrid
**Current State:** Single NFT actions only
**Required:** Multi-select with bulk listing, transfer, favorite

**Implementation:**
Add checkbox mode to NFTCard and bulk action bar:
```typescript
const [selectedNFTs, setSelectedNFTs] = useState<Set<string>>(new Set());

// Bulk action bar
{selectedNFTs.size > 0 && (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl p-4">
    <p>{selectedNFTs.size} items selected</p>
    <button onClick={handleBulkList}>List for Sale</button>
    <button onClick={handleBulkTransfer}>Transfer</button>
  </div>
)}
```

---

### 5.4 Advanced Filtering UI (MEDIUM PRIORITY)
**Components Affected:** CollectionPageLayout
**Current State:** Basic filter panel
**Required:** Multi-range sliders, color pickers, rarity filters

**Implementation:**
Enhance FilterPanel component with:
- Dual-handle range slider for price
- Rarity tier selector (Common, Rare, Epic, Legendary)
- Trait value search within categories
- Save filter presets

---

### 5.5 Shopping Cart (LOW PRIORITY)
**Components Affected:** NFTCard, NFTDetailLayout
**Current State:** Buy one at a time
**Required:** Add multiple NFTs to cart and checkout together

---

### 5.6 Watchlist / Favorites (LOW PRIORITY)
**Components Affected:** NFTCard
**Current State:** No favoriting
**Required:** Heart button to save NFTs to watchlist

---

### 5.7 Collection Offers (LOW PRIORITY)
**Components Affected:** CollectionPageLayout
**Current State:** Only individual NFT offers
**Required:** Make offer on any NFT in a collection

---

## 6. Implementation Priority

### Week 1: Critical API & Blockchain Integrations
**Goal:** Enable core marketplace functionality

1. **Day 1-2:** API Integration
   - Search API (1.1)
   - Activity Feed API (1.4)
   - Offer Management API (1.5)

2. **Day 3-5:** Blockchain Integration
   - USDC Approval Flow (2.1)
   - Offer Submission Transaction (2.2)
   - Wallet Balance Checking (2.5)

**Deliverable:** Users can make offers on NFTs

---

### Week 2: Component Wiring & Performance
**Goal:** Wire all components and optimize performance

1. **Day 1-2:** High Priority Wiring
   - OptimizedImage in NFTCard (3.1)
   - VirtualizedNFTGrid in CollectionPageLayout (3.2)
   - SearchInput in Header (3.3)
   - ErrorBoundary in Layout (3.5)

2. **Day 3-4:** SEO & Accessibility
   - SEO Components in Pages (3.6)
   - SkipLinks in Layout (3.7)
   - Performance Monitoring (3.9)

3. **Day 5:** Testing
   - Test all integrated components
   - Performance audit
   - Accessibility audit

**Deliverable:** Fully wired, production-ready UI

---

### Week 3: Analytics & Real-time Features
**Goal:** Add analytics and real-time updates

1. **Day 1-2:** Analytics
   - Analytics API (1.2)
   - Price History API (1.3)
   - Collection Statistics API (1.6)
   - Wire AnalyticsDashboard (3.4)

2. **Day 3-5:** Real-time Features
   - WebSocket for Activity Feed (4.1)
   - WebSocket for Offer Updates (4.2)
   - Live Floor Price Updates (4.3)

**Deliverable:** Real-time marketplace with analytics

---

### Week 4: Enhanced Features
**Goal:** Add missing features for OpenSea parity

1. **Day 1-2:** Media Enhancements
   - Fullscreen Image Viewer (5.1)
   - 3D Model Support (5.2)
   - Video NFT Support (5.2)

2. **Day 3-4:** Advanced Features
   - Advanced Filtering UI (5.4)
   - Bulk Actions (5.3)
   - Buy Now Transaction (2.3)

3. **Day 5:** Polish
   - PWA Installation (3.8)
   - Toast Notifications
   - Loading states audit

**Deliverable:** Feature-complete marketplace

---

## 7. Testing Checklist

### API Integration Testing
- [ ] Search returns results for NFTs, collections, users
- [ ] Analytics charts display real data
- [ ] Price history chart updates with period selector
- [ ] Activity feed shows all event types
- [ ] Offers can be created, accepted, cancelled
- [ ] Collection stats update in real-time

### Blockchain Integration Testing
- [ ] USDC approval flow completes successfully
- [ ] Offers are submitted to blockchain
- [ ] Transaction confirmations update UI
- [ ] Wallet balance displays correctly
- [ ] Error handling for failed transactions

### Component Wiring Testing
- [ ] OptimizedImage lazy loads and shows fallbacks
- [ ] VirtualizedNFTGrid maintains 60fps with 50k items
- [ ] SearchInput shows autocomplete suggestions
- [ ] ErrorBoundary catches errors without crashing
- [ ] SEO meta tags appear in page source
- [ ] SkipLinks appear on Tab focus
- [ ] PWA install prompt shows on mobile

### Real-time Testing
- [ ] Activity feed updates without refresh
- [ ] New offers appear immediately in OfferTable
- [ ] Floor price updates when new listing created
- [ ] WebSocket reconnects after network interruption

### Performance Testing
- [ ] Lighthouse score > 90 for all pages
- [ ] Core Web Vitals in "Good" range (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] Bundle size < 300KB for main bundle
- [ ] Images lazy load and use blur placeholders
- [ ] Virtual scrolling maintains 60fps

### Accessibility Testing
- [ ] All interactive elements keyboard accessible
- [ ] Focus trap works in modals
- [ ] Skip links navigate correctly
- [ ] Screen reader announcements for dynamic updates
- [ ] Color contrast ratios meet WCAG AA
- [ ] All images have alt text

---

## 8. Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured (API endpoints, contract addresses, RPC URLs)
- [ ] Service worker registered for PWA
- [ ] Analytics tracking configured (GA4, Mixpanel, etc.)
- [ ] Error reporting configured (Sentry, Datadog)
- [ ] Rate limiting configured for API calls
- [ ] CORS configured for API endpoints
- [ ] CDN configured for images (Cloudflare, AWS CloudFront)

### Post-Deployment
- [ ] Verify all API endpoints accessible
- [ ] Test wallet connection on production
- [ ] Verify transactions submit to correct network
- [ ] Check Core Web Vitals in production
- [ ] Monitor error rates in first 24 hours
- [ ] Test on multiple devices and browsers

---

## 9. Summary

**Total Integration Work Remaining:**
- 8 API integrations (HIGH priority: 5, MEDIUM: 3)
- 5 Blockchain integrations (HIGH priority: 3, MEDIUM: 2)
- 10 Component wiring tasks (HIGH priority: 6, MEDIUM: 3, LOW: 1)
- 3 Real-time features (HIGH priority: 2, MEDIUM: 1)
- 7 Missing features (HIGH priority: 1, MEDIUM: 4, LOW: 3)

**Estimated Timeline:** 4 weeks for full OpenSea parity

**Next Steps:**
1. Review this document with backend and blockchain teams
2. Prioritize which APIs to build first
3. Set up development environment with testnet
4. Begin Week 1 implementation
5. Daily standups to track integration progress

---

**Document Version:** 1.0
**Last Updated:** 2025-11-20
**Status:** Ready for implementation
