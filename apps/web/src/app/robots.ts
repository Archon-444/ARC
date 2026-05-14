/**
 * Robots.txt Generation
 *
 * Controls search engine crawling behavior
 * Next.js automatically serves this at /robots.txt
 */

import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://arcmarket.io';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/private/',
          '/_next/',
          '/admin/',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/', // Disallow AI training crawlers
      },
      {
        userAgent: 'CCBot',
        disallow: '/', // Disallow AI training crawlers
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
