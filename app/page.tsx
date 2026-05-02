import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'R$ 97',
    period: '/mês',
    desc: 'Para criadores que publicam regularmente.',
    highlight: false,
    features: [
      '30 vídeos por mês',
      'Até 10 min por vídeo',
      'Cortes automáticos por IA',
      'Legendas sincronizadas',
      'Exportação 9:16 HD',
      'Relatório de edição',
    ],
    cta: 'Começar com Starter',
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
      'Tudo do Starter incluído',
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
      'Tudo do Pro incluído',
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
    title: 'Ilustrações geradas por IA',
    desc: 'Cenas enriquecidas com arte criada pela IA, sobrepostas sem interromper o vídeo original.',
  },
  {
    icon: '📱',
    title: 'Formato 9:16 nativo',
    desc: 'Saída em 1080×1920 pronta para TikTok, Instagram Reels e YouTube Shorts.',
  },
  {
    icon: '📊',
    title: 'Relatório de edição',
    desc: 'Resumo completo: cenas, cortes, duração final e alertas de revisão com timestamps.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Faça upload do vídeo',
    desc: 'Envie qualquer gravação — câmera, screencam ou celular. MP4, MOV ou WebM, até 500 MB.',
  },
  {
    n: '02',
    title: 'Responda 8 perguntas',
    desc: 'Ritmo, estilo, legendas, ilustrações. A IA calibra a edição com base nas suas respostas.',
  },
  {
    n: '03',
    title: 'Baixe e publique',
    desc: 'Em minutos: vídeo vertical editado, legendado e com ilustrações, pronto para postar.',
  },
];

const FOR_WHO = [
  { emoji: '🎬', label: 'Criadores de conteúdo', desc: 'Publique mais vídeos gastando menos horas no editor.' },
  { emoji: '🏢', label: 'Agências de marketing', desc: 'Escale a produção de shorts sem contratar editores.' },
  { emoji: '🎓', label: 'Professores e coaches', desc: 'Transforme suas aulas em shorts educacionais.' },
  { emoji: '🚀', label: 'Startups e empresas', desc: 'Conteúdo profissional sem precisar de equipe de vídeo.' },
];

