'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UserStat {
  userId: string;
  email: string;
  name: string;
  plan: string;
  status: string;
  totalJobs: number;
  jobsThisMonth: number;
  totalCostBRL: number;
  monthCostBRL: number;
  lastJobAt: string | null;
}

const PLAN_COLOR: Record<string, string> = {
  free:       'text-gray-400  bg-gray-500/10  border-gray-500/20',
  starter:    'text-sky-400   bg-sky-500/10   border-sky-500/20',
  pro:        'text-gold      bg-gold/10      border-gold/20',
  enterprise: 'text-violet   bg-violet/10   border-violet/20',
};

const STATUS_COLOR: Record<string, string> = {
  active:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  suspended: 'text-red-400     bg-red-500/10     border-red-500/20',
  pending:   'text-amber-400   bg-amber-500/10   border-amber-500/20',
};

function fmtBRL(brl: number) {
  return brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  try { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(iso)); }
  catch { return iso; }
}

interface NewUserForm {
  name: string; email: string; password: string; plan: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<NewUserForm>({ name: '', email: '', password: '', plan: 'starter' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  async function loadStats() {
    const r = await fetch('/api/admin/stats');
    const d = await r.json();
    setUsers(d.userStats ?? []);
    setLoading(false);
  }

  useEffect(() => { loadStats(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const r = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error ?? 'Erro ao criar usuário');
      }
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', plan: 'starter' });
      await loadStats();
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function toggleStatus(userId: string, current: string) {
    const next = current === 'active' ? 'suspended' : 'active';
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, status: next }),
    });
    await loadStats();
  }

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Usuários</h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} cadastrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet hover:bg-violet/80 text-white text-sm font-bold transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo usuário
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-2xl border border-violet/30 bg-violet/5 p-6">
          <h2 className="text-sm font-bold text-white mb-4">Criar novo usuário</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Nome</label>
              <input
                type="text" required value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg bg-app-2 border border-border-dim focus:border-violet/50 focus:outline-none text-white text-sm px-3 py-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">E-mail</label>
              <input
                type="email" required value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg bg-app-2 border border-border-dim focus:border-violet/50 focus:outline-none text-white text-sm px-3 py-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Senha inicial</label>
              <input
                type="text" required value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Compartilhe com o usuário"
                className="w-full rounded-lg bg-app-2 border border-border-dim focus:border-violet/50 focus:outline-none text-white text-sm px-3 py-2 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Plano</label>
              <select
                value={form.plan}
                onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                className="w-full rounded-lg bg-app-2 border border-border-dim focus:border-violet/50 focus:outline-none text-white text-sm px-3 py-2"
              >
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            {createError && (
              <div className="col-span-2 text-xs text-red-400">{createError}</div>
            )}
            <div className="col-span-2 flex items-center gap-3">
              <button
                type="submit" disabled={creating}
                className="px-5 py-2 rounded-xl bg-violet hover:bg-violet/80 text-white text-sm font-bold disabled:opacity-50 transition-all"
              >
                {creating ? 'Criando…' : 'Criar usuário'}
              </button>
              <button
                type="button" onClick={() => setShowCreate(false)}
                className="px-5 py-2 rounded-xl border border-border-dim text-gray-400 text-sm hover:text-white transition-all"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 rounded-full border-2 border-violet/30 border-t-violet animate-spin" />
        </div>
      ) : (
        <div className="rounded-2xl border border-border-dim bg-surface-1/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-dim text-gray-500">
                  <th className="px-5 py-3 text-left font-semibold uppercase tracking-wider">Nome / E-mail</th>
                  <th className="px-5 py-3 text-left font-semibold uppercase tracking-wider">Plano</th>
                  <th className="px-5 py-3 text-left font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-right font-semibold uppercase tracking-wider">Jobs (mês)</th>
                  <th className="px-5 py-3 text-right font-semibold uppercase tracking-wider">Custo mês</th>
                  <th className="px-5 py-3 text-right font-semibold uppercase tracking-wider">Custo total</th>
                  <th className="px-5 py-3 text-left font-semibold uppercase tracking-wider">Último job</th>
                  <th className="px-5 py-3 text-left font-semibold uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dim">
                {users.map((u) => (
                  <tr key={u.userId} className="hover:bg-surface-1 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/admin/users/${u.userId}`} className="hover:text-violet transition-colors">
                        <p className="font-semibold text-white">{u.name}</p>
                        <p className="text-gray-500">{u.email}</p>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${PLAN_COLOR[u.plan] ?? 'text-gray-400'}`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${STATUS_COLOR[u.status] ?? 'text-gray-400'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-gray-300">{u.jobsThisMonth} / {u.totalJobs}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-300">
                      {u.monthCostBRL > 0 ? fmtBRL(u.monthCostBRL) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-gray-400">
                      {u.totalCostBRL > 0 ? fmtBRL(u.totalCostBRL) : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{fmtDate(u.lastJobAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/users/${u.userId}`}
                          className="px-2.5 py-1 rounded-lg border border-border-dim text-gray-400 hover:text-violet hover:border-violet/30 transition-all"
                        >
                          Ver
                        </Link>
                        <button
                          onClick={() => toggleStatus(u.userId, u.status)}
                          className={`px-2.5 py-1 rounded-lg border transition-all text-[10px] font-bold ${
                            u.status === 'active'
                              ? 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                              : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspender' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-gray-600">
                      Nenhum usuário cadastrado. Crie o primeiro acima.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
