/**
 * Create Wallet Modal
 *
 * UI for creating new Circle User-Controlled Wallets
 */

'use client';

import { useState } from 'react';
import { Wallet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal, ModalSection, ModalFooter } from '@/components/ui/Modal';
import { useCircleWallet } from '@/hooks/useCircleWallet';
import { CircleWallet } from '@/lib/circle';

interface CreateWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (wallet: CircleWallet) => void;
}

enum CreateStep {
  CONFIRM = 'confirm',
  CREATING = 'creating',
  SUCCESS = 'success',
  ERROR = 'error',
}

export function CreateWalletModal({ isOpen, onClose, onSuccess }: CreateWalletModalProps) {
  const { createWallet, isCreatingWallet } = useCircleWallet();
  const [step, setStep] = useState<CreateStep>(CreateStep.CONFIRM);
  const [createdWallet, setCreatedWallet] = useState<CircleWallet | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateWallet = async () => {
    setStep(CreateStep.CREATING);
    setError(null);

    try {
      const wallet = await createWallet();
      if (wallet) {
        setCreatedWallet(wallet);
        setStep(CreateStep.SUCCESS);
        onSuccess?.(wallet);
      } else {
        throw new Error('Failed to create wallet');
      }
    } catch (err) {
      console.error('Wallet creation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setStep(CreateStep.ERROR);
    }
  };

  const handleClose = () => {
    if (step === CreateStep.CREATING) return; // Prevent closing during creation
    setStep(CreateStep.CONFIRM);
    setCreatedWallet(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === CreateStep.SUCCESS ? 'Wallet Created!' : 'Create Circle Wallet'}
      description={
        step === CreateStep.CONFIRM
          ? 'Create a new secure wallet on Circle Arc blockchain'
          : undefined
      }
      size="md"
      closeOnOverlayClick={step !== CreateStep.CREATING}
    >
      <div className="space-y-4">
        {/* Confirm Step */}
        {step === CreateStep.CONFIRM && (
          <ModalSection>
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <Wallet className="h-5 w-5 flex-shrink-0 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Circle User-Controlled Wallet</p>
                    <p className="mt-1 text-xs text-blue-700">
                      Your wallet will be secured by Circle's industry-leading infrastructure. You maintain
                      full control with biometric security.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">Backed by USDC reserves</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">Biometric security (Face ID/Touch ID)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">No seed phrases to manage</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">Compatible with Arc blockchain</span>
                </div>
              </div>
            </div>
          </ModalSection>
        )}

        {/* Creating Step */}
        {step === CreateStep.CREATING && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <div className="text-center">
                <p className="text-sm font-medium text-blue-900">Creating your wallet...</p>
                <p className="mt-1 text-xs text-blue-700">This may take a few moments</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === CreateStep.SUCCESS && createdWallet && (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">Wallet created successfully!</p>
                  <p className="mt-1 text-xs text-green-700">
                    Your new Circle wallet is ready to use on ArcMarket.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Wallet ID</span>
                  <span className="font-mono text-gray-900">{createdWallet.id.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Address</span>
                  <span className="font-mono text-gray-900">
                    {createdWallet.address.slice(0, 6)}...{createdWallet.address.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Blockchain</span>
                  <span className="font-medium text-gray-900">{createdWallet.blockchain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium text-green-600">{createdWallet.state}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Step */}
        {step === CreateStep.ERROR && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Failed to create wallet</p>
                <p className="mt-1 text-xs text-red-700">{error || 'An unknown error occurred'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <ModalFooter>
        {step === CreateStep.CONFIRM && (
          <>
            <button
              onClick={handleClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateWallet}
              disabled={isCreatingWallet}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Wallet className="h-4 w-4" />
              Create Wallet
            </button>
          </>
        )}

        {step === CreateStep.SUCCESS && (
          <button
            onClick={handleClose}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Done
          </button>
        )}

        {step === CreateStep.ERROR && (
          <>
            <button
              onClick={handleClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateWallet}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
