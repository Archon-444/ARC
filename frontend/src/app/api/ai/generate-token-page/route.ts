import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CURVE_TYPE_NAMES } from '@/lib/contracts';

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

    // Call Claude API
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `You are a professional Web3 token launch copywriter for the ARC DeFi platform. Generate honest, professional token descriptions that help investors understand the token's purpose and mechanics. Never use hype language, never promise returns, and always maintain a factual tone. Your output must be valid JSON with these exact fields:
{
  "headline": "A short, compelling headline (max 10 words)",
  "tagline": "A one-sentence value proposition",
  "fullDescription": "A 2-3 paragraph professional description covering the token's purpose, mechanics, and use case",
  "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"],
  "riskDisclaimer": "A brief, honest risk disclaimer"
}`,
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

Respond with ONLY the JSON object, no markdown formatting.`,
        },
      ],
    });

    // Extract text content
    const textBlock = message.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
    }

    // Parse the JSON response
    const generated = JSON.parse(textBlock.text);

    // Validate the response has expected fields
    if (!generated.headline || !generated.fullDescription) {
      return NextResponse.json({ error: 'Generated content was incomplete' }, { status: 500 });
    }

    return NextResponse.json(generated);
  } catch (error: any) {
    console.error('AI generation error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'AI generated invalid response format' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate token page content' },
      { status: 500 }
    );
  }
}
