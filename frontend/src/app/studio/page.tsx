'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Image as ImageIcon,
  Layers,
  Plus,
  Rocket,
  Search,
  Sparkles,
  Upload,
  Wallet,
} from 'lucide-react';
import { fetchGraphQL } from '@/lib/graphql-client';
import { GET_USER } from '@/graphql/queries';
import NFTCard from '@/components/NFTCard';
import { Badge, Button, Card, Input } from '@/components/ui';

type StudioView = 'overview' | 'create';
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
  const [_loading, setLoading] = useState(true);
  const [createdNFTs, setCreatedNFTs] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);

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

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMintForm((current) => ({
          ...current,
          image: file,
          imagePreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addAttribute = () => {
    setMintForm((current) => ({
      ...current,
      attributes: [...current.attributes, { trait_type: '', value: '' }],
    }));
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    setMintForm((current) => {
      const newAttributes = [...current.attributes];
      newAttributes[index][field] = value;
      return { ...current, attributes: newAttributes };
    });
  };

  const removeAttribute = (index: number) => {
    setMintForm((current) => ({
      ...current,
      attributes: current.attributes.filter((_, i) => i !== index),
    }));
  };

  const handleDeployCollection = async () => {
    setIsDeploying(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockCollection = {
      id: `0x${Math.random().toString(16).slice(2, 42)}`,
      name: newCollection.name,
      symbol: newCollection.symbol,
      address: `0x${Math.random().toString(16).slice(2, 42)}`,
    };

    setCollections((current) => [...current, mockCollection]);
    setMintForm((current) => ({ ...current, collectionAddress: mockCollection.address }));
    setNewCollection({ name: '', symbol: '' });
    setIsDeploying(false);
  };

  const handleMint = async () => {
    setIsMinting(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setIsMinting(false);
    setView('overview');
    setMintForm({
      name: '',
      description: '',
      attributes: [{ trait_type: '', value: '' }],
      collectionAddress: '',
      image: null,
      imagePreview: '',
    });
    setCreateStep('upload');
    alert('NFT minted successfully. (Mock)');
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen px-4 py-12 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              ARC studio
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white lg:text-5xl">
              Connect your wallet to open the ARC creator studio.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-neutral-600 dark:text-neutral-400 lg:text-lg">
              Studio brings collection management, asset creation, and launch-ready preparation into one wallet-native ARC workflow.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600"
              >
                <Search className="h-4 w-4" />
                Explore markets
              </Link>
              <Link
                href="/launch"
                className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-3 font-semibold text-neutral-900 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
              >
                <Rocket className="h-4 w-4" />
                Launch a token
              </Link>
            </div>

            <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
              Connect from the navigation bar, then return here to manage collections and creation flows tied to your wallet.
            </p>
          </div>

          <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:p-8">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500">
              <Layers className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">What studio unlocks</h2>
            <div className="mt-5 space-y-4">
              <FeatureRow
                icon={<Layers className="h-4 w-4" />}
                title="Collection control"
                description="Create and manage wallet-linked ARC collections from one dedicated workspace."
              />
              <FeatureRow
                icon={<ImageIcon className="h-4 w-4" />}
                title="Asset preparation"
                description="Upload media, define metadata, and review mint details before publishing."
              />
              <FeatureRow
                icon={<Wallet className="h-4 w-4" />}
                title="Wallet-native continuity"
                description="Keep creation, discovery, profile, and launch actions aligned across the same ARC shell."
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const completedSteps = ['upload', 'details', 'collection', 'review'].indexOf(createStep);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6 lg:py-10">
        <div className="mb-8 grid gap-6 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              Wallet-linked ARC studio
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white lg:text-5xl">
              Build collections and prepare assets inside the ARC creator workflow.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-neutral-600 dark:text-neutral-400 lg:text-lg">
              Studio is the creation layer of the shell, connecting wallet identity, collection management, mint preparation, and launch-ready routes.
            </p>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-neutral-50/80 p-5 dark:border-white/10 dark:bg-slate-950/60">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-neutral-900 dark:text-white">Connected wallet</div>
                <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{address}</div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">
                <Wallet className="h-3.5 w-3.5" />
                Active
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link href="/profile" className="inline-flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 transition hover:border-primary-400 hover:text-primary-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-white">
                Open profile
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/launch" className="inline-flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 transition hover:border-primary-400 hover:text-primary-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-white">
                Open launch
                <Rocket className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <MetricCard icon={<Layers className="h-5 w-5" />} label="Collections" value={collections.length.toString()} tone="blue" />
          <MetricCard icon={<ImageIcon className="h-5 w-5" />} label="Assets created" value={createdNFTs.length.toString()} tone="purple" />
          <MetricCard icon={<CheckCircle className="h-5 w-5" />} label="Studio status" value="Active" tone="green" />
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-neutral-200/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Studio workspace</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Switch between an overview of your ARC creation activity and the guided mint flow.</p>
          </div>
          <div className="flex gap-3">
            <Button variant={view === 'overview' ? 'primary' : 'outline'} onClick={() => setView('overview')}>
              Overview
            </Button>
            <Button variant={view === 'create' ? 'primary' : 'outline'} onClick={() => setView('create')}>
              <Plus className="mr-2 h-4 w-4" />
              Create new
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
            >
              <div className="space-y-8">
                <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Recent creations</h2>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Your latest wallet-linked ARC assets appear here.</p>
                    </div>
                  </div>

                  {createdNFTs.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {createdNFTs.slice(0, 4).map((nft) => (
                        <NFTCard key={nft.id} nft={nft} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-3xl border-2 border-dashed border-neutral-200 px-6 py-12 text-center dark:border-white/10">
                      <p className="text-base font-medium text-neutral-900 dark:text-white">No creations yet</p>
                      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Start your first ARC asset flow to populate this studio overview.</p>
                      <Button className="mt-4" onClick={() => setView('create')}>
                        Create first asset
                      </Button>
                    </div>
                  )}
                </section>
              </div>

              <aside className="space-y-6">
                <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
                  <h2 className="mb-4 text-2xl font-semibold text-neutral-900 dark:text-white">Studio routes</h2>
                  <div className="space-y-3">
                    <RouteCard title="Mint flow" description="Open the guided asset creation journey inside studio." onClick={() => setView('create')} icon={<Sparkles className="h-4 w-4" />} />
                    <LinkCard title="Explore markets" description="Move from creation into marketplace and token discovery." href="/explore" icon={<Search className="h-4 w-4" />} />
                    <LinkCard title="Launch a token" description="Jump from studio into ARC launch workflows." href="/launch" icon={<Rocket className="h-4 w-4" />} />
                  </div>
                </section>

                <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
                  <h2 className="mb-4 text-2xl font-semibold text-neutral-900 dark:text-white">Collection guide</h2>
                  <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                    <GuideRow title="Start with media" description="Upload the asset first so the rest of the mint flow has a clear visual anchor." />
                    <GuideRow title="Add strong metadata" description="Use names, descriptions, and attributes that make your ARC asset easier to discover later." />
                    <GuideRow title="Choose the right collection" description="Create a new collection only when the asset should live in its own branded series." />
                  </div>
                </section>
              </aside>
            </motion.div>
          )}

          {view === 'create' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-auto max-w-4xl"
            >
              <div className="mb-6 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Guided mint flow</h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Move step by step from upload to review inside a cleaner ARC studio workflow.</p>
                  </div>
                  <Badge variant="neutral">Step {completedSteps + 1} of 4</Badge>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  {(['upload', 'details', 'collection', 'review'] as const).map((step, idx) => {
                    const isActive = step === createStep;
                    const isCompleted = completedSteps > idx;

                    return (
                      <div key={step} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                            isActive || isCompleted
                              ? 'bg-primary-600 text-white'
                              : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-[0.18em] text-neutral-400">Stage</div>
                            <div className="font-medium capitalize text-neutral-900 dark:text-white">{step}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Card className="rounded-3xl border border-neutral-200/60 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
                {createStep === 'upload' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">Upload asset</h2>
                      <p className="text-neutral-500 dark:text-neutral-400">Supported formats: JPG, PNG, GIF, MP4.</p>
                    </div>

                    <div className={`rounded-3xl border-2 border-dashed p-12 text-center transition-colors ${
                      mintForm.imagePreview
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10'
                        : 'border-neutral-200 hover:border-primary-400 dark:border-neutral-700'
                    }`}>
                      {mintForm.imagePreview ? (
                        <div className="relative inline-block">
                          <img src={mintForm.imagePreview} alt="Preview" className="max-h-64 rounded-2xl shadow-lg" />
                          <button
                            onClick={() => setMintForm((current) => ({ ...current, image: null, imagePreview: '' }))}
                            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                          >
                            <Plus className="h-4 w-4 rotate-45" />
                          </button>
                        </div>
                      ) : (
                        <label className="block cursor-pointer">
                          <Upload className="mx-auto mb-4 h-12 w-12 text-neutral-400" />
                          <span className="mb-2 block text-lg font-medium text-neutral-900 dark:text-white">Click to upload</span>
                          <span className="text-sm text-neutral-500 dark:text-neutral-400">or drag and drop your media</span>
                          <input type="file" className="hidden" accept="image/*,video/*" onChange={handleImageChange} />
                        </label>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button disabled={!mintForm.image} onClick={() => setCreateStep('details')}>
                        Next step
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {createStep === 'details' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">Asset details</h2>
                      <p className="text-neutral-500 dark:text-neutral-400">Add the metadata that will define this ARC asset.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium">Name</label>
                        <Input placeholder="e.g. Cosmic Traveler #001" value={mintForm.name} onChange={(e) => setMintForm((current) => ({ ...current, name: e.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium">Description</label>
                        <textarea
                          className="w-full rounded-2xl border border-neutral-200 bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-700"
                          rows={4}
                          placeholder="Tell the story behind this piece..."
                          value={mintForm.description}
                          onChange={(e) => setMintForm((current) => ({ ...current, description: e.target.value }))}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium">Attributes (optional)</label>
                        <div className="space-y-3">
                          {mintForm.attributes.map((attr, idx) => (
                            <div key={idx} className="flex gap-3">
                              <Input placeholder="Trait type" value={attr.trait_type} onChange={(e) => updateAttribute(idx, 'trait_type', e.target.value)} />
                              <Input placeholder="Value" value={attr.value} onChange={(e) => updateAttribute(idx, 'value', e.target.value)} />
                              <Button variant="ghost" size="sm" onClick={() => removeAttribute(idx)}>
                                <Plus className="h-4 w-4 rotate-45" />
                              </Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={addAttribute}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add attribute
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button variant="ghost" onClick={() => setCreateStep('upload')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button disabled={!mintForm.name} onClick={() => setCreateStep('collection')}>
                        Next step
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {createStep === 'collection' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">Choose collection</h2>
                      <p className="text-neutral-500 dark:text-neutral-400">Select an existing ARC collection or deploy a new one.</p>
                    </div>

                    <div className="grid gap-4">
                      {collections.map((col) => (
                        <div
                          key={col.id}
                          onClick={() => setMintForm((current) => ({ ...current, collectionAddress: col.address }))}
                          className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                            mintForm.collectionAddress === col.address
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-neutral-200 hover:border-primary-300 dark:border-neutral-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-neutral-900 dark:text-white">{col.name}</p>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">{col.symbol}</p>
                            </div>
                            {mintForm.collectionAddress === col.address && <CheckCircle className="h-6 w-6 text-primary-600" />}
                          </div>
                        </div>
                      ))}

                      <div className="my-2 border-t border-neutral-200 pt-4 dark:border-neutral-700">
                        <p className="mb-3 text-sm font-medium">Or create a new collection</p>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <Input placeholder="Collection name" value={newCollection.name} onChange={(e) => setNewCollection((current) => ({ ...current, name: e.target.value }))} />
                          <Input placeholder="Symbol (e.g. ARC)" value={newCollection.symbol} onChange={(e) => setNewCollection((current) => ({ ...current, symbol: e.target.value }))} />
                        </div>
                        <Button className="mt-3 w-full" variant="outline" disabled={!newCollection.name || !newCollection.symbol || isDeploying} onClick={handleDeployCollection}>
                          {isDeploying ? 'Deploying...' : 'Deploy new collection'}
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button variant="ghost" onClick={() => setCreateStep('details')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button disabled={!mintForm.collectionAddress} onClick={() => setCreateStep('review')}>
                        Next step
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {createStep === 'review' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">Review and mint</h2>
                      <p className="text-neutral-500 dark:text-neutral-400">Confirm your ARC asset details before publishing.</p>
                    </div>

                    <div className="flex flex-col gap-6 rounded-3xl bg-neutral-50 p-6 dark:bg-neutral-900 md:flex-row">
                      <img src={mintForm.imagePreview} alt="Preview" className="aspect-square w-full rounded-2xl object-cover md:w-1/3" />
                      <div className="flex-1 space-y-4">
                        <div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Name</p>
                          <p className="text-xl font-bold text-neutral-900 dark:text-white">{mintForm.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Description</p>
                          <p className="text-neutral-700 dark:text-neutral-300">{mintForm.description || 'No description'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Collection</p>
                          <p className="font-mono text-sm text-neutral-700 dark:text-neutral-300">{mintForm.collectionAddress}</p>
                        </div>
                        {mintForm.attributes.some((attribute) => attribute.trait_type) && (
                          <div className="flex flex-wrap gap-2">
                            {mintForm.attributes
                              .filter((attribute) => attribute.trait_type)
                              .map((attribute, index) => (
                                <Badge key={index} variant="neutral">
                                  {attribute.trait_type}: {attribute.value}
                                </Badge>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button variant="ghost" onClick={() => setCreateStep('collection')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button size="lg" className="px-8" onClick={handleMint} disabled={isMinting}>
                        {isMinting ? 'Minting...' : 'Confirm mint'}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, tone }: { icon: JSX.Element; label: string; value: string; tone: 'blue' | 'purple' | 'green' }) {
  const toneClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
    green: 'bg-green-500/10 text-green-500',
  } as const;

  return (
    <Card className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function FeatureRow({ icon, title, description }: { icon: JSX.Element; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">{icon}</div>
        <div>
          <div className="font-medium text-neutral-900 dark:text-white">{title}</div>
          <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</div>
        </div>
      </div>
    </div>
  );
}

function GuideRow({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
      <div className="font-medium text-neutral-900 dark:text-white">{title}</div>
      <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</div>
    </div>
  );
}

function LinkCard({ title, description, href, icon }: { title: string; description: string; href: string; icon: JSX.Element }) {
  return (
    <Link href={href} className="block rounded-2xl border border-neutral-200 bg-neutral-50 p-4 transition hover:border-primary-400 hover:bg-white dark:border-white/10 dark:bg-slate-950/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">{icon}</div>
          <div className="font-semibold text-neutral-900 dark:text-white">{title}</div>
          <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</div>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 text-neutral-400" />
      </div>
    </Link>
  );
}

function RouteCard({ title, description, onClick, icon }: { title: string; description: string; onClick: () => void; icon: JSX.Element }) {
  return (
    <button onClick={onClick} className="block w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-left transition hover:border-primary-400 hover:bg-white dark:border-white/10 dark:bg-slate-950/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">{icon}</div>
          <div className="font-semibold text-neutral-900 dark:text-white">{title}</div>
          <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</div>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 text-neutral-400" />
      </div>
    </button>
  );
}
