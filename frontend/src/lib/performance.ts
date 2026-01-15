/**
 * Performance Monitoring Utilities
 *
 * Tracks Core Web Vitals and custom metrics
 * Helps identify performance bottlenecks
 * Includes React hooks for performance optimization
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
}

export type MetricName = 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';

/**
 * Core Web Vitals thresholds
 */
const THRESHOLDS: Record<MetricName, { good: number; poor: number }> = {
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 }, // First Input Delay
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
  INP: { good: 200, poor: 500 }, // Interaction to Next Paint
};

/**
 * Get rating for a metric value
 */
export function getRating(name: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report metric to analytics
 */
export function reportMetric(metric: PerformanceMetric) {
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_rating: metric.rating,
        metric_delta: metric.delta,
        metric_id: metric.id,
      });
    }

    // Example: Send to custom analytics endpoint
    // fetch('/api/analytics/performance', {
    //   method: 'POST',
    //   body: JSON.stringify(metric),
    //   headers: { 'Content-Type': 'application/json' },
    // });
  }
}

/**
 * Measure page load performance
 */
export function measurePageLoad() {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navigation) {
      const metrics = {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        request: navigation.responseStart - navigation.requestStart,
        response: navigation.responseEnd - navigation.responseStart,
        dom: navigation.domInteractive - navigation.responseEnd,
        load: navigation.loadEventEnd - navigation.loadEventStart,
        total: navigation.loadEventEnd - navigation.fetchStart,
      };

      console.log('[Performance] Page Load Metrics:', metrics);

      // Report total load time
      reportMetric({
        name: 'PageLoad',
        value: metrics.total,
        rating: getRating('LCP', metrics.total),
      });
    }
  });
}

/**
 * Measure component render time
 */
export function measureRender(componentName: string) {
  if (typeof window === 'undefined') return () => {};

  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;
    console.log(`[Performance] ${componentName} rendered in ${duration.toFixed(2)}ms`);

    if (duration > 16) {
      // Slower than 60fps
      console.warn(`[Performance] ${componentName} render is slow (>16ms)`);
    }
  };
}

/**
 * Measure async operation
 */
