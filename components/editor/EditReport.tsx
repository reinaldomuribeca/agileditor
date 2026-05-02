'use client';

import { useMemo } from 'react';
import type { JobMetadata, SceneInput } from '@/lib/types';
import { describeIntroStyle } from '@/lib/intro-styles';

interface EditReportProps {
  job: JobMetadata;
}

interface Metric {
  label: string;
  value: string;
  hint?: string;
}

interface Alert {
  severity: 'info' | 'warn' | 'error';
  message: string;
  /** Timestamp in seconds (optional). Rendered as mm:ss. */
  at?: number;
}

const PACE_HINTS: Record<string, string> = {
  fast:   'priorizou movimento e fala dinâmica, eliminou silêncios e repetições',
  medium: 'manteve o fluxo narrativo, cortou apenas silêncios longos',
  slow:   'preservou respirações e pausas dramáticas',
  auto:   'a IA escolheu o ritmo coerente com o tom do vídeo',
};

const CUT_MODE_HINTS: Record<string, string> = {
  none:   'mantido sem corte automático',
  speech: 'cortou silêncios entre falas',
  scene:  'cortou trechos sem mudança visual',
  ai:     'IA decidiu trechos a manter',
};

const ILLUSTRATION_STYLE_HINTS: Record<string, string> = {
  minimal:     'minimalista (clean, flat)',
  cartoon:     'cartoon (2D, vibrante)',
  arrows:      'setas e anotações',
  infographic: 'infográfico',
  comic:       'quadrinho (HQ)',
};

const SCENE_TYPE_LABELS: Record<string, string> = {
  intro:        'título de abertura',
  cover:        'capa/destaque',
  talking_head: 'criador em destaque',
  text_only:    'card de texto',
  callout:      'destaque flutuante',
  split:        'PIP (picture-in-picture)',
};

