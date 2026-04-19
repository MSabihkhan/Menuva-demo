'use client';

import React, { Suspense, lazy, useTransition } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// ── Lazy screen imports ──────────────────────────────────────────────────────

const WelcomeScreen = lazy(() =>
  import('./screens/WelcomeScreen').then(m => ({ default: m.WelcomeScreen }))
);
const MenuScreen = lazy(() =>
  import('./screens/MenuScreen').then(m => ({ default: m.MenuScreen }))
);
const DetailScreen = lazy(() =>
  import('./screens/DetailScreen').then(m => ({ default: m.DetailScreen }))
);
const Viewer3DScreen = lazy(() =>
  import('./screens/Viewer3DScreen').then(m => ({ default: m.Viewer3DScreen }))
);
const OrderScreen = lazy(() =>
  import('./screens/OrderScreen').then(m => ({ default: m.OrderScreen }))
);
const WaitingScreen = lazy(() =>
  import('./screens/WaitingScreen').then(m => ({ default: m.WaitingScreen }))
);
const PaymentScreen = lazy(() =>
  import('./screens/PaymentScreen').then(m => ({ default: m.PaymentScreen }))
);

// ── Loading / error UI ───────────────────────────────────────────────────────

function ScreenLoader() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div className="pulse-loader" />
    </div>
  );
}

function ScreenError({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, textAlign: 'center', background: 'var(--bg)',
    }}>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 16, color: 'var(--ink)', marginBottom: 16 }}>
        Something went wrong
      </div>
      <button
        onClick={resetErrorBoundary}
        style={{
          padding: '12px 24px', borderRadius: 100,
          background: 'var(--accent)', color: '#fff',
          fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 15,
          border: 'none', cursor: 'pointer',
        }}
      >
        Try Again
      </button>
    </div>
  );
}

// ── Background preloader ─────────────────────────────────────────────────────

function useScreenPreloader(screen: string) {
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (screen === 'welcome') import('./screens/MenuScreen');
      if (screen === 'menu') {
        import('./screens/DetailScreen');
        import('./screens/OrderScreen');
      }
      if (screen === 'order') import('./screens/WaitingScreen');
      if (screen === 'waiting') import('./screens/PaymentScreen');
    }, 1500);
    return () => clearTimeout(t);
  }, [screen]);
}

// ── Main router ──────────────────────────────────────────────────────────────

type Screen = 'welcome' | 'menu' | 'detail' | 'viewer3d' | 'order' | 'waiting' | 'payment';

interface OptimizedAppProps {
  screen: Screen;
  showPayment: boolean;
  goBack: () => void;
  setScreen: (screen: Screen) => void;
}

const SCREEN_MAP: Record<Screen, React.ComponentType> = {
  welcome: WelcomeScreen,
  menu: MenuScreen,
  detail: DetailScreen,
  viewer3d: Viewer3DScreen,
  order: OrderScreen,
  waiting: WaitingScreen,
  payment: PaymentScreen,
};

export function OptimizedApp({ screen }: OptimizedAppProps) {
  const [isPending] = useTransition();
  useScreenPreloader(screen);

  const Component = SCREEN_MAP[screen] ?? WelcomeScreen;

  return (
    <div style={{ opacity: isPending ? 0.85 : 1, transition: 'opacity 0.2s ease' }}>
      <ErrorBoundary key={screen} FallbackComponent={ScreenError}>
        <Suspense fallback={<ScreenLoader />}>
          <Component />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

// Named re-exports kept for any direct imports
export {
  WelcomeScreen, MenuScreen, DetailScreen,
  Viewer3DScreen, OrderScreen, WaitingScreen, PaymentScreen,
};
