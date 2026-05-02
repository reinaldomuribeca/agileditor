interface AdminLoginPageProps {
  searchParams: { error?: string; next?: string };
}

export default function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const error = searchParams.error === '1';
  const next = searchParams.next ?? '/admin';

  return (
    <main className="min-h-screen bg-app flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="glass-premium rounded-3xl border border-border-dim p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-violet to-gold/60 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Painel Admin</h1>
            <p className="text-xs text-gray-500">Ágil Editor · Acesso restrito</p>
          </div>

          <form method="POST" action="/api/admin/login" className="space-y-3">
            <input type="hidden" name="next" value={next} />
            <input
              type="password"
              name="password"
              autoFocus
              required
              placeholder="Senha de administrador"
              className="w-full rounded-xl bg-app-2 border border-border-dim focus:border-violet/50 focus:outline-none focus:ring-1 focus:ring-violet/20 text-white placeholder-gray-700 text-sm px-4 py-3 transition-all duration-200"
            />

            {error && (
              <p className="text-xs text-red-400 text-center">Senha incorreta.</p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl py-3 font-bold text-white bg-gradient-to-r from-violet to-violet/70 hover:from-violet/90 hover:to-violet/60 transition-all duration-200 text-sm"
            >
              Entrar no painel
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