const FAQ = [
  {
    q: 'Quanto tempo leva para o vídeo ficar pronto?',
    a: 'Em média 3 a 8 minutos, dependendo do tamanho do arquivo e do tipo de edição escolhida.',
  },
  {
    q: 'Preciso ter experiência em edição de vídeo?',
    a: 'Não. Você só precisa fazer upload e responder 8 perguntas simples. O restante é feito automaticamente pela IA.',
  },
  {
    q: 'Quais formatos de vídeo são aceitos?',
    a: 'MP4, MOV e WebM — gravações de câmera, celular, screencasts ou qualquer gravação de tela.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Sim. Não há contrato de fidelidade. Você pode cancelar ou mudar de plano a qualquer momento.',
  },
  {
    q: 'Como funciona o pagamento?',
    a: 'Aceitamos Pix, cartão de crédito e boleto bancário. O acesso é ativado em até 24h após a confirmação do pagamento.',
  },
  {
    q: 'O que são as ilustrações geradas por IA?',
    a: 'Imagens criadas e sobrepostas automaticamente em cenas relevantes do seu vídeo, sempre em overlay — sem substituir o vídeo original.',
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-app overflow-x-hidden" data-page="sales-landing-v2">

      {/* ── Background orbs ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-8%] right-[-4%] w-[700px] h-[700px] bg-gold/7 rounded-full blur-[150px] animate-orb-drift" />
        <div className="absolute bottom-[-10%] left-[-8%] w-[800px] h-[800px] bg-violet/7 rounded-full blur-[150px] animate-orb-drift orb-delay-4" />
        <div className="absolute top-[35%] left-[25%] w-[500px] h-[500px] bg-gold/3 rounded-full blur-[120px] animate-orb-drift orb-delay-2" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* ── Nav ── */}
      <nav className="relative z-20 border-b border-border-dim bg-app/85 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold to-violet flex items-center justify-center shadow-[0_0_24px_rgba(255,184,0,0.3)]">
              <span className="text-black text-xs font-black">Á</span>
            </div>
            <span className="text-white font-bold tracking-tight">Ágil Editor</span>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-7">
            <a href="#como-funciona" className="text-xs text-gray-500 hover:text-gray-200 transition-colors">Como funciona</a>
            <a href="#recursos" className="text-xs text-gray-500 hover:text-gray-200 transition-colors">Recursos</a>
            <a href="#precos" className="text-xs text-gray-500 hover:text-gray-200 transition-colors">Preços</a>
            <a href="#faq" className="text-xs text-gray-500 hover:text-gray-200 transition-colors">FAQ</a>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-surface-2 transition-all"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-gold to-[#FFC933] text-black text-xs font-bold hover:opacity-90 transition-all shadow-[0_0_20px_rgba(255,184,0,0.25)]"
            >
              Criar conta
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 pt-28 pb-24 px-6 text-center">
        <div className="max-w-5xl mx-auto">

          {/* Badge */}
          <div className="animate-slide-up anim-fill-both">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/25 bg-gold/6 text-gold text-[11px] font-semibold uppercase tracking-widest mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              Edição automática com IA · Beta
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-[clamp(3rem,9vw,7.5rem)] font-black tracking-[-0.04em] leading-[0.88] mb-8 animate-slide-up hero-delay-1">
            <span className="block text-white">De gravação bruta</span>
            <span className="block gradient-text">a short viral</span>
            <span className="block text-white">em minutos.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-[17px] text-gray-400 max-w-xl mx-auto leading-relaxed mb-10 animate-slide-up hero-delay-2">
            Faça upload, responda 8 perguntas e receba um short vertical editado,
            legendado e pronto para TikTok, Reels e YouTube Shorts.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16 animate-slide-up hero-delay-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-gold to-[#FFC933] text-black text-base font-black hover:opacity-90 transition-all shadow-[0_0_40px_rgba(255,184,0,0.35)] hover:shadow-[0_0_60px_rgba(255,184,0,0.5)]"
            >
              Criar conta grátis
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="#precos"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl border border-border-mid text-gray-300 text-sm font-semibold hover:border-gold/30 hover:text-white transition-all"
            >
              Ver planos e preços
            </a>
          </div>

          {/* Stats */}
          <div className="inline-flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-8 py-4 rounded-2xl border border-border-dim bg-surface-1/40 backdrop-blur-sm animate-slide-up hero-delay-4">
            {[
              { v: '9:16', l: 'Formato nativo' },
              { v: '~3min', l: 'Tempo médio' },
              { v: '6', l: 'Etapas automáticas' },
              { v: '8', l: 'Parâmetros de edição' },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <div className="text-xl font-black gradient-text-gv">{s.v}</div>
                <div className="text-[9px] text-gray-600 uppercase tracking-widest mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section id="como-funciona" className="relative z-10 py-24 px-6 border-t border-border-dim">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-gold uppercase tracking-widest">Como funciona</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mt-3 tracking-tight">
              Três passos, vídeo pronto.
            </h2>
            <p className="text-gray-500 mt-3 text-sm max-w-xs mx-auto">
              Sem configuração técnica. Sem curva de aprendizado.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="rounded-3xl border border-border-dim bg-surface-1/60 p-8 relative overflow-hidden hover:border-gold/25 hover:bg-surface-1/80 transition-all group"
              >
                <div className="absolute top-6 right-6 text-6xl font-black text-white/[0.03] select-none group-hover:text-white/[0.07] transition-colors">
                  {s.n}
                </div>
                <div className="w-10 h-10 rounded-2xl bg-gold/15 flex items-center justify-center mb-6">
                  <span className="text-gold font-black text-sm">{s.n}</span>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recursos ── */}
      <section id="recursos" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-violet uppercase tracking-widest">Recursos</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mt-3 tracking-tight">
              Tudo automático.
            </h2>
            <p className="text-gray-500 mt-3 text-sm max-w-xs mx-auto">
              6 etapas de edição executadas em paralelo pela IA.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border-dim bg-surface-1/50 p-6 hover:border-gold/20 hover:bg-surface-1/80 transition-all group"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-white font-bold text-sm mb-2">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para quem ── */}
      <section className="relative z-10 py-20 px-6 border-t border-border-dim">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-gold uppercase tracking-widest">Para quem é</span>
            <h2 className="text-4xl font-black text-white mt-3 tracking-tight">Feito para quem cria.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FOR_WHO.map((f) => (
              <div
                key={f.label}
                className="rounded-2xl border border-border-dim bg-surface-1/50 p-6 text-center hover:border-gold/20 hover:bg-surface-1/70 transition-all"
              >
                <div className="text-3xl mb-3">{f.emoji}</div>
                <h3 className="text-white font-bold text-sm mb-2">{f.label}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="precos" className="relative z-10 py-28 px-6 border-t border-border-dim">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-violet uppercase tracking-widest">Planos e preços</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mt-3 tracking-tight">
              Simples, transparente,{' '}
              <span className="gradient-text">sem surpresas.</span>
            </h2>
            <p className="text-sm text-gray-500 mt-4 max-w-sm mx-auto">
              Todos os planos incluem acesso completo. Cancele quando quiser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-3xl border p-7 flex flex-col relative overflow-hidden transition-all ${
                  plan.highlight
                    ? 'border-gold/50 bg-gradient-to-b from-gold/10 via-surface-1/80 to-surface-1/40 shadow-[0_0_80px_rgba(255,184,0,0.15)] scale-[1.03] z-10'
                    : 'border-border-dim bg-surface-1/50 hover:border-border-mid hover:bg-surface-1/70'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px">
                    <span className="inline-flex items-center gap-1 px-4 py-1 rounded-b-xl bg-gradient-to-r from-gold to-[#FFC933] text-black text-[10px] font-black uppercase tracking-wider">
                      ✦ Mais popular
                    </span>
                  </div>
                )}

                <div className="mb-6 pt-3">
                  <h3 className={`text-xl font-black mb-1 ${plan.highlight ? 'text-gold' : 'text-white'}`}>
                    {plan.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-5 leading-snug">{plan.desc}</p>
                  <div className="flex items-end gap-1.5">
                    <span className="text-5xl font-black text-white tracking-tight leading-none">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-sm text-gray-500 mb-1">{plan.period}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-400">
                      <svg
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-gold' : 'text-emerald-400'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-gold to-[#FFC933] text-black hover:opacity-90 shadow-[0_0_30px_rgba(255,184,0,0.4)]'
                      : 'border border-border-mid text-gray-300 hover:border-gold/30 hover:text-white hover:bg-surface-2'
                  }`}
                >
                  {plan.cta}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>

          {/* Trust signals */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-gray-600">
            {[
              'Sem contrato de fidelidade',
              'Aceita Pix, cartão e boleto',
              'Ativação em até 24h',
            ].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative z-10 py-24 px-6 border-t border-border-dim">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-gold uppercase tracking-widest">Dúvidas frequentes</span>
            <h2 className="text-4xl font-black text-white mt-3 tracking-tight">FAQ</h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-border-dim bg-surface-1/50 p-6 hover:border-gold/20 hover:bg-surface-1/70 transition-all"
              >
                <h3 className="text-white font-bold text-sm mb-2">{item.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="relative z-10 py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-3xl border border-gold/25 bg-gradient-to-br from-gold/10 via-app-2 to-violet/10 p-12 sm:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.008)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.008)_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="relative z-10">
              <span className="text-xs font-bold text-gold uppercase tracking-widest">Comece hoje</span>
              <h2 className="text-4xl sm:text-5xl font-black text-white mt-4 mb-4 leading-tight tracking-tight">
                Menos tempo editando.<br />Mais conteúdo publicado.
              </h2>
              <p className="text-sm text-gray-400 mb-8 leading-relaxed max-w-md mx-auto">
                Crie sua conta, escolha um plano e transforme suas gravações em conteúdo viral.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-gold to-[#FFC933] text-black text-sm font-black hover:opacity-90 transition-all shadow-[0_0_40px_rgba(255,184,0,0.3)]"
                >
                  Criar minha conta
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
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
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-border-dim py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold to-violet flex items-center justify-center">
                <span className="text-black text-[10px] font-black">Á</span>
              </div>
              <span className="text-sm font-bold text-white">Ágil Editor</span>
              <span className="text-[9px] text-gray-600 border border-border-dim px-2 py-0.5 rounded-full uppercase tracking-widest ml-1">
                Beta
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <a href="#como-funciona" className="hover:text-gray-400 transition-colors">Como funciona</a>
              <a href="#precos" className="hover:text-gray-400 transition-colors">Preços</a>
              <a href="#faq" className="hover:text-gray-400 transition-colors">FAQ</a>
              <a href="mailto:contato@agiltime.com.br" className="hover:text-gray-400 transition-colors">
                Contato
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-xs text-gray-600 hover:text-gray-400 transition-colors px-3 py-1.5">
                Entrar
              </Link>
              <Link
                href="/register"
                className="text-xs font-bold text-black px-3 py-1.5 rounded-lg bg-gradient-to-r from-gold to-[#FFC933] hover:opacity-90 transition-all"
              >
                Criar conta
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border-dim flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-700">
            <p>© {new Date().getFullYear()} Ágil Time. Todos os direitos reservados.</p>
            <p>contato@agiltime.com.br</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
