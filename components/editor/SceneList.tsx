'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { JobMetadata, SceneInput } from '@/lib/types';

interface SceneListProps {
  job: JobMetadata;
}

/** Run an async task per item with at most `limit` running concurrently. */
async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export default function SceneList({ job }: SceneListProps) {
  const [scenes, setScenes] = useState<SceneInput[]>(job.analysis?.scenes || []);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentimentStyle = (s: string) => ({
    positive: { backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' },
    negative: { backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' },
    exciting: { backgroundColor: 'rgba(139,92,246,0.1)', color: '#8B5CF6' },
    neutral: { backgroundColor: 'rgba(107,114,128,0.1)', color: '#6b7280' },
  }[s] ?? {});

  const generateOne = async (scene: SceneInput): Promise<void> => {
    if (!scene.imagePrompt) return;
    setPending((p) => new Set(p).add(scene.id));
    setError(null);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          sceneId: scene.id,
          imagePrompt: scene.imagePrompt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setScenes((prev) =>
        prev.map((s) => (s.id === scene.id ? { ...s, imageUrl: data.imageUrl } : s)),
      );
    } catch (err) {
      setError(`Cena ${scene.id}: ${(err as Error).message}`);
    } finally {
      setPending((p) => {
        const next = new Set(p);
        next.delete(scene.id);
        return next;
      });
    }
  };

  const generateAll = async () => {
    if (bulkRunning) return;
    const targets = scenes.filter((s) => s.imagePrompt && !s.imageUrl);
    if (targets.length === 0) return;
    setBulkRunning(true);
    setError(null);
    try {
      await runWithConcurrency(targets, 3, generateOne);
    } finally {
      setBulkRunning(false);
    }
  };

  const missingImages = scenes.filter((s) => s.imagePrompt && !s.imageUrl).length;

  return (
    <div className="glass-premium rounded-3xl border border-border-dim flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border-dim flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Scenes</span>
          {scenes.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-gold/10 text-gold text-xs font-bold tabular-nums">
              {scenes.length}
            </span>
          )}
        </div>
        {job.analysis?.format && (
          <span className="text-xs text-gray-500 capitalize">{job.analysis.format}</span>
        )}
      </div>

      {/* Bulk generate button */}
      {missingImages > 0 && (
        <div className="px-5 py-3 border-b border-border-dim flex items-center justify-between gap-3">
          <span className="text-xs text-gray-500">
            {missingImages} cena{missingImages !== 1 ? 's' : ''} sem imagem
          </span>
          <button
            type="button"
            onClick={generateAll}
            disabled={bulkRunning}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-gold to-[#FFC933] text-black text-xs font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {bulkRunning ? (
              <>
                <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Gerar todas as imagens
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="px-5 py-2 border-b border-border-dim text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Empty State */}
      {scenes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-5 py-8">
          <div className="text-center space-y-3 w-full">
            <div className="h-2 skeleton rounded-full mx-auto" style={{ width: '100%' }} />
            <div className="h-2 skeleton rounded-full mx-auto" style={{ width: '80%' }} />
            <div className="h-2 skeleton rounded-full mx-auto" style={{ width: '60%' }} />
            <p className="text-xs text-gray-600 mt-4">Analyzing your video...</p>
          </div>
        </div>
      ) : (
        /* Scene List */
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {scenes.map((scene, index) => {
            const isPending = pending.has(scene.id);
            return (
              <motion.div
                key={scene.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative rounded-xl p-4 border-l-2 border-transparent hover:border-l-gold bg-surface-1 border border-border-dim hover:border-gold/20 transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  {/* Index badge / image thumb */}
                  {scene.imageUrl ? (
                    <img
                      src={scene.imageUrl}
                      alt={scene.title}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gold/30"
                    />
                  ) : (
                    <div className="w-7 h-7 mt-1 rounded-lg bg-gradient-to-br from-gold/20 to-violet/20 border border-gold/20 flex items-center justify-center text-xs font-bold text-gold flex-shrink-0">
                      {index + 1}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-gold transition-colors truncate">
                      {scene.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                      {scene.description}
                    </p>

                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-violet/10 text-violet text-xs font-medium capitalize">
                        {scene.type.replace('_', ' ')}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium capitalize"
                        style={sentimentStyle(scene.sentiment)}
                      >
                        {scene.sentiment}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Generate-image button (only when prompt exists and no image yet) */}
                {scene.imagePrompt && !scene.imageUrl && (
                  <button
                    type="button"
                    onClick={() => generateOne(scene)}
                    disabled={isPending || bulkRunning}
                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet/10 hover:bg-violet/20 border border-violet/20 hover:border-violet/40 text-violet text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isPending ? (
                      <>
                        <span className="w-3 h-3 border-2 border-violet/30 border-t-violet rounded-full animate-spin" />
                        Gerando imagem...
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Gerar imagem
                      </>
                    )}
                  </button>
                )}

                {/* Color palette */}
                {scene.colorPalette?.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-3 pl-10">
                    {scene.colorPalette.map((color, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full border-2 border-app flex-shrink-0"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    <span className="text-xs text-gray-700 ml-1">{scene.colorPalette[0]}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
