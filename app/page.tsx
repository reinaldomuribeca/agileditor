'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import UploadZone from '@/components/upload/UploadZone';

const FEATURES = [
  { icon: '🎙', label: 'Transcrição automática' },
  { icon: '✂️', label: 'Corte inteligente' },
  { icon: '🎨', label: 'Análise de cenas' },
  { icon: '💬', label: 'Legendas sincronizadas' },
  { icon: '📱', label: 'Exportação vertical' },
];

export default function Home() {
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
          <span className="text-[11px] text-gray-600 border border-border-dim px-3 py-1 rounded-full uppercase tracking-widest">
            Beta
          </span>
        </nav>

        {/* Hero */}
        <section className="flex-1 flex flex-col items-center justify-center px-4 py-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="mb-7"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/25 bg-gold/5 text-gold text-xs font-semibold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              IA para edição de vídeo
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="text-[clamp(2.8rem,8vw,6.5rem)] font-black tracking-[-0.04em] leading-[0.88] mb-6 max-w-3xl"
          >
            <span className="block text-white">Transforme</span>
            <span className="block gradient-text">vídeos brutos</span>
            <span className="block text-white">em arte.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[15px] text-gray-500 max-w-md mx-auto leading-relaxed mb-8"
          >
            Envie qualquer vídeo. Cortes automáticos, legendas sincronizadas,
            ilustrações e exportação em formato vertical — tudo sem editar manualmente.
          </motion.p>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="flex flex-wrap justify-center gap-2 mb-12"
          >
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-1 border border-border-dim text-xs text-gray-500 hover:border-gold/30 hover:text-gray-300 transition-all"
              >
                <span>{f.icon}</span>
                {f.label}
              </div>
            ))}
          </motion.div>

          {/* Upload Zone */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.36 }}
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
          <div className="max-w-lg mx-auto px-4 py-8 grid grid-cols-3 gap-4 text-center">
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
