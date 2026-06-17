# Menuva Backend

Express + TypeScript service that owns order placement, the queue logic, and
the kitchen status machine. Live cart sync stays on Firebase RTDB direct from
the app — this service owns the *decisions* (place order, 5-minute queue rule,
status transitions, payment, reset).

## Run

```bash
cd server
npm install
cp .env.example .env   # optional — defaults are fine for the demo
npm run dev            # http://localhost:4000
```

## Endpoints

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | liveness |
| GET | `/api/menu` | menu items, categories, extras |
| GET | `/api/tables/:id/orders` | the queue timeline + totals |
| POST | `/api/tables/:id/orders` | place pending cart → applies the 5-min rule |
| PATCH | `/api/tables/:id/orders/:orderId/status` | kitchen advances `placed→preparing→ready→served` |
| POST | `/api/tables/:id/orders/:orderId/pay` | demo payment |
| POST | `/api/tables/:id/reset` | wipe orders + carts for the next group |

## The 5-minute rule

`POST /orders` reads the pending cart, finds the latest order, and:
- **≤ 5 min** since it was placed → folds the items into that queue (no new ticket).
- **> 5 min** → creates a new queue (Order N+1) with its own ETA.

## Firebase

Uses the **client SDK** with the app's public config (`src/firebase.ts`) — zero
setup for the demo. To move to the Admin SDK later, that one file is the only change.

## Data shape (RTDB)

```
tables/T7/
  members/{sid}/ { name, initials, itemsJson, joinedAt }   # live carts (app writes these)
  orders/{orderId}/ { round, placedAt, etaMinutes, status, lineItems[], paid? }
```
