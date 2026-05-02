'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import UploadZone from '@/components/upload/UploadZone';

export default function AppHome() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-app relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-gold/8 rounded-full blur-[140px] animate-orb-drift" />
        <div
          className="absolute bottom-[-15%] left-[-10%] w-[700px] h-[700px] bg-violet/8 rounded-full blur-[140px] animate-orb-drift"
          style={{ animationDelay: '3s' }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Nav */}
        <nav className="px-6 md:px-8 py-5 flex items-center justify-between max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold to-violet flex items-center justify-center shadow-[0_0_20px_rgba(255,184,0,0.3)]">
              <span className="text-black text-xs font-black">Á</span>
            </div>
            <span className="text-white font-bold tracking-tight">Ágil Editor</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/gallery"
              className="text-xs font-semibold text-gray-500 hover:text-gold transition-colors"
            >
              Meus vídeos
            </Link>
            <form action="/api/logout" method="POST">
              <button
                type="submit"
                className="text-xs text-gray-600 hover:text-red-400 transition-colors"
              >
                Sair
              </button>
            </form>
          </div>
        </nav>

        {/* Hero */}
        <section className="flex-1 flex flex-col items-center justify-center px-4 py-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-[clamp(2.4rem,7vw,5rem)] font-black tracking-[-0.04em] leading-[0.9] mb-4 max-w-2xl"
          >
            <span className="block text-white">Envie seu vídeo</span>
            <span className="block gradient-text">e a IA edita.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed mb-10"
          >
            Cortes automáticos, legendas sincronizadas, ilustrações e formato 9:16 — pronto para publicar.
          </motion.p>

          {/* Upload Zone */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.28 }}
            className="w-full max-w-lg mx-auto"
          >
            <UploadZone onSuccess={(jobId) => router.push(`/editor/${jobId}`)} />
          </motion.div>
        </section>

        {/* Footer stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="border-t border-border-dim"
        >
          <div className="max-w-lg mx-auto px-4 py-6 grid grid-cols-3 gap-4 text-center">
            {[
              { value: '6', label: 'Etapas automáticas' },
              { value: '9:16', label: 'Formato' },
              { value: '30fps', label: 'Output' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-black gradient-text-gv mb-0.5">{s.value}</div>
                <div className="text-[10px] text-gray-600 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
