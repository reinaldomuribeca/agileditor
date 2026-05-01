'use client';

import { useRef, useState } from 'react';
import type { CutMode, CutAggressiveness } from '@/lib/types';

type State = 'idle' | 'selected' | 'uploading';

export interface UploadZoneProps {
  onSuccess: (jobId: string) => void;
}

function formatSpeed(bps: number): string {
  if (bps >= 1_048_576) return `${(bps / 1_048_576).toFixed(1)} MB/s`;
  if (bps >= 1_024) return `${(bps / 1_024).toFixed(0)} KB/s`;
  return `${bps.toFixed(0)} B/s`;
}

function formatEta(remainingBytes: number, bps: number): string {
  if (bps <= 0) return '';
  const secs = Math.ceil(remainingBytes / bps);
  if (secs > 60) return `~${Math.ceil(secs / 60)}min restantes`;
  return `~${secs}s restantes`;
}

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  subtitle: string;
}

function ToggleSwitch({ enabled, onChange, label, subtitle }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 ${
        enabled
          ? 'border-gold/40 bg-gold/[0.06]'
          : 'border-border-dim bg-surface-1 hover:border-border-mid'
      }`}
    >
      <div
        className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200 ${
          enabled ? 'bg-gradient-to-r from-gold to-[#FFC933]' : 'bg-surface-2'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-none transition-colors ${enabled ? 'text-gold' : 'text-gray-400'}`}>
          {label}
        </p>
        <p className="text-xs text-gray-600 mt-0.5 leading-snug">{subtitle}</p>
      </div>
    </button>
  );
}

interface CutModeOption {
  id: CutMode;
  title: string;
  desc: string;
  icon: React.ReactNode;
}

const CUT_MODES: CutModeOption[] = [
  {
    id: 'none',
    title: 'Sem corte',
    desc: 'Mantém o vídeo original sem alterações de duração',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m6 10V7M5 7h14l-1 12H6L5 7zM7 7l1-3h8l1 3" />
      </svg>
    ),
  },
  {
    id: 'speech',
    title: 'Por fala',
    desc: 'Remove silêncios e pausas longas entre falas',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    id: 'scene',
    title: 'Por cena',
    desc: 'Corta trechos parados onde nada muda visualmente',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
      </svg>
    ),
  },
  {
    id: 'ai',
    title: 'Inteligente (IA)',
    desc: 'Claude lê o vídeo e escolhe os melhores momentos',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
];

const AGGR_OPTIONS: { id: CutAggressiveness; label: string; desc: string }[] = [
  { id: 'subtle',     label: 'Suave',      desc: 'cortes mínimos' },
  { id: 'balanced',   label: 'Equilibrado', desc: 'recomendado' },
  { id: 'aggressive', label: 'Agressivo',  desc: 'corta tudo' },
];

interface CutModePickerProps {
  mode: CutMode;
  onModeChange: (m: CutMode) => void;
  aggr: CutAggressiveness;
  onAggrChange: (a: CutAggressiveness) => void;
}

