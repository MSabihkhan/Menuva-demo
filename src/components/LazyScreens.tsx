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
  newJoiner: { name: string; initials: string } | null;
  clearNewJoiner: () => void;
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

function JoinerPopup({ joiner, onDismiss }: { 
  joiner: { name: string; initials: string }; 
  onDismiss: () => void;
}) {
  React.useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div style={{
      position: 'absolute', top: 60, left: 16, right: 16, zIndex: 100,
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderRadius: 16, border: '1px solid var(--border)',
      padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      animation: 'slideDownIn 0.3s ease',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: 'var(--accent-surface)', color: 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14,
        flexShrink: 0,
      }}>{joiner.initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>
          {joiner.name} joined!
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>
          They're now ordering with you
        </div>
      </div>
      <button
        onClick={onDismiss}
        style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--surface)', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 18, color: 'var(--ink-3)',
        }}
      >
        ×
      </button>
    </div>
  );
}

export function OptimizedApp({ screen, newJoiner, clearNewJoiner }: OptimizedAppProps) {
  const [isPending] = useTransition();
  useScreenPreloader(screen);

  const Component = SCREEN_MAP[screen] ?? WelcomeScreen;

  return (
    <div style={{ opacity: isPending ? 0.85 : 1, transition: 'opacity 0.2s ease' }}>
      {newJoiner && <JoinerPopup joiner={newJoiner} onDismiss={clearNewJoiner} />}
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
