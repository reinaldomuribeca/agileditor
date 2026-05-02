interface LoginPageProps {
  searchParams: { error?: string; next?: string };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = searchParams.error === '1';
  const next = searchParams.next ?? '/app';
  const userAccountMode = !!process.env.USER_SESSION_SECRET;

  return (
    <main className="min-h-screen bg-app flex items-center justify-center p-6">
      {/* Background orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-gold/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] bg-violet/6 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="glass-premium rounded-3xl border border-border-dim p-8 space-y-6">
          {/* Brand */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-gold to-violet flex items-center justify-center shadow-[0_0_24px_rgba(255,184,0,0.25)]">
              <span className="text-black text-base font-black">Á</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Ágil Editor</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {userAccountMode ? 'Acesse sua conta' : 'Acesso restrito'}
              </p>
            </div>
          </div>

          {/* Form */}
          <form method="POST" action="/api/login" className="space-y-3">
            <input type="hidden" name="next" value={next} />

            {userAccountMode ? (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    E-mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    autoFocus
                    required
                    autoComplete="email"
                    placeholder="seu@email.com"
                    className="w-full rounded-xl bg-app-2 border border-border-dim focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 text-white placeholder-gray-700 text-sm px-4 py-3 transition-all duration-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    Senha
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-app-2 border border-border-dim focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 text-white placeholder-gray-700 text-sm px-4 py-3 transition-all duration-200"
                  />
                </div>
              </>
            ) : (
              <input
                type="password"
                name="password"
                autoFocus
                required
                placeholder="Senha de acesso"
                className="w-full rounded-xl bg-app-2 border border-border-dim focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/20 text-white placeholder-gray-700 text-sm px-4 py-3 transition-all duration-200"
              />
            )}

            {error && (
              <p className="text-xs text-red-400 text-center flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {userAccountMode ? 'E-mail ou senha incorretos.' : 'Senha incorreta.'}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl py-3 font-bold text-black bg-gradient-to-r from-gold via-[#FFC933] to-gold hover:opacity-90 transition-all duration-200 text-sm"
            >
              Entrar
            </button>
          </form>

          {userAccountMode && (
            <p className="text-center text-[11px] text-gray-600 leading-snug">
              Não tem acesso?{' '}
              <a href="/" className="text-gold hover:text-gold/80 transition-colors font-semibold">
                Conheça os planos
              </a>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
