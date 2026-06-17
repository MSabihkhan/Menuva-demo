// ── Waiter-style upsell engine ────────────────────────────────────────────────
// Hardcoded pairing rules that read the live cart and surface the single most
// relevant complementary dish — the way a sharp waiter reads a table and says
// "you'll want naan with that." Rules are prioritised; the highest-priority
// applicable suggestion (not already in the cart) wins.

import { MenuItem, ITEM_BY_ID } from './menu';

export interface Suggestion {
  item: MenuItem;
  headline: string; // short hook, e.g. "Tame the heat"
  reason: string;   // the waiter's pitch
  badge: string;    // social-proof / context chip, e.g. "Most paired"
}

export interface CartCtx {
  id: string;
  category: string;
  spicy?: boolean;
}

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
  priority: number;
  badge: string;
  headline: string;
  reason: string;
  applies: (a: Analysis) => boolean;
}

// Higher priority = a sharper, more contextual pairing.
const RULES: Rule[] = [
  {
    suggestId: '9', priority: 95, badge: 'Cools the heat', headline: 'Tame the spice',
    reason: 'That masala packs real heat — a cool mint raita is how Lahori regulars balance every bite.',
    applies: a => a.hasSpicy && !a.ids.has('9'),
  },
  {
    suggestId: '9', priority: 90, badge: 'The classic combo', headline: 'Biryani’s best friend',
    reason: 'Biryani without raita? Not at this table. The cool yogurt cuts the spice perfectly.',
    applies: a => a.ids.has('8') && !a.ids.has('9'),
  },
  {
    suggestId: '10', priority: 80, badge: 'Most paired', headline: 'Scoop up every bite',
    reason: 'Fresh tandoor naan, straight from the oven — you’ll want it to mop up all that rich gravy.',
    applies: a => a.cats.has('Mains') && !a.ids.has('10'),
  },
  {
    suggestId: '10', priority: 75, badge: 'Grill essential', headline: 'Wrap it up',
    reason: 'Charcoal kebabs were made for warm naan and a squeeze of lemon. Trust your waiter on this one.',
    applies: a => a.cats.has('Grills') && !a.ids.has('10'),
  },
  {
    suggestId: '11', priority: 70, badge: 'For the table', headline: 'Feed the whole table',
    reason: 'Ordering for the group? The Mixed Grill — seekh, tikka & boti on one sizzling platter — is built to share.',
    applies: a => a.mainsAndGrills >= 2 && !a.ids.has('11'),
  },
  {
    suggestId: '1', priority: 65, badge: 'Make it a meal', headline: 'Don’t stop at a starter',
    reason: 'Loving the tikka? Our signature Chicken Karahi turns it into a proper Lahori feast.',
    applies: a => a.startersOnly && !a.ids.has('1'),
  },
  {
    suggestId: '6', priority: 50, badge: 'Local favourite', headline: 'Round it off',
    reason: 'Finish like a local — slow-brewed Peshwari chai with cardamom. The perfect full stop to the meal.',
    applies: a => a.count > 0 && !a.ids.has('6'),
  },
  {
    suggestId: '4', priority: 45, badge: 'Save room', headline: 'Leave room for dessert',
    reason: 'Shahi Tukray — saffron-soaked, cardamom cream, crushed pistachio. Regulars say it’s non-negotiable.',
    applies: a => (a.cats.has('Mains') || a.cats.has('Grills')) && !a.cats.has('Desserts') && !a.ids.has('4'),
  },
];

export function recommendMany(cart: CartCtx[], n = 1, exclude: string[] = []): Suggestion[] {
  const a = analyze(cart);
  const ex = new Set(exclude);
  const out: Suggestion[] = [];
  const used = new Set<string>();

  for (const r of [...RULES].sort((x, y) => y.priority - x.priority)) {
    if (out.length >= n) break;
    if (ex.has(r.suggestId) || used.has(r.suggestId) || a.ids.has(r.suggestId)) continue;
    if (!r.applies(a)) continue;
    const item = ITEM_BY_ID[r.suggestId];
    if (!item) continue;
    out.push({ item, headline: r.headline, reason: r.reason, badge: r.badge });
    used.add(r.suggestId);
  }

  // Never show nothing: fall back to the house favourite.
  if (out.length === 0) {
    const fb = ITEM_BY_ID['1'];
    if (fb && !a.ids.has('1') && !ex.has('1')) {
      out.push({ item: fb, headline: 'Tonight’s favourite', reason: 'Can’t decide? Chicken Karahi is the dish every table comes back for.', badge: 'Trending' });
    }
  }
  return out;
}

export function recommend(cart: CartCtx[], exclude: string[] = []): Suggestion | null {
  return recommendMany(cart, 1, exclude)[0] ?? null;
}
