'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    title: 'Transcrição automática',
    desc: 'O áudio é transcrito com timestamps precisos. Cada palavra sincronizada ao milissegundo.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
      </svg>
    ),
    title: 'Cortes inteligentes',
    desc: 'Silêncios e pausas cortados automaticamente. Escolha o nível de agressividade do corte.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
    title: 'Legendas sincronizadas',
    desc: 'Legendas geradas e sobrepostas automaticamente, palavra por palavra, no formato certo.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Ilustrações geradas',
    desc: 'Cenas enriquecidas com ilustrações criadas por IA, sobrepostas sem cortar o vídeo.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Formato 9:16 nativo',
    desc: 'Saída em vertical 1080×1920 pronta para TikTok, Instagram Reels e YouTube Shorts.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Relatório de edição',
    desc: 'Relatório detalhado de cada edição: cenas, cortes, duração final e alertas de revisão.',
  },
];

const STEPS = [
  { n: '01', title: 'Faça upload', desc: 'Envie qualquer gravação — câmera, screencam ou celular. MP4, MOV, WebM.' },
  { n: '02', title: 'Preencha o questionário', desc: '8 perguntas rápidas sobre ritmo, estilo e formato. A IA calibra tudo com base nas suas respostas.' },
  { n: '03', title: 'Baixe pronto', desc: 'Em minutos você tem um vídeo vertical editado, legendado e com ilustrações, pronto para publicar.' },
];

const FOR_WHO = [
  { emoji: '🎬', label: 'Criadores de conteúdo', desc: 'Mais vídeos publicados, menos horas no editor.' },
  { emoji: '🏢', label: 'Agências de marketing', desc: 'Escale a produção de conteúdo dos clientes sem contratar editores.' },
  { emoji: '🎓', label: 'Professores e coaches', desc: 'Transforme aulas gravadas em shorts educacionais.' },
  { emoji: '🚀', label: 'Empresas e startups', desc: 'Conteúdo profissional sem equipe de vídeo interna.' },
];

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function SalesPage() {
  return (
    <main className="min-h-screen bg-app overflow-x-hidden">
      {/* ── Background ───────────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-8%] right-[-4%] w-[700px] h-[700px] bg-gold/7 rounded-full blur-[150px] animate-orb-drift" />
        <div className="absolute bottom-[-10%] left-[-8%] w-[800px] h-[800px] bg-violet/7 rounded-full blur-[150px] animate-orb-drift" style={{ animationDelay: '4s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="relative z-20 border-b border-border-dim bg-app/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold to-violet flex items-center justify-center shadow-[0_0_20px_rgba(255,184,0,0.25)]">
              <span className="text-black text-xs font-black">Á</span>
            </div>
            <span className="text-white font-bold tracking-tight">Ágil Editor</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-600 border border-border-dim px-2.5 py-1 rounded-full uppercase tracking-widest hidden sm:inline">
              Beta
            </span>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-gold to-[#FFC933] text-black text-sm font-bold hover:opacity-90 transition-all"
            >
              Entrar
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-24 pb-20 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/25 bg-gold/5 text-gold text-xs font-semibold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            Edição automática com IA
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="text-[clamp(3rem,9vw,7rem)] font-black tracking-[-0.04em] leading-[0.88] mb-6 max-w-4xl mx-auto"
        >
          <span className="block text-white">De gravação bruta</span>
          <span className="block gradient-text">a conteúdo viral</span>
          <span className="block text-white">em minutos.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-[16px] text-gray-400 max-w-xl mx-auto leading-relaxed mb-10"
        >
          Faça upload do seu vídeo, responda 8 perguntas rápidas e receba um short vertical
          editado, legendado e pronto para TikTok, Reels e YouTube Shorts.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-gold to-[#FFC933] text-black text-base font-black hover:opacity-90 transition-all shadow-[0_0_40px_rgba(255,184,0,0.3)] hover:shadow-[0_0_60px_rgba(255,184,0,0.45)]"
          >
            Começar agora
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <a
            href="#como-funciona"
            className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl border border-border-mid text-gray-300 text-sm font-semibold hover:border-gold/30 hover:text-white transition-all"
          >
            Ver como funciona
          </a>
        </motion.div>

        {/* Stat bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
        >
          {[
            { v: '9:16', l: 'Formato nativo' },
            { v: '30fps', l: 'Saída H.264' },
            { v: '6', l: 'Etapas automáticas' },
            { v: '8', l: 'Parâmetros de edição' },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-xl font-black gradient-text-gv">{s.v}</div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">{s.l}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="como-funciona" className="relative z-10 py-20 px-6 border-t border-border-dim">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="text-xs font-bold text-gold uppercase tracking-widest">Como funciona</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
              Três passos, vídeo pronto.
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <FadeIn key={s.n} delay={i * 0.1}>
                <div className="rounded-2xl border border-border-dim bg-surface-1/60 p-6 relative overflow-hidden group hover:border-gold/25 transition-all">
                  <div className="absolute top-4 right-4 text-5xl font-black text-white/[0.04] select-none group-hover:text-white/[0.07] transition-colors">
                    {s.n}
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center mb-4">
                    <span className="text-gold font-black text-sm">{s.n}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="text-xs font-bold text-violet uppercase tracking-widest">Recursos</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
              Tudo que você precisa,
              <span className="gradient-text"> automático.</span>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.06}>
                <div className="rounded-2xl border border-border-dim bg-surface-1/50 p-5 hover:border-gold/20 hover:bg-surface-1/80 transition-all group">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold/20 to-violet/10 flex items-center justify-center text-gold mb-4 group-hover:from-gold/30 transition-all">
                    {f.icon}
                  </div>
                  <h3 className="text-white font-bold text-sm mb-1.5">{f.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── For who ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-6 border-t border-border-dim">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="text-xs font-bold text-gold uppercase tracking-widest">Para quem é</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
              Feito para quem cria.
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FOR_WHO.map((f, i) => (
              <FadeIn key={f.label} delay={i * 0.08}>
                <div className="rounded-2xl border border-border-dim bg-surface-1/50 p-5 text-center hover:border-gold/20 transition-all">
                  <div className="text-3xl mb-3">{f.emoji}</div>
                  <h3 className="text-white font-bold text-sm mb-1.5">{f.label}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <div className="rounded-3xl border border-gold/20 bg-gradient-to-br from-gold/8 via-app-2 to-violet/8 p-10 sm:p-14">
              <span className="text-xs font-bold text-gold uppercase tracking-widest">Acesso por convite</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-4 mb-4 leading-tight">
                Pronto para publicar mais<br />em menos tempo?
              </h2>
              <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                O Ágil Editor está em beta com acesso por convite.
                Entre em contato para garantir o seu acesso.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-gold to-[#FFC933] text-black text-sm font-black hover:opacity-90 transition-all shadow-[0_0_40px_rgba(255,184,0,0.25)]"
                >
                  Já tenho acesso — Entrar
                </Link>
                <a
                  href="mailto:contato@agiltime.com.br"
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl border border-border-mid text-gray-300 text-sm font-semibold hover:border-gold/30 hover:text-white transition-all"
                >
                  Solicitar acesso
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-border-dim py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-gold to-violet flex items-center justify-center">
              <span className="text-black text-[9px] font-black">Á</span>
            </div>
            <span className="text-sm font-bold text-white">Ágil Editor</span>
            <span className="text-[10px] text-gray-600 border border-border-dim px-2 py-0.5 rounded-full uppercase tracking-widest ml-1">Beta</span>
          </div>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Ágil Time · Todos os direitos reservados
          </p>
        </div>
      </footer>
    </main>
  );
}
