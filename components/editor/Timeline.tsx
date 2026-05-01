'use client';

import { JobMetadata } from '@/lib/types';
import { formatTime } from '@/lib/utils';

interface TimelineProps {
  job: JobMetadata;
}

export default function Timeline({ job }: TimelineProps) {
  const scenes = job.analysis?.scenes ?? [];
  const totalDuration = job.duration ?? 0;

  return (
    <div className="glass-premium rounded-2xl border border-border-dim p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-white">Timeline</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600">{scenes.length} scenes</span>
          <span className="text-xs font-bold text-gold tabular-nums">{formatTime(totalDuration)}</span>
        </div>
      </div>

      {scenes.length === 0 ? (
        /* Empty / loading skeleton */
        <div className="space-y-3">
          <div className="h-10 skeleton rounded-lg" />
          <div className="flex gap-1.5">
            <div className="h-6 skeleton rounded flex-1" />
            <div className="h-6 skeleton rounded flex-1" />
            <div className="h-6 skeleton rounded flex-1" />
          </div>
        </div>
      ) : (
        <>
          {/* Main timeline bar */}
          <div className="relative h-10 bg-app-2 rounded-lg overflow-visible border border-border-dim mb-3">
            <div className="absolute inset-0 flex rounded-lg overflow-hidden">
              {scenes.map((scene, i) => (
                <div
                  key={scene.id}
                  className="flex-1 relative group/seg border-r border-black/40 last:border-r-0 cursor-pointer transition-all duration-150 hover:brightness-125"
                  style={{ backgroundColor: scene.colorPalette?.[0] ? `${scene.colorPalette[0]}55` : 'rgba(255,184,0,0.15)' }}
                >
                  {/* Number */}
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/50 group-hover/seg:text-white/90 transition-colors select-none">
                    {i + 1}
                  </span>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none opacity-0 group-hover/seg:opacity-100 transition-opacity duration-150">
                    <div className="bg-app border border-border-mid rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl shadow-black/50">
                      <p className="font-semibold text-white">{scene.title}</p>
                      <p className="text-gray-500 mt-0.5 capitalize">{scene.type.replace('_', ' ')}</p>
                    </div>
                    <div className="w-2 h-2 bg-app border-r border-b border-border-mid rotate-45 mx-auto -mt-1" />
                  </div>
                </div>
              ))}
            </div>

            {/* Time markers */}
            <div className="absolute inset-0 flex justify-between items-end px-2 pb-1.5 pointer-events-none">
              <span className="text-[9px] text-white/25 font-mono">0:00</span>
              {totalDuration > 0 && (
                <span className="text-[9px] text-white/25 font-mono">{formatTime(totalDuration / 2)}</span>
              )}
              {totalDuration > 0 && (
                <span className="text-[9px] text-white/25 font-mono">{formatTime(totalDuration)}</span>
              )}
            </div>
          </div>

          {/* Scene tags row */}
          <div className="flex flex-wrap gap-1.5">
            {scenes.slice(0, 6).map((scene, i) => (
              <div
                key={scene.id}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-1 border border-border-dim text-xs text-gray-400 hover:text-white hover:border-gold/30 transition-all cursor-default"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: scene.colorPalette?.[0] ?? '#FFB800' }}
                />
                <span className="truncate max-w-[80px]">{i + 1}. {scene.title}</span>
              </div>
            ))}
            {scenes.length > 6 && (
              <div className="inline-flex items-center px-2 py-1 rounded-md bg-gold/5 border border-gold/20 text-xs text-gold font-medium">
                +{scenes.length - 6} more
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
