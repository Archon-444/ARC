import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CURVE_TYPE_NAMES } from '@/lib/contracts';
import type { GenerateTokenPageResponse } from '@/types';

// Simple in-memory rate limiter per IP
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => t > now - RATE_LIMIT_WINDOW_MS);
  rateLimitMap.set(ip, recent);

  if (recent.length >= RATE_LIMIT_MAX) {
    return true;
  }
  recent.push(now);
  return false;
}

// Platform-controlled disclaimer — never trust the model for this
const PLATFORM_RISK_DISCLAIMER =
  'This token is a speculative digital asset on the ARC bonding curve. ' +
  'The price is determined algorithmically and may lose value. ' +
  'Do your own research before purchasing. This is not financial advice.';

// Tool definition for structured output
const TOKEN_PAGE_TOOL: Anthropic.Messages.Tool = {
  name: 'generate_token_page',
  description: 'Generate structured token page content with headline, tagline, description, and key features.',
  input_schema: {
    type: 'object' as const,
    properties: {
      headline: {
        type: 'string',
        description: 'A short, compelling headline for the token (max 10 words). No price predictions or guarantees.',
      },
      tagline: {
        type: 'string',
        description: 'A one-sentence value proposition. Factual, no hype.',
      },
      fullDescription: {
        type: 'string',
        description: 'A 2-3 paragraph professional description covering the token purpose, mechanics, and use case. No price predictions, no return guarantees, no "safe" or "guaranteed" language.',
      },
      keyFeatures: {
        type: 'array',
        items: { type: 'string' },
        description: '3-5 key features or properties of the token. Factual statements only.',
      },
    },
    required: ['headline', 'tagline', 'fullDescription', 'keyFeatures'],
  },
};

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before trying again.' },
        { status: 429 }
      );
    }

    // Validate API key exists
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI generation is not configured. Please set ANTHROPIC_API_KEY.' },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, symbol, description, category, totalSupply, basePrice, curveType } = body;

    // Validate required fields
    if (!name?.trim() || name.length > 50) {
      return NextResponse.json({ error: 'Name is required (max 50 characters)' }, { status: 400 });
    }
    if (!symbol?.trim() || symbol.length > 10) {
      return NextResponse.json({ error: 'Symbol is required (max 10 characters)' }, { status: 400 });
    }
    if (!description?.trim() || description.length < 10) {
      return NextResponse.json({ error: 'Description must be at least 10 characters' }, { status: 400 });
    }

    const curveTypeName = CURVE_TYPE_NAMES[curveType] || 'Linear';

    // Call Claude API with tool use for structured output
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `You are a professional Web3 token launch copywriter for the ARC DeFi platform. Generate honest, professional token descriptions.

STRICT RULES:
- Never use hype language ("moonshot", "100x", "guaranteed", "to the moon")
- Never predict prices or promise returns
- Never use the word "safe", "risk-free", or "guaranteed"
- Never claim tokens are an investment or security
- Always maintain a factual, informational tone
- Focus on the token's stated purpose and bonding curve mechanics`,
      messages: [
        {
          role: 'user',
          content: `Generate a token page for:
- Name: ${name}
- Symbol: ${symbol}
- Creator's description: ${description}
${category ? `- Category: ${category}` : ''}
- Total Supply: ${totalSupply || '1,000,000'}
- Base Price: $${basePrice || '0.01'} USDC
- Bonding Curve: ${curveTypeName}

The token uses ARC's bonding curve mechanism where price increases as more tokens are purchased. It graduates when 80% of supply is sold, after which staking rewards begin.

Use the generate_token_page tool to return the structured content.`,
        },
      ],
      tools: [TOKEN_PAGE_TOOL],
      tool_choice: { type: 'tool', name: 'generate_token_page' },
    });

    // Extract tool use result — guaranteed to be structured JSON
    const toolUseBlock = message.content.find((block) => block.type === 'tool_use');
    if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
      return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
    }

    const generated = toolUseBlock.input as {
      headline?: string;
      tagline?: string;
      fullDescription?: string;
      keyFeatures?: string[];
    };

    // Validate all required fields present
    if (!generated.headline || !generated.tagline || !generated.fullDescription || !Array.isArray(generated.keyFeatures)) {
      return NextResponse.json({ error: 'Generated content was incomplete' }, { status: 500 });
    }

    // Return with platform-controlled disclaimer (never model-generated)
    const response: GenerateTokenPageResponse = {
      headline: generated.headline,
      tagline: generated.tagline,
      fullDescription: generated.fullDescription,
      keyFeatures: generated.keyFeatures,
      riskDisclaimer: PLATFORM_RISK_DISCLAIMER,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate token page content' },
      { status: 500 }
    );
  }
}
