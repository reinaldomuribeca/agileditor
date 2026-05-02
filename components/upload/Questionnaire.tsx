'use client';

import { useState } from 'react';
import type {
  ContentType,
  EditingPace,
  IllustrationStyle,
  MusicStyle,
  MusicVolume,
  Questionnaire,
  SubtitleStyle,
  TransitionStyle,
} from '@/lib/types';

export const DEFAULT_QUESTIONNAIRE: Questionnaire = {
  contentType: 'other',
  pace: 'auto',
  music: { enabled: false },
  subtitles: 'standard',
  illustrations: { enabled: true, style: 'minimal' },
  introTitle: { enabled: false },
  transition: 'auto',
  notes: '',
};

interface OptionGridProps<T extends string> {
  options: { id: T; label: string; desc?: string }[];
  value: T;
  onChange: (v: T) => void;
  cols?: 2 | 3 | 4;
}

function OptionGrid<T extends string>({ options, value, onChange, cols = 2 }: OptionGridProps<T>) {
  const gridCol = cols === 4 ? 'grid-cols-2 sm:grid-cols-4' : cols === 3 ? 'grid-cols-3' : 'grid-cols-2';
  return (
    <div className={`grid ${gridCol} gap-1.5`}>
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`px-2.5 py-2 rounded-lg text-left border transition-all duration-150 ${
              active
                ? 'border-gold/60 bg-gold/[0.10]'
                : 'border-border-dim bg-app hover:border-gold/25 hover:bg-gold/[0.03]'
            }`}
          >
            <p className={`text-xs font-bold leading-tight ${active ? 'text-gold' : 'text-gray-400'}`}>
              {opt.label}
            </p>
            {opt.desc && (
              <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{opt.desc}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface SectionProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

function Section({ number, title, children }: SectionProps) {
  return (
    <section className="space-y-2 py-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-gold/20 text-gold text-[10px] font-black tabular-nums">
          {number}
        </span>
        <h3 className="text-xs font-bold text-gray-200 font-bold uppercase tracking-wider">{title}</h3>
      </div>
      <div className="pl-7"><div className="bg-app/30 rounded-lg p-3">{children}</div></div>
    </section>
  );
}

interface SwitchProps {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

function Switch({ enabled, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="flex items-center gap-3"
      aria-pressed={enabled}
    >
      <div className={`relative w-9 h-5 rounded-full transition-colors duration-150 ${enabled ? 'bg-gradient-to-r from-gold to-[#FFC933]' : 'bg-surface-2'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-150 ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
      </div>
      <span className={`text-sm font-semibold ${enabled ? 'text-gold' : 'text-gray-400'}`}>{label}</span>
    </button>
  );
}

const CONTENT_TYPES: { id: ContentType; label: string }[] = [
  { id: 'humor', label: 'Humor' },
  { id: 'serious', label: 'Sério/Informativo' },
  { id: 'emotional', label: 'Emocional' },
  { id: 'educational', label: 'Educacional' },
  { id: 'documentary', label: 'Documental' },
  { id: 'vlog', label: 'Vlog/Diário' },
  { id: 'commercial', label: 'Publicitário' },
  { id: 'other', label: 'Outro' },
];

const PACES: { id: EditingPace; label: string; desc: string }[] = [
  { id: 'fast', label: 'Rápido', desc: 'dinâmico' },
  { id: 'medium', label: 'Médio', desc: 'equilibrado' },
  { id: 'slow', label: 'Lento', desc: 'contemplativo' },
  { id: 'auto', label: 'Automático', desc: 'IA decide' },
];

const MUSIC_STYLES: { id: MusicStyle; label: string }[] = [
  { id: 'energetic', label: 'Animada' },
  { id: 'calm', label: 'Calma' },
  { id: 'epic', label: 'Épica' },
  { id: 'comic', label: 'Cômica' },
  { id: 'melancholic', label: 'Melancólica' },
  { id: 'electronic', label: 'Eletrônica' },
  { id: 'other', label: 'Outro' },
];

const MUSIC_VOLUMES: { id: MusicVolume; label: string; desc: string }[] = [
  { id: 'low',    label: 'Baixo',  desc: 'discreto' },
  { id: 'medium', label: 'Médio',  desc: 'equilibrado' },
  { id: 'high',   label: 'Alto',   desc: 'em destaque' },
];

const SUBTITLE_STYLES: { id: SubtitleStyle; label: string; desc: string }[] = [
  { id: 'standard', label: 'Padrão', desc: 'sincronizado' },
  { id: 'animated', label: 'Animado', desc: 'pop-up/karaokê' },
  { id: 'none',     label: 'Sem',    desc: 'desligado' },
];

const ILLUSTRATION_STYLES: { id: IllustrationStyle; label: string }[] = [
  { id: 'minimal',     label: 'Minimalista' },
  { id: 'cartoon',     label: 'Cartoon' },
  { id: 'arrows',      label: 'Setas/Anotações' },
  { id: 'infographic', label: 'Infográfico' },
  { id: 'comic',       label: 'Quadrinho' },
];

const TRANSITIONS: { id: TransitionStyle; label: string }[] = [
  { id: 'none',      label: 'Sem (corte seco)' },
  { id: 'fade-soft', label: 'Fade suave' },
  { id: 'fade-fast', label: 'Fade rápido' },
  { id: 'zoom',      label: 'Zoom in/out' },
  { id: 'slide',     label: 'Deslize' },
  { id: 'auto',      label: 'Automático' },
];

interface QuestionnaireFormProps {
  value: Questionnaire;
  onChange: (q: Questionnaire) => void;
}

export default function QuestionnaireForm({ value, onChange }: QuestionnaireFormProps) {
  const [collapsed, setCollapsed] = useState(false);

  const update = (patch: Partial<Questionnaire>) => onChange({ ...value, ...patch });

  return (
    <div className="rounded-2xl border border-border-dim bg-app-2/80 overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-app-2 hover:bg-surface-2/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="text-sm font-bold text-white">Questionário de edição</span>
          <span className="text-[10px] text-gray-600 uppercase tracking-wider">8 perguntas</span>
        </div>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${collapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!collapsed && (
        <div className="p-4 divide-y divide-border-dim border-t border-border-dim">
          {/* 1. Tipo de conteúdo */}
          <Section number={1} title="Tipo de conteúdo">
            <OptionGrid
              options={CONTENT_TYPES}
              value={value.contentType}
              onChange={(v) => update({ contentType: v })}
              cols={4}
            />
            {value.contentType === 'other' && (
              <input
                type="text"
                value={value.contentTypeOther ?? ''}
                onChange={(e) => update({ contentTypeOther: e.target.value.slice(0, 60) })}
                placeholder="Descreva o tipo..."
                className="mt-2 w-full rounded-lg bg-app border border-border-dim focus:border-gold/50 focus:outline-none text-white placeholder-gray-700 text-sm px-3 py-2"
              />
            )}
          </Section>

          {/* 2. Ritmo */}
          <Section number={2} title="Ritmo de edição">
            <OptionGrid
              options={PACES}
              value={value.pace}
              onChange={(v) => update({ pace: v })}
              cols={4}
            />
          </Section>

          {/* 3. Música */}
          <Section number={3} title="Trilha sonora">
            <Switch
              enabled={value.music.enabled}
              onChange={(v) => update({ music: { ...value.music, enabled: v, style: v ? (value.music.style ?? 'energetic') : undefined, volume: v ? (value.music.volume ?? 'medium') : undefined } })}
              label={value.music.enabled ? 'Adicionar trilha sonora' : 'Sem trilha sonora'}
            />

            {value.music.enabled && (
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Estilo</p>
                  <OptionGrid
                    options={MUSIC_STYLES}
                    value={value.music.style ?? 'energetic'}
                    onChange={(v) => update({ music: { ...value.music, style: v } })}
                    cols={4}
                  />
                  {value.music.style === 'other' && (
                    <input
                      type="text"
                      value={value.music.styleOther ?? ''}
                      onChange={(e) => update({ music: { ...value.music, styleOther: e.target.value.slice(0, 60) } })}
                      placeholder="Descreva o estilo musical..."
                      className="mt-2 w-full rounded-lg bg-app border border-border-dim focus:border-gold/50 focus:outline-none text-white placeholder-gray-700 text-sm px-3 py-2"
                    />
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Volume vs. voz</p>
                  <OptionGrid
                    options={MUSIC_VOLUMES}
                    value={value.music.volume ?? 'medium'}
                    onChange={(v) => update({ music: { ...value.music, volume: v } })}
                    cols={3}
                  />
                </div>
                <p className="text-[11px] text-amber-400/80 leading-snug">
                  ⚠️ Mixagem de trilha sonora ainda em desenvolvimento — sua escolha será registrada e aplicada quando esse recurso entrar em produção.
                </p>
              </div>
            )}
          </Section>

          {/* 4. Legendas */}
          <Section number={4} title="Legendas">
            <OptionGrid
              options={SUBTITLE_STYLES}
              value={value.subtitles}
              onChange={(v) => update({ subtitles: v })}
              cols={3}
            />
          </Section>

          {/* 5. Ilustrações */}
          <Section number={5} title="Ilustrações / gráficos animados">
            <Switch
              enabled={value.illustrations.enabled}
              onChange={(v) => update({ illustrations: { enabled: v, style: v ? (value.illustrations.style ?? 'minimal') : undefined } })}
              label={value.illustrations.enabled ? 'IA insere ilustrações nas cenas' : 'Sem ilustrações'}
            />
            {value.illustrations.enabled && (
              <div className="mt-3 space-y-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Estilo visual</p>
                <OptionGrid
                  options={ILLUSTRATION_STYLES}
                  value={value.illustrations.style ?? 'minimal'}
                  onChange={(v) => update({ illustrations: { ...value.illustrations, style: v } })}
                  cols={3}
                />
                <p className="text-[11px] text-gray-600 leading-snug">
                  Todos os textos das ilustrações sairão em pt-BR e serão sobrepostos nas cenas como animações, sem cortar o vídeo.
                </p>
              </div>
            )}
          </Section>

          {/* 6. Título inicial */}
          <Section number={6} title="Título no início do vídeo">
            <Switch
              enabled={value.introTitle.enabled}
              onChange={(v) => update({ introTitle: { ...value.introTitle, enabled: v } })}
              label={value.introTitle.enabled ? 'Adicionar título de abertura' : 'Sem título inicial'}
            />
            {value.introTitle.enabled && (
              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  value={value.introTitle.title ?? ''}
                  onChange={(e) => update({ introTitle: { ...value.introTitle, title: e.target.value.slice(0, 80) } })}
                  placeholder="Título principal (ex: COMO MUDEI MINHA VIDA)"
                  className="w-full rounded-lg bg-app border border-border-dim focus:border-gold/50 focus:outline-none text-white placeholder-gray-700 text-sm px-3 py-2 font-bold uppercase"
                  maxLength={80}
                />
                <input
                  type="text"
                  value={value.introTitle.subtitle ?? ''}
                  onChange={(e) => update({ introTitle: { ...value.introTitle, subtitle: e.target.value.slice(0, 120) } })}
                  placeholder="Subtítulo (opcional)"
                  className="w-full rounded-lg bg-app border border-border-dim focus:border-gold/50 focus:outline-none text-white placeholder-gray-700 text-sm px-3 py-2"
                  maxLength={120}
                />
              </div>
            )}
          </Section>

          {/* 7. Transições */}
          <Section number={7} title="Transições entre cenas">
            <OptionGrid
              options={TRANSITIONS}
              value={value.transition}
              onChange={(v) => update({ transition: v })}
              cols={3}
            />
          </Section>

          {/* 8. Observações */}
          <Section number={8} title="Observações adicionais">
            <textarea
              value={value.notes ?? ''}
              onChange={(e) => update({ notes: e.target.value.slice(0, 1500) })}
              placeholder='Ex: "remova os silêncios longos", "destaque o trecho 1:30 a 2:00", "mantenha apenas momentos de fala"'
              rows={3}
              maxLength={1500}
              className="w-full rounded-lg bg-app border border-border-dim focus:border-gold/50 focus:outline-none text-white placeholder-gray-700 text-sm px-3 py-2 resize-none"
            />
            <span className={`block text-right text-[10px] tabular-nums mt-1 ${(value.notes?.length ?? 0) >= 1350 ? 'text-amber-400' : 'text-gray-700'}`}>
              {value.notes?.length ?? 0}/1500
            </span>
          </Section>
        </div>
      )}
    </div>
  );
}
