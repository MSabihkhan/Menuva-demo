'use client';

import { useState, useCallback, useEffect, memo, useRef } from 'react';

// LazyImage with placeholder and blur-up effect
interface LazyImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  placeholderColor?: string;
  onLoad?: () => void;
}

export function LazyImage({ 
  src, 
  alt, 
  width = '100%', 
  height = '100%', 
  style = {},
  className,
  placeholderColor = '#E8E6E1',
  onLoad,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!containerRef.current || !('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        background: isLoaded ? 'transparent' : placeholderColor,
        transition: 'background 0.3s ease',
        ...style,
      }}
      className={className}
    >
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}

// Optimized image with responsive srcset
interface ResponsiveImageProps extends LazyImageProps {
  srcSet?: string;
  sizes?: string;
}

export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  style,
  className,
  placeholderColor,
  srcSet,
  sizes,
  onLoad,
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      onLoad={handleLoad}
      style={{
        width,
        height,
        objectFit: 'cover',
        background: isLoaded ? 'transparent' : placeholderColor || '#E8E6E1',
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.2s ease',
        ...style,
      }}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}

// Blur placeholder component
export const ImagePlaceholder = memo(function ImagePlaceholder({
  width = '100%',
  height = 100,
  style = {},
}: {
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width,
        height,
        background: 'linear-gradient(90deg, #E8E6E1 0%, #F0EEE9 50%, #E8E6E1 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        ...style,
      }}
    />
  );
});

// Skeleton wrapper for content
export const SkeletonBox = memo(function SkeletonBox({
  children,
  isLoading,
}: {
  children: React.ReactNode;
  isLoading: boolean;
}) {
  if (!isLoading) return <>{children}</>;
  
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {children}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(255,255,255,0.5)',
        animation: 'fadeIn 0.2s ease',
      }} />
    </div>
  );
});