export async function measureAsync<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await operation();
    const duration = performance.now() - startTime;

    console.log(`[Performance] ${operationName} completed in ${duration.toFixed(2)}ms`);

    reportMetric({
      name: operationName,
      value: duration,
      rating: duration < 1000 ? 'good' : duration < 3000 ? 'needs-improvement' : 'poor',
    });

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`[Performance] ${operationName} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Track image loading performance
 */
export function trackImageLoad(src: string, onLoad?: () => void, onError?: () => void) {
  const startTime = performance.now();

  const img = new Image();

  img.onload = () => {
    const duration = performance.now() - startTime;
    console.log(`[Performance] Image loaded in ${duration.toFixed(2)}ms:`, src);
    onLoad?.();
  };

  img.onerror = () => {
    const duration = performance.now() - startTime;
    console.error(`[Performance] Image failed to load after ${duration.toFixed(2)}ms:`, src);
    onError?.();
  };

  img.src = src;

  return img;
}

/**
 * Monitor bundle size
 */
export function logBundleSize() {
  if (typeof window === 'undefined') return;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const scripts = resources.filter((r) => r.initiatorType === 'script');
  const styles = resources.filter((r) => r.initiatorType === 'link');

  const totalScriptSize = scripts.reduce((sum, s) => sum + (s.transferSize || 0), 0);
  const totalStyleSize = styles.reduce((sum, s) => sum + (s.transferSize || 0), 0);

  console.log('[Performance] Bundle Sizes:', {
    scripts: `${(totalScriptSize / 1024).toFixed(2)} KB`,
    styles: `${(totalStyleSize / 1024).toFixed(2)} KB`,
    total: `${((totalScriptSize + totalStyleSize) / 1024).toFixed(2)} KB`,
  });

  // Warn if bundle is too large
  if (totalScriptSize > 300 * 1024) {
    // > 300KB
    console.warn('[Performance] JavaScript bundle is large (>300KB). Consider code splitting.');
  }
}

/**
 * Track memory usage
 */
export function logMemoryUsage() {
  if (typeof window === 'undefined') return;

  const memory = (performance as any).memory;
  if (!memory) {
    console.log('[Performance] Memory API not available');
    return;
  }

  const used = memory.usedJSHeapSize / 1048576; // Convert to MB
  const total = memory.totalJSHeapSize / 1048576;
  const limit = memory.jsHeapSizeLimit / 1048576;

  console.log('[Performance] Memory Usage:', {
    used: `${used.toFixed(2)} MB`,
    total: `${total.toFixed(2)} MB`,
    limit: `${limit.toFixed(2)} MB`,
    percentage: `${((used / limit) * 100).toFixed(1)}%`,
  });

  // Warn if memory usage is high
  if (used / limit > 0.9) {
    console.warn('[Performance] High memory usage (>90% of limit)');
  }
}

/**
 * Create a performance observer for Core Web Vitals
 */
export function observeCoreWebVitals() {
  if (typeof window === 'undefined') return;

  // Observe LCP
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as any;

    reportMetric({
      name: 'LCP',
      value: lastEntry.renderTime || lastEntry.loadTime,
      rating: getRating('LCP', lastEntry.renderTime || lastEntry.loadTime),
    });
  });

  try {
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    console.warn('[Performance] LCP observation not supported');
  }

  // Observe CLS
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
      }
    }

    reportMetric({
      name: 'CLS',
      value: clsValue,
      rating: getRating('CLS', clsValue),
    });
  });

  try {
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    console.warn('[Performance] CLS observation not supported');
  }

  // Observe FID
  const fidObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const firstInput = entries[0] as any;

    reportMetric({
      name: 'FID',
      value: firstInput.processingStart - firstInput.startTime,
      rating: getRating('FID', firstInput.processingStart - firstInput.startTime),
    });
  });

  try {
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    console.warn('[Performance] FID observation not supported');
  }
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // Observe Core Web Vitals
  observeCoreWebVitals();

  // Log bundle size and memory on load
  window.addEventListener('load', () => {
    setTimeout(() => {
      logBundleSize();
      logMemoryUsage();
    }, 1000);
  });

  // Log memory periodically in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(logMemoryUsage, 30000); // Every 30 seconds
  }
}

/**
 * ============================================
 * REACT HOOKS FOR PERFORMANCE OPTIMIZATION
 * ============================================
 */

/**
 * Debounce Hook
 *
 * Delays function execution until after a specified delay
 * Perfect for search inputs, resize handlers, etc.
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Throttle Hook
 *
 * Limits function execution to once per specified delay
 * Perfect for scroll handlers, mouse move events, etc.
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRan = useRef(Date.now());

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRan.current >= delay) {
        callback(...args);
        lastRan.current = Date.now();
      }
    },
    [callback, delay]
  ) as T;

  return throttledCallback;
}

/**
 * Intersection Observer Hook
 *
 * Detects when an element enters the viewport
 * Perfect for lazy loading images, infinite scroll, analytics
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options, hasIntersected]);

  return { isIntersecting, hasIntersected };
}

/**
 * Prefetch Hook
 *
 * Prefetches resources on hover for faster navigation
 * Perfect for link prefetching, image preloading
 */
export function usePrefetch() {
  const prefetchedUrls = useRef(new Set<string>());

  const prefetch = useCallback((url: string) => {
    if (prefetchedUrls.current.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'document';
    document.head.appendChild(link);

    prefetchedUrls.current.add(url);
  }, []);

  const prefetchImage = useCallback((src: string) => {
    if (prefetchedUrls.current.has(src)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = src;
    link.as = 'image';
    document.head.appendChild(link);

    prefetchedUrls.current.add(src);
  }, []);

  return { prefetch, prefetchImage };
}

/**
 * Idle Callback Hook
 *
 * Executes callback when browser is idle
 * Perfect for non-critical work like analytics, preloading
 */
export function useIdleCallback(callback: () => void, deps: React.DependencyList = []) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleIdle = () => {
      callback();
    };

    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(handleIdle);
      return () => window.cancelIdleCallback(id);
    } else {
      // Fallback for browsers without requestIdleCallback
      const id = setTimeout(handleIdle, 1);
      return () => clearTimeout(id);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Media Query Hook
 *
 * Detects media query changes
 * Perfect for responsive behavior
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

/**
 * Page Visibility Hook
 *
 * Detects when page becomes visible/hidden
 * Perfect for pausing/resuming work
 */
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

/**
 * Network Status Hook
 *
 * Detects online/offline status
 * Perfect for handling network errors
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial state
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
