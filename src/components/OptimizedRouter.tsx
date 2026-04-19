'use client';

import React, { memo, useCallback, useRef, useState, useEffect } from 'react';

type ScreenKey = 'welcome' | 'menu' | 'detail' | 'viewer3d' | 'order' | 'waiting' | 'payment';

interface OptimizedRouterProps {
  currentScreen: ScreenKey;
  children: React.ReactNode;
}

// Track screen navigation order for direction
const NAV_ORDER: ScreenKey[] = ['welcome', 'menu', 'detail', 'viewer3d', 'order', 'waiting', 'payment'];

// Get transition direction
function getDirection(from: ScreenKey, to: ScreenKey): 'forward' | 'backward' {
  const fromIdx = NAV_ORDER.indexOf(from);
  const toIdx = NAV_ORDER.indexOf(to);
  return toIdx > fromIdx ? 'forward' : 'backward';
}

// Extract screen by key from children
function getScreenByKey(children: React.ReactNode, key: ScreenKey): React.ReactNode {
  const childArray = React.Children.toArray(children);
  return childArray.find((child: any) => 
    child?.props?.['data-screen'] === key || child?.key === key
  ) || null;
}

// CSS-only optimized router - no JS animations for maximum performance
export const OptimizedRouter = memo(function OptimizedRouter({ 
  currentScreen, 
  children 
}: OptimizedRouterProps) {
  const prevScreenRef = useRef<ScreenKey>('welcome');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const screenElement = getScreenByKey(children, currentScreen);
  
  // Update direction on screen change
  useEffect(() => {
    if (prevScreenRef.current !== currentScreen) {
      setDirection(getDirection(prevScreenRef.current, currentScreen));
      prevScreenRef.current = currentScreen;
    }
  }, [currentScreen]);
  
  const enterClass = direction === 'forward' ? 'slide-in-right' : 'slide-in-left';
  const exitClass = direction === 'forward' ? 'slide-out-left' : 'slide-out-right';
  
  return (
    <div 
      className="router-container gpu-accelerated"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {screenElement && React.cloneElement(screenElement as React.ReactElement<any>, {
        'data-screen': currentScreen,
        className: `screen-transition ${enterClass}`,
      })}
    </div>
  );
});

// Optimized screen wrapper with CSS animations (GPU accelerated)
interface OptimizedScreenWrapperProps {
  children: React.ReactNode;
  isActive?: boolean;
  direction?: 'forward' | 'backward';
}

export const OptimizedScreenWrapper = memo(function OptimizedScreenWrapper({
  children,
  isActive = true,
  direction = 'forward',
}: OptimizedScreenWrapperProps) {
  if (!isActive) return null;
  
  const animationClass = direction === 'forward' ? 'slide-in-right' : 'slide-in-left';
  
  return (
    <div 
      className={`screen-wrapper ${animationClass}`}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        transform: 'translateZ(0)',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
});

// Performance-optimized screen transition hook
export function useOptimizedTransition(duration = 300) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentKey, setCurrentKey] = useState(0);
  
  const startTransition = useCallback((callback: () => void) => {
    setIsTransitioning(true);
    setCurrentKey(prev => prev + 1);
    callback();
    
    // Complete transition after CSS animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, duration);
  }, [duration]);
  
  return { isTransitioning, currentKey, startTransition };
}

// Add CSS-only transition styles
const routerStyles = `
  /* GPU accelerated container */
  .router-container {
    transform: translateZ(0);
    will-change: transform;
    perspective: 1000px;
  }
  
  /* Screen transition animations - CSS only for 60fps */
  .screen-transition {
    animation-fill-mode: both;
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateZ(0);
    will-change: transform;
  }
  
  /* Slide from right (forward navigation) */
  @keyframes slideInRight {
    from {
      transform: translateX(100%) translateZ(0);
      opacity: 0;
    }
    to {
      transform: translateX(0) translateZ(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutLeft {
    from {
      transform: translateX(0) translateZ(0);
      opacity: 1;
    }
    to {
      transform: translateX(-30%) translateZ(0);
      opacity: 0;
    }
  }
  
  /* Slide from left (backward navigation) */
  @keyframes slideInLeft {
    from {
      transform: translateX(-100%) translateZ(0);
      opacity: 0;
    }
    to {
      transform: translateX(0) translateZ(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0) translateZ(0);
      opacity: 1;
    }
    to {
      transform: translateX(30%) translateZ(0);
      opacity: 0;
    }
  }
  
  /* Apply animations */
  .slide-in-right {
    animation: slideInRight 250ms forwards;
  }
  
  .slide-out-left {
    animation: slideOutLeft 250ms forwards;
  }
  
  .slide-in-left {
    animation: slideInLeft 250ms forwards;
  }
  
  .slide-out-right {
    animation: slideOutRight 250ms forwards;
  }
  
  /* Screen wrapper */
  .screen-wrapper {
    transform: translateZ(0);
    will-change: transform;
    backface-visibility: hidden;
  }
  
  /* Optimized scroll container */
  .scroll-container {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    overscroll-behavior: contain;
  }
  
  /* Disable paint during scroll for smoother experience */
  .scroll-container.scrolling {
    -webkit-paint-order: none;
    paint-order: none;
  }
`;

export { routerStyles };