'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const PLAN_LABELS: Record<string, string> = {
  starter:    'Starter — R$ 97/mês',
  pro:        'Pro — R$ 247/mês',
  enterprise: 'Enterprise — Sob consulta',
};

const PLAN_FEATURES: Record<string, string[]> = {
  starter:    ['30 vídeos/mês', 'Até 10 min por vídeo', 'Cortes, legendas, exportação 9:16'],
  pro:        ['150 vídeos/mês', 'Até 30 min por vídeo', 'Tudo do Starter + ilustrações'],
  enterprise: ['Volume ilimitado', 'Integração por API', 'SLA e suporte dedicado'],
};

function RegisterForm() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan') ?? 'starter';

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    plan: (planParam in PLAN_LABELS ? planParam : 'starter') as string,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('As senhas não conferem.');
      return;
    }
    if (form.password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const r = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          plan: form.plan,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Erro ao criar conta');
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-app flex items-center justify-center p-6">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-gold/6 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-8%] w-[600px] h-[600px] bg-violet/6 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="glass-premium rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-10 space-y-5">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Conta criada!</h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                Seu cadastro foi recebido com sucesso. O acesso será liberado em até{' '}
                <strong className="text-white">24 horas</strong> após a confirmação do pagamento.
              </p>
            </div>
            <div className="rounded-2xl border border-border-dim bg-app-2 p-5 text-left space-y-3">
              <p className="text-xs font-bold text-gold uppercase tracking-wider">Próximos passos</p>
              {[
                { n: '1', t: 'Efetue o pagamento', d: 'Pix ou cartão — envie o comprovante para contato@agiltime.com.br' },
                { n: '2', t: 'Aguarde a ativação', d: 'Em até 24h você receberá um e-mail confirmando o acesso.' },
                { n: '3', t: 'Acesse o editor', d: 'Faça login com o e-mail e senha que acabou de cadastrar.' },
              ].map((s) => (
                <div key={s.n} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gold/15 text-gold text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</div>
                  <div>
                    <p className="text-xs font-semibold text-white">{s.t}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
            >
              ← Voltar para a página inicial
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app flex items-center justify-center p-6 py-12">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-gold/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-8%] w-[600px] h-[600px] bg-violet/6 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

        {/* Left — Plan summary */}
        <div className="space-y-6">
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </Link>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold to-violet flex items-center justify-center">
                <span className="text-black text-xs font-black">Á</span>
              </div>
              <span className="text-white font-bold">Ágil Editor</span>
            </div>
            <h1 className="text-3xl font-black text-white leading-tight">
              Crie sua conta e<br />
              <span className="gradient-text">comece a publicar mais.</span>
            </h1>
            <p className="text-sm text-gray-500 mt-3">
              Preencha o formulário ao lado. O acesso é ativado após a confirmação do pagamento.
            </p>
          </div>

          {/* Plan card */}
          <div className="rounded-2xl border border-gold/25 bg-gold/5 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-gold uppercase tracking-wider">Plano selecionado</p>
                <p className="text-lg font-black text-white mt-1">{PLAN_LABELS[form.plan] ?? PLAN_LABELS.starter}</p>
              </div>
              <Link href="/#precos" className="text-xs text-gray-500 hover:text-gold transition-colors">
                Mudar plano
              </Link>
            </div>
            <ul className="space-y-2">
              {(PLAN_FEATURES[form.plan] ?? PLAN_FEATURES.starter).map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-gray-300">
                  <svg className="w-3.5 h-3.5 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border-dim bg-app-2 p-4 space-y-1">
            <p className="text-xs font-semibold text-gray-400">Pagamento aceito</p>
            <div className="flex flex-wrap gap-2">
              {['Pix', 'Cartão de crédito', 'Boleto'].map((m) => (
                <span key={m} className="px-2.5 py-1 rounded-lg border border-border-dim text-xs text-gray-500">{m}</span>
              ))}
            </div>
            <p className="text-[11px] text-gray-600 pt-1">Ativação em até 24h após confirmação do pagamento.</p>
          </div>
        </div>

        {/* Right — Form */}
        <div className="glass-premium rounded-3xl border border-border-dim p-7 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Criar conta</h2>
            <p className="text-xs text-gray-500 mt-0.5">Todos os campos são obrigatórios</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Plan selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Plano</label>
              <select
                value={form.plan}
                onChange={update('plan')}
                className="w-full rounded-xl bg-app-2 border border-border-dim focus:border-gold/50 focus:outline-none text-white text-sm px-4 py-3 transition-all"
              >
                <option value="starter">Starter — R$ 97/mês</option>
                <option value="pro">Pro — R$ 247/mês</option>
                <option value="enterprise">Enterprise — Sob consulta</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Nome completo</label>
              <input
                type="text" required value={form.name} onChange={update('name')}
                placeholder="Seu nome"
                className="w-full rounded-xl bg-app-2 border border-border-dim focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 text-white placeholder-gray-700 text-sm px-4 py-3 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">E-mail</label>
              <input
                type="email" required value={form.email} onChange={update('email')}
                placeholder="seu@email.com"
                autoComplete="email"
                className="w-full rounded-xl bg-app-2 border border-border-dim focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 text-white placeholder-gray-700 text-sm px-4 py-3 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">WhatsApp (opcional)</label>
              <input
                type="tel" value={form.phone} onChange={update('phone')}
                placeholder="(11) 99999-9999"
                className="w-full rounded-xl bg-app-2 border border-border-dim focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 text-white placeholder-gray-700 text-sm px-4 py-3 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Senha</label>
              <input
                type="password" required value={form.password} onChange={update('password')}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                className="w-full rounded-xl bg-app-2 border border-border-dim focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 text-white placeholder-gray-700 text-sm px-4 py-3 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Confirmar senha</label>
              <input
                type="password" required value={form.confirm} onChange={update('confirm')}
                placeholder="Repita a senha"
                autoComplete="new-password"
                className="w-full rounded-xl bg-app-2 border border-border-dim focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 text-white placeholder-gray-700 text-sm px-4 py-3 transition-all"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full rounded-xl py-3.5 font-bold text-black bg-gradient-to-r from-gold via-[#FFC933] to-gold hover:opacity-90 disabled:opacity-50 transition-all text-sm"
            >
              {loading ? 'Criando conta...' : 'Criar minha conta'}
            </button>

            <p className="text-center text-xs text-gray-600">
              Já tem conta?{' '}
              <Link href="/login" className="text-gold hover:text-gold/80 transition-colors font-semibold">
                Entrar
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
