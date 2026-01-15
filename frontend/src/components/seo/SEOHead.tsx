/**
 * SEO Head Component
 *
 * Reusable component for managing meta tags, Open Graph, and structured data
 */

import Head from 'next/head';

interface SEOHeadProps {
    title: string;
    description: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'product';
    noindex?: boolean;
    structuredData?: object;
}

export function SEOHead({
    title,
    description,
    image = '/images/og-default.png',
    url,
    type = 'website',
    noindex = false,
    structuredData,
}: SEOHeadProps) {
    const siteName = 'ARC NFT Marketplace';
    const fullTitle = `${title} | ${siteName}`;
    const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    return (
        <Head>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {noindex && <meta name="robots" content="noindex,nofollow" />}

            {/* Canonical URL */}
            {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

            {/* Open Graph */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
            <meta property="og:site_name" content={siteName} />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Structured Data (JSON-LD) */}
            {structuredData && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
                />
            )}
        </Head>
    );
}

/**
 * Generate Product structured data for NFTs
 */
export function generateNFTStructuredData(nft: {
    name: string;
    description: string;
    image: string;
    price?: string;
    collection: string;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: nft.name,
        description: nft.description,
        image: nft.image,
        brand: {
            '@type': 'Brand',
            name: nft.collection,
        },
        ...(nft.price && {
            offers: {
                '@type': 'Offer',
                price: nft.price,
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
            },
        }),
    };
}

/**
 * Generate Organization structured data
 */
export function generateOrganizationStructuredData() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'ARC NFT Marketplace',
        url: 'https://arc-marketplace.com',
        logo: 'https://arc-marketplace.com/logo.png',
        sameAs: [
            'https://twitter.com/arc_marketplace',
            'https://discord.gg/arc',
        ],
    };
}
