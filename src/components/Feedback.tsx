'use client';

import React, { useCallback } from 'react';

// Trigger haptic feedback on devices that support it
export function useHaptic() {
  return useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(8);
    }
  }, []);
}

// Skeleton block — CSS pulse, no framer-motion
export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style = {},
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'var(--border)',
        animation: 'pulse 1.4s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

// Menu item loading skeleton
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
        <Skeleton width={80} height={14} />
        <Skeleton width="100%" height={13} />
        <Skeleton width="65%" height={13} />
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton width={60} height={16} />
          <Skeleton width={32} height={32} borderRadius={16} />
        </div>
      </div>
    </div>
  );
}
