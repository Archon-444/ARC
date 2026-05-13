import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { TrustApiClient } from '../trust-api-client.js';
import { TrustApiError } from '../trust-api-client.js';

export const arcPassportGetTool: Tool = {
  name: 'arc_passport_get',
  title: 'ARC Passport — free read',
  description:
    'Look up an ARC Passport by EVM address. Free. Returns the on-chain passport record once W8 ships; until then, returns the trust-api placeholder.',
  inputSchema: {
    type: 'object',
    required: ['address'],
    properties: {
      address: {
        type: 'string',
        pattern: '^0x[a-fA-F0-9]{40}$',
        description: 'EVM address to look up.',
      },
    },
    additionalProperties: false,
  },
};

export async function handleArcPassportGet(
  client: TrustApiClient,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  let address: string;
  try {
    address = parseAddress(args);
  } catch (err) {
    return errorContent(err);
  }
  try {
    const passport = await client.getPassport(address);
    return {
      content: [{ type: 'text', text: JSON.stringify(passport, null, 2) }],
    };
  } catch (err) {
    return errorContent(err);
  }
}

function parseAddress(args: unknown): string {
  if (!args || typeof args !== 'object') {
    throw new Error('arc_passport_get: arguments must be an object with `address`');
  }
  const address = (args as { address?: unknown }).address;
  if (typeof address !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error('arc_passport_get: `address` must be a 0x-prefixed 40-hex EVM address');
  }
  return address;
}

function errorContent(err: unknown): {
  content: Array<{ type: 'text'; text: string }>;
  isError: true;
} {
  const message =
    err instanceof TrustApiError
      ? `trust-api error ${err.status}: ${err.message}`
      : err instanceof Error
        ? err.message
        : String(err);
  return { content: [{ type: 'text', text: message }], isError: true };
}
