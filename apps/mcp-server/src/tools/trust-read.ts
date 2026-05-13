import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { TrustApiClient } from '../trust-api-client.js';
import { TrustApiError } from '../trust-api-client.js';

export const arcTrustReadTool: Tool = {
  name: 'arc_trust_read',
  title: 'ARC Trust Read — $0.01 per call',
  description:
    'Score an EVM address using ARC v1 trust heuristics (creator, contract, trading, liquidity). Paid tier ($0.01 USDC on Base mainnet via x402). If the MCP server is funded (ARC_MCP_PAYER_PRIVATE_KEY set), the call returns the actual assessment. If not (stub-quote mode), the tool returns the 402 quote so the caller can surface "payment required" to the agent.',
  inputSchema: {
    type: 'object',
    required: ['target'],
    properties: {
      target: {
        type: 'string',
        pattern: '^0x[a-fA-F0-9]{40}$',
        description: 'EVM address to score.',
      },
    },
    additionalProperties: false,
  },
};

export async function handleArcTrustRead(
  client: TrustApiClient,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  let target: string;
  try {
    target = parseTarget(args);
  } catch (err) {
    return errorContent(err);
  }
  try {
    const result = await client.trustRead(target);
    if (result.paid) {
      const body = {
        status: 'ok',
        assessment: result.assessment,
        ...(result.txHash ? { txHash: result.txHash } : {}),
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(body, null, 2) }],
      };
    }
    const accept = result.quote.accepts[0];
    const summary = {
      status: 'payment_required',
      notice: result.settleError
        ? `Settlement failed: ${result.settleError}. The MCP server attempted to sign and pay but the facilitator rejected the authorization — likely a funding or nonce issue.`
        : 'ARC MCP server has no payer wallet configured. Surface this quote to the calling agent; alternatively the operator can set ARC_MCP_PAYER_PRIVATE_KEY so the server signs $0.01 USDC payments transparently.',
      ...(result.settleError ? { settleError: result.settleError } : {}),
      quote: {
        scheme: accept?.scheme,
        network: accept?.network,
        asset: accept?.asset,
        payTo: accept?.payTo,
        maxAmountRequired: accept?.maxAmountRequired,
        description: accept?.description,
        resource: accept?.resource,
      },
    };
    return {
      content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
    };
  } catch (err) {
    return errorContent(err);
  }
}

function parseTarget(args: unknown): string {
  if (!args || typeof args !== 'object') {
    throw new Error('arc_trust_read: arguments must be an object with `target`');
  }
  const target = (args as { target?: unknown }).target;
  if (typeof target !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(target)) {
    throw new Error('arc_trust_read: `target` must be a 0x-prefixed 40-hex EVM address');
  }
  return target;
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
