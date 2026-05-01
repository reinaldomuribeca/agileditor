interface LoginPageProps {
  searchParams: { error?: string; next?: string };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = searchParams.error === '1';
  const next = searchParams.next ?? '/';

  return (
    <main className="min-h-screen bg-app flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="glass-premium rounded-3xl border border-border-dim p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-gold to-violet flex items-center justify-center shadow-[0_0_20px_rgba(255,184,0,0.3)]">
              <span className="text-black text-base font-black">Á</span>
            </div>
            <h1 className="text-xl font-bold text-white">Ágil Editor</h1>
            <p className="text-xs text-gray-500">Acesso restrito</p>
          </div>

          <form method="POST" action="/api/login" className="space-y-3">
            <input type="hidden" name="next" value={next} />
            <input
              type="password"
              name="password"
              autoFocus
              required
              placeholder="Senha"
              className="w-full rounded-xl bg-app-2 border border-border-dim focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 text-white placeholder-gray-700 text-sm px-4 py-3 transition-all duration-200"
            />

            {error && (
              <p className="text-xs text-red-400 text-center">Senha incorreta.</p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl py-3 font-bold text-black bg-gradient-to-r from-gold via-[#FFC933] to-gold hover:from-gold-muted hover:to-gold transition-all duration-200 text-sm"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
