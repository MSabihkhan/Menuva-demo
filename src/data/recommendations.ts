// ── Waiter-style upsell engine ────────────────────────────────────────────────
// Hardcoded pairing rules that read the live cart and surface complementary
// items the way a sharp cashier upsells a fast-food counter. Every rule sits in
// a "lane" so the picks span different ideas — a plate-completer (fries / a
// drink) AND a meal-rounder (a shake, a share-bucket, dessert) — instead of two
// near-identical sides. Highest-priority applicable rule per lane wins.

import { MenuItem, ITEM_BY_ID } from './menu';

export interface Suggestion {
  item: MenuItem;
  headline: string; // short hook, e.g. "Tame the spice"
  reason: string;   // the waiter's pitch
  badge: string;    // social-proof / context chip, e.g. "Most paired"
}

export interface CartCtx {
  id: string;
  category: string;
  spicy?: boolean;
}

// plate = completes the dish · round = rounds out / upgrades the meal
export type Lane = 'plate' | 'round';

// The substantial items a meal is built around (everything else is a side,
// drink or dessert that completes or rounds them out).
const MAIN_CATS = new Set(['Burgers', 'Pizza', 'Chicken']);

interface Analysis {
  ids: Set<string>;
  cats: Set<string>;
  hasMain: boolean;
  mainsCount: number;
  hasDrink: boolean;
  hasDessert: boolean;
  count: number;
}

function analyze(cart: CartCtx[]): Analysis {
  const ids = new Set(cart.map(c => c.id));
  const cats = new Set(cart.map(c => c.category));
  const mainsCount = cart.filter(c => MAIN_CATS.has(c.category)).length;
  return {
    ids,
    cats,
    hasMain: mainsCount > 0,
    mainsCount,
    hasDrink: cats.has('Drinks'),
    hasDessert: cats.has('Desserts'),
    count: cart.length,
  };
}

interface Rule {
  suggestId: string;
  lane: Lane;
  priority: number;
  badge: string;
  headline: string;
  reason: string;
  applies: (a: Analysis) => boolean;
}

const RULES: Rule[] = [
  // ── plate: complete the meal (a side + a drink) ───────────────────────────
  {
    suggestId: '6', lane: 'plate', priority: 95, badge: 'Most added', headline: 'Don’t forget the fries',
    reason: 'A burger this good needs a side of loaded fries — crispy, cheesy, gone in seconds.',
    applies: a => a.hasMain && !a.ids.has('6'),
  },
  {
    suggestId: '8', lane: 'plate', priority: 78, badge: 'Make it a combo', headline: 'Wash it down',
    reason: 'An ice-cold cola cuts right through all that cheese. Make it a combo.',
    applies: a => a.hasMain && !a.hasDrink && !a.ids.has('8'),
  },

  // ── round: share / upgrade / finish ───────────────────────────────────────
  {
    suggestId: '5', lane: 'round', priority: 82, badge: 'For the table', headline: 'Feed the whole table',
    reason: 'Ordering for the group? The Fried Chicken Bucket — eight crunchy pieces — is built to pass around.',
    applies: a => a.mainsCount >= 2 && !a.ids.has('5'),
  },
  {
    suggestId: '9', lane: 'round', priority: 74, badge: 'Crowd favourite', headline: 'Make it a shake',
    reason: 'Thick, hand-spun chocolate shake — the upgrade regulars add without thinking twice.',
    applies: a => a.hasMain && !a.ids.has('9'),
  },
  {
    suggestId: '7', lane: 'round', priority: 56, badge: 'Save room', headline: 'Leave room for dessert',
    reason: 'Warm fudge brownie, molten centre. Skipping it is the one thing regulars regret.',
    applies: a => a.count > 0 && !a.hasDessert && !a.ids.has('7'),
  },
];

export interface RecommendOpts {
  exclude?: string[];
  preferLanes?: Lane[]; // bias which lane is surfaced first (e.g. order screen → 'round')
}

export function recommendMany(cart: CartCtx[], n = 1, opts: RecommendOpts = {}): Suggestion[] {
  const { exclude = [], preferLanes } = opts;
  const a = analyze(cart);
  const ex = new Set(exclude);

  const pool = RULES.filter(r => !ex.has(r.suggestId) && !a.ids.has(r.suggestId) && r.applies(a));
  pool.sort((x, y) => y.priority - x.priority);
  if (preferLanes && preferLanes.length) {
    const rank = (l: Lane) => { const i = preferLanes.indexOf(l); return i === -1 ? 99 : i; };
    pool.sort((x, y) => rank(x.lane) - rank(y.lane) || y.priority - x.priority);
  }

  const toSug = (r: Rule): Suggestion => ({ item: ITEM_BY_ID[r.suggestId], headline: r.headline, reason: r.reason, badge: r.badge });
  const out: Suggestion[] = [];
  const usedIds = new Set<string>();
  const usedLanes = new Set<Lane>();

  // Pass 1 — one per lane, so the picks always feel varied.
  for (const r of pool) {
    if (out.length >= n) break;
    if (usedIds.has(r.suggestId) || usedLanes.has(r.lane) || !ITEM_BY_ID[r.suggestId]) continue;
    out.push(toSug(r)); usedIds.add(r.suggestId); usedLanes.add(r.lane);
  }
  // Pass 2 — fill any remaining slots regardless of lane.
  if (out.length < n) {
    for (const r of pool) {
      if (out.length >= n) break;
      if (usedIds.has(r.suggestId) || !ITEM_BY_ID[r.suggestId]) continue;
      out.push(toSug(r)); usedIds.add(r.suggestId);
    }
  }

  // Never show nothing.
  if (out.length === 0) {
    const fbId = a.ids.has('6') ? '9' : '6';
    const fb = ITEM_BY_ID[fbId];
    if (fb && !ex.has(fbId) && !a.ids.has(fbId)) {
      out.push(fbId === '6'
        ? { item: fb, headline: 'Don’t forget the fries', reason: 'Loaded fries — crispy and cheesy — are the one thing no order should skip.', badge: 'Most added' }
        : { item: fb, headline: 'Make it a shake', reason: 'A thick chocolate shake is the perfect way to round things off.', badge: 'Crowd favourite' });
    }
  }
  return out;
}

export function recommend(cart: CartCtx[], opts: RecommendOpts = {}): Suggestion | null {
  return recommendMany(cart, 1, opts)[0] ?? null;
}
