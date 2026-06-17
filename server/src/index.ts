import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import { PORT, CORS_ORIGIN, TABLE_ID } from './config';
import healthRoutes from './routes/health';
import menuRoutes from './routes/menu';
import orderRoutes from './routes/orders';

const app = express();

app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map(s => s.trim()) }));
app.use(express.json());

app.use('/api', healthRoutes);
app.use('/api', menuRoutes);
app.use('/api/tables', orderRoutes);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = (err && err.status) || 500;
  // eslint-disable-next-line no-console
  console.error(`[${status}]`, err?.message || err);
  res.status(status).json({ error: err?.message || 'Internal error' });
};
app.use(errorHandler);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Menuva backend → http://localhost:${PORT}  (table ${TABLE_ID})`);
});
