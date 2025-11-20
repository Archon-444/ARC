/**
 * Performance Monitoring Utilities
 *
 * Tracks Core Web Vitals and custom metrics
 * Helps identify performance bottlenecks
 */

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
