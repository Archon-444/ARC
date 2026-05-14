/**
 * Modal Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Modal, ModalFooter, ModalSection, ConfirmModal } from '../Modal';

// Mock lucide-react
jest.mock('lucide-react', () => ({
  X: () => <span data-testid="close-icon">X</span>,
}));

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders when isOpen is true', () => {
      render(<Modal {...defaultProps}>Content</Modal>);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false}>Content</Modal>);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders title', () => {
      render(<Modal {...defaultProps}>Content</Modal>);
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(<Modal {...defaultProps} description="Test description">Content</Modal>);
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('renders children', () => {
      render(<Modal {...defaultProps}><p>Modal content</p></Modal>);
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('renders close button by default', () => {
      render(<Modal {...defaultProps}>Content</Modal>);
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });

    it('hides close button when showClose is false', () => {
      render(<Modal {...defaultProps} showClose={false}>Content</Modal>);
      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('applies sm size class', () => {
      render(<Modal {...defaultProps} size="sm">Content</Modal>);
      const content = document.querySelector('.max-w-sm');
      expect(content).toBeInTheDocument();
    });

    it('applies lg size class', () => {
      render(<Modal {...defaultProps} size="lg">Content</Modal>);
      const content = document.querySelector('.max-w-lg');
      expect(content).toBeInTheDocument();
    });

    it('applies xl size class', () => {
      render(<Modal {...defaultProps} size="xl">Content</Modal>);
      const content = document.querySelector('.max-w-xl');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Close Behavior', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose}>Content</Modal>);

      fireEvent.click(screen.getByLabelText('Close modal'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose}>Content</Modal>);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose on Escape when closeOnEscape is false', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} closeOnEscape={false}>Content</Modal>);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();
    });

    it('calls onClose when clicking overlay', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose}>Content</Modal>);

      // Click on the overlay (the outermost div with role="dialog")
      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when clicking overlay if closeOnOverlayClick is false', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} closeOnOverlayClick={false}>Content</Modal>);

      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has role="dialog"', () => {
      render(<Modal {...defaultProps}>Content</Modal>);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal="true"', () => {
      render(<Modal {...defaultProps}>Content</Modal>);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby pointing to title', () => {
      render(<Modal {...defaultProps}>Content</Modal>);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('has aria-describedby when description is provided', () => {
      render(<Modal {...defaultProps} description="Description">Content</Modal>);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', 'modal-description');
    });
  });
});

describe('ModalFooter', () => {
  it('renders children', () => {
    render(<ModalFooter><button>Action</button></ModalFooter>);
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ModalFooter className="custom-class">Content</ModalFooter>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('ModalSection', () => {
  it('renders children', () => {
    render(<ModalSection>Section content</ModalSection>);
    expect(screen.getByText('Section content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<ModalSection title="Section Title">Content</ModalSection>);
    expect(screen.getByText('Section Title')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ModalSection className="custom-section">Content</ModalSection>);
    expect(container.firstChild).toHaveClass('custom-section');
  });
});

describe('ConfirmModal', () => {
  const defaultConfirmProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Confirm Action',
    description: 'Are you sure?',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with title and description', () => {
    render(<ConfirmModal {...defaultConfirmProps} />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('renders default button labels', () => {
    render(<ConfirmModal {...defaultConfirmProps} />);
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('renders custom button labels', () => {
    render(
      <ConfirmModal
        {...defaultConfirmProps}
        confirmLabel="Delete"
        cancelLabel="Keep"
      />
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = jest.fn();
    render(<ConfirmModal {...defaultConfirmProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = jest.fn();
    render(<ConfirmModal {...defaultConfirmProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<ConfirmModal {...defaultConfirmProps} isLoading />);
    expect(screen.getByRole('button', { name: 'Loading...' })).toBeInTheDocument();
  });

  it('disables buttons when loading', () => {
    render(<ConfirmModal {...defaultConfirmProps} isLoading />);
    expect(screen.getByRole('button', { name: 'Loading...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('renders children content', () => {
    render(
      <ConfirmModal {...defaultConfirmProps}>
        <p>Additional warning</p>
      </ConfirmModal>
    );
    expect(screen.getByText('Additional warning')).toBeInTheDocument();
  });
});
