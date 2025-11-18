/**
 * Circle Wallets API Configuration
 *
 * Backend API key (NEVER expose in frontend)
 */

// Circle API Base URL
export const CIRCLE_API_BASE = 'https://api.circle.com/v1/w3s';

// API Key (from environment - KEEP SECRET)
export const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;

/**
 * Circle API Headers
 */
export function getCircleHeaders() {
  if (!CIRCLE_API_KEY) {
    throw new Error('CIRCLE_API_KEY not configured in environment');
  }

  return {
    'Authorization': `Bearer ${CIRCLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Circle API Error Handler
 */
export class CircleAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public circleCode?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CircleAPIError';
  }
}

/**
 * Call Circle API with error handling
 */
export async function callCircleAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${CIRCLE_API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getCircleHeaders(),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new CircleAPIError(
        data.message || 'Circle API request failed',
        response.status,
        data.code,
        data
      );
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof CircleAPIError) {
      throw error;
    }

    console.error('Circle API call failed:', error);
    throw new CircleAPIError(
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
}
