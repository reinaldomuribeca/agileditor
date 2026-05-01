'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { JobMetadata } from '@/lib/types';
import EditorLayout from '@/components/editor/EditorLayout';

/* ─── Pipeline definition ─────────────────────────────────────────────── */

const STEPS = [
  { id: 'uploading',        label: 'Upload',           desc: 'Enviando vídeo para o servidor' },
  { id: 'normalizing',      label: 'Normalizar',       desc: 'Convertendo para H.264 · 30 fps' },
  { id: 'transcribing',     label: 'Transcrever',      desc: 'Whisper AI extrai fala com timestamps' },
  { id: 'cutting-silence',  label: 'Cortar silêncio',  desc: 'Removendo pausas longas e regravando timeline' },
  { id: 'analyzing',        label: 'Analisar IA',      desc: 'Claude detecta cenas e paleta de cores' },
  { id: 'rendering',        label: 'Renderizar',       desc: 'Remotion gera o vídeo final 9:16' },
] as const;

type StepId = (typeof STEPS)[number]['id'];

const STATUS_IDX: Record<string, number> = {
  uploading:        0,
  normalizing:      1,
  transcribing:     2,
  'cutting-silence':3,
  analyzing:        4,
  editing:          5,
  rendering:        5,
  done:             6,
  error:           -1,
};

/* ─── Progress bar with ref (avoids inline style) ─────────────────────── */

interface ProgressBarProps {
  pct: number;
  cssClass: string;
  varName: string;
}

function ProgressBar({ pct, cssClass, varName }: ProgressBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.style.setProperty(varName, `${pct}%`);
  }, [pct, varName]);
  return <div ref={ref} className={cssClass} />;
}

/* ─── Step icon ───────────────────────────────────────────────────────── */

function StepIcon({ id, className }: { id: StepId | string; className?: string }) {
  const cls = className ?? 'w-5 h-5 text-gold';
  switch (id) {
    case 'uploading':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      );
    case 'normalizing':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    case 'transcribing':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      );
    case 'cutting-silence':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
        </svg>
      );
    case 'analyzing':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
        </svg>
      );
    case 'rendering':
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
  }
}

