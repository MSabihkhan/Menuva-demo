# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the repo root (the `package.json` is at root, not in a subdirectory):

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build (removes console logs, optimizes assets)
npm start        # Run production server
npm run lint     # ESLint with Next.js + TypeScript config
```

No test framework is configured.

## Architecture

Menuva v4 is a mobile-first (390×844px baseline) **PWA restaurant ordering app** built with Next.js 16 App Router + React 19 + TypeScript. It has no page routing — the entire app is a single page (`src/app/page.tsx`) with screen-based navigation managed through React Context.

### Navigation Model

There are 7 screens in `src/components/screens/`: `WelcomeScreen` → `MenuScreen` → `DetailScreen` → `Viewer3DScreen` → `OrderScreen` → `WaitingScreen` → `PaymentScreen`. Transitions are handled by `AnimatedRouter.tsx` (Framer Motion slide animations) and lazy-loaded via `LazyScreens.tsx`. The active screen is stored in `AppContext`.

### State Management

`src/context/AppContext.tsx` is the single source of truth: current screen, cart items, user info (name/group), and toast notifications. Cart and user data persist to `localStorage`. Toast system caps at 3 concurrent notifications.

### Performance Layer

Several components exist purely for performance:
- `PerformanceMonitor.tsx` — FPS tracking, rendered in dev by `PerfMonitor` in `page.tsx`
- `WebVitals.tsx` — LCP, CLS, FID reporting
- `OptimizedList.tsx` — virtualized list rendering
- `primitives-optimized.tsx` — memoized versions of base UI components
- `ImageOptimization.tsx` — progressive image loading with blur placeholders

### PWA

`public/sw.js` implements cache-first (static assets) + network-first (API) strategies. `src/components/usePWA.ts` registers the service worker and exposes network status. `public/manifest.json` configures standalone install behavior.

### Data

`src/data/menu.ts` contains all menu items inline (no API). Types like `MenuItem` and `CartItem` are defined here.

### Styling

Inline styles throughout (no CSS-in-JS library). Design tokens (colors, spacing, radii) are CSS custom properties defined in `globals.css`. The brand accent color is `#C8760A`.

## Backend API

`src/app/api/table/[tableId]/route.ts` — GET/POST handler for multi-device table sync.

- `GET /api/table/T7` → returns `{ members: GroupMember[], orderStatus: string, debug: string }`
- `POST /api/table/T7` → actions: `join`, `updateCart`, `placeOrder`, `reset`, `leave`
- Storage: auto-detects Vercel KV via `KV_REST_API_URL` + `KV_REST_API_TOKEN` env vars; falls back to `globalThis.__menuvaStore` (in-memory Map, resets on cold start). Both are already wired — just set the env vars to activate KV.
- Table state is pruned after 4 hours of inactivity.
- Table ID is hardcoded as `T7` in `AppContext.tsx` (`TABLE_ID` constant).
- Frontend polls every 3 s (all screens) and does a one-time fetch on mount. Same-device tab sync also uses `BroadcastChannel('menuva_table')`.
- `sessionId` is a stable per-browser identifier persisted in `localStorage` (`menuva-session-id`).

## Key Conventions

- Path alias `@/*` maps to `src/*`
- TypeScript strict mode is on — no `any` without justification
- Console logs are stripped in production builds (`next.config.ts`)
- `framer-motion` is imported via `OptimizedRouter` / `AnimatedRouter`; use `AnimatePresence` for exit animations
- New screens should be added to `src/components/screens/index.ts` and wired into `LazyScreens.tsx`
- `goBack()` in `AppContext` uses a hardcoded screen→screen map; update it when adding screens
- Cart items are stored per `GroupMember` (not a flat array) — the current user's items live at `groupMembers.find(m => m.isCurrentUser).items`
- `primitives.tsx` has the base unstyled components; `primitives-optimized.tsx` wraps them in `React.memo` — prefer the optimized versions in screens
