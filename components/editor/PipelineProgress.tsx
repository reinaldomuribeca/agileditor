'use client';

import { useRef, useEffect } from 'react';

interface PipelineProgressProps {
  pct: number;
  label?: string;
}

function ProgressFill({ pct }: { pct: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.style.setProperty('--progress', `${pct}%`);
  }, [pct]);
  return (
    <div
      ref={ref}
      className="progress-fill absolute top-0 left-0 h-0.5 bg-gradient-to-r from-gold to-violet"
    />
  );
}

export default function PipelineProgress({ pct, label }: PipelineProgressProps) {
  return (
    <div className="relative w-full">
      <ProgressFill pct={pct} />
      {label && (
        <span className="text-xs text-gold font-bold tabular-nums">{label}</span>
      )}
    </div>
  );
}
