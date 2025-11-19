/**
 * Circle Smart Contract Platform API Configuration
 *
 * This SDK allows programmatic deployment of smart contracts using Circle's infrastructure.
 * Server-side only - requires API key and entity secret.
 */

// Circle API key (shared with User-Controlled Wallets)
export const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;

// Circle entity secret for developer-controlled operations
export const CIRCLE_ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET;

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
