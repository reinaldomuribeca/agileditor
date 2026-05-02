import Link from 'next/link';

/* ─── Pricing data ────────────────────────────────────────────────────────── */
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'R$ 97',
    period: '/mês',
    desc: 'Para criadores que publicam com regularidade.',
    highlight: false,
    features: [
      '30 vídeos por mês',
      'Até 10 min por vídeo',
      'Cortes automáticos',
      'Legendas sincronizadas',
      'Exportação 9:16 HD',
      'Relatório de edição',
    ],
    cta: 'Começar agora',
    href: '/register?plan=starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 247',
    period: '/mês',
    desc: 'Para agências e criadores profissionais.',
    highlight: true,
    features: [
      '150 vídeos por mês',
      'Até 30 min por vídeo',
      'Tudo do Starter',
      'Ilustrações geradas pela IA',
      'Título de abertura personalizado',
      'Suporte prioritário',
    ],
    cta: 'Escolher Pro',
    href: '/register?plan=pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Sob consulta',
    period: '',
    desc: 'Para empresas com alto volume de produção.',
    highlight: false,
    features: [
      'Volume ilimitado',
      'Vídeos de qualquer duração',
      'Tudo do Pro',
      'Onboarding dedicado',
      'SLA garantido',
      'Integração por API',
    ],
    cta: 'Falar com a equipe',
    href: 'mailto:contato@agiltime.com.br',
  },
];

const FEATURES = [
  {
    icon: '🎙',
    title: 'Transcrição automática',
    desc: 'Áudio transcrito com timestamps precisos. Cada palavra sincronizada ao milissegundo.',
  },
  {
    icon: '✂️',
    title: 'Cortes inteligentes',
    desc: 'Silêncios e pausas removidos automaticamente. Você escolhe o nível de agressividade.',
  },
  {
    icon: '💬',
    title: 'Legendas sincronizadas',
    desc: 'Legendas geradas e sobrepostas palavra por palavra no formato certo para cada plataforma.',
  },
  {
    icon: '🎨',
    title: 'Ilustrações geradas',
    desc: 'Cenas enriquecidas com arte criada pela IA, sobrepostas sem interromper o vídeo.',
  },
  {
    icon: '📱',
    title: 'Formato 9:16 nativo',
    desc: 'Saída em 1080×1920 pronta para TikTok, Instagram Reels e YouTube Shorts.',
  },
  {
    icon: '📊',
    title: 'Relatório de edição',
    desc: 'Resumo de cada edição: cenas, cortes, duração final e alertas de revisão detalhados.',
  },
];

const STEPS = [
  { n: '01', title: 'Faça upload', desc: 'Envie qualquer gravação — câmera, screencam ou celular. MP4, MOV, WebM.' },
  { n: '02', title: 'Responda 8 perguntas', desc: 'Ritmo, estilo, legendas, ilustrações. A IA calibra tudo com base nas suas respostas.' },
  { n: '03', title: 'Baixe e publique', desc: 'Em minutos: vídeo vertical editado, legendado e com ilustrações, pronto para postar.' },
];

