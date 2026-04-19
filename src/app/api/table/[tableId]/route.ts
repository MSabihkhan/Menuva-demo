import { NextRequest, NextResponse } from 'next/server';
import type { GroupMember } from '@/data/menu';

interface TableState {
  members: GroupMember[];
  orderStatus: string;
  updatedAt: number;
}

const TABLE_KEY_PREFIX = 'menuva:table:';
const STALE_MS = 4 * 60 * 60 * 1000;

const inMemoryStore: Map<string, TableState> = new Map();

function getInMemoryTable(tableId: string): TableState {
  return inMemoryStore.get(tableId) ?? { members: [], orderStatus: 'idle', updatedAt: 0 };
}

function setInMemoryTable(tableId: string, state: TableState): void {
  inMemoryStore.set(tableId, state);
}

async function getKvTable(tableId: string): Promise<TableState | null> {
  try {
    const { kv } = await import('@vercel/kv');
    const key = `${TABLE_KEY_PREFIX}${tableId}`;
    const data = await kv.get<TableState>(key);
    return data;
  } catch {
    return null;
  }
}

async function setKvTable(tableId: string, state: TableState): Promise<void> {
  try {
    const { kv } = await import('@vercel/kv');
    const key = `${TABLE_KEY_PREFIX}${tableId}`;
    await kv.set(key, state, { ex: 86400 });
  } catch {
    // Fallback to in-memory
  }
}

async function getTable(tableId: string): Promise<TableState> {
  const kvData = await getKvTable(tableId);
  if (kvData) return kvData;
  return getInMemoryTable(tableId);
}

async function saveTable(tableId: string, state: TableState): Promise<void> {
  state.updatedAt = Date.now();
  setInMemoryTable(tableId, state);
  await setKvTable(tableId, state);
}

function pruneTable(tableId: string, state: TableState): TableState {
  const now = Date.now();
  if (now - state.updatedAt > STALE_MS) {
    return { members: [], orderStatus: 'idle', updatedAt: now };
  }
  return state;
}

type Params = { tableId: string } | Promise<{ tableId: string }>;

async function resolveTableId(params: Params): Promise<string> {
  const p = await Promise.resolve(params);
  return p.tableId;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Params }
) {
  const tableId = await resolveTableId(params);
  let s = await getTable(tableId);
  s = pruneTable(tableId, s);
  return NextResponse.json({ members: s.members, orderStatus: s.orderStatus });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Params }
) {
  const tableId = await resolveTableId(params);
  const body = await req.json() as {
    action: 'join' | 'updateCart' | 'placeOrder' | 'reset' | 'leave';
    member?: GroupMember;
    memberId?: string;
    items?: GroupMember['items'];
  };

  let s = await getTable(tableId);
  s = pruneTable(tableId, s);

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
