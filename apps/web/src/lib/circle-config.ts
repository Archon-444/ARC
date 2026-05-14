/**
 * Circle SDK Configuration
 * Handles environment-based credential selection (testnet vs mainnet)
 */

export type CircleEnvironment = 'testnet' | 'mainnet';

/**
 * Get the current Circle environment from environment variables
 * Defaults to 'testnet' if not specified
 */
export function getCircleEnvironment(): CircleEnvironment {
  const env = process.env.NEXT_PUBLIC_CIRCLE_ENVIRONMENT?.toLowerCase();
  return env === 'mainnet' ? 'mainnet' : 'testnet';
}

/**
 * Get Circle API Key based on current environment
 * Server-side only - NEVER expose to client
 */
export function getCircleApiKey(): string {
  const env = getCircleEnvironment();

  if (env === 'mainnet') {
    return process.env.CIRCLE_API_KEY_MAINNET || '';
  }

  return process.env.CIRCLE_API_KEY_TESTNET || '';
}

/**
 * Get Circle App ID based on current environment
 * Public - safe to expose to client
 */
export function getCircleAppId(): string {
  const env = getCircleEnvironment();

  if (env === 'mainnet') {
    return process.env.NEXT_PUBLIC_CIRCLE_APP_ID_MAINNET || '';
  }

  return process.env.NEXT_PUBLIC_CIRCLE_APP_ID_TESTNET || '';
}

/**
 * Get Circle Entity Secret based on current environment
 * Server-side only - NEVER expose to client
 */
export function getCircleEntitySecret(): string {
  const env = getCircleEnvironment();

  if (env === 'mainnet') {
    return process.env.CIRCLE_ENTITY_SECRET_MAINNET || '';
  }

  return process.env.CIRCLE_ENTITY_SECRET_TESTNET || '';
}

/**
 * Validate Circle configuration
 * Returns error messages if configuration is incomplete
 */
export function validateCircleConfig(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const env = getCircleEnvironment();

  const apiKey = getCircleApiKey();
  const appId = getCircleAppId();
  const entitySecret = getCircleEntitySecret();

  if (!apiKey) {
    errors.push(`CIRCLE_API_KEY_${env.toUpperCase()} is not configured`);
  }

  if (!appId) {
    errors.push(`NEXT_PUBLIC_CIRCLE_APP_ID_${env.toUpperCase()} is not configured`);
  }

  if (!entitySecret) {
    errors.push(`CIRCLE_ENTITY_SECRET_${env.toUpperCase()} is not configured (optional for Smart Contract Platform)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get Circle configuration summary for debugging
 */
export function getCircleConfigSummary(): {
  environment: CircleEnvironment;
  hasApiKey: boolean;
  hasAppId: boolean;
  hasEntitySecret: boolean;
} {
  return {
    environment: getCircleEnvironment(),
    hasApiKey: !!getCircleApiKey(),
    hasAppId: !!getCircleAppId(),
    hasEntitySecret: !!getCircleEntitySecret(),
  };
}
