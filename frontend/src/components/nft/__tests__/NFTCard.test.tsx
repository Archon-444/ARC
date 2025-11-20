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
import type { NFT, Listing, Auction } from '@/types';

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

describe('NFTCard', () => {
  const mockNFT: NFT = {
    id: '1',
    tokenId: '1',
    name: 'Test NFT',
    image: 'https://example.com/nft.png',
    owner: '0x1234567890123456789012345678901234567890',
    collection: {
      id: '0xCollection',
      name: 'Test Collection',
      symbol: 'TEST',
    },
  };

  const mockListing: Listing = {
    id: '1',
    price: '100000000', // 100 USDC (6 decimals)
    seller: '0x1234567890123456789012345678901234567890',
  };

  const mockAuction: Auction = {
    id: '1',
    minBid: '50000000',
    highestBid: '75000000',
    highestBidder: '0x9876543210987654321098765432109876543210',
    endTime: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
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
      const nftWithoutName = { ...mockNFT, name: undefined };
      render(<NFTCard nft={nftWithoutName} />);

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

      const card = screen.getByRole('article', { hidden: true }) || screen.getByText('Test NFT').closest('div');
      if (card) {
        fireEvent.click(card);
        expect(handleClick).toHaveBeenCalledTimes(1);
      }
    });

    it('stops propagation on Buy Now button click', () => {
      const handleCardClick = jest.fn();
      render(<NFTCard nft={mockNFT} listing={mockListing} onClick={handleCardClick} />);

      const buyButton = screen.getByText('Buy Now');
      fireEvent.click(buyButton);

      // Card click should not be triggered
      expect(handleCardClick).not.toHaveBeenCalled();
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
    const { container } = render(<NFTCardSkeleton />);

    // Check for skeleton elements
    const skeletons = container.querySelectorAll('.skeleton, [aria-hidden="true"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('NFTGrid', () => {
  const mockNFTs: NFT[] = [
    {
      id: '1',
      tokenId: '1',
      name: 'NFT 1',
      image: 'https://example.com/1.png',
      owner: '0x1234567890123456789012345678901234567890',
      collection: {
        id: '0xCollection',
        name: 'Test Collection',
        symbol: 'TEST',
      },
    },
    {
      id: '2',
      tokenId: '2',
      name: 'NFT 2',
      image: 'https://example.com/2.png',
      owner: '0x1234567890123456789012345678901234567890',
      collection: {
        id: '0xCollection',
        name: 'Test Collection',
        symbol: 'TEST',
      },
    },
  ];

  it('renders loading state when isLoading is true', () => {
    const { container } = render(<NFTGrid isLoading />);

    const skeletons = container.querySelectorAll('.skeleton, [aria-hidden="true"]');
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
