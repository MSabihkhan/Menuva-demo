import { Router } from 'express';
import {
  placeOrder, readOrders, advanceStatus, payOrder, resetTable, orderTotal,
} from '../services/orders';
import type { OrderStatus } from '../types';

// Mounted at /api/tables
const router = Router();

// GET /api/tables/:tableId/orders — the queue timeline (+ computed totals).
router.get('/:tableId/orders', async (req, res, next) => {
  try {
    const orders = await readOrders(req.params.tableId);
    res.json({ orders: orders.map(o => ({ ...o, totals: orderTotal(o) })) });
  } catch (e) { next(e); }
});

// POST /api/tables/:tableId/orders — place the pending cart, applying the 5-min rule.
router.post('/:tableId/orders', async (req, res, next) => {
  try {
    const result = await placeOrder(req.params.tableId, req.body?.kitchenNotes);
    res.status(201).json(result);
  } catch (e) { next(e); }
});

// PATCH /api/tables/:tableId/orders/:orderId/status — kitchen advances a queue.
router.patch('/:tableId/orders/:orderId/status', async (req, res, next) => {
  try {
    const order = await advanceStatus(
      req.params.tableId, req.params.orderId, req.body?.status as OrderStatus | undefined,
    );
    res.json({ order });
  } catch (e) { next(e); }
});

// POST /api/tables/:tableId/orders/:orderId/pay — demo payment.
router.post('/:tableId/orders/:orderId/pay', async (req, res, next) => {
  try {
    const order = await payOrder(req.params.tableId, req.params.orderId, req.body?.method || 'card');
    res.json({ order });
  } catch (e) { next(e); }
});

// POST /api/tables/:tableId/reset — wipe orders + carts for the next group.
router.post('/:tableId/reset', async (req, res, next) => {
  try {
    await resetTable(req.params.tableId);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
