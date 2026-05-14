/**
 * SEO Utilities
 *
 * Dynamic meta tags and OpenGraph configuration
 */

import type { Metadata } from 'next';

interface SEOConfig {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://arcmarket.io';
const SITE_NAME = 'ARC Marketplace';
const DEFAULT_DESCRIPTION =
  'Buy, sell, and discover NFTs on the Arc blockchain. Trade with USDC, instant finality, and low fees.';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description = DEFAULT_DESCRIPTION,
    image = DEFAULT_IMAGE,
    url,
    type = 'website',
    noindex = false,
  } = config;

  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = url ? `${BASE_URL}${url}` : BASE_URL;

  return {
    title: fullTitle,
    description,
    applicationName: SITE_NAME,
    authors: [{ name: 'ARC Marketplace Team' }],
    keywords: [
      'NFT',
      'marketplace',
      'Arc blockchain',
      'USDC',
      'crypto',
      'digital art',
      'collectibles',
      'trading',
    ],
    robots: noindex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    openGraph: {
      type,
      locale: 'en_US',
      url: canonicalUrl,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
      creator: '@arcmarket',
      site: '@arcmarket',
    },
    alternates: {
      canonical: canonicalUrl,
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  };
}

/**
 * Generate metadata for NFT detail pages
 */
export function generateNFTMetadata(nft: {
  name: string;
  description?: string;
  image: string;
  collection: string;
  tokenId: string;
  contractAddress: string;
}): Metadata {
  return generateMetadata({
    title: `${nft.name} - ${nft.collection}`,
    description: nft.description || `${nft.name} from ${nft.collection}. View details and purchase on ARC Marketplace.`,
    image: nft.image,
    url: `/nft/${nft.contractAddress}/${nft.tokenId}`,
    type: 'article',
  });
}

/**
 * Generate metadata for collection pages
 */
export function generateCollectionMetadata(collection: {
  name: string;
  description?: string;
  banner?: string;
  floorPrice?: string;
  totalVolume?: string;
  itemCount?: number;
}): Metadata {
  const description = collection.description
    ? `${collection.description}. Floor: ${collection.floorPrice || 'N/A'} USDC. ${collection.itemCount || 0} items.`
    : `Explore ${collection.name} on ARC Marketplace. Floor: ${collection.floorPrice || 'N/A'} USDC.`;

  return generateMetadata({
    title: collection.name,
    description,
    image: collection.banner,
  });
}

/**
 * Generate JSON-LD structured data for NFTs
 */
export function generateNFTJsonLd(nft: {
  name: string;
  description?: string;
  image: string;
  price?: string;
  creator?: string;
  owner?: string;
  contractAddress: string;
  tokenId: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: nft.name,
    description: nft.description,
    image: nft.image,
    offers: nft.price
      ? {
          '@type': 'Offer',
          price: nft.price,
          priceCurrency: 'USDC',
          availability: 'https://schema.org/InStock',
        }
      : undefined,
    brand: {
      '@type': 'Brand',
      name: 'ARC Marketplace',
    },
  };
}

/**
 * Generate JSON-LD structured data for the homepage
 */
export function generateHomeJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}
