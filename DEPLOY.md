# Deploying Menuva (demo)

Two pieces deploy separately: the **Next.js frontend** (Vercel) and the
**Express backend** (Render). The frontend talks to Firebase directly for live
sync, and to the backend for order placement / kitchen status / payment.

## 1. Backend → Render
Either:
- **Blueprint (one click):** Render → New → **Blueprint** → pick this repo +
  branch `redesign/foodpanda-ui`. It reads `render.yaml` and provisions
  `menuva-backend`.
- **Manual:** Render → New → **Web Service** → connect repo →
  - Root Directory: `server`
  - Build Command: `npm install && npm run build`
  - Start Command: `npm start`
  - Health Check Path: `/api/health`
  - Plan: Free

After it deploys, copy the URL, e.g. `https://menuva-backend.onrender.com`.

> ⚠️ Render's free plan **sleeps after ~15 min idle** — the first request then
> takes ~50s to wake. **Before the pitch, open `<backend-url>/api/health` once**
> to warm it up.

## 2. Frontend → Vercel
- Vercel → New Project → import this repo → branch `redesign/foodpanda-ui`.
- Add an Environment Variable:
  - `NEXT_PUBLIC_API_BASE` = `https://menuva-backend.onrender.com/api`
    (your backend URL **with `/api` on the end**)
- Deploy.

## 3. Firebase
Already configured — the Realtime Database rules are open (`database.rules.json`),
which the live cart/order sync needs. No action required.

## Demo URLs
- **App** → the Vercel URL (open on judges' phones)
- **Kitchen board** → `<vercel-url>/kitchen` (open on a laptop)
