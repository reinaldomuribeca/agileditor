import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export default function Spinner({ size = 'md', color = '#FFB800' }: SpinnerProps) {
  const sizes = {
    sm: 'h-3 w-3 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-[3px]',
  };

  return (
    <div
      className={`${sizes[size]} rounded-full animate-spin flex-shrink-0`}
      style={{
        borderColor: `${color}25`,
        borderTopColor: color,
      }}
    />
  );
}
