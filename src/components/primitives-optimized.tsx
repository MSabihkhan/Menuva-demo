'use client';

import React, { memo, useCallback, useMemo } from 'react';

// CSS-based button with hardware acceleration
interface ButtonOptimizedProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  type?: 'button' | 'submit';
  loading?: boolean;
}

// Memoized optimized button - uses transform for animations (GPU accelerated)
export const ButtonOptimized = memo(function ButtonOptimized({
  children,
  variant = 'primary',
  disabled,
  style = {},
  onClick,
  type = 'button',
  loading,
}: ButtonOptimizedProps) {
  const baseStyle = useMemo(() => ({
    height: 52,
    borderRadius: 100,
    width: '100%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    fontSize: 15,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    padding: '0 24px',
    letterSpacing: '-0.005em',
    transition: 'transform 0.15s ease, opacity 0.15s ease',
    transform: 'translateZ(0)',
    willChange: 'transform',
  }), []);

  const variantStyle = useMemo(() => {
    switch (variant) {
      case 'primary':
        return { background: 'var(--accent)', color: '#fff' };
      case 'secondary':
        return { background: 'transparent', color: 'var(--ink)', border: '1px solid var(--border)' };
      case 'ghost':
        return { background: 'transparent', color: 'var(--error)' };
      default:
        return { background: 'var(--accent)', color: '#fff' };
    }
  }, [variant]);

  const handleClick = useCallback(() => {
    if (!disabled && !loading) {
      onClick?.();
    }
  }, [disabled, loading, onClick]);

  // Use CSS active state instead of JS for instant response
  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      style={{
        ...baseStyle,
        ...variantStyle,
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
      className="button-optimized"
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="spinner-small" />
          <span style={{ opacity: 0.7 }}>Loading...</span>
        </span>
      ) : children}
    </button>
  );
});

// Optimized chip component
interface ChipOptimizedProps {
  children: React.ReactNode;
  active?: boolean;
  muted?: boolean;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const ChipOptimized = memo(function ChipOptimized({
  children,
  active,
  muted,
  size = 'md',
  style = {},
  onClick,
}: ChipOptimizedProps) {
  const pad = size === 'sm' ? '5px 10px' : '6px 12px';
  const fs = size === 'sm' ? 11 : 12;
  
  const chipStyle = useMemo(() => {
    let bg: string, color: string, border = 'none';
    if (active) { bg = 'var(--accent)'; color = '#fff'; }
    else if (muted) { bg = 'var(--surface)'; color = 'var(--ink-2)'; border = '1px solid var(--border)'; }
    else { bg = 'var(--accent-surface)'; color = 'var(--accent)'; }
    
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: pad,
      borderRadius: 100,
      background: bg,
      color,
      fontFamily: 'var(--font-sans)',
      fontWeight: 500,
      fontSize: fs,
      lineHeight: 1,
      border,
      whiteSpace: 'nowrap',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.1s ease, opacity 0.1s ease',
      transform: 'translateZ(0)',
    };
  }, [active, muted, pad, fs, onClick]);

  if (onClick) {
    return (
      <button onClick={onClick} style={{ ...chipStyle, ...style }}>
        {children}
      </button>
    );
  }

  return <span style={{ ...chipStyle, ...style }}>{children}</span>;
});

// Optimized toast with proper cleanup
interface ToastOptimizedProps {
  message: string;
  success?: boolean;
  initials?: string;
  onDismiss?: () => void;
  duration?: number;
}

export const ToastOptimized = memo(function ToastOptimized({
  message,
  success,
  initials,
  onDismiss,
  duration = 4000,
}: ToastOptimizedProps) {
  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 52,
        left: 16,
        right: 16,
        zIndex: 10,
        height: 52,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 14px',
        transform: 'translateZ(0)',
        willChange: 'transform, opacity',
        animation: 'toastIn 0.2s ease',
      }}
    >
      {success ? (
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            background: 'var(--success-surface)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.5 5 9l4.5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
      ) : initials ? (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--accent-surface)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            fontSize: 14,
            border: '2px solid #fff',
          }}
        >
          {initials}
        </div>
      ) : null}
      <div
        style={{
          flex: 1,
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: 'var(--ink)',
          lineHeight: 1.3,
        }}
      >
        {message}
      </div>
      {onDismiss && (
        <button
          onClick={handleDismiss}
          style={{
            color: 'var(--ink-3)',
            fontSize: 20,
            lineHeight: 1,
            fontWeight: 300,
            padding: 4,
            cursor: 'pointer',
            background: 'none',
            border: 'none',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
});

// Optimized food tile with GPU acceleration
interface FoodTileOptimizedProps {
  emoji: string;
  size?: number;
  radius?: number;
  bg?: string;
}

export const FoodTileOptimized = memo(function FoodTileOptimized({
  emoji,
  size = 80,
  radius = 16,
  bg = 'var(--surface)',
}: FoodTileOptimizedProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.55,
        flexShrink: 0,
        transform: 'translateZ(0)',
        willChange: 'transform',
      }}
    >
      {emoji}
    </div>
  );
});

// Optimized screen frame with hardware layer
interface ScreenFrameOptimizedProps {
  children: React.ReactNode;
  dark?: boolean;
  style?: React.CSSProperties;
}

export const ScreenFrameOptimized = memo(function ScreenFrameOptimized({
  children,
  dark = false,
  style = {},
}: ScreenFrameOptimizedProps) {
  return (
    <div
      className={`screen ${dark ? 'dark' : ''}`}
      style={{
        transform: 'translateZ(0)',
        willChange: 'transform',
        ...style,
      }}
    >
      {children}
    </div>
  );
});

// Virtual list item for large menus - render only what's visible
interface VirtualListItemProps {
  index: number;
  style: React.CSSProperties;
  children: React.ReactNode;
}

export const VirtualListItem = memo(function VirtualListItem({
  index,
  style,
  children,
}: VirtualListItemProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        transform: `translateY(${style.top}px)`,
        willChange: 'transform',
        ...style,
      }}
    >
      {children}
    </div>
  );
});

// Add optimized styles to globals
const optimizedStyles = `
  .button-optimized:active {
    transform: scale(0.96) translateZ(0);
  }
  
  .button-optimized:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  
  @keyframes toastIn {
    from {
      opacity: 0;
      transform: translateY(-10px) translateZ(0);
    }
    to {
      opacity: 1;
      transform: translateY(0) translateZ(0);
    }
  }
  
  .spinner-small {
    width: 16px;
    height: 16px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  /* GPU acceleration hints */
  .gpu-accelerated {
    transform: translateZ(0);
    will-change: transform;
    backface-visibility: hidden;
    perspective: 1000px;
  }
  
  /* Smooth scrolling for mobile */
  .smooth-scroll {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }
  
  /* Prevent layout thrashing */
  .no-layout-thrash {
    contain: layout style paint;
  }
`;

export { optimizedStyles };