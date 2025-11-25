/**
 * Web Vitals Reporter Component
 *
 * Initializes Web Vitals monitoring when mounted
 * Logs metrics in development, sends to analytics in production
 */

'use client';

import { useEffect } from 'react';
import { logWebVitals, sendWebVitalsToAnalytics } from '@/lib/web-vitals';

interface WebVitalsReporterProps {
  analyticsEndpoint?: string;
}

export function WebVitalsReporter({ analyticsEndpoint }: WebVitalsReporterProps) {
  useEffect(() => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logWebVitals();
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      sendWebVitalsToAnalytics(analyticsEndpoint);
    }
  }, [analyticsEndpoint]);

  // This component doesn't render anything
  return null;
}

export default WebVitalsReporter;
