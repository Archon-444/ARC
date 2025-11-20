/**
 * OptimizedImage Component
 *
 * Enhanced image component with:
 * - Lazy loading
 * - Blur placeholder (blurhash support)
 * - Fallback handling
 * - Skeleton loader
 * - Error states
 * - Progressive enhancement
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  blurDataURL?: string;
  fallback?: React.ReactNode;
  priority?: boolean;
  sizes?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className,
  blurDataURL,
  fallback,
  priority = false,
  sizes,
  objectFit = 'cover',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reset states when src changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Error/Fallback state
  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900',
          className
        )}
      >
        {fallback || (
          <div className="flex flex-col items-center gap-2 text-neutral-400">
            <ImageOff className="h-8 w-8" />
            <span className="text-xs">Image unavailable</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden bg-neutral-100 dark:bg-neutral-800', className)}>
      {/* Loading skeleton */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-neutral-200 dark:bg-neutral-700"
        >
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </motion.div>
      )}

      {/* Image */}
      {fill ? (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn('transition-opacity duration-300', isLoading ? 'opacity-0' : 'opacity-100')}
          style={{ objectFit }}
          onLoad={handleLoad}
          onError={handleError}
          placeholder={blurDataURL ? 'blur' : undefined}
          blurDataURL={blurDataURL}
          priority={priority}
          sizes={sizes}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width!}
          height={height!}
          className={cn('transition-opacity duration-300', isLoading ? 'opacity-0' : 'opacity-100')}
          style={{ objectFit }}
          onLoad={handleLoad}
          onError={handleError}
          placeholder={blurDataURL ? 'blur' : undefined}
          blurDataURL={blurDataURL}
          priority={priority}
          sizes={sizes}
        />
      )}
    </div>
  );
}

/**
 * Avatar Image Component
 * Specialized for user avatars with initials fallback
 */
export interface AvatarImageProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackInitials?: string;
}

const SIZE_CONFIG = {
  sm: { container: 'h-8 w-8', text: 'text-xs' },
  md: { container: 'h-10 w-10', text: 'text-sm' },
  lg: { container: 'h-12 w-12', text: 'text-base' },
  xl: { container: 'h-16 w-16', text: 'text-lg' },
};

export function AvatarImage({
  src,
  alt,
  size = 'md',
  className,
  fallbackInitials,
}: AvatarImageProps) {
  const [hasError, setHasError] = useState(false);
  const config = SIZE_CONFIG[size];

  // Generate initials from alt text if not provided
  const initials =
    fallbackInitials ||
    alt
      .split(' ')
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 font-semibold text-white',
          config.container,
          config.text,
          className
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-full', config.container, className)}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setHasError(true)}
        sizes="(max-width: 64px) 100vw, 64px"
      />
    </div>
  );
}

/**
 * NFT Image Component
 * Specialized for NFT display with aspect ratio preservation
 */
export interface NFTImageProps {
  src: string;
  alt: string;
  tokenId?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
  showPlaceholder?: boolean;
}

export function NFTImage({
  src,
  alt,
  tokenId,
  className,
  aspectRatio = 'square',
  showPlaceholder = true,
}: NFTImageProps) {
  const [hasError, setHasError] = useState(false);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
  };

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900',
          aspectClasses[aspectRatio],
          className
        )}
      >
        {showPlaceholder && tokenId && (
          <span className="text-4xl font-bold text-neutral-400">#{tokenId}</span>
        )}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      className={cn(aspectClasses[aspectRatio], className)}
      fallback={
        showPlaceholder && tokenId ? (
          <span className="text-4xl font-bold text-neutral-400">#{tokenId}</span>
        ) : undefined
      }
      onError={() => setHasError(true)}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  );
}
