'use client';

import { useEffect, useRef } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { OptimizedApp } from '@/components/LazyScreens';
import { usePWA, useNetworkStatus } from '@/components/usePWA';

function PerfMonitor() {
  const metricsRef = useRef<{ fps: number; memory?: number }>({ fps: 60 });
  
  useEffect(() => {
    // Basic FPS monitoring
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const now = performance.now();
      const elapsed = now - lastTime;
      
      if (elapsed >= 1000) {
        metricsRef.current.fps = Math.round((frameCount * 1000) / elapsed);
        
        // Log warnings in development
        if (metricsRef.current.fps < 50) {
          console.warn('Low FPS detected:', metricsRef.current.fps);
        }
        
        frameCount = 0;
        lastTime = now;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    const rafId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(rafId);
  }, []);
  
  return null;
}

function App() {
  const { screen, showPayment, goBack, setScreen } = useApp();

  return (
    <OptimizedApp
      screen={screen}
      showPayment={showPayment}
      goBack={goBack}
      setScreen={setScreen}
    />
  );
}

export default function HomePage() {
  // Initialize PWA features
  usePWA();
  
  // Monitor network status
  const { isOnline } = useNetworkStatus();
  
  // Performance monitoring in development
  if (process.env.NODE_ENV === 'development') {
    // Development performance checks
  }

  return (
    <AppProvider>
      <PerfMonitor />
      <App />
    </AppProvider>
  );
}