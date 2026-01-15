/**
 * MediaViewer Component
 *
 * Advanced media viewer for NFTs with:
 * - Zoom functionality
 * - Fullscreen mode
 * - 3D model support (future)
 * - Video/audio playback
 */

'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { X, ZoomIn, ZoomOut, Maximize2, Minimize2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaViewerProps {
  src: string;
  alt: string;
  type?: 'image' | 'video' | 'audio' | '3d';
  className?: string;
  onClose?: () => void;
  allowDownload?: boolean;
}

export function MediaViewer({
  src,
  alt,
  type = 'image',
  className,
  onClose,
  allowDownload = false,
}: MediaViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Failed to enter fullscreen:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error('Failed to exit fullscreen:', err);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = alt || 'nft-image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download:', err);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex items-center justify-center bg-black',
        isFullscreen ? 'h-screen w-screen' : 'h-full w-full',
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Controls */}
      <div className="absolute right-4 top-4 z-10 flex gap-2">
        {/* Zoom Controls */}
        <div className="flex gap-1 rounded-lg bg-black/70 p-1 backdrop-blur-sm">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="rounded p-2 text-white hover:bg-white/20 disabled:opacity-50"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <button
            onClick={handleReset}
            className="min-w-[3rem] rounded px-3 py-2 text-sm font-medium text-white hover:bg-white/20"
            aria-label="Reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            className="rounded p-2 text-white hover:bg-white/20 disabled:opacity-50"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
        </div>

        {/* Download */}
        {allowDownload && (
          <button
            onClick={handleDownload}
            className="rounded-lg bg-black/70 p-2 text-white backdrop-blur-sm hover:bg-white/20"
            aria-label="Download image"
          >
            <Download className="h-5 w-5" />
          </button>
        )}

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="rounded-lg bg-black/70 p-2 text-white backdrop-blur-sm hover:bg-white/20"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5" />
          ) : (
            <Maximize2 className="h-5 w-5" />
          )}
        </button>

        {/* Close */}
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg bg-black/70 p-2 text-white backdrop-blur-sm hover:bg-white/20"
            aria-label="Close viewer"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Media Content */}
      <div
        className="relative transition-transform duration-200"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
          cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
        }}
      >
        {type === 'image' && (
          <Image
            src={src}
            alt={alt}
            width={800}
            height={800}
            className="max-h-[80vh] w-auto object-contain"
            priority
            draggable={false}
          />
        )}

        {type === 'video' && (
          <video
            src={src}
            controls
            className="max-h-[80vh] w-auto"
            playsInline
          >
            Your browser does not support video playback.
          </video>
        )}

        {type === 'audio' && (
          <div className="flex flex-col items-center gap-4 p-8">
            <div className="flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500">
              <svg
                className="h-24 w-24 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
            <audio src={src} controls className="w-full max-w-md">
              Your browser does not support audio playback.
            </audio>
          </div>
        )}

        {type === '3d' && (
          <div className="flex h-96 w-96 items-center justify-center rounded-lg bg-neutral-800 text-white">
            <div className="text-center">
              <p className="text-lg font-semibold">3D Model Viewer</p>
              <p className="text-sm text-neutral-400">Coming Soon</p>
            </div>
          </div>
        )}
      </div>

      {/* Zoom hint */}
      {zoom > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-black/70 px-4 py-2 text-sm text-white backdrop-blur-sm">
          Click and drag to pan
        </div>
      )}
    </div>
  );
}

/**
 * Simplified image viewer for inline use
 */
interface SimpleImageViewerProps {
  src: string;
  alt: string;
  className?: string;
}

export function SimpleImageViewer({ src, alt, className }: SimpleImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className={cn('relative cursor-pointer overflow-hidden rounded-lg', className)}
        onClick={() => setIsOpen(true)}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover transition-transform hover:scale-105"
        />
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black">
          <MediaViewer
            src={src}
            alt={alt}
            onClose={() => setIsOpen(false)}
            allowDownload
          />
        </div>
      )}
    </>
  );
}
