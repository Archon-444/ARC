/**
 * SEO Component
 *
 * Manages meta tags, Open Graph, Twitter Cards, and structured data
 * For optimal SEO and social media sharing
 */

import Head from 'next/head';

export interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  // NFT-specific
  nftData?: {
    name: string;
    description: string;
    image: string;
    price?: string;
    currency?: string;
    creator?: string;
    collection?: string;
  };
}

export function SEO({
  title,
  description,
  image = '/images/og-default.jpg',
  url,
  type = 'website',
  noindex = false,
  keywords = [],
  author,
  publishedTime,
  modifiedTime,
  nftData,
}: SEOProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://arcmarket.io';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

  // Default keywords
  const defaultKeywords = [
    'NFT',
    'NFT marketplace',
    'Arc blockchain',
    'USDC',
    'digital art',
    'crypto',
    'blockchain',
  ];
  const allKeywords = [...defaultKeywords, ...keywords];

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={allKeywords.join(', ')} />}
      {author && <meta name="author" content={author} />}

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content="ArcMarket" />

      {/* Article metadata */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullImage} />
      {/* Add your Twitter handle */}
      <meta property="twitter:site" content="@arcmarket" />
      <meta property="twitter:creator" content="@arcmarket" />

      {/* Structured Data for NFTs */}
      {nftData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: nftData.name,
              description: nftData.description,
              image: nftData.image,
              ...(nftData.price && {
                offers: {
                  '@type': 'Offer',
                  price: nftData.price,
                  priceCurrency: nftData.currency || 'USDC',
                  availability: 'https://schema.org/InStock',
                },
              }),
              ...(nftData.creator && {
                creator: {
                  '@type': 'Person',
                  name: nftData.creator,
                },
              }),
              ...(nftData.collection && {
                isPartOf: {
                  '@type': 'Collection',
                  name: nftData.collection,
                },
              }),
            }),
          }}
        />
      )}
    </Head>
  );
}

/**
 * Collection Page SEO
 */
export interface CollectionSEOProps {
  name: string;
  description: string;
  image?: string;
  slug: string;
  floorPrice?: string;
  totalVolume?: string;
  itemCount?: number;
}

export function CollectionSEO({
  name,
  description,
  image,
  slug,
  floorPrice,
  totalVolume,
  itemCount,
}: CollectionSEOProps) {
  const title = `${name} - NFT Collection | ArcMarket`;
  const enhancedDescription = `${description} ${floorPrice ? `Floor: ${floorPrice} USDC. ` : ''}${totalVolume ? `Volume: ${totalVolume} USDC. ` : ''}${itemCount ? `${itemCount} items.` : ''}`;

  return (
    <>
      <SEO
        title={title}
        description={enhancedDescription}
        image={image}
        url={`/collection/${slug}`}
        type="website"
        keywords={[name, 'collection', 'NFT collection']}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: title,
            description: enhancedDescription,
            url: `${process.env.NEXT_PUBLIC_SITE_URL}/collection/${slug}`,
            ...(image && { image }),
          }),
        }}
      />
    </>
  );
}

/**
 * NFT Page SEO
 */
export interface NFTSEOProps {
  name: string;
  description: string;
  image: string;
  collectionName: string;
  tokenId: string;
  owner: string;
  price?: string;
  creator?: string;
}

export function NFTSEO({
  name,
  description,
  image,
  collectionName,
  tokenId,
  owner,
  price,
  creator,
}: NFTSEOProps) {
  const title = `${name} - ${collectionName} | ArcMarket`;
  const enhancedDescription = `${description} ${price ? `Price: ${price} USDC. ` : ''}Owner: ${owner}`;

  return (
    <SEO
      title={title}
      description={enhancedDescription}
      image={image}
      url={`/nft/${tokenId}`}
      type="product"
      keywords={[name, collectionName, 'NFT', 'digital art']}
      nftData={{
        name,
        description,
        image,
        price,
        currency: 'USDC',
        creator,
        collection: collectionName,
      }}
    />
  );
}

/**
 * Profile Page SEO
 */
export interface ProfileSEOProps {
  username?: string;
  address: string;
  bio?: string;
  avatar?: string;
  itemCount?: number;
}

export function ProfileSEO({ username, address, bio, avatar, itemCount }: ProfileSEOProps) {
  const displayName = username || address.slice(0, 8);
  const title = `${displayName} - Profile | ArcMarket`;
  const description =
    bio || `View ${displayName}'s NFT collection on ArcMarket. ${itemCount ? `${itemCount} items.` : ''}`;

  return (
    <>
      <SEO
        title={title}
        description={description}
        image={avatar}
        url={`/profile/${address}`}
        type="website"
        keywords={[displayName, 'profile', 'NFT collector']}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ProfilePage',
            name: displayName,
            ...(bio && { description: bio }),
            ...(avatar && { image: avatar }),
          }),
        }}
      />
    </>
  );
}
