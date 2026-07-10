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

export const CATEGORIES = ['All', 'Burgers', 'Pizza', 'Chicken', 'Sides', 'Desserts', 'Drinks'];

export const MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Classic Smash Burger', desc: 'Double smashed beef patties, melted cheddar, pickles & house burger sauce', price: 850, tag: 'Trending', emoji: '🍔', category: 'Burgers', gluten: true, image: '/images/burger-smash.jpg', modelUrl: '/models/burger.glb' },
  { id: '2', name: 'Crispy Chicken Burger', desc: 'Buttermilk-fried chicken fillet, lettuce & mayo in a toasted brioche bun', price: 780, tag: 'New', emoji: '🍔', category: 'Burgers', gluten: true, image: '/images/burger-chicken.jpg' },
  { id: '3', name: 'Margherita Pizza', desc: 'Wood-fired, San Marzano tomato, fresh mozzarella & basil', price: 1450, tag: "Chef's Pick", emoji: '🍕', category: 'Pizza', gluten: true, image: '/images/pizza-margherita.jpg' },
  { id: '4', name: 'Crispy Chicken Sando', desc: 'Buttermilk-fried chicken, pickles & spicy mayo in a soft bun', price: 650, tag: 'Popular', emoji: '🥪', category: 'Chicken', spicy: true, gluten: true, image: '/images/chicken-sando.jpg' },
  { id: '5', name: 'Fried Chicken Bucket', desc: 'Eight pieces of crunchy buttermilk fried chicken — built to share', price: 1990, tag: 'For the Table', emoji: '🍗', category: 'Chicken', image: '/images/fried-chicken.jpg' },
  { id: '6', name: 'Loaded Fries', desc: 'Crispy fries smothered in melted cheese & rich gravy', price: 450, tag: null, emoji: '🍟', category: 'Sides', image: '/images/loaded-fries.jpg' },
  { id: '7', name: 'Fudge Brownie', desc: 'Warm chocolate brownie with a molten fudge centre', price: 420, tag: null, emoji: '🍫', category: 'Desserts', gluten: true, image: '/images/brownie.jpg' },
  { id: '8', name: 'Classic Cola', desc: 'Ice-cold cola, served chilled', price: 220, tag: null, emoji: '🥤', category: 'Drinks' },
  { id: '9', name: 'Chocolate Shake', desc: 'Thick, hand-spun chocolate shake', price: 480, tag: null, emoji: '🥤', category: 'Drinks' },
];

export const EXTRAS = [
  { id: 'cheese', name: 'Extra Cheese', price: 80 },
  { id: 'bacon', name: 'Add Bacon', price: 120 },
  { id: 'make-spicy', name: 'Make it Spicy', price: 0 },
];

// O(1) lookup so order/bill/kitchen rows can show a dish photo from just its id.
export const ITEM_BY_ID: Record<string, MenuItem> = Object.fromEntries(
  MENU_ITEMS.map(i => [i.id, i])
);

export const RESTAURANT = {
  name: 'Cheat Day',
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

// ── Group bill payment tracking ───────────────────────────────────────────────

export interface MemberPayment {
  sid: string;
  name: string;
  initials: string;
  amount: number;
  method: string;
  paidAt: number;
}

export interface BillSplit {
  method: string;
  amounts: Record<string, number>; // sessionId → amount owed
  setAt: number;
  setBySid: string;
  setByName: string;
}