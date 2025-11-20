/**
 * PullToRefresh Component
 *
 * Mobile-friendly pull-to-refresh gesture
 * Provides tactile feedback and smooth animations
 */

'use client';

import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  className,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const y = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const opacity = useTransform(y, [0, threshold], [0, 1]);
  const rotate = useTransform(y, [0, threshold], [0, 360]);
  const scale = useTransform(y, [0, threshold / 2, threshold], [0.5, 0.8, 1]);

  const handleDragEnd = async (_: any, info: PanInfo) => {
    if (info.offset.y > threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    y.set(0);
  };

  const canDrag = () => {
    if (isRefreshing) return false;

    // Only allow drag when at top of page
    if (containerRef.current) {
      return containerRef.current.scrollTop === 0;
    }
    return window.scrollY === 0;
  };

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      {/* Pull indicator */}
      <div className="absolute left-0 right-0 top-0 z-10 flex justify-center pt-4">
        <motion.div
          style={{ opacity, scale }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg"
        >
          <motion.div style={{ rotate }}>
            <RefreshCw className={`h-6 w-6 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.div>
        </motion.div>
      </div>

      {/* Content */}
      <motion.div
        drag={canDrag() ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.5, bottom: 0 }}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className={isRefreshing ? 'pointer-events-none' : ''}
      >
        {children}
      </motion.div>

      {/* Loading overlay */}
      {isRefreshing && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm dark:bg-black/50">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      )}
    </div>
  );
}
