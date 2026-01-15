'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Layers, Tag, CheckCircle, ArrowRight, ArrowLeft, Plus, Image as ImageIcon } from 'lucide-react';
import { fetchGraphQL } from '@/lib/graphql-client';
import { GET_USER } from '@/graphql/queries';
import NFTCard from '@/components/NFTCard';
import { Button, Card, Input, Badge } from '@/components/ui';

type StudioView = 'overview' | 'create' | 'collections';
type CreateStep = 'upload' | 'details' | 'collection' | 'review';

interface CollectionFormData {
  name: string;
  symbol: string;
}

interface MintFormData {
  name: string;
  description: string;
  attributes: { trait_type: string; value: string }[];
  collectionAddress: string;
  image: File | null;
  imagePreview: string;
}

export default function StudioPage() {
  const { address, isConnected } = useAccount();
  const [view, setView] = useState<StudioView>('overview');
  const [createStep, setCreateStep] = useState<CreateStep>('upload');
  const [loading, setLoading] = useState(true);
  const [createdNFTs, setCreatedNFTs] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);

  // Form States
  const [mintForm, setMintForm] = useState<MintFormData>({
    name: '',
    description: '',
    attributes: [{ trait_type: '', value: '' }],
    collectionAddress: '',
    image: null,
    imagePreview: '',
  });

  const [newCollection, setNewCollection] = useState<CollectionFormData>({
    name: '',
    symbol: '',
  });

  const [isDeploying, setIsDeploying] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadCreatorData();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  const loadCreatorData = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const userId = address.toLowerCase();
      const data: any = await fetchGraphQL(GET_USER, { id: userId });

      if (data.user) {
        setCreatedNFTs(data.user.createdNFTs || []);
        const uniqueCollections = Array.from(
          new Map(
            (data.user.createdNFTs || []).map((nft: any) => [
              nft.collection.address,
              nft.collection,
            ])
          ).values()
        );
        setCollections(uniqueCollections);
      }
    } catch (error) {
      console.error('Error loading creator data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMintForm({
          ...mintForm,
          image: file,
          imagePreview: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const addAttribute = () => {
    setMintForm({
      ...mintForm,
      attributes: [...mintForm.attributes, { trait_type: '', value: '' }],
    });
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    const newAttributes = [...mintForm.attributes];
    newAttributes[index][field] = value;
    setMintForm({ ...mintForm, attributes: newAttributes });
  };

  const removeAttribute = (index: number) => {
    const newAttributes = mintForm.attributes.filter((_, i) => i !== index);
    setMintForm({ ...mintForm, attributes: newAttributes });
  };

  const handleDeployCollection = async () => {
    setIsDeploying(true);
    // Simulate deployment delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock new collection
    const mockCollection = {
      id: `0x${Math.random().toString(16).slice(2, 42)}`,
      name: newCollection.name,
      symbol: newCollection.symbol,
      address: `0x${Math.random().toString(16).slice(2, 42)}`,
    };

    setCollections([...collections, mockCollection]);
    setMintForm({ ...mintForm, collectionAddress: mockCollection.address });
    setIsDeploying(false);
  };

  const handleMint = async () => {
    setIsMinting(true);
    // Simulate minting delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Mock success
    setIsMinting(false);
    setView('overview');
    // Reset form
    setMintForm({
      name: '',
      description: '',
      attributes: [{ trait_type: '', value: '' }],
      collectionAddress: '',
      image: null,
      imagePreview: '',
    });
    setCreateStep('upload');
    alert('NFT Minted Successfully! (Mock)');
  };

  if (!isConnected) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400">
            <Layers className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Connect to Studio</h2>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-md">
            Connect your wallet to access the Creator Studio, manage collections, and mint new NFTs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Creator Studio</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Manage your collections and assets
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant={view === 'overview' ? 'primary' : 'outline'}
            onClick={() => setView('overview')}
          >
            Overview
          </Button>
          <Button
            variant={view === 'create' ? 'primary' : 'outline'}
            onClick={() => setView('create')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {view === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Collections</p>
                    <p className="text-2xl font-bold">{collections.length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">NFTs Created</p>
                    <p className="text-2xl font-bold">{createdNFTs.length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Status</p>
                    <p className="text-2xl font-bold">Active</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Creations */}
            <div>
              <h2 className="text-xl font-bold mb-4">Recent Creations</h2>
              {createdNFTs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {createdNFTs.slice(0, 4).map((nft) => (
                    <NFTCard key={nft.id} nft={nft} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
                  <p className="text-neutral-500">No NFTs created yet. Start creating!</p>
                  <Button className="mt-4" onClick={() => setView('create')}>
                    Create First NFT
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {view === 'create' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl mx-auto"
          >
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 w-full h-0.5 bg-neutral-200 dark:bg-neutral-800 -z-10" />
                {(['upload', 'details', 'collection', 'review'] as const).map((step, idx) => {
                  const isActive = step === createStep;
                  const isCompleted =
                    ['upload', 'details', 'collection', 'review'].indexOf(createStep) > idx;

                  return (
                    <div key={step} className="flex flex-col items-center gap-2 bg-neutral-50 dark:bg-neutral-900 px-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${isActive || isCompleted
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                          }`}
                      >
                        {idx + 1}
                      </div>
                      <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <Card className="p-8">
              {createStep === 'upload' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Upload Asset</h2>
                    <p className="text-neutral-500">Supported formats: JPG, PNG, GIF, MP4</p>
                  </div>

                  <div className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${mintForm.imagePreview
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-400'
                    }`}>
                    {mintForm.imagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={mintForm.imagePreview}
                          alt="Preview"
                          className="max-h-64 rounded-lg shadow-lg"
                        />
                        <button
                          onClick={() => setMintForm({ ...mintForm, image: null, imagePreview: '' })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <Plus className="w-4 h-4 rotate-45" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <Upload className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
                        <span className="text-lg font-medium block mb-2">Click to upload</span>
                        <span className="text-sm text-neutral-500">or drag and drop</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,video/*"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      disabled={!mintForm.image}
                      onClick={() => setCreateStep('details')}
                    >
                      Next Step
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {createStep === 'details' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Item Details</h2>
                    <p className="text-neutral-500">Provide information about your NFT</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <Input
                        placeholder="e.g. Cosmic Traveler #001"
                        value={mintForm.name}
                        onChange={(e) => setMintForm({ ...mintForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent focus:ring-2 focus:ring-primary-500 outline-none"
                        rows={4}
                        placeholder="Tell the story behind this piece..."
                        value={mintForm.description}
                        onChange={(e) => setMintForm({ ...mintForm, description: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Attributes (Optional)</label>
                      <div className="space-y-3">
                        {mintForm.attributes.map((attr, idx) => (
                          <div key={idx} className="flex gap-3">
                            <Input
                              placeholder="Trait Type (e.g. Background)"
                              value={attr.trait_type}
                              onChange={(e) => updateAttribute(idx, 'trait_type', e.target.value)}
                            />
                            <Input
                              placeholder="Value (e.g. Blue)"
                              value={attr.value}
                              onChange={(e) => updateAttribute(idx, 'value', e.target.value)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttribute(idx)}
                            >
                              <Plus className="w-4 h-4 rotate-45" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addAttribute}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Attribute
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={() => setCreateStep('upload')}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      disabled={!mintForm.name}
                      onClick={() => setCreateStep('collection')}
                    >
                      Next Step
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {createStep === 'collection' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Choose Collection</h2>
                    <p className="text-neutral-500">Select where this NFT belongs</p>
                  </div>

                  <div className="grid gap-4">
                    {collections.map((col) => (
                      <div
                        key={col.id}
                        onClick={() => setMintForm({ ...mintForm, collectionAddress: col.address })}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${mintForm.collectionAddress === col.address
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold">{col.name}</p>
                            <p className="text-sm text-neutral-500">{col.symbol}</p>
                          </div>
                          {mintForm.collectionAddress === col.address && (
                            <CheckCircle className="w-6 h-6 text-primary-600" />
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="border-t border-neutral-200 dark:border-neutral-700 my-2 pt-4">
                      <p className="text-sm font-medium mb-3">Or create a new collection:</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Collection Name"
                          value={newCollection.name}
                          onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                        />
                        <Input
                          placeholder="Symbol (e.g. ARC)"
                          value={newCollection.symbol}
                          onChange={(e) => setNewCollection({ ...newCollection, symbol: e.target.value })}
                        />
                      </div>
                      <Button
                        className="mt-3 w-full"
                        variant="outline"
                        disabled={!newCollection.name || !newCollection.symbol || isDeploying}
                        onClick={handleDeployCollection}
                      >
                        {isDeploying ? 'Deploying...' : 'Deploy New Collection'}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={() => setCreateStep('details')}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      disabled={!mintForm.collectionAddress}
                      onClick={() => setCreateStep('review')}
                    >
                      Next Step
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {createStep === 'review' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Review & Mint</h2>
                    <p className="text-neutral-500">Double check your details before minting</p>
                  </div>

                  <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-6 flex flex-col md:flex-row gap-6">
                    <img
                      src={mintForm.imagePreview}
                      alt="Preview"
                      className="w-full md:w-1/3 rounded-lg object-cover aspect-square"
                    />
                    <div className="space-y-4 flex-1">
                      <div>
                        <p className="text-sm text-neutral-500">Name</p>
                        <p className="font-bold text-xl">{mintForm.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500">Description</p>
                        <p className="text-neutral-700 dark:text-neutral-300">{mintForm.description || 'No description'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500">Collection</p>
                        <p className="font-mono text-sm">{mintForm.collectionAddress}</p>
                      </div>
                      {mintForm.attributes.some(a => a.trait_type) && (
                        <div className="flex flex-wrap gap-2">
                          {mintForm.attributes.filter(a => a.trait_type).map((attr, i) => (
                            <Badge key={i} variant="neutral">
                              {attr.trait_type}: {attr.value}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={() => setCreateStep('collection')}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      size="lg"
                      className="px-8"
                      onClick={handleMint}
                      disabled={isMinting}
                    >
                      {isMinting ? 'Minting...' : 'Confirm Mint'}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

