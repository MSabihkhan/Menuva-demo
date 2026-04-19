'use client';

import React, { useRef } from 'react';
import { motion, useAnimate, AnimatePresence } from 'framer-motion';

type ScreenKey = 'welcome' | 'menu' | 'detail' | 'viewer3d' | 'order' | 'waiting' | 'payment';

interface AnimatedRouterProps {
  currentScreen: ScreenKey;
  children: React.ReactNode;
}

// Define direction for each screen transition
const getDirection = (from: ScreenKey, to: ScreenKey): 'forward' | 'backward' => {
  const order: ScreenKey[] = ['welcome', 'menu', 'detail', 'viewer3d', 'order', 'waiting', 'payment'];
  const fromIdx = order.indexOf(from);
  const toIdx = order.indexOf(to);
  return toIdx > fromIdx ? 'forward' : 'backward';
};

// Slide variants for smooth transitions
const slideVariants = {
  enter: (direction: 'forward' | 'backward') => ({
    x: direction === 'forward' ? 390 : -390,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: 'forward' | 'backward') => ({
    x: direction === 'forward' ? -390 : 390,
    opacity: 0,
  }),
};

const transition = {
  x: { type: 'spring' as const, stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 },
};

// Extract screen by key from children
function getScreenByKey(children: React.ReactNode, key: ScreenKey): React.ReactNode {
  const childArray = React.Children.toArray(children);
  return childArray.find((child: any) => 
    child?.props?.['data-screen'] === key || child?.key === key
  ) || null;
}

export function AnimatedRouter({ currentScreen, children }: AnimatedRouterProps) {
  const prevScreenRef = useRef<ScreenKey>('welcome');
  const direction = getDirection(prevScreenRef.current, currentScreen);
  prevScreenRef.current = currentScreen;

  const screenElement = getScreenByKey(children, currentScreen);

  return (
    <AnimatePresence mode="popLayout" initial={false} custom={direction}>
      {screenElement && (
        <motion.div
          key={currentScreen}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transition}
          style={{
            position: 'absolute',
            inset: 0,
            width: 390,
            height: '100%',
          }}
          data-screen={currentScreen}
        >
          {screenElement}
        </motion.div>
      )}
    </AnimatePresence>
  );
}