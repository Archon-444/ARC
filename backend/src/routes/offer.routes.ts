import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import * as offerController from '../controllers/offer.controller';
import { validateWalletSignature } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /v1/offers
 * @desc    Create new offer
 * @access  Protected (requires wallet signature)
 */
router.post(
  '/',
  validateWalletSignature,
  asyncHandler(offerController.createOffer)
);

/**
 * @route   GET /v1/nft/:id/offers
 * @desc    Get all offers for an NFT
 * @access  Public
 */
router.get(
  '/nft/:id/offers',
  asyncHandler(offerController.getOffersByNFT)
);

/**
 * @route   POST /v1/offers/:offerId/accept
 * @desc    Accept an offer (owner only)
 * @access  Protected (requires wallet signature)
 */
router.post(
  '/:offerId/accept',
  validateWalletSignature,
  asyncHandler(offerController.acceptOffer)
);

/**
 * @route   POST /v1/offers/:offerId/cancel
 * @desc    Cancel an offer (offerer only)
 * @access  Protected (requires wallet signature)
 */
router.post(
  '/:offerId/cancel',
  validateWalletSignature,
  asyncHandler(offerController.cancelOffer)
);

/**
 * @route   GET /v1/offers/:offerId
 * @desc    Get offer by ID
 * @access  Public
 */
router.get(
  '/:offerId',
  asyncHandler(offerController.getOfferById)
);

export default router;
