'use client';

import React, { useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

// Callback to trigger haptic feedback on mobile
export function useHaptic() {
  return useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, []);
}

// Magnetic button that pulls toward cursor
interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export function MagneticButton({ children, onClick, style, disabled }: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.3);
    y.set((e.clientY - centerY) * 0.3);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      style={{
        ...style,
        transform: `translate(${springX.get()}px, ${springY.get()}px)`,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </motion.button>
  );
}

// Press animation wrapper
interface PressableProps {
  children: React.ReactNode;
  onClick?: () => void;
  scale?: number;
}

export function Pressable({ children, onClick, scale = 0.96 }: PressableProps) {
  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      style={{ cursor: 'pointer' }}
    >
      {children}
    </motion.div>
  );
}

// Skeleton loader for menu items
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  style?: React.CSSProperties;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style = {} }: SkeletonProps) {
  return (
    <motion.div
      animate={{ 
        backgroundColor: ['#E8E6E1', '#F0EEE9', '#E8E6E1'],
      }}
      transition={{ duration: 1.5, repeat: Infinity }}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

// Menu item skeleton
export function MenuItemSkeleton() {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: '1px solid var(--border)',
      padding: 12,
      display: 'flex',
      gap: 12,
    }}>
      <Skeleton width={80} height={80} borderRadius={16} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton width={80} height={16} />
        <Skeleton width="100%" height={14} />
        <Skeleton width="70%" height={14} />
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton width={60} height={18} />
          <Skeleton width={32} height={32} borderRadius={16} />
        </div>
      </div>
    </div>
  );
}

// Pull to refresh hook
interface UsePullToRefreshProps {
  onRefresh: () => void;
  threshold?: number;
}

export function usePullToRefresh({ onRefresh, threshold = 100 }: UsePullToRefreshProps) {
  const y = useMotionValue(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const handlePull = useCallback((deltaY: number) => {
    if (deltaY > 0) {
      y.set(deltaY * 0.5);
    }
  }, [y]);

  const handleRelease = useCallback((deltaY: number) => {
    if (deltaY > threshold) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => {
        y.set(0);
        setIsRefreshing(false);
      }, 1000);
    } else {
      y.set(0);
    }
  }, [y, threshold, onRefresh]);

  return { y: springY, isRefreshing, handlePull, handleRelease };
}