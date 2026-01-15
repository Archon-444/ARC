import { v4 as uuidv4 } from 'uuid';
import { APIError } from '../middleware/error.middleware';
import { broadcastToRoom } from '../websocket';

/**
 * Offer Service
 *
 * Handles business logic for offer management
 * TODO: Replace in-memory storage with database (PostgreSQL/Prisma)
 */

interface Offer {
  id: string;
  nftId: string;
  contractAddress: string;
  tokenId: string;
  offerer: string;
  offererUsername?: string;
  offererAvatar?: string;
  price: string;
  expiresAt: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'cancelled' | 'expired';
  onChainOfferId?: string;
}

// In-memory storage (replace with database)
const offers: Map<string, Offer> = new Map();
const nftOffers: Map<string, string[]> = new Map(); // nftId -> offerIds[]

/**
 * Create new offer
 */
export async function createOffer(params: {
  nftId: string;
  contractAddress: string;
  tokenId: string;
  price: string;
  expirationDays: number;
  offererAddress: string;
  signature?: string;
}) {
  const offerId = uuidv4();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + params.expirationDays * 24 * 60 * 60 * 1000);

  const offer: Offer = {
    id: offerId,
    nftId: params.nftId,
    contractAddress: params.contractAddress,
    tokenId: params.tokenId,
    offerer: params.offererAddress,
    price: params.price,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
    status: 'pending',
  };

  // Store offer
  offers.set(offerId, offer);

  // Add to NFT offers index
  const currentOffers = nftOffers.get(params.nftId) || [];
  currentOffers.push(offerId);
  nftOffers.set(params.nftId, currentOffers);

  // Broadcast to WebSocket clients
  broadcastToRoom(`nft:${params.nftId}`, {
    type: 'offer_created',
    data: offer,
  });

  // In production: This would also submit to blockchain
  // const { onChainOfferId } = await submitOfferToBlockchain(params);
  // offer.onChainOfferId = onChainOfferId;

  return {
    offerId,
    status: 'pending',
    requiresApproval: true, // Check USDC allowance in real implementation
    // In production: Return approval transaction data if needed
  };
}

/**
 * Get offers for an NFT
 */
export async function getOffersByNFT(nftId: string): Promise<Offer[]> {
  const offerIds = nftOffers.get(nftId) || [];
  const nftOffersList = offerIds
    .map(id => offers.get(id))
    .filter(offer => offer !== undefined) as Offer[];

  // Filter expired offers
  const now = new Date();
  return nftOffersList.filter(offer => {
    if (offer.status === 'expired') return false;

    // Auto-expire old offers
    if (new Date(offer.expiresAt) < now && offer.status === 'pending') {
      offer.status = 'expired';
      offers.set(offer.id, offer);
      return false;
    }

    return true;
  });
}

/**
 * Accept offer (owner only)
 */
export async function acceptOffer(offerId: string, ownerAddress: string) {
  const offer = offers.get(offerId);

  if (!offer) {
    throw new APIError(404, 'Offer not found', 'NOT_FOUND');
  }

  if (offer.status !== 'pending') {
    throw new APIError(400, 'Offer is not pending', 'INVALID_STATUS');
  }

  // Check if expired
  if (new Date(offer.expiresAt) < new Date()) {
    offer.status = 'expired';
    offers.set(offerId, offer);
    throw new APIError(400, 'Offer has expired', 'EXPIRED');
  }

  // TODO: In production, verify ownerAddress owns the NFT
  // const actualOwner = await getNFTOwner(offer.contractAddress, offer.tokenId);
  // if (actualOwner.toLowerCase() !== ownerAddress.toLowerCase()) {
  //   throw new APIError(403, 'Not NFT owner', 'NOT_OWNER');
  // }

  // Update offer status
  offer.status = 'accepted';
  offers.set(offerId, offer);

  // Broadcast to WebSocket clients
  broadcastToRoom(`nft:${offer.nftId}`, {
    type: 'offer_accepted',
    data: offer,
  });

  // In production: Submit acceptance to blockchain
  // const txHash = await acceptOfferOnChain(offerId);

  return {
    offerId,
    status: 'accepted',
    txHash: '0x' + '0'.repeat(64), // Mock transaction hash
  };
}

/**
 * Cancel offer (offerer only)
 */
export async function cancelOffer(offerId: string, offererAddress: string) {
  const offer = offers.get(offerId);

  if (!offer) {
    throw new APIError(404, 'Offer not found', 'NOT_FOUND');
  }

  if (offer.offerer.toLowerCase() !== offererAddress.toLowerCase()) {
    throw new APIError(403, 'Not offer creator', 'NOT_OFFERER');
  }

  if (offer.status !== 'pending') {
    throw new APIError(400, 'Offer is not pending', 'INVALID_STATUS');
  }

  // Update offer status
  offer.status = 'cancelled';
  offers.set(offerId, offer);

  // Broadcast to WebSocket clients
  broadcastToRoom(`nft:${offer.nftId}`, {
    type: 'offer_cancelled',
    data: offer,
  });

  // In production: Submit cancellation to blockchain
  // const txHash = await cancelOfferOnChain(offerId);

  return {
    offerId,
    status: 'cancelled',
    txHash: '0x' + '0'.repeat(64), // Mock transaction hash
  };
}

/**
 * Get offer by ID
 */
export async function getOfferById(offerId: string): Promise<Offer | null> {
  return offers.get(offerId) || null;
}

/**
 * Clean up expired offers (run periodically)
 */
export async function cleanupExpiredOffers() {
  const now = new Date();
  let cleanedCount = 0;

  for (const [id, offer] of offers.entries()) {
    if (offer.status === 'pending' && new Date(offer.expiresAt) < now) {
      offer.status = 'expired';
      offers.set(id, offer);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired offers`);
  }

  return cleanedCount;
}

// Run cleanup every hour
setInterval(cleanupExpiredOffers, 60 * 60 * 1000);
