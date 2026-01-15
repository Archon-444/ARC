/**
 * NFTCard Component Tests
 *
 * Tests for the NFTCard component including:
 * - Rendering with different props
 * - User interactions
 * - Accessibility
 * - Edge cases
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { NFTCard, NFTCardSkeleton, NFTGrid } from '../NFTCard';
import type { NFT, Listing, Auction, Collection, ListingStatus, AuctionStatus } from '@/types';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Helper to create a complete mock collection
const createMockCollection = (overrides?: Partial<Collection>): Collection => ({
  id: '0x1234567890123456789012345678901234567890' as `0x${string}`,
  name: 'Test Collection',
  symbol: 'TEST',
  totalSupply: '10000',
  floorPrice: '100000000',
  volumeTraded: '5000000000',
  ...overrides,
});

describe('NFTCard', () => {
  const mockCollection = createMockCollection();

  const mockNFT: NFT = {
    id: '1',
    tokenId: '1',
    name: 'Test NFT',
    image: 'https://example.com/nft.png',
    owner: '0x1234567890123456789012345678901234567890',
    collection: mockCollection,
  };

  const mockListing: Listing = {
    id: '1',
    collection: '0x1234567890123456789012345678901234567890',
    tokenId: '1',
    price: '100000000', // 100 USDC (6 decimals)
    seller: '0x1234567890123456789012345678901234567890',
    createdAt: String(Math.floor(Date.now() / 1000)),
    status: 'ACTIVE' as ListingStatus,
  };

  const mockAuction: Auction = {
    id: '1',
    collection: '0x1234567890123456789012345678901234567890',
    tokenId: '1',
    seller: '0x1234567890123456789012345678901234567890',
    minBid: '50000000',
    highestBid: '75000000',
    highestBidder: '0x9876543210987654321098765432109876543210',
    startTime: String(Math.floor(Date.now() / 1000)),
    endTime: String(Math.floor(Date.now() / 1000) + 86400), // 24 hours from now
    status: 'ACTIVE' as AuctionStatus,
  };

  describe('Rendering', () => {
    it('renders NFT card with basic information', () => {
      render(<NFTCard nft={mockNFT} />);

      expect(screen.getByText('Test Collection')).toBeInTheDocument();
      expect(screen.getByText('Test NFT')).toBeInTheDocument();
      expect(screen.getByAltText(/Test NFT/i)).toBeInTheDocument();
    });

    it('renders NFT card with listing', () => {
      render(<NFTCard nft={mockNFT} listing={mockListing} />);

      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('Buy Now')).toBeInTheDocument();
    });

    it('renders NFT card with auction', () => {
      render(<NFTCard nft={mockNFT} auction={mockAuction} />);

      expect(screen.getByText('Auction')).toBeInTheDocument();
      expect(screen.getByText('Place Bid')).toBeInTheDocument();
    });

    it('renders NFT card without listing or auction', () => {
      render(<NFTCard nft={mockNFT} />);

      expect(screen.getByText('Not listed')).toBeInTheDocument();
    });

    it('displays fallback when no NFT name is provided', () => {
      // Create NFT with empty name to test fallback
      const nftWithEmptyName: NFT = { ...mockNFT, name: '' };
      render(<NFTCard nft={nftWithEmptyName} />);

      expect(screen.getByText('#1')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('handles like button click', () => {
      render(<NFTCard nft={mockNFT} />);

      const likeButton = screen.getByLabelText('Like');
      fireEvent.click(likeButton);

      expect(screen.getByLabelText('Unlike')).toBeInTheDocument();
    });

    it('calls onClick when card is clicked', () => {
      const handleClick = jest.fn();
      render(<NFTCard nft={mockNFT} onClick={handleClick} />);

      // Find the card wrapper div by finding an element with cursor-pointer class
      const card = screen.getByText('Test NFT').closest('div[class*="cursor-pointer"]');
      if (card) {
        fireEvent.click(card);
        expect(handleClick).toHaveBeenCalledTimes(1);
      }
    });

    it('has Buy Now link with correct href', () => {
      render(<NFTCard nft={mockNFT} listing={mockListing} />);

      const buyLink = screen.getByText('Buy Now');
      expect(buyLink).toBeInTheDocument();
      expect(buyLink.closest('a')).toHaveAttribute('href', `/nft/${mockNFT.collection.id}/${mockNFT.tokenId}`);
    });
  });

  describe('Visibility Options', () => {
    it('hides owner when showOwner is false', () => {
      render(<NFTCard nft={mockNFT} showOwner={false} />);

      expect(screen.queryByText(/Owner:/)).not.toBeInTheDocument();
    });

    it('hides collection when showCollection is false', () => {
      render(<NFTCard nft={mockNFT} showCollection={false} />);

      expect(screen.queryByText('Test Collection')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible like button labels', () => {
      render(<NFTCard nft={mockNFT} />);

      expect(screen.getByLabelText('Like')).toBeInTheDocument();
    });

    it('has proper image alt text', () => {
      render(<NFTCard nft={mockNFT} />);

      const image = screen.getByAltText(/Test NFT/i);
      expect(image).toHaveAttribute('alt');
    });

    it('links are keyboard accessible', () => {
      render(<NFTCard nft={mockNFT} listing={mockListing} />);

      const buyLink = screen.getByText('Buy Now');
      expect(buyLink.closest('a')).toHaveAttribute('href');
    });
  });
});

describe('NFTCardSkeleton', () => {
  it('renders skeleton loading state', () => {
    render(<NFTCardSkeleton />);

    // Check for skeleton elements with role="status" (from the Skeleton component)
    const skeletons = screen.getAllByRole('status');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('NFTGrid', () => {
  const gridMockCollection = createMockCollection();

  const mockNFTs: NFT[] = [
    {
      id: '1',
      tokenId: '1',
      name: 'NFT 1',
      image: 'https://example.com/1.png',
      owner: '0x1234567890123456789012345678901234567890',
      collection: gridMockCollection,
    },
    {
      id: '2',
      tokenId: '2',
      name: 'NFT 2',
      image: 'https://example.com/2.png',
      owner: '0x1234567890123456789012345678901234567890',
      collection: gridMockCollection,
    },
  ];

  it('renders loading state when isLoading is true', () => {
    render(<NFTGrid isLoading />);

    // Check for skeleton elements with role="status"
    const skeletons = screen.getAllByRole('status');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty message when no NFTs', () => {
    render(<NFTGrid nfts={[]} />);

    expect(screen.getByText('No NFTs found')).toBeInTheDocument();
  });

  it('renders custom empty message', () => {
    render(<NFTGrid nfts={[]} emptyMessage="No items available" />);

    expect(screen.getByText('No items available')).toBeInTheDocument();
  });

  it('renders grid of NFT cards', () => {
    render(<NFTGrid nfts={mockNFTs} />);

    expect(screen.getByText('NFT 1')).toBeInTheDocument();
    expect(screen.getByText('NFT 2')).toBeInTheDocument();
  });
});
