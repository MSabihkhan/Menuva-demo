import 'dotenv/config';

export const PORT = Number(process.env.PORT) || 4000;

// The single demo table. Matches TABLE_ID in the frontend AppContext.
export const TABLE_ID = process.env.TABLE_ID || 'T7';

// The 5-minute rule: adding/placing within this window of the last order
// folds into that order; beyond it, a new queue is created.
export const QUEUE_WINDOW_MS = 5 * 60 * 1000;

// Default kitchen ETA for a fresh order, in minutes (cosmetic countdown).
export const DEFAULT_ETA_MIN = 18;

// Allowed CORS origins. "*" is fine for the demo.
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
