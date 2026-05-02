'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Overview {
  totalUsers: number;
  activeUsers: number;
  totalJobs: number;
  jobsThisMonth: number;
  totalCostUSD: number;
  totalCostBRL: number;
  monthCostUSD: number;
  monthCostBRL: number;
  statusCounts: Record<string, number>;
}

interface RecentJob {
  id: string;
  userId: string | null;
  status: string;
  duration?: number;
  createdAt: string;
  costUSD: number;
  tokenUsage?: {
    whisperAudioMinutes?: number;
    claudeInputTokens?: number;
    claudeOutputTokens?: number;
    imageGenCount?: number;
  };
}

interface Stats {
  overview: Overview;
  recentJobs: RecentJob[];
}

function StatCard({ label, value, sub, color = 'gold' }: { label: string; value: string; sub?: string; color?: 'gold' | 'violet' | 'emerald' | 'sky' }) {
  const accent: Record<string, string> = {
    gold:    'from-gold/20 to-gold/5 border-gold/20',
    violet:  'from-violet/20 to-violet/5 border-violet/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20',
    sky:     'from-sky-500/20 to-sky-500/5 border-sky-500/20',
  };
  const textColor: Record<string, string> = {
    gold: 'text-gold', violet: 'text-violet', emerald: 'text-emerald-400', sky: 'text-sky-400',
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${accent[color]}`}>
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-black ${textColor[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function fmtBRL(brl: number) {
  return brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtUSD(usd: number) {
  return `US$ ${usd.toFixed(3)}`;
}

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  } catch { return iso; }
}

const STATUS_COLOR: Record<string, string> = {
  done:       'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  error:      'text-red-400 bg-red-500/10 border-red-500/20',
  rendering:  'text-orange-400 bg-orange-500/10 border-orange-500/20',
  analyzing:  'text-violet-400 bg-violet-500/10 border-violet-500/20',
  editing:    'text-gold bg-gold/10 border-gold/20',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-violet/30 border-t-violet animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return <div className="p-8 text-red-400 text-sm">Erro ao carregar estatísticas.</div>;
  }

  const { overview, recentJobs } = stats;

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral do mês atual</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Usuários ativos" value={String(overview.activeUsers)} sub={`de ${overview.totalUsers} cadastrados`} color="violet" />
        <StatCard label="Jobs este mês" value={String(overview.jobsThisMonth)} sub={`${overview.totalJobs} no total`} color="sky" />
        <StatCard label="Custo este mês" value={fmtBRL(overview.monthCostBRL)} sub={fmtUSD(overview.monthCostUSD) + ' (bruto)'} color="gold" />
        <StatCard label="Custo total acumulado" value={fmtBRL(overview.totalCostBRL)} sub={fmtUSD(overview.totalCostUSD) + ' (bruto)'} color="emerald" />
      </div>

      {/* Status breakdown */}
      {Object.keys(overview.statusCounts).length > 0 && (
        <div className="rounded-2xl border border-border-dim bg-surface-1/60 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Jobs por status (este mês)</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(overview.statusCounts).map(([status, count]) => (
              <span
                key={status}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${STATUS_COLOR[status] ?? 'text-gray-400 bg-gray-500/10 border-gray-500/20'}`}
              >
                {status}
                <span className="opacity-70">×{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent jobs */}
      <div className="rounded-2xl border border-border-dim bg-surface-1/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-border-dim flex items-center justify-between">
          <p className="text-sm font-bold text-white">Jobs recentes</p>
          <Link href="/admin/users" className="text-xs text-violet hover:text-violet/80 transition-colors">
            Ver usuários →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-dim text-gray-500">
                <th className="px-5 py-3 text-left font-semibold uppercase tracking-wider">Job ID</th>
                <th className="px-5 py-3 text-left font-semibold uppercase tracking-wider">Usuário</th>
                <th className="px-5 py-3 text-left font-semibold uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right font-semibold uppercase tracking-wider">Whisper</th>
                <th className="px-5 py-3 text-right font-semibold uppercase tracking-wider">Tokens IA</th>
                <th className="px-5 py-3 text-right font-semibold uppercase tracking-wider">Imagens</th>
                <th className="px-5 py-3 text-right font-semibold uppercase tracking-wider">Custo</th>
                <th className="px-5 py-3 text-left font-semibold uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dim">
              {recentJobs.map((job) => (
                <tr key={job.id} className="hover:bg-surface-1 transition-colors">
                  <td className="px-5 py-3 font-mono text-gray-400">{job.id.slice(0, 10)}…</td>
                  <td className="px-5 py-3 text-gray-400">{job.userId ? (
                    <Link href={`/admin/users/${job.userId}`} className="hover:text-violet transition-colors">{job.userId.slice(0, 8)}…</Link>
                  ) : <span className="text-gray-700 italic">sem usuário</span>}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${STATUS_COLOR[job.status] ?? 'text-gray-400 bg-gray-500/10 border-gray-500/20'}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-500">
                    {job.tokenUsage?.whisperAudioMinutes != null ? `${job.tokenUsage.whisperAudioMinutes.toFixed(1)}min` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-500">
                    {job.tokenUsage?.claudeInputTokens != null
                      ? `${((job.tokenUsage.claudeInputTokens + (job.tokenUsage.claudeOutputTokens ?? 0)) / 1000).toFixed(1)}k`
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-500">
                    {job.tokenUsage?.imageGenCount ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-gray-300">
                    {job.costUSD > 0 ? fmtUSD(job.costUSD) : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{fmtDate(job.createdAt)}</td>
                </tr>
              ))}
              {recentJobs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-600">Nenhum job ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
