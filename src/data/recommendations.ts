// ── Waiter-style upsell engine ────────────────────────────────────────────────
// Hardcoded pairing rules that read the live cart and surface complementary
// dishes the way a sharp waiter reads a table. Every rule sits in a "lane" so
// the picks span different ideas — a plate-completer (naan/raita) AND a
// meal-rounder (mixed grill / dessert / chai) — instead of two near-identical
// sides. Highest-priority applicable rule per lane wins.

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

interface Analysis {
  ids: Set<string>;
  cats: Set<string>;
  hasSpicy: boolean;
  mainsAndGrills: number;
  startersOnly: boolean;
  count: number;
}

function analyze(cart: CartCtx[]): Analysis {
  const ids = new Set(cart.map(c => c.id));
  const cats = new Set(cart.map(c => c.category));
  const mainOrGrill = cats.has('Mains') || cats.has('Grills');
  return {
    ids,
    cats,
    hasSpicy: cart.some(c => c.spicy),
    mainsAndGrills: cart.filter(c => c.category === 'Mains' || c.category === 'Grills').length,
    startersOnly: cats.has('Starters') && !mainOrGrill,
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
  // ── plate: complete the dish ──────────────────────────────────────────────
  {
    suggestId: '9', lane: 'plate', priority: 95, badge: 'Cools the heat', headline: 'Tame the spice',
    reason: 'That masala packs real heat — a cool mint raita is how Lahori regulars balance every bite.',
    applies: a => a.hasSpicy && !a.ids.has('9'),
  },
  {
    suggestId: '9', lane: 'plate', priority: 90, badge: 'The classic combo', headline: 'Biryani’s best friend',
    reason: 'Biryani without raita? Not at this table. The cool yogurt cuts right through the spice.',
    applies: a => a.ids.has('8') && !a.ids.has('9'),
  },
  {
    suggestId: '10', lane: 'plate', priority: 80, badge: 'Most paired', headline: 'Scoop up every bite',
    reason: 'Fresh tandoor naan, straight from the oven — you’ll want it to mop up all that rich gravy.',
    applies: a => a.cats.has('Mains') && !a.ids.has('10'),
  },
  {
    suggestId: '10', lane: 'plate', priority: 75, badge: 'Grill essential', headline: 'Wrap it up',
    reason: 'Charcoal kebabs were made for warm naan and a squeeze of lemon. Trust your waiter on this one.',
    applies: a => a.cats.has('Grills') && !a.ids.has('10'),
  },
  {
    suggestId: '9', lane: 'plate', priority: 60, badge: 'Cooling side', headline: 'Cool it down',
    reason: 'A cucumber-mint raita is the side every kebab platter is quietly missing.',
    applies: a => a.cats.has('Grills') && !a.ids.has('9'),
  },

  // ── round: upgrade / finish the meal ──────────────────────────────────────
  {
    suggestId: '11', lane: 'round', priority: 72, badge: 'For the table', headline: 'Feed the whole table',
    reason: 'Ordering for the group? The Mixed Grill — seekh, tikka & boti on one sizzling platter — is built to share.',
    applies: a => a.mainsAndGrills >= 2 && !a.ids.has('11'),
  },
  {
    suggestId: '1', lane: 'round', priority: 66, badge: 'Make it a meal', headline: 'Don’t stop at a starter',
    reason: 'Loving the tikka? Our signature Chicken Karahi turns it into a proper Lahori feast.',
    applies: a => a.startersOnly && !a.ids.has('1'),
  },
  {
    suggestId: '4', lane: 'round', priority: 56, badge: 'Save room', headline: 'Leave room for dessert',
    reason: 'Shahi Tukray — saffron-soaked, cardamom cream, crushed pistachio. Regulars say it’s non-negotiable.',
    applies: a => (a.cats.has('Mains') || a.cats.has('Grills')) && !a.cats.has('Desserts') && !a.ids.has('4'),
  },
  {
    suggestId: '6', lane: 'round', priority: 52, badge: 'Local favourite', headline: 'Round it off',
    reason: 'Finish like a local — slow-brewed Peshwari chai with cardamom. The perfect full stop to the meal.',
    applies: a => a.count > 0 && !a.ids.has('6'),
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
    const fbId = a.ids.has('1') ? '6' : '1';
    const fb = ITEM_BY_ID[fbId];
    if (fb && !ex.has(fbId) && !a.ids.has(fbId)) {
      out.push(fbId === '1'
        ? { item: fb, headline: 'Tonight’s favourite', reason: 'Can’t decide? Chicken Karahi is the dish every table comes back for.', badge: 'Trending' }
        : { item: fb, headline: 'Round it off', reason: 'A cup of cardamom Peshwari chai is the perfect way to finish.', badge: 'Local favourite' });
    }
  }
  return out;
}

export function recommend(cart: CartCtx[], opts: RecommendOpts = {}): Suggestion | null {
  return recommendMany(cart, 1, opts)[0] ?? null;
}
