import { Request, Response } from 'express';
import { APIError } from '../middleware/error.middleware';
import * as offerService from '../services/offer.service';
import Joi from 'joi';

// Validation schemas
const createOfferSchema = Joi.object({
  nftId: Joi.string().required(),
  contractAddress: Joi.string().required(),
  tokenId: Joi.string().required(),
  price: Joi.string().required(),
  expirationDays: Joi.number().integer().min(1).max(30).required(),
  signature: Joi.string().optional(),
});

/**
 * Create new offer
 */
export async function createOffer(req: Request, res: Response) {
  // Validate request body
  const { error, value } = createOfferSchema.validate(req.body);
  if (error) {
    throw new APIError(400, 'Invalid request body', 'VALIDATION_ERROR', error.details);
  }

  // Get wallet address from auth middleware
  const offererAddress = (req as any).walletAddress;
  if (!offererAddress) {
    throw new APIError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  // Create offer
  const result = await offerService.createOffer({
    ...value,
    offererAddress,
  });

  res.status(201).json(result);
}

/**
 * Get offers for an NFT
 */
export async function getOffersByNFT(req: Request, res: Response) {
  const { id } = req.params;

  if (!id) {
    throw new APIError(400, 'NFT ID is required', 'VALIDATION_ERROR');
  }

  const offers = await offerService.getOffersByNFT(id);

  res.json(offers);
}

/**
 * Accept offer (owner only)
 */
export async function acceptOffer(req: Request, res: Response) {
  const { offerId } = req.params;
  const ownerAddress = (req as any).walletAddress;

  if (!ownerAddress) {
    throw new APIError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  if (!offerId) {
    throw new APIError(400, 'Offer ID is required', 'VALIDATION_ERROR');
  }

  const result = await offerService.acceptOffer(offerId, ownerAddress);

  res.json(result);
}

/**
 * Cancel offer (offerer only)
 */
export async function cancelOffer(req: Request, res: Response) {
  const { offerId } = req.params;
  const offererAddress = (req as any).walletAddress;

  if (!offererAddress) {
    throw new APIError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  if (!offerId) {
    throw new APIError(400, 'Offer ID is required', 'VALIDATION_ERROR');
  }

  const result = await offerService.cancelOffer(offerId, offererAddress);

  res.json(result);
}

/**
 * Get offer by ID
 */
export async function getOfferById(req: Request, res: Response) {
  const { offerId } = req.params;

  if (!offerId) {
    throw new APIError(400, 'Offer ID is required', 'VALIDATION_ERROR');
  }

  const offer = await offerService.getOfferById(offerId);

  if (!offer) {
    throw new APIError(404, 'Offer not found', 'NOT_FOUND');
  }

  res.json(offer);
}
