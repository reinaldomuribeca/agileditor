'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { JobMetadata, JobStatus } from '@/lib/types';

function StatusBadge({ status }: { status: JobStatus }) {
  const variants: Record<string, string> = {
    done: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    editing: 'bg-gold/10 text-gold border border-gold/20',
    error: 'bg-red-500/10 text-red-400 border border-red-500/20',
    analyzing: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
    transcribing: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    rendering: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    normalizing: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
    uploading: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${variants[status] ?? 'bg-gray-500/10 text-gray-400'}`}>
      {status}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function GalleryPage() {
  const [jobs, setJobs] = useState<JobMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/jobs')
      .then((r) => r.json())
      .then((data) => {
        setJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Falha ao carregar os vídeos.');
        setLoading(false);
      });
  }, []);

  const visibleJobs = jobs.filter((j) =>
    ['done', 'editing', 'error', 'analyzing', 'rendering', 'transcribing', 'normalizing'].includes(j.status)
  );

  return (
    <div className="min-h-screen bg-app">
      {/* Header */}
      <header className="border-b border-border-dim bg-app-2/60 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </Link>
            <span className="h-4 w-px bg-border-dim" />
            <span className="text-sm font-semibold text-white">Galeria de Vídeos</span>
          </div>
          <Link
            href="/app"
            className="text-xs font-semibold text-gold hover:text-gold/80 transition-colors"
          >
            + Novo vídeo
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
            <p className="text-sm text-gray-500">Carregando vídeos...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-24">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && visibleJobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-1 border border-border-dim flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold">Nenhum vídeo ainda</p>
              <p className="text-sm text-gray-500 mt-1">Faça upload de um vídeo para começar</p>
            </div>
            <Link
              href="/app"
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-[#FFC933] text-black text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Enviar vídeo
            </Link>
          </div>
        )}

        {!loading && !error && visibleJobs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleJobs.map((job) => (
              <div
                key={job.id}
                className="glass-premium rounded-2xl border border-border-dim hover:border-border-mid transition-all duration-200 overflow-hidden flex flex-col"
              >
                {/* Card header */}
                <div className="p-5 flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-mono text-gray-600 truncate">{job.id.slice(0, 12)}…</span>
                    <StatusBadge status={job.status} />
                  </div>

                  {/* Prompt preview */}
                  <p className="text-sm text-gray-300 leading-snug line-clamp-2 min-h-[2.5rem]">
                    {job.prompt || job.analysis?.summary || (
                      <span className="text-gray-600 italic">Sem contexto</span>
                    )}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDuration(job.duration)}
                    </span>
                    <span className="h-3 w-px bg-border-dim" />
                    <span>{formatDate(job.createdAt)}</span>
                  </div>

                  {/* Feature tags */}
                  {(job.legendar !== undefined || job.animator !== undefined) && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {job.legendar && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gold/10 text-gold border border-gold/20">
                          Legendas
                        </span>
                      )}
                      {job.animator && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                          Animator
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card actions */}
                <div className="border-t border-border-dim px-5 py-3 flex items-center gap-2">
                  {job.status === 'done' && (
                    <a
                      href={`/api/video/${job.id}/output.mp4`}
                      download
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-gold to-[#FFC933] text-black text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                  )}
                  {(job.status === 'done' || job.status === 'editing') && (
                    <Link
                      href={`/editor/${job.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border-mid text-white text-xs font-semibold hover:border-gold/40 hover:text-gold transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Abrir Editor
                    </Link>
                  )}
                  {job.status === 'error' && (
                    <Link
                      href={`/editor/${job.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/20 text-red-400 text-xs font-semibold hover:border-red-500/40 transition-all"
                    >
                      Ver erro
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
