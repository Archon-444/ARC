/**
 * Badge Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Badge } from '../Badge';

describe('Badge', () => {
  describe('Rendering', () => {
    it('renders with children', () => {
      render(<Badge>New</Badge>);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('renders with default variant (primary)', () => {
      const { container } = render(<Badge>Primary</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-primary-50');
    });
  });

  describe('Variants', () => {
    it('renders success variant', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-success-50');
    });

    it('renders warning variant', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-warning-50');
    });

    it('renders error variant', () => {
      const { container } = render(<Badge variant="error">Error</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-error-50');
    });

    it('renders neutral variant', () => {
      const { container } = render(<Badge variant="neutral">Neutral</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-neutral-100');
    });

    it('renders common rarity variant', () => {
      const { container } = render(<Badge variant="common">Common</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('border-neutral-300');
    });

    it('renders rare rarity variant', () => {
      const { container } = render(<Badge variant="rare">Rare</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-blue-100');
    });

    it('renders epic rarity variant', () => {
      const { container } = render(<Badge variant="epic">Epic</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-purple-100');
    });

    it('renders legendary rarity variant', () => {
      const { container } = render(<Badge variant="legendary">Legendary</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('bg-gradient-to-r');
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      const { container } = render(<Badge size="sm">Small</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('px-2');
    });

    it('renders medium size (default)', () => {
      const { container } = render(<Badge size="md">Medium</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('px-3');
    });

    it('renders large size', () => {
      const { container } = render(<Badge size="lg">Large</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('px-4');
    });
  });

  describe('Icon and Dot', () => {
    it('renders with icon', () => {
      render(<Badge icon={<span data-testid="test-icon">★</span>}>With Icon</Badge>);
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('renders with dot', () => {
      const { container } = render(<Badge dot>With Dot</Badge>);
      const dot = container.querySelector('.h-1\\.5.w-1\\.5.rounded-full');
      expect(dot).toBeInTheDocument();
    });

    it('dot has aria-hidden', () => {
      const { container } = render(<Badge dot>With Dot</Badge>);
      const dot = container.querySelector('[aria-hidden="true"]');
      expect(dot).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('applies custom className', () => {
      const { container } = render(<Badge className="custom-badge">Custom</Badge>);
      const badge = container.firstChild;
      expect(badge).toHaveClass('custom-badge');
    });
  });

  describe('Accessibility', () => {
    it('renders as a div element', () => {
      const { container } = render(<Badge>Badge</Badge>);
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('passes through additional props', () => {
      render(<Badge data-testid="badge-test">Test</Badge>);
      expect(screen.getByTestId('badge-test')).toBeInTheDocument();
    });
  });
});
