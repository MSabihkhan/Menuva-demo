export interface MenuItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  tag: string | null;
  emoji: string;
  category: string;
  spicy?: boolean;
  gluten?: boolean;
  modelUrl?: string;
  image?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
  extras: string[];
}

export interface GroupMember {
  id: string;
  name: string;
  initials: string;
  items: CartItem[];
  isCurrentUser?: boolean;
}

export interface Toast {
  id: string;
  message: string;
  initials?: string;
  success?: boolean;
}

export const CATEGORIES = ['All', 'Starters', 'Mains', 'Grills', 'Desserts', 'Drinks'];

export const MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Chicken Karahi', desc: 'Slow-cooked with hand-crushed tomatoes & 12-spice masala', price: 1200, tag: 'Trending', emoji: '🍛', category: 'Mains', spicy: true, gluten: true, image: '/images/karahi.jpg', modelUrl: '/models/burger.glb' },
  { id: '2', name: 'Seekh Kebab Platter', desc: 'Minced beef skewers, charcoal-grilled, with mint chutney', price: 950, tag: 'New', emoji: '🍢', category: 'Grills', image: '/images/kebab.jpg' },
  { id: '3', name: 'Daal Makhani', desc: 'Black lentils simmered overnight in butter and cream', price: 650, tag: "Chef's Pick", emoji: '🥘', category: 'Mains', image: '/images/dal.jpg' },
  { id: '4', name: 'Shahi Tukray', desc: 'Saffron-soaked bread, cardamom cream, pistachio', price: 450, tag: null, emoji: '🍮', category: 'Desserts' },
  { id: '5', name: 'Seekh Kebab ×2', desc: 'Double portion of our signature seekh kebab', price: 1900, tag: null, emoji: '🍢', category: 'Grills', image: '/images/kebab.jpg' },
  { id: '11', name: 'Mixed Grill Platter', desc: 'Seekh kebab, chicken tikka & boti kabab — charcoal-grilled for the whole table', price: 2200, tag: 'For the Table', emoji: '🍖', category: 'Grills', image: '/images/grill.jpg' },
  { id: '6', name: 'Peshwari Chai', desc: 'Cardamom-spiced Kashmiri tea', price: 180, tag: null, emoji: '🍵', category: 'Drinks', image: '/images/chai.jpg' },
  { id: '7', name: 'Chicken Tikka', desc: 'Tandoor-roasted chicken in yogurt marinade', price: 850, tag: 'Popular', emoji: '🍗', category: 'Starters', image: '/images/tikka.jpg' },
  { id: '8', name: 'Vegetable Biryani', desc: 'Fragrant basmati rice with mixed vegetables', price: 550, tag: null, emoji: '🍚', category: 'Mains', image: '/images/biryani.jpg' },
  { id: '9', name: 'Raita', desc: 'Cool yogurt with cucumber and mint', price: 120, tag: null, emoji: '🥒', category: 'Drinks' },
  { id: '10', name: 'Extra Naan', desc: 'Freshly baked tandoor flatbread', price: 60, tag: null, emoji: '🥯', category: 'Drinks' },
];

export const EXTRAS = [
  { id: 'naan', name: 'Extra Naan', price: 60 },
  { id: 'raita', name: 'Add Raita', price: 80 },
  { id: 'extra-spicy', name: 'Extra Spicy', price: 0 },
];

// O(1) lookup so order/bill/kitchen rows can show a dish photo from just its id.
export const ITEM_BY_ID: Record<string, MenuItem> = Object.fromEntries(
  MENU_ITEMS.map(i => [i.id, i])
);

export const RESTAURANT = {
  name: 'Lahori Darbar',
  table: 'Table 7',
};

// ── Orders timeline (backend-owned) ───────────────────────────────────────────

export type OrderStatus = 'placed' | 'preparing' | 'ready' | 'served';

export interface OrderLineItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  extras: string[];
  byName: string;
  bySid: string;
}

export interface Order {
  id: string;
  round: number;
  placedAt: number;
  etaMinutes: number;
  status: OrderStatus;
  lineItems: OrderLineItem[];
  paid?: boolean;
  paymentMethod?: string;
  paidAt?: number;
  kitchenNotes?: string;
}