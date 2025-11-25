/**
 * EmptyState Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  EmptyState,
  NoNFTsFound,
  NoSearchResults,
  NoCollectionsFound,
  NoFavorites,
  NoListings,
  NoActivity,
  ErrorState,
} from '../EmptyState';
import { Search, PackageOpen } from 'lucide-react';

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe('EmptyState', () => {
  describe('Basic Rendering', () => {
    it('renders title', () => {
      render(<EmptyState title="No items" />);
      expect(screen.getByText('No items')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(<EmptyState title="No items" description="Try a different search" />);
      expect(screen.getByText('Try a different search')).toBeInTheDocument();
    });

    it('renders without description', () => {
      render(<EmptyState title="No items" />);
      expect(screen.queryByText('Try a different search')).not.toBeInTheDocument();
    });

    it('renders icon when provided', () => {
      render(<EmptyState title="No items" icon={Search} />);
      // Lucide icons render as SVGs
      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Action Button', () => {
    it('renders link action with href', () => {
      render(
        <EmptyState
          title="No items"
          action={{ label: 'Browse', href: '/explore' }}
        />
      );
      const link = screen.getByRole('link', { name: 'Browse' });
      expect(link).toHaveAttribute('href', '/explore');
    });

    it('renders button action with onClick', () => {
      const handleClick = jest.fn();
      render(
        <EmptyState
          title="No items"
          action={{ label: 'Retry', onClick: handleClick }}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders custom React node as action', () => {
      render(
        <EmptyState
          title="No items"
          action={<button data-testid="custom-action">Custom Button</button>}
        />
      );
      expect(screen.getByTestId('custom-action')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('applies custom className', () => {
      const { container } = render(<EmptyState title="Test" className="custom-empty" />);
      expect(container.firstChild).toHaveClass('custom-empty');
    });
  });
});

describe('Preset Empty States', () => {
  describe('NoNFTsFound', () => {
    it('renders with correct title', () => {
      render(<NoNFTsFound />);
      expect(screen.getByText('No NFTs found')).toBeInTheDocument();
    });

    it('renders with description', () => {
      render(<NoNFTsFound />);
      expect(screen.getByText(/Try adjusting your filters/)).toBeInTheDocument();
    });
  });

  describe('NoSearchResults', () => {
    it('renders with default title', () => {
      render(<NoSearchResults />);
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('renders with query in title', () => {
      render(<NoSearchResults query="cool nft" />);
      expect(screen.getByText('No results for "cool nft"')).toBeInTheDocument();
    });

    it('renders Browse Collections link', () => {
      render(<NoSearchResults />);
      expect(screen.getByRole('link', { name: 'Browse Collections' })).toHaveAttribute('href', '/explore');
    });
  });

  describe('NoCollectionsFound', () => {
    it('renders with correct title', () => {
      render(<NoCollectionsFound />);
      expect(screen.getByText('No collections yet')).toBeInTheDocument();
    });

    it('renders Explore Collections link', () => {
      render(<NoCollectionsFound />);
      expect(screen.getByRole('link', { name: 'Explore Collections' })).toHaveAttribute('href', '/explore');
    });
  });

  describe('NoFavorites', () => {
    it('renders with correct title', () => {
      render(<NoFavorites />);
      expect(screen.getByText('No favorites yet')).toBeInTheDocument();
    });
  });

  describe('NoListings', () => {
    it('renders with correct title', () => {
      render(<NoListings />);
      expect(screen.getByText('No active listings')).toBeInTheDocument();
    });
  });

  describe('NoActivity', () => {
    it('renders with correct title', () => {
      render(<NoActivity />);
      expect(screen.getByText('No activity yet')).toBeInTheDocument();
    });
  });

  describe('ErrorState', () => {
    it('renders with default title', () => {
      render(<ErrorState />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders with custom title', () => {
      render(<ErrorState title="Custom Error" />);
      expect(screen.getByText('Custom Error')).toBeInTheDocument();
    });

    it('renders with custom description', () => {
      render(<ErrorState description="A custom error message" />);
      expect(screen.getByText('A custom error message')).toBeInTheDocument();
    });

    it('renders retry button when onRetry is provided', () => {
      const handleRetry = jest.fn();
      render(<ErrorState onRetry={handleRetry} />);

      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('does not render retry button when onRetry is not provided', () => {
      render(<ErrorState />);
      expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument();
    });
  });
});
