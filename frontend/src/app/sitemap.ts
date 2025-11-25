/**
 * Sitemap Generation
 *
 * Generates dynamic sitemap for search engine optimization
 * Next.js automatically serves this at /sitemap.xml
 */

import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://arcmarket.io';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/explore`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/studio`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // In production, you would fetch collections and NFTs from your API
  // and add them to the sitemap dynamically
  // Example:
  // const collections = await fetchCollections();
  // const collectionPages = collections.map(collection => ({
  //   url: `${BASE_URL}/collection/${collection.address}`,
  //   lastModified: new Date(collection.updatedAt),
  //   changeFrequency: 'daily' as const,
  //   priority: 0.8,
  // }));

  return staticPages;
}