function CutModePicker({ mode, onModeChange, aggr, onAggrChange }: CutModePickerProps) {
  const showAggr = mode === 'speech' || mode === 'scene';

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Cortes automáticos
      </label>

      <div className="grid grid-cols-2 gap-2">
        {CUT_MODES.map((opt) => {
          const active = opt.id === mode;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onModeChange(opt.id)}
              className={`text-left p-3 rounded-xl border transition-all duration-200 ${
                active
                  ? 'border-gold/50 bg-gold/[0.08] shadow-[0_0_16px_rgba(255,184,0,0.08)]'
                  : 'border-border-dim bg-surface-1 hover:border-border-mid'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 flex-shrink-0 ${active ? 'text-gold' : 'text-gray-500'}`}>
                  {opt.icon}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold leading-tight ${active ? 'text-gold' : 'text-gray-300'}`}>
                    {opt.title}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-1 leading-snug">{opt.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {showAggr && (
        <div className="pt-1">
          <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Nível
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {AGGR_OPTIONS.map((opt) => {
              const active = opt.id === aggr;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onAggrChange(opt.id)}
                  className={`px-2 py-2 rounded-lg text-center border transition-all duration-200 ${
                    active
                      ? 'border-gold/50 bg-gold/[0.08]'
                      : 'border-border-dim bg-surface-1 hover:border-border-mid'
                  }`}
                >
                  <p className={`text-xs font-bold leading-none ${active ? 'text-gold' : 'text-gray-400'}`}>
                    {opt.label}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-1 leading-none">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UploadZone({ onSuccess }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const [state, setState] = useState<State>('idle');
  const [isDragActive, setIsDragActive] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loaded, setLoaded] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [legendar, setLegendas] = useState(true);
  const [animator, setAnimator] = useState(true);
  const [cutMode, setCutMode] = useState<CutMode>('speech');
  const [cutAggressiveness, setCutAggressiveness] = useState<CutAggressiveness>('balanced');

  const pct = file ? Math.min(100, Math.round((loaded / file.size) * 100)) : 0;

  const pickFile = (f: File) => {
    if (!f.type.startsWith('video/')) {
      setError('Selecione um arquivo de vídeo (MP4, MOV, WebM)');
      return;
    }
    setError(null);
    setFile(f);
    setState('selected');
  };

  const reset = () => {
    xhrRef.current?.abort();
    xhrRef.current = null;
    setState('idle');
    setFile(null);
    setLoaded(0);
    setSpeed(0);
    setError(null);
    setPrompt('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (state === 'uploading') return;
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) pickFile(dropped);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || state === 'uploading') return;

    setState('uploading');
    setLoaded(0);
    setSpeed(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('prompt', prompt);
    formData.append('legendar', String(legendar));
    formData.append('animator', String(animator));
    formData.append('cutMode', cutMode);
    formData.append('cutAggressiveness', cutAggressiveness);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    let lastTime = Date.now();
    let lastLoaded = 0;

    xhr.upload.addEventListener('progress', (ev) => {
      if (!ev.lengthComputable) return;
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      const dl = ev.loaded - lastLoaded;
      if (dt > 0.1) {
        setSpeed(dl / dt);
        lastTime = now;
        lastLoaded = ev.loaded;
      }
      setLoaded(ev.loaded);
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText) as { jobId: string };
          onSuccess(data.jobId);
        } catch {
          setError('Resposta inesperada do servidor.');
          setState('selected');
        }
      } else {
        setError(`Falha no upload (${xhr.status}). Tente novamente.`);
        setState('selected');
      }
    });

    xhr.addEventListener('error', () => {
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
      setState('selected');
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {state === 'uploading' ? (
        <div className="rounded-2xl border border-gold/30 bg-gold/[0.03] p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{file?.name}</p>
              <p className="text-xs text-gray-500">{file ? `${(file.size / 1_048_576).toFixed(1)} MB total` : ''}</p>
            </div>
            <button type="button" onClick={reset} className="text-xs text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0">
              Cancelar
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Taxa de upload</span>
              <span className="text-sm font-bold text-gold tabular-nums">{pct}%</span>
            </div>
            <div className="h-3 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="progress-fill h-full rounded-full bg-gradient-to-r from-gold to-[#FFC933]"
                style={{ '--progress': `${pct}%` } as React.CSSProperties}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="tabular-nums font-medium">{speed > 0 ? formatSpeed(speed) : '—'}</span>
              <span className="tabular-nums">{file ? formatEta(file.size - loaded, speed) : ''}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-700 tabular-nums border-t border-border-dim pt-3">
            <span>{(loaded / 1_048_576).toFixed(2)} MB enviados</span>
            <span>{file ? `de ${(file.size / 1_048_576).toFixed(2)} MB` : ''}</span>
          </div>
        </div>
      ) : (
        <div
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 ${
            isDragActive
              ? 'border-gold bg-gold/5 scale-[1.01]'
              : state === 'selected'
              ? 'border-gold/40 bg-gold/[0.03]'
              : 'border-border-mid hover:border-gold/40 bg-surface-1 cursor-pointer'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => state === 'idle' && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            aria-label="Selecionar arquivo de vídeo"
            title="Selecionar arquivo de vídeo"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pickFile(f);
            }}
          />

          {state === 'idle' ? (
            <div className="px-8 py-14 text-center space-y-4">
              <div className={`mx-auto w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 ${isDragActive ? 'bg-gold/20 border-gold/40' : 'bg-surface-2 border-border-mid'}`}>
                <svg className={`w-7 h-7 transition-colors duration-300 ${isDragActive ? 'text-gold' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <div>
                <h3 className={`text-base font-bold transition-colors duration-300 ${isDragActive ? 'text-gold' : 'text-white'}`}>
                  {isDragActive ? 'Solte para enviar' : 'Arraste seu vídeo aqui'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">MP4, MOV ou WebM — até 500 MB</p>
              </div>
              <div className="flex items-center justify-center gap-3 text-xs text-gray-600">
                <span className="h-px w-10 bg-border-dim" />
                ou clique para selecionar
                <span className="h-px w-10 bg-border-dim" />
              </div>
            </div>
          ) : (
            <div className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate text-sm">{file!.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{(file!.size / 1_048_576).toFixed(1)} MB</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); reset(); }}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                aria-label="Remover arquivo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 text-center flex items-center justify-center gap-1.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </p>
      )}

      {state !== 'uploading' && (
        <>
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Opções de edição
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ToggleSwitch
                enabled={legendar}
                onChange={setLegendas}
                label="Legendar"
                subtitle="Legendas dinâmicas sincronizadas"
              />
              <ToggleSwitch
                enabled={animator}
                onChange={setAnimator}
                label="Animator"
                subtitle="Animações em pontos críticos"
              />
            </div>
          </div>

          <CutModePicker
            mode={cutMode}
            onModeChange={setCutMode}
            aggr={cutAggressiveness}
            onAggrChange={setCutAggressiveness}
          />

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Contexto{' '}
              <span className="text-gray-700 normal-case font-normal tracking-normal">(opcional)</span>
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, 1500))}
                placeholder="Ex: Tutorial de culinária, palestra sobre tecnologia..."
                rows={4}
                maxLength={1500}
                className="w-full rounded-xl bg-app-2 border border-border-dim focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 text-white placeholder-gray-700 text-sm px-4 py-3 resize-none transition-all duration-200"
              />
              <span className={`absolute bottom-2.5 right-3 text-xs tabular-nums transition-colors ${prompt.length >= 1350 ? 'text-amber-400' : 'text-gray-700'}`}>
                {prompt.length}/1500
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={state !== 'selected'}
            className="group w-full relative overflow-hidden rounded-xl py-4 font-bold text-black bg-gradient-to-r from-gold via-[#FFC933] to-gold hover:from-gold-muted hover:to-gold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_0_32px_rgba(255,184,0,0.15)] hover:shadow-[0_0_48px_rgba(255,184,0,0.35)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            <span className="relative flex items-center justify-center gap-2 text-sm">
              Processar vídeo
            </span>
          </button>
        </>
      )}
    </form>
  );
}
