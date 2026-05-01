import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'gold' | 'success' | 'error' | 'info' | 'violet' | 'neutral' | 'warning';
}

export default function Badge({
  children,
  variant = 'gold',
  className = '',
  ...props
}: BadgeProps) {
  const variants = {
    gold: 'bg-gold/10 text-gold border border-gold/20',
    success: 'bg-green-500/10 text-green-400 border border-green-500/20',
    error: 'bg-red-500/10 text-red-400 border border-red-500/20',
    info: 'bg-blue-400/10 text-blue-400 border border-blue-400/20',
    violet: 'bg-violet/10 text-violet border border-violet/20',
    neutral: 'bg-surface-1 text-gray-400 border border-border-dim',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
