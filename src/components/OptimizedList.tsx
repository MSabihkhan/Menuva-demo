'use client';

import React, { useCallback, useRef, useMemo, useEffect, memo } from 'react';

// Optimized virtualized list for large datasets
// Renders only visible items + overscan for smooth scrolling
interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  overscan?: number;
  containerHeight: number;
  keyExtractor: (item: T) => string;
  onScroll?: (scrollTop: number) => void;
}

export function OptimizedList<T>({
  items,
  renderItem,
  itemHeight,
  overscan = 3,
  containerHeight,
  keyExtractor,
  onScroll,
}: OptimizedListProps<T>) {
  const scrollTopRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTopRef.current / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);
    return { startIndex, endIndex };
  }, [items.length, itemHeight, containerHeight, overscan]);

  // Handle scroll with RAF for 60fps
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTopRef.current === scrollTop) return;
    
    scrollTopRef.current = scrollTop;
    onScroll?.(scrollTop);
  }, [onScroll]);

  // Memoize visible items
  const visibleItems = useMemo(() => {
    const result: Array<{ item: T; index: number }> = [];
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      if (items[i]) {
        result.push({ item: items[i], index: i });
      }
    }
    return result;
  }, [items, visibleRange]);

  // Calculate total height
  const totalHeight = items.length * itemHeight;

  // Calculate offset for sticky positioning
  const offsetY = visibleRange.startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflowY: 'auto',
        contain: 'content',
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div key={keyExtractor(item)} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Optimized grid for menu items
interface OptimizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  numColumns: number;
  gap: number;
  containerHeight: number;
  itemHeight: number;
  keyExtractor: (item: T) => string;
}

export function OptimizedGrid<T>({
  items,
  renderItem,
  numColumns,
  gap,
  containerHeight,
  itemHeight,
  keyExtractor,
}: OptimizedGridProps<T>) {
  const scrollTopRef = useRef(0);
  const rowHeight = itemHeight + gap;
  
  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTopRef.current / rowHeight) - 1);
    const visibleRows = Math.ceil(containerHeight / rowHeight);
    const totalRows = Math.ceil(items.length / numColumns);
    const endRow = Math.min(totalRows - 1, startRow + visibleRows + 2);
    return { startRow, endRow };
  }, [items.length, rowHeight, containerHeight, numColumns]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    scrollTopRef.current = e.currentTarget.scrollTop;
  }, []);

  // Flatten visible items
  const visibleItems = useMemo(() => {
    const result: Array<{ item: T; index: number }> = [];
    for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
      for (let col = 0; col < numColumns; col++) {
        const index = row * numColumns + col;
        if (items[index]) {
          result.push({ item: items[index], index });
        }
      }
    }
    return result;
  }, [items, visibleRange, numColumns]);

  return (
    <div
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflowY: 'auto',
        display: 'grid',
        gridTemplateColumns: `repeat(${numColumns}, 1fr)`,
        gap,
        contain: 'content',
      }}
    >
      {visibleItems.map(({ item, index }) => (
        <div key={keyExtractor(item)} style={{ height: itemHeight }}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

// useDeferredValue hook for reducing render blocking
export function useDeferredValue<T>(value: T): T {
  const [deferred, setDeferred] = React.useState(value);
  
  useEffect(() => {
    // Defer to next frame
    requestAnimationFrame(() => {
      setDeferred(value);
    });
  }, [value]);
  
  return deferred;
}