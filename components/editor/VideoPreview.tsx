'use client';

import { JobMetadata } from '@/lib/types';

interface VideoPreviewProps {
  job: JobMetadata;
}

interface IconBoxProps {
  color?: 'gold' | 'violet' | 'blue' | 'green' | 'red';
  children: React.ReactNode;
}

function IconBox({ color = 'gold', children }: IconBoxProps) {
  const styles: Record<string, string> = {
    gold:   'bg-gold/10 border-gold/20',
    violet: 'bg-violet/10 border-violet/20',
    blue:   'bg-blue-500/10 border-blue-500/20',
    green:  'bg-green-500/10 border-green-500/20',
    red:    'bg-red-500/10 border-red-500/20',
  };
  return (
    <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center animate-glow ${styles[color]}`}>
      {children}
    </div>
  );
}

export default function VideoPreview({ job }: VideoPreviewProps) {
  const isProcessing = !['done', 'error', 'editing'].includes(job.status);
  const jobAny = job as JobMetadata & { errorMessage?: string };

  return (
    <div className="glass-premium rounded-3xl overflow-hidden border border-border-dim">
      {/* 9:16 aspect ratio container */}
      <div className="relative bg-gradient-to-b from-app-2 to-app aspect-[9/16] flex items-center justify-center overflow-hidden">
        {isProcessing && (
          <div className="absolute inset-0 bg-gradient-to-t from-violet/3 via-transparent to-gold/3 animate-pulse pointer-events-none" />
        )}

        <div className="relative z-10 flex flex-col items-center justify-center gap-5 px-8 text-center w-full">

          {/* DONE */}
          {job.status === 'done' && (
            <>
              <IconBox color="green">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </IconBox>
              <div>
                <p className="text-base font-bold text-white">Video ready!</p>
                <p className="text-xs text-gray-500 mt-1">Your edited video is done</p>
              </div>
              <a
                href={`/api/video/${job.id}/output.mp4`}
                download
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold to-[#FFC933] text-black font-bold rounded-xl text-sm shadow-[0_0_24px_rgba(255,184,0,0.3)] hover:shadow-[0_0_36px_rgba(255,184,0,0.5)] transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Video
              </a>
            </>
          )}

          {/* ERROR */}
          {job.status === 'error' && (
            <>
              <IconBox color="red">
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </IconBox>
              <div>
                <p className="text-base font-semibold text-red-400">Processing failed</p>
                <p className="text-xs text-gray-500 mt-1">{jobAny.errorMessage ?? 'Something went wrong'}</p>
              </div>
            </>
          )}

          {/* UPLOADING */}
          {job.status === 'uploading' && (
            <>
              <IconBox color="gold">
                <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </IconBox>
              <div>
                <p className="text-base font-semibold text-white">Uploading video</p>
                <p className="text-xs text-gray-500 mt-1">Please wait...</p>
              </div>
            </>
          )}

          {/* NORMALIZING */}
          {job.status === 'normalizing' && (
            <>
              <IconBox color="violet">
                <svg className="w-7 h-7 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ animation: 'spin 3s linear infinite' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </IconBox>
              <div>
                <p className="text-base font-semibold text-white">Converting format</p>
                <p className="text-xs text-gray-500 mt-1">Optimizing to H.264 30fps</p>
              </div>
            </>
          )}

          {/* TRANSCRIBING */}
          {job.status === 'transcribing' && (
            <>
              <IconBox color="blue">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </IconBox>
              <div>
                <p className="text-base font-semibold text-white">Transcribing audio</p>
                <p className="text-xs text-gray-500 mt-1">Extracting words & timestamps</p>
              </div>
              <div className="w-full space-y-2">
                <div className="h-1.5 skeleton rounded-full w-full" />
                <div className="h-1.5 skeleton rounded-full w-4/5 mx-auto" />
                <div className="h-1.5 skeleton rounded-full w-3/5 mx-auto" />
              </div>
            </>
          )}

          {/* CUTTING SILENCE */}
          {job.status === 'cutting-silence' && (
            <>
              <IconBox color="violet">
                <svg className="w-7 h-7 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                </svg>
              </IconBox>
              <div>
                <p className="text-base font-semibold text-white">Cortando silêncio</p>
                <p className="text-xs text-gray-500 mt-1">Removendo pausas longas</p>
              </div>
            </>
          )}

          {/* ANALYZING */}
          {job.status === 'analyzing' && (
            <>
              <IconBox color="violet">
                <svg className="w-7 h-7 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                </svg>
              </IconBox>
              <div>
                <p className="text-base font-semibold text-white">AI analyzing content</p>
                <p className="text-xs text-gray-500 mt-1">Detecting scenes & color palette</p>
              </div>
              <div className="w-full space-y-2">
                <div className="h-1.5 skeleton rounded-full w-full" />
                <div className="h-1.5 skeleton rounded-full w-4/5 mx-auto" />
                <div className="h-1.5 skeleton rounded-full w-3/5 mx-auto" />
              </div>
            </>
          )}

          {/* EDITING */}
          {job.status === 'editing' && (
            <>
              <IconBox color="gold">
                <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </IconBox>
              <div>
                <p className="text-base font-semibold text-white">Ready for editing</p>
                <p className="text-xs text-gray-500 mt-1">Review and customize scenes on the right</p>
              </div>
            </>
          )}

          {/* RENDERING */}
          {job.status === 'rendering' && (
            <>
              <IconBox color="violet">
                <svg className="w-7 h-7 text-violet animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ animationDuration: '2s' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </IconBox>
              <div>
                <p className="text-base font-semibold text-white">Rendering final video</p>
                <p className="text-xs text-gray-500 mt-1">Almost done!</p>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Info bar */}
      <div className="border-t border-border-dim px-5 py-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-600 mb-0.5">Duration</p>
          <p className="text-sm font-semibold text-white tabular-nums">{job.duration ? `${job.duration}s` : '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-0.5">Format</p>
          <p className="text-sm font-semibold text-white">1080 × 1920</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-0.5">Status</p>
          <p className="text-sm font-semibold text-gold capitalize">{job.status}</p>
        </div>
      </div>
    </div>
  );
}
