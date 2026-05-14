/**
 * LazyImage Component
 *
 * Optimized image loading with blur placeholder and lazy loading
 */

'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface LazyImageProps extends Omit<ImageProps, 'placeholder' | 'blurDataURL'> {
    fallbackSrc?: string;
    showShimmer?: boolean;
}

export function LazyImage({
    src,
    alt,
    fallbackSrc = '/images/nft-placeholder.png',
    showShimmer = true,
    className,
    ...props
}: LazyImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    return (
        <div className={cn('relative overflow-hidden', className)}>
            <Image
                src={error ? fallbackSrc : src}
                alt={alt}
                onLoadingComplete={() => setIsLoading(false)}
                onError={() => {
                    setError(true);
                    setIsLoading(false);
                }}
                className={cn(
                    'duration-700 ease-in-out',
                    isLoading && showShimmer ? 'scale-105 blur-lg grayscale' : 'scale-100 blur-0 grayscale-0',
                    className
                )}
                {...props}
            />

            {/* Loading shimmer */}
            {isLoading && showShimmer && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            )}
        </div>
    );
}