const FOR_WHO = [
  { emoji: '🎬', label: 'Criadores de conteúdo', desc: 'Mais vídeos publicados, menos horas no editor.' },
  { emoji: '🏢', label: 'Agências de marketing', desc: 'Escale a produção sem contratar editores.' },
  { emoji: '🎓', label: 'Professores e coaches', desc: 'Transforme aulas em shorts educacionais.' },
  { emoji: '🚀', label: 'Startups e empresas', desc: 'Conteúdo profissional sem equipe de vídeo.' },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-app overflow-x-hidden">

      {/* ── Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-8%] right-[-4%] w-[700px] h-[700px] bg-gold/7 rounded-full blur-[150px] animate-orb-drift" />
        <div className="absolute bottom-[-10%] left-[-8%] w-[800px] h-[800px] bg-violet/7 rounded-full blur-[150px] animate-orb-drift" style={{ animationDelay: '4s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* ── Nav ── */}
      <nav className="relative z-20 border-b border-border-dim bg-app/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold to-violet flex items-center justify-center shadow-[0_0_20px_rgba(255,184,0,0.25)]">
              <span className="text-black text-xs font-black">Á</span>
            </div>
            <span className="text-white font-bold tracking-tight">Ágil Editor</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#precos" className="text-xs font-semibold text-gray-500 hover:text-gray-300 transition-colors hidden sm:inline">
              Preços
            </a>
            <Link
              href="/login"
              className="text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-gold to-[#FFC933] text-black text-sm font-bold hover:opacity-90 transition-all"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 pt-24 pb-20 px-6 text-center">
        <div className="animate-slide-up" style={{ animationFillMode: 'both' }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/25 bg-gold/5 text-gold text-xs font-semibold uppercase tracking-widest mb-6 inline-flex">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            Edição automática com IA · Beta
          </span>
        </div>

        <h1
          className="text-[clamp(3rem,9vw,7rem)] font-black tracking-[-0.04em] leading-[0.88] mb-6 max-w-4xl mx-auto animate-slide-up"
          style={{ animationDelay: '0.08s', animationFillMode: 'both' }}
        >
          <span className="block text-white">De gravação bruta</span>
          <span className="block gradient-text">a conteúdo viral</span>
          <span className="block text-white">em minutos.</span>
        </h1>

        <p
          className="text-[16px] text-gray-400 max-w-xl mx-auto leading-relaxed mb-10 animate-slide-up"
          style={{ animationDelay: '0.18s', animationFillMode: 'both' }}
        >
          Faça upload, responda 8 perguntas e receba um short vertical editado,
          legendado e pronto para TikTok, Reels e YouTube Shorts.
        </p>

        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up"
          style={{ animationDelay: '0.28s', animationFillMode: 'both' }}
        >
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-gold to-[#FFC933] text-black text-base font-black hover:opacity-90 transition-all shadow-[0_0_40px_rgba(255,184,0,0.3)] hover:shadow-[0_0_60px_rgba(255,184,0,0.45)]"
          >
            Criar conta grátis
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
        </div>

        {/* Stats bar */}
        <div
          className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 animate-slide-up"
          style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
        >
          {[
            { v: '9:16', l: 'Formato nativo' },
            { v: '30fps', l: 'Saída H.264' },
            { v: '6', l: 'Etapas automáticas' },
            { v: '8', l: 'Parâmetros de edição' },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-2xl font-black gradient-text-gv">{s.v}</div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="como-funciona" className="relative z-10 py-20 px-6 border-t border-border-dim">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-gold uppercase tracking-widest">Como funciona</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">Três passos, vídeo pronto.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-border-dim bg-surface-1/60 p-6 relative overflow-hidden hover:border-gold/25 transition-all group">
                <div className="absolute top-4 right-4 text-5xl font-black text-white/[0.04] select-none group-hover:text-white/[0.07] transition-colors">{s.n}</div>
                <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center mb-4">
                  <span className="text-gold font-black text-sm">{s.n}</span>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-violet uppercase tracking-widest">Recursos</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
              Tudo que você precisa,{' '}
              <span className="gradient-text">automático.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border-dim bg-surface-1/50 p-5 hover:border-gold/20 hover:bg-surface-1/80 transition-all group">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="text-white font-bold text-sm mb-1.5">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For who ── */}
      <section className="relative z-10 py-20 px-6 border-t border-border-dim">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-gold uppercase tracking-widest">Para quem é</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">Feito para quem cria.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FOR_WHO.map((f) => (
              <div key={f.label} className="rounded-2xl border border-border-dim bg-surface-1/50 p-5 text-center hover:border-gold/20 transition-all">
                <div className="text-3xl mb-3">{f.emoji}</div>
                <h3 className="text-white font-bold text-sm mb-1.5">{f.label}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="precos" className="relative z-10 py-24 px-6 border-t border-border-dim">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-violet uppercase tracking-widest">Planos e preços</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
              Simples, transparente,{' '}
              <span className="gradient-text">sem surpresas.</span>
            </h2>
            <p className="text-sm text-gray-500 mt-4 max-w-md mx-auto">
              Todos os planos incluem acesso completo às funcionalidades.
              Cancele quando quiser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl border p-6 flex flex-col relative overflow-hidden transition-all ${
                  plan.highlight
                    ? 'border-gold/40 bg-gradient-to-b from-gold/10 via-surface-1/80 to-surface-1/40 shadow-[0_0_60px_rgba(255,184,0,0.12)]'
                    : 'border-border-dim bg-surface-1/50 hover:border-border-mid'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px">
                    <span className="inline-flex items-center px-3 py-0.5 rounded-b-lg bg-gradient-to-r from-gold to-[#FFC933] text-black text-[10px] font-black uppercase tracking-wider">
                      Mais popular
                    </span>
                  </div>
                )}

                <div className="mb-5 pt-2">
                  <h3 className={`text-lg font-black mb-1 ${plan.highlight ? 'text-gold' : 'text-white'}`}>
                    {plan.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-4 leading-snug">{plan.desc}</p>
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-white'}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-sm text-gray-500 mb-1">{plan.period}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-400">
                      <svg className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-gold' : 'text-emerald-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-gold to-[#FFC933] text-black hover:opacity-90 shadow-[0_0_24px_rgba(255,184,0,0.3)]'
                      : 'border border-border-mid text-gray-300 hover:border-gold/30 hover:text-white hover:bg-surface-2'
                  }`}
                >
                  {plan.cta}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-600 mt-8">
            Aceita Pix e cartão de crédito. Ativação em até 24h após confirmação do pagamento.
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="rounded-3xl border border-gold/20 bg-gradient-to-br from-gold/8 via-app-2 to-violet/8 p-10 sm:p-14">
            <span className="text-xs font-bold text-gold uppercase tracking-widest">Comece hoje</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-4 mb-4 leading-tight">
              Menos tempo editando.<br />Mais conteúdo publicado.
            </h2>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              Crie sua conta agora e transforme suas gravações em conteúdo viral.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-gold to-[#FFC933] text-black text-sm font-black hover:opacity-90 transition-all shadow-[0_0_40px_rgba(255,184,0,0.25)]"
              >
                Criar minha conta
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl border border-border-mid text-gray-300 text-sm font-semibold hover:border-gold/30 hover:text-white transition-all"
              >
                Já tenho conta — Entrar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-border-dim py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-gold to-violet flex items-center justify-center">
              <span className="text-black text-[9px] font-black">Á</span>
            </div>
            <span className="text-sm font-bold text-white">Ágil Editor</span>
            <span className="text-[10px] text-gray-600 border border-border-dim px-2 py-0.5 rounded-full uppercase tracking-widest ml-1">Beta</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-600">
            <a href="mailto:contato@agiltime.com.br" className="hover:text-gray-400 transition-colors">contato@agiltime.com.br</a>
            <Link href="/login" className="hover:text-gray-400 transition-colors">Login</Link>
          </div>
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} Ágil Time</p>
        </div>
      </footer>
    </main>
  );
}
