import { Request, Response, NextFunction } from 'express';
import { ethers } from 'ethers';
import { APIError } from './error.middleware';

/**
 * Validate wallet signature
 *
 * Expects headers:
 * - X-Wallet-Address: The wallet address
 * - X-Wallet-Signature: Signature of a message
 * - X-Wallet-Message: The message that was signed
 */
export async function validateWalletSignature(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const address = req.headers['x-wallet-address'] as string;
    const signature = req.headers['x-wallet-signature'] as string;
    const message = req.headers['x-wallet-message'] as string;

    if (!address || !signature || !message) {
      throw new APIError(
        401,
        'Missing authentication headers',
        'MISSING_AUTH_HEADERS'
      );
    }

    // Verify signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      throw new APIError(
        401,
        'Invalid signature',
        'INVALID_SIGNATURE'
      );
    }

    // Check message timestamp to prevent replay attacks
    // Message format: "Sign this message to authenticate with ArcMarket. Timestamp: {timestamp}"
    const timestampMatch = message.match(/Timestamp: (\d+)/);
    if (timestampMatch) {
      const timestamp = parseInt(timestampMatch[1]);
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      // Message must be less than 5 minutes old
      if (now - timestamp > fiveMinutes) {
        throw new APIError(
          401,
          'Message timestamp expired',
          'MESSAGE_EXPIRED'
        );
      }
    }

    // Attach wallet address to request
    (req as any).walletAddress = address;

    next();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    throw new APIError(
      401,
      'Authentication failed',
      'AUTH_FAILED',
      error
    );
  }
}

/**
 * Optional wallet validation
 * Same as validateWalletSignature but doesn't throw if missing
 */
export async function optionalWalletSignature(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const address = req.headers['x-wallet-address'] as string;
  const signature = req.headers['x-wallet-signature'] as string;
  const message = req.headers['x-wallet-message'] as string;

  if (!address || !signature || !message) {
    return next();
  }

  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
      (req as any).walletAddress = address;
    }
  } catch (error) {
    // Silently fail for optional auth
    console.warn('Optional wallet validation failed:', error);
  }

  next();
}
