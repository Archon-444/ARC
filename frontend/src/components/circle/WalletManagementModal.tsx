/**
 * Wallet Management Modal
 *
 * UI for viewing and managing Circle wallets
 */

'use client';

import { useState } from 'react';
import { Wallet, Check, Plus, Copy, ExternalLink, AlertCircle } from 'lucide-react';
import { Modal, ModalSection, ModalFooter } from '@/components/ui/Modal';
import { useCircleWallet } from '@/hooks/useCircleWallet';
import { CreateWalletModal } from './CreateWalletModal';
import { formatCircleWallet, CircleWallet } from '@/lib/circle';
import { truncateAddress } from '@/lib/utils';

interface WalletManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletManagementModal({ isOpen, onClose }: WalletManagementModalProps) {
  const { wallets, currentWallet, selectWallet, logout } = useCircleWallet();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleSelectWallet = (walletId: string) => {
    selectWallet(walletId);
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Manage Wallets"
        description="Select or create a Circle wallet"
        size="md"
      >
        <div className="space-y-4">
          {/* Wallets List */}
          {wallets.length > 0 ? (
            <ModalSection title="Your Wallets">
              <div className="space-y-2">
                {wallets.map((wallet) => (
                  <WalletCard
                    key={wallet.id}
                    wallet={wallet}
                    isSelected={currentWallet?.id === wallet.id}
                    onSelect={() => handleSelectWallet(wallet.id)}
                    onCopyAddress={handleCopyAddress}
                    isCopied={copiedAddress === wallet.address}
                  />
                ))}
              </div>
            </ModalSection>
          ) : (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-yellow-600" />
              <p className="text-sm font-medium text-yellow-900">No wallets found</p>
              <p className="mt-1 text-xs text-yellow-700">Create your first Circle wallet to get started</p>
            </div>
          )}

          {/* Create New Wallet Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <div className="flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Wallet
            </div>
          </button>
        </div>

        {/* Footer */}
        <ModalFooter>
          <button
            onClick={handleLogout}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Disconnect
          </button>
          <button
            onClick={onClose}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Done
          </button>
        </ModalFooter>
      </Modal>

      {/* Create Wallet Modal */}
      <CreateWalletModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
      />
    </>
  );
}

/**
 * Wallet Card Component
 */
function WalletCard({
  wallet,
  isSelected,
  onSelect,
  onCopyAddress,
  isCopied,
}: {
  wallet: CircleWallet;
  isSelected: boolean;
  onSelect: () => void;
  onCopyAddress: (address: string) => void;
  isCopied: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
        isSelected
          ? 'border-blue-600 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`rounded-full p-2 ${isSelected ? 'bg-blue-600' : 'bg-gray-100'}`}
          >
            <Wallet className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p
                className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}
              >
                {wallet.blockchain} Wallet
              </p>
              {isSelected && (
                <div className="flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5">
                  <Check className="h-3 w-3 text-white" />
                  <span className="text-xs font-medium text-white">Active</span>
                </div>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <p className="font-mono text-xs text-gray-600 truncate">{truncateAddress(wallet.address as `0x${string}`)}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyAddress(wallet.address);
                }}
                className="flex-shrink-0 rounded p-1 hover:bg-gray-200"
                aria-label="Copy address"
              >
                {isCopied ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3 text-gray-500" />
                )}
              </button>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span className="text-gray-500">Status:</span>
              <span
                className={`font-medium ${
                  wallet.state === 'LIVE' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {wallet.state}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
