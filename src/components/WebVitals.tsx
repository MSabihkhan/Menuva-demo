'use client';

import { useEffect, useRef, useCallback } from 'react';

// Web Vitals metrics interface
interface WebVitalsMetrics {
  CLS: number;
  LCP: number;
  FID: number;
  FCP: number;
  TTFB: number;
}

interface WebVitalsOptions {
  onMetric?: (metrics: WebVitalsMetrics) => void;
  reportAllChanges?: boolean;
}

// Cumulative Layout Shift (CLS) measurement
function useCLS(onMetric?: (value: number) => void) {
  const clsRef = useRef(0);
  const entriesRef = useRef<PerformanceObserverEntryList | null>(null);

  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any) {
          if (entry.hadRecentInput) continue;
          clsRef.current += entry.value;
          onMetric?.(clsRef.current);
        }
      });
      
      observer.observe({ type: 'layout-shift', buffered: true });
      entriesRef.current = observer as any;
      
      return () => observer.disconnect();
    } catch (e) {
      // Observer not supported
    }
  }, [onMetric]);
}

// First Input Delay (FID) measurement
function useFID(onMetric?: (value: number) => void) {
  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any) {
          onMetric?.(entry.processingEnd - entry.startTime);
        }
      });
      
      observer.observe({ type: 'first-input', buffered: true });
      return () => observer.disconnect();
    } catch (e) {
      // Observer not supported
    }
  }, [onMetric]);
}

// Largest Contentful Paint (LCP) measurement  
function useLCP(onMetric?: (value: number) => void) {
  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    try {
      let lcpValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any;
        const lastEntry = entries[entries.length - 1];
        if (lastEntry.renderTime > lcpValue) {
          lcpValue = lastEntry.renderTime;
          onMetric?.(lcpValue);
        }
      });
      
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      return () => observer.disconnect();
    } catch (e) {
      // Observer not supported
    }
  }, [onMetric]);
}

// First Contentful Paint (FCP) measurement
function useFCP(onMetric?: (value: number) => void) {
  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any) {
          if (entry.name === 'first-contentful-paint') {
            onMetric?.(entry.startTime);
          }
        }
      });
      
      observer.observe({ type: 'paint', buffered: true });
      return () => observer.disconnect();
    } catch (e) {
      // Observer not supported
    }
  }, [onMetric]);
}

// TTFB (Time to First Byte) measurement
function useTTFB(onMetric?: (value: number) => void) {
  useEffect(() => {
    const navigationEntries = performance.getEntriesByType('navigation') as any;
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0];
      onMetric?.(navEntry.responseStart - navEntry.requestStart);
    }
  }, [onMetric]);
}

// Hook to report all web vitals
export function useWebVitals(options: WebVitalsOptions = {}) {
  const { onMetric, reportAllChanges = false } = options;
  const metricsRef = useRef<WebVitalsMetrics>({
    CLS: 0,
    LCP: 0,
    FID: 0,
    FCP: 0,
    TTFB: 0,
  });

  const reportMetric = useCallback((name: keyof WebVitalsMetrics, value: number) => {
    metricsRef.current[name] = value;
    
    // Report in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Web Vitals: ${name} = ${value.toFixed(2)}ms`);
    }
    
    onMetric?.(metricsRef.current);
    
    // In production, you could send to analytics
    if (typeof window !== 'undefined' && (window as any).__ANALYTICS__) {
      // (window as any).__ANALYTICS__.track('web_vitals', { name, value });
    }
  }, [onMetric]);

  useCLS(reportAllChanges ? (v) => reportMetric('CLS', v) : undefined);
  useFID(reportAllChanges ? (v) => reportMetric('FID', v) : undefined);
  useLCP(reportAllChanges ? (v) => reportMetric('LCP', v) : undefined);
  useFCP(reportAllChanges ? (v) => reportMetric('FCP', v) : undefined);
  useTTFB(reportAllChanges ? (v) => reportMetric('TTFB', v) : undefined);

  return metricsRef.current;
}

// Performance mark utility
export function perfMark(name: string) {
  if (typeof performance !== 'undefined') {
    performance.mark(name);
  }
}

export function perfMeasure(name: string, startMark: string, endMark?: string) {
  if (typeof performance !== 'undefined') {
    performance.measure(name, startMark, endMark);
  }
}