import { NextRequest, NextResponse } from 'next/server';
import type { GroupMember } from '@/data/menu';

interface TableState {
  members: GroupMember[];
  orderStatus: string;
  updatedAt: number;
}

// Global in-memory store — persists within the same serverless instance.
// Production upgrade: swap to Vercel KV (`import { kv } from '@vercel/kv'`)
declare global {
  // eslint-disable-next-line no-var
  var __menuvaStore: Map<string, TableState> | undefined;
}
const store: Map<string, TableState> =
  globalThis.__menuvaStore ??
  (globalThis.__menuvaStore = new Map<string, TableState>());

const STALE_MS = 4 * 60 * 60 * 1000; // 4 h

function prune() {
  const now = Date.now();
  for (const [id, s] of store) {
    if (now - s.updatedAt > STALE_MS) store.delete(id);
  }
}

function getOrCreate(tableId: string): TableState {
  return store.get(tableId) ?? { members: [], orderStatus: 'idle', updatedAt: 0 };
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
  prune();
  const tableId = await resolveTableId(params);
  const s = getOrCreate(tableId);
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

  const s = getOrCreate(tableId);

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

  s.updatedAt = Date.now();
  store.set(tableId, s);
  return NextResponse.json({ ok: true, members: s.members, orderStatus: s.orderStatus });
}
