/**
 * Structured Data Components
 *
 * JSON-LD structured data for rich search results
 * Supports Organization, Product (NFT), Collection schemas
 */

import Script from 'next/script';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://arcmarket.io';

/**
 * Organization schema for the marketplace
 */
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ARC Marketplace',
    alternateName: 'ArcMarket',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'Premier NFT marketplace on Circle Arc blockchain with instant USDC settlements',
    sameAs: [
      'https://twitter.com/arcmarketplace',
      'https://discord.gg/arcmarket',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'English',
    },
  };

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Website schema with search action
 */
export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ARC Marketplace',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <Script
      id="website-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface NFTSchemaProps {
  name: string;
  description: string;
  image: string;
  collectionName: string;
  collectionAddress: string;
  tokenId: string;
  price?: string;
  currency?: string;
  seller?: string;
}

/**
 * Product schema for individual NFTs
 */
export function NFTSchema({
  name,
  description,
  image,
  collectionName,
  collectionAddress,
  tokenId,
  price,
  currency = 'USDC',
  seller,
}: NFTSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    brand: {
      '@type': 'Brand',
      name: collectionName,
    },
    url: `${BASE_URL}/nft/${collectionAddress}/${tokenId}`,
    productID: `${collectionAddress}-${tokenId}`,
    category: 'NFT',
    ...(price && {
      offers: {
        '@type': 'Offer',
        price,
        priceCurrency: currency,
        availability: 'https://schema.org/InStock',
        seller: seller
          ? {
              '@type': 'Person',
              name: seller,
            }
          : undefined,
      },
    }),
  };

  return (
    <Script
      id={`nft-schema-${tokenId}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface CollectionSchemaProps {
  name: string;
  description: string;
  image: string;
  address: string;
  totalSupply: number;
  floorPrice?: string;
  currency?: string;
}

/**
 * CollectionPage schema for NFT collections
 */
export function CollectionSchema({
  name,
  description,
  image,
  address,
  totalSupply,
  floorPrice,
  currency = 'USDC',
}: CollectionSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    image,
    url: `${BASE_URL}/collection/${address}`,
    mainEntity: {
      '@type': 'ItemList',
      name,
      description,
      numberOfItems: totalSupply,
      ...(floorPrice && {
        offers: {
          '@type': 'AggregateOffer',
          lowPrice: floorPrice,
          priceCurrency: currency,
          offerCount: totalSupply,
        },
      }),
    },
  };

  return (
    <Script
      id={`collection-schema-${address}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbSchemaProps {
  items: Array<{
    name: string;
    href: string;
  }>;
}

/**
 * BreadcrumbList schema for navigation
 */
export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.href}`,
    })),
  };

  return (
    <Script
      id="breadcrumb-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * FAQ schema for help/support pages
 */
interface FAQSchemaProps {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

export function FAQSchema({ questions }: FAQSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };

  return (
    <Script
      id="faq-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
