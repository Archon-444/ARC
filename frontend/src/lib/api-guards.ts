import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

type RateLimitOptions = {
  limit: number;
  windowMs: number;
  identifier?: string | null;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function normalizeIdentifier(value?: string | null) {
  if (!value) return null;
  return value.toLowerCase();
}

function getRequestIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

export async function requireSessionUser(expectedUserId?: string | null) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const sessionUserId =
    (session.user as any).userId ||
    (session.user as any).id ||
    session.user.email ||
    null;

  if (expectedUserId) {
    const normalizedExpected = normalizeIdentifier(expectedUserId);
    const normalizedSession = normalizeIdentifier(sessionUserId);

    if (!normalizedSession || normalizedSession !== normalizedExpected) {
      return {
        error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      };
    }
  }

  return { session, sessionUserId };
}

export function enforceRateLimit(request: NextRequest, options: RateLimitOptions) {
  const ip = getRequestIp(request);
  const identifier = normalizeIdentifier(options.identifier);
  const key = `${request.nextUrl.pathname}:${identifier || 'anon'}:${ip}`;
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.limit - 1, resetAt: now + options.windowMs };
  }

  if (existing.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);

  return {
    allowed: true,
    remaining: Math.max(options.limit - existing.count, 0),
    resetAt: existing.resetAt,
  };
}

export function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.max(Math.ceil((resetAt - Date.now()) / 1000), 1);
  return NextResponse.json(
    { error: 'Too many requests' },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}
