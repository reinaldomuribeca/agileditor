import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'violet' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold focus:ring-offset-app disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-gold hover:bg-gold-muted text-black shadow-[0_0_20px_rgba(255,184,0,0.2)] hover:shadow-[0_0_28px_rgba(255,184,0,0.35)]',
    secondary: 'bg-surface-1 hover:bg-surface-2 text-white border border-border-mid hover:border-gold/30',
    ghost: 'text-gray-400 hover:text-white hover:bg-surface-1',
    violet: 'bg-violet hover:bg-violet-muted text-white shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_28px_rgba(139,92,246,0.35)]',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
