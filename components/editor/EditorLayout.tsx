'use client';

import { useState } from 'react';
import Link from 'next/link';
import { JobMetadata } from '@/lib/types';
import VideoPreview from './VideoPreview';
import SceneList from './SceneList';
import Timeline from './Timeline';
import Badge from '@/components/ui/Badge';
import RenderButton from './RenderButton';
import EditReport from './EditReport';

interface EditorLayoutProps {
  job: JobMetadata;
}

function ReEditSection({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/reanalyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, prompt }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setSuccess(true);
      setPrompt('');
      // The page polling will pick up the status change automatically
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-border-dim bg-app-2/30">
      <div className="max-w-8xl mx-auto px-6 py-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gold transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Re-editar com novo contexto
        </button>

        {open && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3 max-w-2xl">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, 1500))}
                placeholder="Descreva como você quer que o vídeo seja re-editado..."
                rows={3}
                maxLength={1500}
                disabled={loading}
                className="w-full rounded-xl bg-app-2 border border-border-dim focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 text-white placeholder-gray-700 text-sm px-4 py-3 resize-none transition-all duration-200 disabled:opacity-50"
              />
              <span className={`absolute bottom-2.5 right-3 text-xs tabular-nums transition-colors ${prompt.length >= 1350 ? 'text-amber-400' : 'text-gray-700'}`}>
                {prompt.length}/1500
              </span>
            </div>

            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </p>
            )}

            {success && (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Re-análise iniciada! Recarregando...
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-[#FFC933] text-black text-sm font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Re-analisar
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function EditorLayout({ job }: EditorLayoutProps) {
  return (
    <div className="min-h-screen bg-app">
      {/* Secondary Header Bar */}
      <div className="border-b border-border-dim bg-app-2/50 backdrop-blur-sm sticky top-14 z-20">
        <div className="max-w-8xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-mono text-gray-600">job/{job.id.slice(0, 8)}</span>
            <Link
              href="/gallery"
              className="text-xs font-semibold text-gray-500 hover:text-gold transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Galeria
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={job.status === 'done' ? 'success' : job.status === 'error' ? 'error' : 'gold'}>
              {job.status}
            </Badge>
            {job.status === 'editing' && <RenderButton jobId={job.id} />}
            {job.status === 'done' && (
              <a href={`/api/video/${job.id}/output.mp4`} download className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold hover:bg-gold-muted text-black text-sm font-semibold rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(255,184,0,0.2)] hover:shadow-[0_0_28px_rgba(255,184,0,0.35)]">
                Exportar
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-6 py-8 space-y-6">
        {/* Delivery report — only after the render is done */}
        {job.status === 'done' && <EditReport job={job} />}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
          {/* Left Column: Preview + Timeline */}
          <div className="space-y-5">
            <VideoPreview job={job} />
            <Timeline job={job} />
          </div>

          {/* Right Column: Scenes */}
          <div className="order-first xl:order-last">
            <SceneList job={job} />
          </div>
        </div>
      </div>

      {/* Re-edit section (shown when status is editing) */}
      {job.status === 'editing' && <ReEditSection jobId={job.id} />}
    </div>
  );
}
