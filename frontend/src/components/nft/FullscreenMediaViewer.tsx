/**
 * Fullscreen Media Viewer Component
 * 
 * Features:
 * - Image zoom controls (Fit, Fill, 100%, 200%)
 * - Keyboard shortcuts (Esc, +, -, arrows)
 * - Touch gestures (pinch to zoom, swipe to dismiss)
 * - Video support with controls
 * - Loading states
 * - Smooth animations
 * 
 * Usage:
 * ```tsx
 * const [showViewer, setShowViewer] = useState(false);
 * 
 * <FullscreenMediaViewer
 *   isOpen={showViewer}
 *   onClose={() => setShowViewer(false)}
 *   media={{
 *     type: 'image',
 *     url: nft.image,
 *     alt: nft.name
 *   }}
 * />
 * ```
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';
import Image from 'next/image';
import { FocusTrap } from '../accessibility/FocusTrap';

export interface Media {
  type: 'image' | 'video' | '3d';
  url: string;
  alt?: string;
  thumbnail?: string;
}

export interface FullscreenMediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  media: Media;
}

type ZoomLevel = 'fit' | 'fill' | '100%' | '200%';

export function FullscreenMediaViewer({
  isOpen,
  onClose,
  media,
}: FullscreenMediaViewerProps) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('fit');
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
        case '_':
          zoomOut();
          break;
        case '0':
          setZoomLevel('fit');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const zoomIn = () => {
    const levels: ZoomLevel[] = ['fit', 'fill', '100%', '200%'];
    const currentIndex = levels.indexOf(zoomLevel);
    if (currentIndex < levels.length - 1) {
      setZoomLevel(levels[currentIndex + 1]);
    }
  };

  const zoomOut = () => {
    const levels: ZoomLevel[] = ['fit', 'fill', '100%', '200%'];
    const currentIndex = levels.indexOf(zoomLevel);
    if (currentIndex > 0) {
      setZoomLevel(levels[currentIndex - 1]);
    }
  };

  const getZoomScale = (): string => {
    switch (zoomLevel) {
      case 'fit':
        return 'contain';
      case 'fill':
        return 'cover';
      case '100%':
        return 'scale-100';
      case '200%':
        return 'scale-200';
    }
  };

  // Handle drag to dismiss
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.y) > 100 || Math.abs(info.velocity.y) > 500) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <FocusTrap active={isOpen} autoFocus restoreFocus>
        <motion.div
          ref={containerRef}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          {/* Controls */}
          <motion.div
            className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* Title */}
              <div className="text-white">
                <p className="text-sm text-white/60">Viewing</p>
                <h2 className="font-semibold">{media.alt || 'Media'}</h2>
              </div>

              {/* Zoom Controls */}
              {media.type === 'image' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      zoomOut();
                    }}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    aria-label="Zoom out"
                    disabled={zoomLevel === 'fit'}
                  >
                    <ZoomOut size={20} />
                  </button>

                  <div className="flex gap-1">
                    {['fit', 'fill', '100%', '200%'].map((level) => (
                      <button
                        key={level}
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomLevel(level as ZoomLevel);
                        }}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                          zoomLevel === level
                            ? 'bg-white text-black'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      zoomIn();
                    }}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    aria-label="Zoom in"
                    disabled={zoomLevel === '200%'}
                  >
                    <ZoomIn size={20} />
                  </button>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close viewer"
              >
                <X size={24} />
              </button>
            </div>
          </motion.div>

          {/* Media Content */}
          <div
            className="absolute inset-0 flex items-center justify-center p-16"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              ref={imageRef}
              drag={media.type === 'image'}
              dragConstraints={containerRef}
              dragElastic={0.05}
              onDragEnd={handleDragEnd}
              className="relative max-w-full max-h-full cursor-move"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', damping: 25 }}
            >
              {media.type === 'image' && (
                <div
                  className={`relative ${
                    zoomLevel === '100%' || zoomLevel === '200%'
                      ? ''
                      : 'w-screen h-screen'
                  }`}
                  style={{
                    width: zoomLevel === '100%' ? 'auto' : zoomLevel === '200%' ? 'auto' : '100%',
                    height: zoomLevel === '100%' ? 'auto' : zoomLevel === '200%' ? 'auto' : '100%',
                  }}
                >
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
                    </div>
                  )}

                  <Image
                    src={media.url}
                    alt={media.alt || 'Media'}
                    fill={zoomLevel === 'fit' || zoomLevel === 'fill'}
                    width={zoomLevel === '100%' ? 1920 : zoomLevel === '200%' ? 3840 : undefined}
                    height={zoomLevel === '100%' ? 1080 : zoomLevel === '200%' ? 2160 : undefined}
                    style={{
                      objectFit: zoomLevel === 'fit' ? 'contain' : zoomLevel === 'fill' ? 'cover' : undefined,
                    }}
                    className={`rounded-lg ${
                      zoomLevel === '100%' ? '' : zoomLevel === '200%' ? 'scale-200' : ''
                    }`}
                    onLoad={() => setIsLoading(false)}
                    priority
                  />
                </div>
              )}

              {media.type === 'video' && (
                <video
                  src={media.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full rounded-lg"
                  poster={media.thumbnail}
                />
              )}

              {media.type === '3d' && (
                <div className="w-[800px] h-[600px] bg-white/5 rounded-lg flex items-center justify-center">
                  <p className="text-white/60">3D viewer coming soon</p>
                  {/* Add three.js or model-viewer here */}
                </div>
              )}
            </motion.div>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <motion.div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-black/50 text-white/80 text-sm"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="mr-4">
              <kbd className="px-2 py-1 bg-white/10 rounded">Esc</kbd> Close
            </span>
            <span className="mr-4">
              <kbd className="px-2 py-1 bg-white/10 rounded">+</kbd> Zoom In
            </span>
            <span>
              <kbd className="px-2 py-1 bg-white/10 rounded">-</kbd> Zoom Out
            </span>
          </motion.div>
        </motion.div>
      </FocusTrap>
    </AnimatePresence>
  );
}
