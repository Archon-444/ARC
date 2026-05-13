import Anthropic from '@anthropic-ai/sdk';

import {
  DEEP_TIER_MODEL,
  DEEP_TIER_OUTPUT_SCHEMA,
  DEEP_TIER_SYSTEM_PROMPT,
  buildUserMessage,
  type DeepTierCommentary,
} from './prompt';

export interface EditorialClientOptions {
  apiKey?: string;
  /** Override the default Anthropic client (used by tests). */
  client?: Anthropic;
}

export interface EditorialResult {
  commentary: DeepTierCommentary;
  /** Usage breakdown from the Anthropic response (for logging). */
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationInputTokens: number;
    cacheReadInputTokens: number;
  };
  /** True when this call read from Anthropic's prompt cache. */
  cacheHit: boolean;
  model: string;
}

/**
 * Editorial client wrapping a single Haiku call with prompt caching.
 *
 * The system prompt carries `cache_control: { type: 'ephemeral' }` so
 * Anthropic caches the prefix on the first call; subsequent calls
 * within ~5 minutes pay roughly 0.1x on the prefix instead of the
 * full input rate. The minimum cacheable prefix on Haiku 4.5 is
 * 4096 tokens — the system prompt is sized accordingly. A shorter
 * prompt silently bypasses caching (cache_creation_input_tokens=0).
 *
 * Structured outputs: `output_config.format.json_schema` constrains
 * the response shape; on parse failure the client throws.
 */
export class EditorialClient {
  private readonly client: Anthropic;

  constructor(opts: EditorialClientOptions = {}) {
    this.client = opts.client ?? new Anthropic({ apiKey: opts.apiKey });
  }

  async generate(
    target: string,
    scoreV1: {
      composite: number;
      factors: { creator: number; contract: number; trading: number; liquidity: number };
    }
  ): Promise<EditorialResult> {
    const userMessage = buildUserMessage(target, scoreV1);

    const response = await (this.client.messages.create as any)({
      model: DEEP_TIER_MODEL,
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: DEEP_TIER_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userMessage }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: DEEP_TIER_OUTPUT_SCHEMA,
        },
      },
    });

    const text = extractText(response);
    let commentary: DeepTierCommentary;
    try {
      commentary = JSON.parse(text) as DeepTierCommentary;
    } catch (err) {
      throw new Error(
        `editorial: failed to parse structured output: ${(err as Error).message}; raw text head: ${text.slice(0, 200)}`
      );
    }

    const usage = response.usage ?? {};
    const cacheReadInputTokens = Number(usage.cache_read_input_tokens ?? 0);
    const cacheCreationInputTokens = Number(usage.cache_creation_input_tokens ?? 0);

    return {
      commentary,
      usage: {
        inputTokens: Number(usage.input_tokens ?? 0),
        outputTokens: Number(usage.output_tokens ?? 0),
        cacheCreationInputTokens,
        cacheReadInputTokens,
      },
      cacheHit: cacheReadInputTokens > 0,
      model: DEEP_TIER_MODEL,
    };
  }
}

function extractText(response: any): string {
  if (!response || !Array.isArray(response.content)) {
    throw new Error('editorial: response has no content array');
  }
  for (const block of response.content) {
    if (block && block.type === 'text' && typeof block.text === 'string') {
      return block.text;
    }
  }
  throw new Error('editorial: response had no text block');
}
