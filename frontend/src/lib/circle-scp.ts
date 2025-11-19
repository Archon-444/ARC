/**
 * Circle Smart Contract Platform API Configuration
 *
 * This SDK allows programmatic deployment of smart contracts using Circle's infrastructure.
 * Server-side only - requires API key and entity secret.
 */

import { getCircleApiKey, getCircleEntitySecret } from './circle-config';

// Circle API key (shared with User-Controlled Wallets)
// Automatically selected based on NEXT_PUBLIC_CIRCLE_ENVIRONMENT
export const CIRCLE_API_KEY = getCircleApiKey();

// Circle entity secret for developer-controlled operations
// Automatically selected based on NEXT_PUBLIC_CIRCLE_ENVIRONMENT
export const CIRCLE_ENTITY_SECRET = getCircleEntitySecret();

/**
 * Circle Smart Contract Platform Error
 */
export class CircleSCPError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public circleCode?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CircleSCPError';
  }
}
