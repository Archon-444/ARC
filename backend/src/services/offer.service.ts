import { APIError } from '../middleware/error.middleware';
import { broadcastToRoom } from '../websocket';
import { prisma } from '../prisma';
import { getNFTOwner } from './nft-ownership';
import type { Offer as PrismaOffer, OfferStatus } from '@prisma/client';

/**
 * Offer Service
 *
 * Persists offers via Prisma (Postgres). Owner-gated actions verify on-chain
 * ownership through RPC_URL to prevent accept-offer spoofing.
 */

export interface Offer {
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

function toOffer(row: PrismaOffer): Offer {
  return {
    id: row.id,
    nftId: row.nftId,
    contractAddress: row.contractAddress,
    tokenId: row.tokenId,
    offerer: row.offerer,
    offererUsername: row.offererUsername ?? undefined,
    offererAvatar: row.offererAvatar ?? undefined,
    price: row.price,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    status: row.status as Offer['status'],
    onChainOfferId: row.onChainOfferId ?? undefined,
  };
}

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
  const now = new Date();
  const expiresAt = new Date(now.getTime() + params.expirationDays * 24 * 60 * 60 * 1000);

  const row = await prisma.offer.create({
    data: {
      nftId: params.nftId,
      contractAddress: params.contractAddress,
      tokenId: params.tokenId,
      offerer: params.offererAddress,
      price: params.price,
      expiresAt,
      status: 'pending' as OfferStatus,
    },
  });

  const offer = toOffer(row);

  broadcastToRoom(`nft:${params.nftId}`, {
    type: 'offer_created',
    data: offer,
  });

  return {
    offerId: offer.id,
    status: 'pending' as const,
    requiresApproval: true,
  };
}

/**
 * Get offers for an NFT (filters out expired; lazily transitions pending→expired).
 */
export async function getOffersByNFT(nftId: string): Promise<Offer[]> {
  const now = new Date();

  await prisma.offer.updateMany({
    where: { nftId, status: 'pending', expiresAt: { lt: now } },
    data: { status: 'expired' },
  });

  const rows = await prisma.offer.findMany({
    where: { nftId, status: { notIn: ['expired'] } },
    orderBy: { createdAt: 'desc' },
  });

  return rows.map(toOffer);
}

/**
 * Accept offer. Verifies the signed `ownerAddress` matches the current on-chain
 * owner of the NFT before transitioning.
 */
export async function acceptOffer(offerId: string, ownerAddress: string) {
  const row = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!row) {
    throw new APIError(404, 'Offer not found', 'NOT_FOUND');
  }

  if (row.status !== 'pending') {
    throw new APIError(400, 'Offer is not pending', 'INVALID_STATUS');
  }

  if (row.expiresAt < new Date()) {
    await prisma.offer.update({
      where: { id: offerId },
      data: { status: 'expired' },
    });
    throw new APIError(400, 'Offer has expired', 'EXPIRED');
  }

  let actualOwner: string;
  try {
    actualOwner = await getNFTOwner(row.contractAddress, row.tokenId);
  } catch (err) {
    throw new APIError(
      502,
      'Failed to verify NFT ownership',
      'OWNERSHIP_LOOKUP_FAILED',
      err,
    );
  }

  if (actualOwner !== ownerAddress.toLowerCase()) {
    throw new APIError(403, 'Not NFT owner', 'NOT_OWNER');
  }

  const updated = await prisma.offer.update({
    where: { id: offerId },
    data: { status: 'accepted' },
  });
  const offer = toOffer(updated);

  broadcastToRoom(`nft:${offer.nftId}`, {
    type: 'offer_accepted',
    data: offer,
  });

  return {
    offerId: offer.id,
    status: 'accepted' as const,
    txHash: '0x' + '0'.repeat(64),
  };
}

/**
 * Cancel offer (offerer only)
 */
export async function cancelOffer(offerId: string, offererAddress: string) {
  const row = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!row) {
    throw new APIError(404, 'Offer not found', 'NOT_FOUND');
  }

  if (row.offerer.toLowerCase() !== offererAddress.toLowerCase()) {
    throw new APIError(403, 'Not offer creator', 'NOT_OFFERER');
  }

  if (row.status !== 'pending') {
    throw new APIError(400, 'Offer is not pending', 'INVALID_STATUS');
  }

  const updated = await prisma.offer.update({
    where: { id: offerId },
    data: { status: 'cancelled' },
  });
  const offer = toOffer(updated);

  broadcastToRoom(`nft:${offer.nftId}`, {
    type: 'offer_cancelled',
    data: offer,
  });

  return {
    offerId: offer.id,
    status: 'cancelled' as const,
    txHash: '0x' + '0'.repeat(64),
  };
}

/**
 * Get offer by ID
 */
export async function getOfferById(offerId: string): Promise<Offer | null> {
  const row = await prisma.offer.findUnique({ where: { id: offerId } });
  return row ? toOffer(row) : null;
}

/**
 * Clean up expired offers (run periodically)
 */
export async function cleanupExpiredOffers() {
  const { count } = await prisma.offer.updateMany({
    where: { status: 'pending', expiresAt: { lt: new Date() } },
    data: { status: 'expired' },
  });

  if (count > 0) {
    console.log(`Cleaned up ${count} expired offers`);
  }

  return count;
}

// Run cleanup every hour.
setInterval(() => {
  cleanupExpiredOffers().catch((err) => {
    console.error('cleanupExpiredOffers failed:', err);
  });
}, 60 * 60 * 1000);
