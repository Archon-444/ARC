/**
 * Web Vitals Monitoring
 *
 * Tracks Core Web Vitals metrics for performance monitoring:
 * - LCP (Largest Contentful Paint)
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 * - INP (Interaction to Next Paint) - replaced FID in web-vitals v4
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

export type WebVitalsMetric = {
  name: 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
};

// Thresholds for Web Vitals ratings
const thresholds = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  INP: { good: 200, poor: 500 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = thresholds[name as keyof typeof thresholds];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

type ReportCallback = (metric: WebVitalsMetric) => void;

/**
 * Reports Web Vitals metrics to a callback function
 */
export function reportWebVitals(onReport: ReportCallback): void {
  const handleMetric = (metric: Metric) => {
    const webVitalsMetric: WebVitalsMetric = {
      name: metric.name as WebVitalsMetric['name'],
      value: metric.value,
      rating: getRating(metric.name, metric.value),
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType || 'navigate',
    };
    onReport(webVitalsMetric);
  };

  onCLS(handleMetric);
  onFCP(handleMetric);
  onINP(handleMetric);
  onLCP(handleMetric);
  onTTFB(handleMetric);
}

/**
 * Log Web Vitals to console (development)
 */
export function logWebVitals(): void {
  reportWebVitals((metric) => {
    const color = metric.rating === 'good'
      ? 'green'
      : metric.rating === 'needs-improvement'
        ? 'orange'
        : 'red';

    console.log(
      `%c[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
      `color: ${color}; font-weight: bold;`
    );
  });
}

/**
 * Send Web Vitals to analytics endpoint
 */
export function sendWebVitalsToAnalytics(endpoint?: string): void {
  const analyticsEndpoint = endpoint || '/api/analytics/vitals';

  reportWebVitals(async (metric) => {
    try {
      // Only send in production
      if (process.env.NODE_ENV !== 'production') {
        return;
      }

      await fetch(analyticsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...metric,
          url: window.location.href,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
        }),
        keepalive: true, // Ensure the request completes even if page unloads
      });
    } catch (error) {
      // Silently fail - don't impact user experience
      console.debug('[Web Vitals] Failed to send metrics:', error);
    }
  });
}

/**
 * Get a summary of current performance
 */
export function getPerformanceSummary(): {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number | null;
  resourceCount: number;
} {
  const timing = performance.timing;
  const paintEntries = performance.getEntriesByType('paint');
  const firstPaint = paintEntries.find(e => e.name === 'first-paint');

  return {
    loadTime: timing.loadEventEnd - timing.navigationStart,
    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
    firstPaint: firstPaint?.startTime || null,
    resourceCount: performance.getEntriesByType('resource').length,
  };
}
