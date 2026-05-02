'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  plan: string;
  status: string;
  createdAt: string;
  notes?: string;
  limits?: { videosPerMonth?: number; maxVideoDurationSecs?: number; maxStorageMB?: number };
}

interface MonthlyRow {
  month: string;
  jobCount: number;
  whisperAudioMinutes: number;
  claudeInputTokens: number;
  claudeOutputTokens: number;
  imageGenCount: number;
  rawCostUSD: number;
  billedCostBRL: number;
}

interface UserDetail {
  userId: string;
  totalJobs: number;
  monthly: MonthlyRow[];
  totals: Omit<MonthlyRow, 'month'>;
}

const PLAN_OPTIONS = ['free', 'starter', 'pro', 'enterprise'];
const STATUS_OPTIONS = ['active', 'suspended', 'pending'];

function fmtBRL(brl: number) {
  return brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtUSD(usd: number) { return `US$ ${usd.toFixed(4)}`; }
function fmtDate(iso: string) {
  try { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso)); }
  catch { return iso; }
}

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Editable fields
  const [name, setName] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/users?id=${userId}`).then((r) => r.json()),
      fetch(`/api/admin/stats`).then((r) => r.json()),
    ]).then(([u, stats]) => {
      setUser(u);
      setName(u.name ?? '');
      setPlan(u.plan ?? 'free');
      setStatus(u.status ?? 'active');
      setNotes(u.notes ?? '');

      // Build usage detail from per-user jobs in stats
      const userStat = stats.userStats?.find((s: { userId: string }) => s.userId === userId);
      if (userStat) {
        // Build a minimal detail object from the jobs in recentJobs filtered by userId
        const userJobs = (stats.recentJobs ?? []).filter((j: { userId: string }) => j.userId === userId);
        const monthMap: Record<string, MonthlyRow> = {};
        for (const j of userJobs) {
          const m = (j.createdAt as string).slice(0, 7);
          if (!monthMap[m]) monthMap[m] = { month: m, jobCount: 0, whisperAudioMinutes: 0, claudeInputTokens: 0, claudeOutputTokens: 0, imageGenCount: 0, rawCostUSD: 0, billedCostBRL: 0 };
          const row = monthMap[m];
          row.jobCount++;
          row.whisperAudioMinutes += j.tokenUsage?.whisperAudioMinutes ?? 0;
          row.claudeInputTokens   += j.tokenUsage?.claudeInputTokens   ?? 0;
          row.claudeOutputTokens  += j.tokenUsage?.claudeOutputTokens  ?? 0;
          row.imageGenCount       += j.tokenUsage?.imageGenCount        ?? 0;
          row.rawCostUSD          += j.costUSD ?? 0;
          row.billedCostBRL       += (j.costUSD ?? 0) * 5.7 * 1.4;
        }
        const monthly = Object.values(monthMap).sort((a, b) => b.month.localeCompare(a.month));
        const totals: Omit<MonthlyRow, 'month'> = { jobCount: userStat.totalJobs, whisperAudioMinutes: 0, claudeInputTokens: 0, claudeOutputTokens: 0, imageGenCount: 0, rawCostUSD: 0, billedCostBRL: userStat.totalCostBRL };
        for (const m of monthly) { totals.whisperAudioMinutes += m.whisperAudioMinutes; totals.claudeInputTokens += m.claudeInputTokens; totals.claudeOutputTokens += m.claudeOutputTokens; totals.imageGenCount += m.imageGenCount; totals.rawCostUSD += m.rawCostUSD; }
        setDetail({ userId, totalJobs: userStat.totalJobs, monthly, totals });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      const body: Record<string, unknown> = { id: userId, name, plan, status, notes };
      if (newPassword) body.password = newPassword;
      const r = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? 'Erro');
      setSaveMsg('Salvo com sucesso!');
      setNewPassword('');
    } catch (err) {
      setSaveMsg(`Erro: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Excluir usuário ${user?.name}? Esta ação não pode ser desfeita.`)) return;
    await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
    router.push('/admin/users');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="w-7 h-7 rounded-full border-2 border-violet/30 border-t-violet animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <div className="p-8 text-red-400 text-sm">Usuário não encontrado.</div>;
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="text-gray-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white">{user.name}</h1>
          <p className="text-sm text-gray-500">{user.email} · cadastrado em {fmtDate(user.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Usage / cost breakdown */}
        <div className="space-y-4">
          {/* Totals */}
          {detail && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Jobs totais', value: String(detail.totals.jobCount) },
                { label: 'Áudio (min)', value: detail.totals.whisperAudioMinutes.toFixed(1) },
                { label: 'Tokens IA', value: `${((detail.totals.claudeInputTokens + detail.totals.claudeOutputTokens) / 1000).toFixed(1)}k` },
                { label: 'Imagens', value: String(detail.totals.imageGenCount) },
              ].map((c) => (
                <div key={c.label} className="rounded-xl border border-border-dim bg-surface-1/60 p-4">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{c.label}</p>
                  <p className="text-xl font-black text-white mt-1">{c.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Cost totals */}
          {detail && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Custo bruto total</p>
                <p className="text-xl font-black text-gold mt-1">{fmtUSD(detail.totals.rawCostUSD)}</p>
                <p className="text-xs text-gray-600 mt-0.5">sem margem, sem conversão</p>
              </div>
              <div className="rounded-xl border border-violet/20 bg-violet/5 p-4">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">A cobrar (BRL c/ margem)</p>
                <p className="text-xl font-black text-violet mt-1">{fmtBRL(detail.totals.billedCostBRL)}</p>
                <p className="text-xs text-gray-600 mt-0.5">cotação + 40% markup</p>
              </div>
            </div>
          )}

          {/* Monthly breakdown */}
          {detail && detail.monthly.length > 0 && (
            <div className="rounded-2xl border border-border-dim bg-surface-1/60 overflow-hidden">
              <div className="px-5 py-3 border-b border-border-dim">
                <p className="text-xs font-bold text-white">Consumo mensal</p>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-dim text-gray-500">
                    <th className="px-4 py-2 text-left font-semibold uppercase tracking-wider">Mês</th>
                    <th className="px-4 py-2 text-right font-semibold uppercase tracking-wider">Jobs</th>
                    <th className="px-4 py-2 text-right font-semibold uppercase tracking-wider">Áudio</th>
                    <th className="px-4 py-2 text-right font-semibold uppercase tracking-wider">Tokens</th>
                    <th className="px-4 py-2 text-right font-semibold uppercase tracking-wider">Imagens</th>
                    <th className="px-4 py-2 text-right font-semibold uppercase tracking-wider">Custo bruto</th>
                    <th className="px-4 py-2 text-right font-semibold uppercase tracking-wider">A cobrar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dim">
                  {detail.monthly.map((m) => (
                    <tr key={m.month} className="hover:bg-surface-1 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-gray-300">{m.month}</td>
                      <td className="px-4 py-2.5 text-right text-gray-400">{m.jobCount}</td>
                      <td className="px-4 py-2.5 text-right text-gray-400">{m.whisperAudioMinutes.toFixed(1)}min</td>
                      <td className="px-4 py-2.5 text-right text-gray-400">{((m.claudeInputTokens + m.claudeOutputTokens) / 1000).toFixed(1)}k</td>
                      <td className="px-4 py-2.5 text-right text-gray-400">{m.imageGenCount}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-gray-300">{fmtUSD(m.rawCostUSD)}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-gold">{fmtBRL(m.billedCostBRL)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit form */}
        <div className="rounded-2xl border border-border-dim bg-surface-1/60 p-5 space-y-4 h-fit">
          <h2 className="text-sm font-bold text-white">Editar perfil</h2>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Nome</label>
              <input
                type="text" value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg bg-app-2 border border-border-dim focus:border-violet/50 focus:outline-none text-white text-sm px-3 py-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Plano</label>
              <select
                value={plan} onChange={(e) => setPlan(e.target.value)}
                className="w-full rounded-lg bg-app-2 border border-border-dim focus:border-violet/50 focus:outline-none text-white text-sm px-3 py-2"
              >
                {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</label>
              <select
                value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg bg-app-2 border border-border-dim focus:border-violet/50 focus:outline-none text-white text-sm px-3 py-2"
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Nova senha (opcional)</label>
              <input
                type="text" value={newPassword} placeholder="Deixe vazio para manter"
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg bg-app-2 border border-border-dim focus:border-violet/50 focus:outline-none text-white text-sm px-3 py-2 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Observações internas</label>
              <textarea
                value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                className="w-full rounded-lg bg-app-2 border border-border-dim focus:border-violet/50 focus:outline-none text-white text-sm px-3 py-2 resize-none"
              />
            </div>
            {saveMsg && (
              <p className={`text-xs ${saveMsg.startsWith('Erro') ? 'text-red-400' : 'text-emerald-400'}`}>{saveMsg}</p>
            )}
            <button
              type="submit" disabled={saving}
              className="w-full py-2.5 rounded-xl bg-violet hover:bg-violet/80 text-white text-sm font-bold disabled:opacity-50 transition-all"
            >
              {saving ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </form>

          <div className="pt-2 border-t border-border-dim">
            <button
              onClick={handleDelete}
              className="w-full py-2 rounded-xl border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/10 transition-all"
            >
              Excluir usuário
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
