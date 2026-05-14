import { NextRequest, NextResponse } from 'next/server';

/**
 * Legacy quarantine middleware (W11).
 *
 * Routes that backed the original NFT marketplace + token launcher
 * are quarantined here. They redirect to `/legacy` with a 308
 * (permanent) so any cached client / bookmark / share link surfaces
 * an explainer instead of dead-ending into the frozen surface.
 *
 * The actual page files under app/{cart,collection,collections,explore,
 * launch,nft,rewards,token}/ stay in tree as `legacy-primitives/` (next
 * follow-up commit; the codemod is the highest-blast-radius change in
 * the 90-day plan and lands as its own pass). Until the codemod ships
 * we intercept at the edge — keeps the routing honest without moving
 * a single source file.
 *
 * What does NOT redirect: surfaces that survive the pivot
 *   /, /trust/[target], /passport/[address], /agents, /docs,
 *   /legacy, /api/*, /profile/*, /settings, /search, /stats, /studio,
 *   /about, /contact, /privacy, /terms, /offline,
 *   anything under _next/, favicon, robots.txt, sitemap.xml
 *
 * Why 308 and not 410: a 410 strips the URL from the user's hands —
 * they hit a wall with no explanation. A 308 to /legacy preserves
 * the experience: the page explains what changed, where the contracts
 * still live on Arc testnet, and what the new surface looks like.
 * Browsers and crawlers both honor 308 as permanent.
 */

const LEGACY_PREFIXES = [
  '/cart',
  '/collection',
  '/collections',
  '/explore',
  '/launch',
  '/nft',
  '/rewards',
  '/token',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  for (const prefix of LEGACY_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      const url = request.nextUrl.clone();
      url.pathname = '/legacy';
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url, 308);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run the middleware on routes that could match a legacy prefix.
  // Skip _next, static assets, and api routes — the latter are still
  // alive (some serve the new surface; the old token routes return
  // their own 410 in a follow-up).
  matcher: [
    '/cart/:path*',
    '/collection/:path*',
    '/collections/:path*',
    '/explore/:path*',
    '/launch/:path*',
    '/nft/:path*',
    '/rewards/:path*',
    '/token/:path*',
  ],
};
