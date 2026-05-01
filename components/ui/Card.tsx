import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass';
}

export default function Card({
  children,
  variant = 'glass',
  className = '',
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-surface border border-glass rounded-lg p-4',
    glass: 'glass rounded-2xl p-6',
  };

  return (
    <div className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