function formatDuration(secs: number | undefined): string {
  if (!secs || !Number.isFinite(secs)) return '—';
  const total = Math.round(secs);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}min ${s}s` : `${s}s`;
}

function formatTimestamp(secs: number): string {
  const total = Math.round(secs);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function countByType(scenes: SceneInput[] | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  if (!scenes) return out;
  for (const s of scenes) {
    out[s.type] = (out[s.type] ?? 0) + 1;
  }
  return out;
}

function buildMetrics(job: JobMetadata): Metric[] {
  const out: Metric[] = [];

  const scenes = job.analysis?.scenes ?? [];
  const introCount = scenes.filter((s) => s.type === 'intro').length;
  const aiSceneCount = scenes.length - introCount;
  out.push({
    label: 'Cenas',
    value: `${scenes.length} mantidas`,
    hint: aiSceneCount > 0 ? `${aiSceneCount} geradas pela IA${introCount > 0 ? ` + ${introCount} título de abertura` : ''}` : undefined,
  });

  const pace = job.questionnaire?.pace ?? 'auto';
  out.push({
    label: 'Ritmo aplicado',
    value: pace,
    hint: PACE_HINTS[pace],
  });

  const mode = job.cutMode ?? 'speech';
  out.push({
    label: 'Modo de corte',
    value: mode,
    hint: CUT_MODE_HINTS[mode],
  });

  const music = job.questionnaire?.music;
  if (music?.enabled) {
    const styleLabel = music.style === 'other' && music.styleOther ? music.styleOther : (music.style ?? 'energetic');
    out.push({
      label: 'Trilha sonora',
      value: `${styleLabel} · vol. ${music.volume ?? 'medium'}`,
      hint: 'recurso em desenvolvimento — será aplicado em release futura',
    });
  } else {
    out.push({ label: 'Trilha sonora', value: 'sem trilha' });
  }

  const illu = job.questionnaire?.illustrations;
  if (illu?.enabled) {
    const byType = countByType(scenes);
    const breakdown = Object.entries(byType)
      .filter(([t]) => t !== 'intro')
      .map(([t, n]) => `${n} ${SCENE_TYPE_LABELS[t] ?? t}`)
      .join(', ');
    out.push({
      label: 'Ilustrações',
      value: `${aiSceneCount} no estilo ${ILLUSTRATION_STYLE_HINTS[illu.style ?? 'minimal']}`,
      hint: breakdown || undefined,
    });
  } else {
    out.push({ label: 'Ilustrações', value: 'desativadas' });
  }

  const intro = scenes.find((s) => s.type === 'intro');
  if (intro && job.questionnaire?.introTitle.enabled) {
    const desc = describeIntroStyle(job.questionnaire.contentType);
    out.push({
      label: 'Título de abertura',
      value: `"${intro.title}"`,
      hint: `fonte ${desc.fontName} · animação ${desc.animationName}`,
    });
  }

  const subStyle = job.questionnaire?.subtitles ?? 'standard';
  if (subStyle !== 'none') {
    const subs = job.subtitlesCut ?? job.subtitles ?? [];
    out.push({
      label: 'Legendas',
      value: `${subs.length} linhas (${subStyle === 'animated' ? 'animadas' : 'padrão'})`,
    });
  } else {
    out.push({ label: 'Legendas', value: 'desativadas' });
  }

  const orig = job.duration ?? 0;
  const finalDur = subStyle !== 'none' && job.subtitlesCut?.length
    ? job.subtitlesCut[job.subtitlesCut.length - 1].end
    : orig - (job.silenceCutSeconds ?? 0);
  out.push({
    label: 'Duração',
    value: `${formatDuration(orig)} → ${formatDuration(finalDur)}`,
    hint: job.silenceCutSeconds && job.silenceCutSeconds > 0.1
      ? `${job.silenceCutSeconds.toFixed(1)}s cortados`
      : undefined,
  });

  return out;
}

function buildAlerts(job: JobMetadata): Alert[] {
  const out: Alert[] = [];

  // Surface every warning the pipeline already raised
  for (const w of job.warnings ?? []) {
    let severity: Alert['severity'] = 'warn';
    const lower = w.toLowerCase();
    if (lower.includes('alucina') || lower.includes('fallback')) severity = 'error';
    else if (lower.includes('desenvolvimento') || lower.includes('futura')) severity = 'info';
    out.push({ severity, message: w });
  }

  // Detect very short or very long scene durations (only relevant for AI-generated scenes)
  const scenes = job.analysis?.scenes ?? [];
  const subs = job.subtitlesCut ?? job.subtitles ?? [];
  if (subs.length > 0) {
    for (let i = 0; i < scenes.length; i++) {
      const cur = scenes[i];
      if (cur.type === 'intro') continue; // intro has fixed 3s duration
      const startSub = subs[Math.min(cur.startLeg, subs.length - 1)];
      const next = scenes[i + 1];
      const endSub = next ? subs[Math.min(next.startLeg, subs.length - 1)] : subs[subs.length - 1];
      const dur = (next ? endSub.start : endSub.end) - startSub.start;
      if (dur < 0.5) {
        out.push({
          severity: 'warn',
          at: startSub.start,
          message: `Cena "${cur.title}" passa muito rápido (${dur.toFixed(1)}s) — pode ser difícil de ler`,
        });
      } else if (dur > 10) {
        out.push({
          severity: 'warn',
          at: startSub.start,
          message: `Cena "${cur.title}" fica estagnada por ${dur.toFixed(1)}s — considere quebrar em duas`,
        });
      }
    }
  }

  // Suggest re-edit if no notes were provided
  if (!job.questionnaire?.notes) {
    out.push({
      severity: 'info',
      message: 'Nenhuma observação foi enviada no questionário. Se algo ficou diferente do esperado, use "Re-editar com novo contexto" para refinar.',
    });
  }

  return out;
}

const SEVERITY_STYLES: Record<Alert['severity'], { bg: string; border: string; text: string; icon: string }> = {
  info:  { bg: 'bg-sky-500/8',    border: 'border-sky-500/25',    text: 'text-sky-300',    icon: 'ℹ' },
  warn:  { bg: 'bg-amber-500/8',  border: 'border-amber-500/25',  text: 'text-amber-300',  icon: '⚠' },
  error: { bg: 'bg-red-500/8',    border: 'border-red-500/25',    text: 'text-red-300',    icon: '✕' },
};

export default function EditReport({ job }: EditReportProps) {
  const metrics = useMemo(() => buildMetrics(job), [job]);
  const alerts = useMemo(() => buildAlerts(job), [job]);

  return (
    <div className="rounded-2xl border border-border-dim bg-surface-1/70 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border-dim flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-violet flex items-center justify-center">
            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Relatório de edição</h3>
            <p className="text-[11px] text-gray-600">Resumo da edição automática deste vídeo</p>
          </div>
        </div>
        <a
          href={`/api/video/${job.id}/output.mp4`}
          download
          className="inline-flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-muted text-black text-xs font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(255,184,0,0.2)]"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Baixar vídeo
        </a>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border-dim/50">
        {metrics.map((m) => (
          <div key={m.label} className="bg-surface-1 px-5 py-4">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
              {m.label}
            </p>
            <p className="text-sm font-bold text-white capitalize-first">{m.value}</p>
            {m.hint && <p className="text-[11px] text-gray-500 mt-1 leading-snug">{m.hint}</p>}
          </div>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="px-5 py-4 border-t border-border-dim space-y-2">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Alertas e sugestões de revisão
          </p>
          {alerts.map((a, i) => {
            const styles = SEVERITY_STYLES[a.severity];
            return (
              <div
                key={i}
                className={`rounded-lg border ${styles.border} ${styles.bg} px-3 py-2.5 flex items-start gap-2.5`}
              >
                <span className={`${styles.text} text-sm leading-none mt-0.5 flex-shrink-0 font-bold`}>
                  {styles.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${styles.text} leading-snug`}>
                    {a.at !== undefined && (
                      <span className="font-mono font-bold mr-1.5">[{formatTimestamp(a.at)}]</span>
                    )}
                    {a.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
