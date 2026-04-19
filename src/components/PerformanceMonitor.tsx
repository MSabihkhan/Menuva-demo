'use client';

import { useEffect, useRef, useCallback } from 'react';

// Performance monitoring utilities
interface PerformanceMetrics {
  fps: number;
  memory?: number;
  longTasks: number;
}

interface PerformanceMonitorOptions {
  onMetric?: (metrics: PerformanceMetrics) => void;
  sampleRate?: number;
}

// Lightweight performance monitor hook
export function usePerformanceMonitor(options: PerformanceMonitorOptions = {}) {
  const { onMetric, sampleRate = 1000 } = options;
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafIdRef = useRef<number | null>(null);
  const longTasksRef = useRef(0);
  
  const measureFPS = useCallback(() => {
    frameCountRef.current++;
    const now = performance.now();
    const elapsed = now - lastTimeRef.current;
    
    if (elapsed >= sampleRate) {
      const fps = Math.round((frameCountRef.current * 1000) / elapsed);
      
      // Check for long tasks (>50ms)
      if (elapsed > 50) {
        longTasksRef.current++;
      }
      
      // Get memory if available
      const memory = (navigator as any).memory?.usedJSHeapSize;
      
      onMetric?.({
        fps,
        memory,
        longTasks: longTasksRef.current,
      });
      
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
    
    rafIdRef.current = requestAnimationFrame(measureFPS);
  }, [onMetric, sampleRate]);
  
  const start = useCallback(() => {
    lastTimeRef.current = performance.now();
    frameCountRef.current = 0;
    rafIdRef.current = requestAnimationFrame(measureFPS);
  }, [measureFPS]);
  
  const stop = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);
  
  return { start, stop };
}

// Optimized scroll handler with passive listeners
export function useOptimizedScroll(onScroll?: (progress: number) => void) {
  const progressRef = useRef(0);
  const tickingRef = useRef(false);
  
  const handleScroll = useCallback(() => {
    if (!tickingRef.current) {
      requestAnimationFrame(() => {
        const scrollElement = document.documentElement;
        const scrollTop = scrollElement.scrollTop;
        const scrollHeight = scrollElement.scrollHeight - scrollElement.clientHeight;
        progressRef.current = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
        onScroll?.(progressRef.current);
        tickingRef.current = false;
      });
      tickingRef.current = true;
    }
  }, [onScroll]);
  
  useEffect(() => {
    const options: AddEventListenerOptions = {
      passive: true,
    };
    
    window.addEventListener('scroll', handleScroll, options);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
}

// Intersection observer for lazy loading visibility
export function useVisible(onVisible?: () => void, threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const hasReportedRef = useRef(false);
  
  useEffect(() => {
    const element = ref.current;
    if (!element || hasReportedRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasReportedRef.current) {
            hasReportedRef.current = true;
            onVisible?.();
          }
        });
      },
      { threshold }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, [onVisible, threshold]);
  
  return ref;
}

// Memory-efficient animation frame throttler
export function useAnimationThrottle(maxFPS = 60) {
  const lastFrameTimeRef = useRef(0);
  const frameIntervalRef = useRef(1000 / maxFPS);
  
  const shouldRender = useCallback(() => {
    const now = performance.now();
    if (now - lastFrameTimeRef.current >= frameIntervalRef.current) {
      lastFrameTimeRef.current = now;
      return true;
    }
    return false;
  }, [maxFPS]);
  
  return { shouldRender };
}