import { Router } from 'express';
import { MENU_ITEMS, CATEGORIES, EXTRAS } from '../data/menu';

const router = Router();

// GET /api/menu — the frontend fetches this instead of bundling menu.ts.
router.get('/menu', (_req, res) => {
  res.json({ items: MENU_ITEMS, categories: CATEGORIES, extras: EXTRAS });
});

export default router;
