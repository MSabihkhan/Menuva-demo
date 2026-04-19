import { NextRequest, NextResponse } from 'next/server';
import type { GroupMember } from '@/data/menu';

interface TableState {
  members: GroupMember[];
  orderStatus: string;
  updatedAt: number;
}

const TABLE_KEY_PREFIX = 'menuva:table:';
const STALE_MS = 4 * 60 * 60 * 1000;

// Survive warm lambda instances — module-level Map resets on cold start
declare const globalThis: typeof global & { __menuvaStore?: Map<string, TableState> };
if (!globalThis.__menuvaStore) globalThis.__menuvaStore = new Map();
const inMemoryStore = globalThis.__menuvaStore;

const KV_AVAILABLE = !!(
  process.env.KV_REST_API_URL &&
  process.env.KV_REST_API_TOKEN
);

async function getTable(tableId: string): Promise<TableState> {
  if (KV_AVAILABLE) {
    try {
      const { kv } = await import('@vercel/kv');
      const data = await kv.get<TableState>(`${TABLE_KEY_PREFIX}${tableId}`);
      if (data) return data;
    } catch { /* fall through */ }
  }
  return inMemoryStore.get(tableId) ?? { members: [], orderStatus: 'idle', updatedAt: 0 };
}

async function saveTable(tableId: string, state: TableState): Promise<void> {
  state.updatedAt = Date.now();
  inMemoryStore.set(tableId, state);
  if (KV_AVAILABLE) {
    try {
      const { kv } = await import('@vercel/kv');
      await kv.set(`${TABLE_KEY_PREFIX}${tableId}`, state, { ex: 86400 });
    } catch { /* in-memory already saved above */ }
  }
}

function pruneStale(state: TableState): TableState {
  if (Date.now() - state.updatedAt > STALE_MS) {
    return { members: [], orderStatus: 'idle', updatedAt: Date.now() };
  }
  return state;
}

type Params = { tableId: string } | Promise<{ tableId: string }>;

export async function GET(
  _req: NextRequest,
  { params }: { params: Params }
) {
  const { tableId } = await Promise.resolve(params);
  const s = pruneStale(await getTable(tableId));
  return NextResponse.json({
    members: s.members,
    orderStatus: s.orderStatus,
    debug: `KV:${KV_AVAILABLE ? 'ON' : 'OFF'}`,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Params }
) {
  const { tableId } = await Promise.resolve(params);
  const body = await req.json() as {
    action: 'join' | 'updateCart' | 'placeOrder' | 'reset' | 'leave';
    member?: GroupMember;
    memberId?: string;
    items?: GroupMember['items'];
  };

  const s = pruneStale(await getTable(tableId));

  switch (body.action) {
    case 'join': {
      if (!body.member) break;
      const idx = s.members.findIndex(m => m.id === body.member!.id);
      if (idx >= 0) s.members[idx] = { ...body.member, isCurrentUser: false };
      else s.members.push({ ...body.member, isCurrentUser: false });
      break;
    }
    case 'updateCart': {
      if (!body.memberId || !body.items) break;
      const idx = s.members.findIndex(m => m.id === body.memberId);
      if (idx >= 0) s.members[idx] = { ...s.members[idx], items: body.items };
      break;
    }
    case 'placeOrder': {
      s.orderStatus = 'placed';
      break;
    }
    case 'reset': {
      s.members = s.members.map(m => ({ ...m, items: [] }));
      s.orderStatus = 'idle';
      break;
    }
    case 'leave': {
      if (!body.memberId) break;
      s.members = s.members.filter(m => m.id !== body.memberId);
      break;
    }
  }

  await saveTable(tableId, s);
  return NextResponse.json({ ok: true, members: s.members, orderStatus: s.orderStatus });
}
