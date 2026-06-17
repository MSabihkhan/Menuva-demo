import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'menuva-backend', ts: Date.now() });
});

export default router;
