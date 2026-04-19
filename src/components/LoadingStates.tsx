'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Loading spinner component
interface SpinnerProps {
  size?: number;
  color?: string;
}

export function Spinner({ size = 24, color = 'var(--accent)' }: SpinnerProps) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      style={{
        width: size,
        height: size,
        border: `2px solid ${color}`,
        borderTopColor: 'transparent',
        borderRadius: '50%',
      }}
    />
  );
}

// Full-screen loading overlay
export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(255,255,255,0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        zIndex: 100,
      }}
    >
      <Spinner size={32} />
      <span style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        color: 'var(--ink-2)',
      }}>{message}</span>
    </motion.div>
  );
}

// Inline loading state for buttons
interface ButtonLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  disabled?: boolean;
}

export function ButtonLoading({ loading, children, disabled }: ButtonLoadingProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {loading && <Spinner size={18} color="#fff" />}
      <span style={{ opacity: loading ? 0.7 : 1 }}>{children}</span>
    </div>
  );
}

// Error boundary component
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onRetry?: () => void;
}

export function ErrorBoundary({ children, fallback, onRetry }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      setError(new Error(e.message));
      setHasError(true);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return fallback || (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: 24,
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <div style={{ fontSize: 16, color: 'var(--ink)', marginBottom: 8 }}>
          Something went wrong
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 16 }}>
          {error?.message || 'Please try again'}
        </div>
        {onRetry && (
          <button
            onClick={() => { setHasError(false); onRetry(); }}
            style={{
              padding: '10px 20px',
              borderRadius: 100,
              background: 'var(--accent)',
              color: '#fff',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        )}
      </motion.div>
    );
  }

  return <>{children}</>;
}

// Empty state component
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = '🍽️', title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <div style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 18,
        fontWeight: 500,
        color: 'var(--ink)',
        marginBottom: 8,
      }}>{title}</div>
      {description && (
        <div style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: 'var(--ink-2)',
          marginBottom: 16,
        }}>{description}</div>
      )}
      {action}
    </motion.div>
  );
}

// Swipeable list item
interface SwipeableItemProps {
  children: React.ReactNode;
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  onSwipe?: (direction: 'left' | 'right') => void;
}

export function SwipeableItem({ children, leftActions, rightActions, onSwipe }: SwipeableItemProps) {
  const x = React.useRef(0);
  const THRESHOLD = 80;

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(e, { offset, velocity }) => {
        const swipe = Math.abs(offset.x) > THRESHOLD || Math.abs(velocity.x) > 500;
        if (swipe) {
          const direction = offset.x > 0 ? 'right' : 'left';
          x.current = direction === 'right' ? 200 : -200;
          onSwipe?.(direction);
          setTimeout(() => { x.current = 0; }, 300);
        }
      }}
      style={{ x: x.current }}
    >
      {children}
    </motion.div>
  );
}