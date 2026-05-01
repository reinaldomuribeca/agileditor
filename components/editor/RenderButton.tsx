'use client';

import { useState } from 'react';

export default function RenderButton({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRender = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao iniciar render');
      }
      // Status polling on the parent page will detect 'rendering' and update the UI
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
      <button
        type="button"
        onClick={handleRender}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gold via-[#FFC933] to-gold text-black text-xs font-bold hover:from-gold-muted hover:to-gold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(255,184,0,0.2)] hover:shadow-[0_0_28px_rgba(255,184,0,0.4)]"
      >
        {loading ? (
          <>
            <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            Iniciando...
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Renderizar vídeo
          </>
        )}
      </button>
    </div>
  );
}
