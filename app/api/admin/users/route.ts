import { NextRequest, NextResponse } from 'next/server';
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser,
} from '@/lib/users';
import type { UserPlan, UserStatus } from '@/lib/types';

export const runtime = 'nodejs';

// GET /api/admin/users          → list all users
// GET /api/admin/users?id=xxx   → get single user
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (id) {
    const user = await getUserById(id);
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const safe = { ...user, passwordHash: undefined };
    return NextResponse.json(safe);
  }
  const users = await listUsers();
  const safe = users.map((u) => ({ ...u, passwordHash: undefined }));
  return NextResponse.json(safe);
}

// POST /api/admin/users → create user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password, plan, status, notes } = body;
    if (!email || !name || !password) {
      return NextResponse.json({ error: 'email, name and password are required' }, { status: 400 });
    }
    const user = await createUser({ email, name, password, plan, status, notes });
    return NextResponse.json({ ...user, passwordHash: undefined }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

// PATCH /api/admin/users → update user
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, password, ...patch } = body;
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    if (password) await updateUserPassword(id, password);

    const user = await updateUser(id, patch as Partial<{ name: string; email: string; plan: UserPlan; status: UserStatus; notes: string }>);
    return NextResponse.json({ ...user, passwordHash: undefined });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

// DELETE /api/admin/users?id=xxx
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  await deleteUser(id);
  return NextResponse.json({ success: true });
}
