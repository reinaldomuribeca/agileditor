import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/users';
import type { UserPlan } from '@/lib/types';

export const runtime = 'nodejs';

const ALLOWED_PLANS: UserPlan[] = ['free', 'starter', 'pro', 'enterprise'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, plan, phone } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Nome inválido.' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'A senha deve ter no mínimo 8 caracteres.' }, { status: 400 });
    }

    const safePlan: UserPlan = ALLOWED_PLANS.includes(plan) ? plan : 'starter';

    const user = await createUser({
      name: name.trim().slice(0, 100),
      email: email.toLowerCase().trim(),
      password,
      plan: safePlan,
      status: 'pending', // awaiting payment confirmation by admin
      notes: phone ? `WhatsApp: ${String(phone).slice(0, 30)}` : undefined,
    });

    console.log(`[register] new pending user: ${user.email} (${safePlan})`);

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (err) {
    const msg = (err as Error).message ?? 'Erro desconhecido';
    // Surface duplicate email as a friendly message
    if (msg.includes('já cadastrado')) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 409 });
    }
    console.error('[register] error:', msg);
    return NextResponse.json({ error: 'Não foi possível criar a conta. Tente novamente.' }, { status: 500 });
  }
}
