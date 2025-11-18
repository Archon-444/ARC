'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { fetchGraphQL } from '@/lib/graphql-client';
import { GET_USER } from '@/graphql/queries';
import NFTCard from '@/components/NFTCard';

type StudioView = 'overview' | 'deploy' | 'mint' | 'collections';

interface CollectionFormData {
  name: string;
  symbol: string;
  baseURI: string;
}

interface MintFormData {
  collectionAddress: string;
  to: string;
  tokenURI: string;
}

export default function StudioPage() {
  const { address, isConnected } = useAccount();
  const [view, setView] = useState<StudioView>('overview');
  const [loading, setLoading] = useState(true);
  const [createdNFTs, setCreatedNFTs] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);

  // Form states
  const [collectionForm, setCollectionForm] = useState<CollectionFormData>({
    name: '',
    symbol: '',
    baseURI: '',
  });

  const [mintForm, setMintForm] = useState<MintFormData>({
    collectionAddress: '',
    to: '',
    tokenURI: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [metadataName, setMetadataName] = useState('');
  const [metadataDescription, setMetadataDescription] = useState('');

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
        // Extract unique collections from created NFTs
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
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadToIPFS = async () => {
    if (!imageFile) return;

    // In production, this would upload to IPFS using services like:
    // - Pinata, NFT.Storage, Web3.Storage
    // For now, this is a placeholder
    alert(
      'IPFS upload integration needed. In production, upload to Pinata/NFT.Storage/Web3.Storage and return CID.'
    );

    // Placeholder IPFS CID format
    const placeholderCID = `Qm${Math.random().toString(36).substring(2, 15)}`;
    return `ipfs://${placeholderCID}`;
  };

  const handleGenerateMetadata = async () => {
    if (!imageFile || !metadataName) {
      alert('Please provide an image and name');
      return;
    }

    // Upload image to IPFS
    const imageCID = await handleUploadToIPFS();
    if (!imageCID) return;

    // Create metadata JSON
    const metadata = {
      name: metadataName,
      description: metadataDescription,
      image: imageCID,
      attributes: [],
    };

    // In production, upload metadata JSON to IPFS
    const metadataCID = `ipfs://Qm${Math.random().toString(36).substring(2, 15)}`;

    setMintForm({ ...mintForm, tokenURI: metadataCID });
    alert(`Metadata generated!\nURI: ${metadataCID}\n\nNow deploy your collection and mint this NFT.`);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connect your wallet to access the Creator Studio and start minting NFTs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Creator Studio</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create, deploy, and manage your NFT collections
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setView('overview')}
          className={`px-6 py-3 font-medium transition-colors ${
            view === 'overview'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setView('deploy')}
          className={`px-6 py-3 font-medium transition-colors ${
            view === 'deploy'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Deploy Collection
        </button>
        <button
          onClick={() => setView('mint')}
          className={`px-6 py-3 font-medium transition-colors ${
            view === 'mint'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Mint NFT
        </button>
        <button
          onClick={() => setView('collections')}
          className={`px-6 py-3 font-medium transition-colors ${
            view === 'collections'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          My Collections ({collections.length})
        </button>
      </div>

      {/* Content Area */}
      {view === 'overview' && (
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Collections</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {collections.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">NFTs Created</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {createdNFTs.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setView('deploy')}
                className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">Deploy Collection</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create a new ERC721 NFT collection
                  </p>
                </div>
              </button>

              <button
                onClick={() => setView('mint')}
                className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition"
              >
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">Mint NFT</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Mint a new NFT to your collection
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Creations */}
          {createdNFTs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Recent Creations
                </h2>
                <button
                  onClick={() => setView('collections')}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  View All →
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {createdNFTs.slice(0, 4).map((nft: any) => (
                  <NFTCard key={nft.id} nft={nft} />
                ))}
              </div>
            </div>
          )}

          {/* Getting Started */}
          {createdNFTs.length === 0 && (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Get Started with NFT Creation</h2>
              <p className="text-lg mb-6 opacity-90">
                Follow these steps to create and launch your NFT collection on Arc blockchain
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3 text-xl font-bold">
                    1
                  </div>
                  <h3 className="font-semibold mb-2">Deploy Collection</h3>
                  <p className="text-sm opacity-90">
                    Create your ERC721 smart contract with custom name and symbol
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3 text-xl font-bold">
                    2
                  </div>
                  <h3 className="font-semibold mb-2">Upload Metadata</h3>
                  <p className="text-sm opacity-90">
                    Upload images and metadata to IPFS for decentralized storage
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3 text-xl font-bold">
                    3
                  </div>
                  <h3 className="font-semibold mb-2">Mint & Sell</h3>
                  <p className="text-sm opacity-90">
                    Mint your NFTs and list them on the marketplace for sale
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'deploy' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Deploy New Collection
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={collectionForm.name}
                  onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value })}
                  placeholder="My Amazing Collection"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  The name of your NFT collection
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Symbol
                </label>
                <input
                  type="text"
                  value={collectionForm.symbol}
                  onChange={(e) =>
                    setCollectionForm({ ...collectionForm, symbol: e.target.value.toUpperCase() })
                  }
                  placeholder="MAC"
                  maxLength={10}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Short symbol for your collection (e.g., BAYC, MAYC)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Base URI (Optional)
                </label>
                <input
                  type="text"
                  value={collectionForm.baseURI}
                  onChange={(e) => setCollectionForm({ ...collectionForm, baseURI: e.target.value })}
                  placeholder="ipfs://QmXxx.../"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Base URI for token metadata (can be set later)
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm text-blue-900 dark:text-blue-200">
                    <p className="font-medium mb-1">Contract Deployment</p>
                    <p>
                      This will deploy a standard ERC721 contract to the Arc blockchain. You'll need to
                      interact with the contract directly or use tools like Remix, Hardhat, or Foundry.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  alert(
                    'Contract deployment requires:\n\n1. Deploy ERC721 contract via Remix/Hardhat/Foundry\n2. Use contract address to mint NFTs\n3. Integrate with marketplace for listings\n\nSample ERC721 contract code available in contracts/mocks/'
                  )
                }
                disabled={!collectionForm.name || !collectionForm.symbol}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                Deploy Collection
              </button>

              <div className="text-center">
                <Link
                  href="https://remix.ethereum.org"
                  target="_blank"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  Open Remix IDE →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'mint' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Mint NFT</h2>

            <div className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Image
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center ${
                    imagePreview
                      ? 'border-blue-400 dark:border-blue-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                        }}
                        className="text-sm text-red-600 dark:text-red-400 hover:underline"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div>
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="mt-4">
                        <label className="cursor-pointer">
                          <span className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                            Upload a file
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  NFT Name
                </label>
                <input
                  type="text"
                  value={metadataName}
                  onChange={(e) => setMetadataName(e.target.value)}
                  placeholder="Awesome NFT #1"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={metadataDescription}
                  onChange={(e) => setMetadataDescription(e.target.value)}
                  placeholder="Describe your NFT..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleGenerateMetadata}
                disabled={!imageFile || !metadataName}
                className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                Generate Metadata & IPFS URI
              </button>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Mint to Collection</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Collection Address
                    </label>
                    <input
                      type="text"
                      value={mintForm.collectionAddress}
                      onChange={(e) =>
                        setMintForm({ ...mintForm, collectionAddress: e.target.value })
                      }
                      placeholder="0x..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      value={mintForm.to}
                      onChange={(e) => setMintForm({ ...mintForm, to: e.target.value })}
                      placeholder={address || '0x...'}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Token URI
                    </label>
                    <input
                      type="text"
                      value={mintForm.tokenURI}
                      onChange={(e) => setMintForm({ ...mintForm, tokenURI: e.target.value })}
                      placeholder="ipfs://..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={() =>
                      alert(
                        'NFT minting requires calling the mint() function on your ERC721 contract with:\n\n' +
                          `- to: ${mintForm.to || address}\n` +
                          `- tokenURI: ${mintForm.tokenURI}\n\n` +
                          'Use Remix, Hardhat, or Foundry to interact with the contract.'
                      )
                    }
                    disabled={
                      !mintForm.collectionAddress || !mintForm.to || !mintForm.tokenURI
                    }
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                  >
                    Mint NFT
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'collections' && (
        <div>
          {createdNFTs.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No NFTs created yet
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by deploying a collection and minting your first NFT
              </p>
              <div className="mt-6 flex gap-3 justify-center">
                <button
                  onClick={() => setView('deploy')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Deploy Collection
                </button>
                <button
                  onClick={() => setView('mint')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Mint NFT
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Your Created NFTs ({createdNFTs.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {createdNFTs.map((nft: any) => (
                  <NFTCard key={nft.id} nft={nft} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