function formatSecs(s: number): string {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

/* ─── Main page ───────────────────────────────────────────────────────── */

export default function EditorPage({ params }: { params: { jobId: string } }) {
  const router = useRouter();
  const [job, setJob] = useState<JobMetadata | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const firstSeenAt = useRef<Partial<Record<string, number>>>({});
  const [elapsed, setElapsed] = useState<Partial<Record<string, number>>>({});

  // Track which pipeline steps the client has already triggered this session
  const triggered = useRef<Set<string>>(new Set());

  /* Drive the pipeline from the client — reliable even when the server hot-reloads */
  useEffect(() => {
    if (!job) return;

    const PIPELINE: Partial<Record<string, string>> = {
      normalizing:       '/api/normalize',
      transcribing:      '/api/transcribe',
      'cutting-silence': '/api/cut-silence',
      analyzing:         '/api/analyze',
    };

    const endpoint = PIPELINE[job.status];
    if (!endpoint || triggered.current.has(job.status)) return;

    triggered.current.add(job.status);

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: params.jobId }),
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error(`[pipeline] ${endpoint} failed:`, body);
        // Allow retry on next status change
        triggered.current.delete(job.status);
      }
    }).catch((err) => {
      console.error(`[pipeline] ${endpoint} error:`, err);
      triggered.current.delete(job.status);
    });
  }, [job?.status, params.jobId]);

  /* Poll job */
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/job?id=${params.jobId}`);
        if (!res.ok) throw new Error(res.status === 404 ? 'Job não encontrado' : 'Falha ao carregar');
        const data: JobMetadata = await res.json();
        setJob(data);
        setFetchError(null);
        if (!firstSeenAt.current[data.status]) {
          firstSeenAt.current[data.status] = Date.now();
        }
      } catch (err) {
        setFetchError((err as Error).message);
      } finally {
        setInitialLoad(false);
      }
    };

    fetchJob();
    const iv = setInterval(fetchJob, 2000);
    return () => clearInterval(iv);
  }, [params.jobId]);

  /* Elapsed ticker */
  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now();
      const next: Partial<Record<string, number>> = {};
      for (const [status, t] of Object.entries(firstSeenAt.current)) {
        next[status] = Math.floor((now - (t ?? now)) / 1000);
      }
      setElapsed(next);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  /* ── Initial loading spinner ── */
  if (initialLoad) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 border-gold/10" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold animate-spin" />
          </div>
          <p className="text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  /* ── Fetch error ── */
  if (fetchError || !job) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center p-4">
        <div className="glass-premium rounded-3xl p-10 max-w-sm w-full text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Job não encontrado</h2>
            <p className="text-sm text-gray-500">{fetchError}</p>
            <p className="text-xs text-gray-700 font-mono mt-3">{params.jobId}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full py-3 rounded-xl bg-surface-2 border border-border-mid text-white text-sm font-semibold hover:bg-surface-3 transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  /* ── Editor view (done / editing) ── */
  if (job.status === 'done' || job.status === 'editing') {
    return (
      <div className="min-h-screen bg-app">
        <div className="sticky top-0 z-30 border-b border-border-dim bg-app/90 backdrop-blur-xl">
          <div className="h-0.5 bg-gradient-to-r from-gold to-violet" />
          <div className="max-w-8xl mx-auto px-6 h-[52px] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/')}
                aria-label="Voltar"
                className="text-gray-500 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs font-mono text-gray-600">job/{params.jobId.slice(0, 10)}</span>
            </div>
            {job.status === 'done' && (
              <a
                href={`/api/video/${job.id}/output.mp4`}
                download
                className="inline-flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-muted text-black text-xs font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(255,184,0,0.2)]"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar
              </a>
            )}
          </div>
        </div>
        <EditorLayout job={job} />
      </div>
    );
  }

  /* ── Processing screen ── */

  const isError = job.status === 'error';
  const currentIdx = isError ? -1 : (STATUS_IDX[job.status] ?? 0);
  const overallPct = isError ? 0 : Math.round((currentIdx / STEPS.length) * 100);

  const renderElapsed = elapsed['rendering'] ?? 0;
  // We already returned early for 'done', so only check 'rendering' here
  const renderPct =
    job.status === 'rendering'
      ? Math.round((1 - Math.exp(-renderElapsed / 45)) * 95)
      : 0;

  const activeStep = STEPS[currentIdx] as (typeof STEPS)[number] | undefined;

  return (
    <div className="min-h-screen bg-app flex flex-col">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] animate-orb-drift" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-violet/5 rounded-full blur-[120px] animate-orb-drift orb-delay-4" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-border-dim/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold to-violet flex items-center justify-center">
            <span className="text-black text-[10px] font-black">Á</span>
          </div>
          <span className="text-white font-bold text-sm tracking-tight">Ágil Editor</span>
        </div>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          Cancelar
        </button>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-8">

          {/* Spinner + step info */}
          <div className="text-center space-y-5">
            {isError ? (
              <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg className="w-9 h-9 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            ) : (
              <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-gold/10" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold animate-spin" />
                <div className="absolute inset-2 rounded-full border border-transparent border-t-violet/60 spin-reverse" />
                <div className="relative w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                  {activeStep && <StepIcon id={activeStep.id} className="w-5 h-5 text-gold" />}
                </div>
              </div>
            )}

            <div>
              {isError ? (
                <>
                  <h2 className="text-xl font-bold text-red-400">Falha no processamento</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {(job as JobMetadata & { errorMessage?: string }).errorMessage ?? 'Ocorreu um erro inesperado.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-surface-2 border border-border-mid text-white text-sm font-semibold rounded-xl hover:bg-surface-3 transition-colors"
                  >
                    Tentar novamente
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-white">{activeStep?.label ?? job.status}</h2>
                  <p className="text-sm text-gray-500 mt-1">{activeStep?.desc}</p>
                  {job.status === 'rendering' && (
                    <p className="text-xs text-gold tabular-nums mt-2 font-semibold">{renderPct}% concluído</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Overall progress */}
          {!isError && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Progresso geral</span>
                <span className="text-gold font-bold tabular-nums">{overallPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                <ProgressBar
                  pct={overallPct}
                  cssClass="progress-fill h-full rounded-full bg-gradient-to-r from-gold to-violet"
                  varName="--progress"
                />
              </div>
            </div>
          )}

          {/* Steps list */}
          <div className="space-y-2">
            {STEPS.map((step, i) => {
              const stepStatus =
                isError && i === currentIdx ? 'error' :
                i < currentIdx ? 'done' :
                i === currentIdx ? 'active' :
                'pending';

              const isDone   = stepStatus === 'done';
              const isActive = stepStatus === 'active';
              const isRender = step.id === 'rendering';
              const stepElapsed = elapsed[step.id];

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-500 ${
                    isActive       ? 'bg-gold/8 border border-gold/20 shadow-[0_0_20px_rgba(255,184,0,0.05)]' :
                    isDone         ? 'bg-surface-1 border border-border-dim' :
                    stepStatus === 'error' ? 'bg-red-500/8 border border-red-500/20' :
                    'border border-transparent opacity-35'
                  }`}
                >
                  {/* Number / check circle */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
                    isDone         ? 'bg-gold/20 text-gold' :
                    isActive       ? 'bg-gold text-black' :
                    stepStatus === 'error' ? 'bg-red-500/20 text-red-400' :
                    'bg-surface-2 text-gray-600'
                  }`}>
                    {isDone ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : stepStatus === 'error' ? '✕' : i + 1}
                  </div>

                  {/* Icon + label */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <StepIcon id={step.id} className={`w-4 h-4 flex-shrink-0 ${isDone ? 'text-gray-500' : isActive ? 'text-gold' : 'text-gray-700'}`} />
                    <span className={`text-sm font-medium truncate ${isActive ? 'text-white' : isDone ? 'text-gray-400' : 'text-gray-600'}`}>
                      {step.label}
                    </span>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isActive && isRender && (
                      <span className="text-xs font-bold text-gold tabular-nums">{renderPct}%</span>
                    )}
                    {isActive && !isRender && (
                      <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                    )}
                    {stepElapsed !== undefined && (
                      <span className="text-xs text-gray-600 tabular-nums">{formatSecs(stepElapsed)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Render progress bar */}
          {job.status === 'rendering' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Taxa de renderização</span>
                <span className="text-violet font-bold tabular-nums">{renderPct}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-surface-2 overflow-hidden">
                <ProgressBar
                  pct={renderPct}
                  cssClass="render-fill h-full rounded-full bg-gradient-to-r from-violet to-[#A78BFA]"
                  varName="--render-progress"
                />
              </div>
              <p className="text-[11px] text-gray-700 text-right tabular-nums">
                {renderElapsed > 0 ? `${formatSecs(renderElapsed)} decorridos` : ''}
              </p>
            </div>
          )}

          {/* Job ID */}
          <p className="text-center text-[11px] text-gray-700 font-mono">job/{params.jobId}</p>
        </div>
      </div>
    </div>
  );
}
