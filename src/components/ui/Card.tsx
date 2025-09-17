import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = true,
  glow = false
}) => {
  const baseClasses = 'bg-white/80 dark:bg-black/40 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl p-6 transition-all duration-300';
  const hoverClasses = hover ? 'hover:scale-[1.02] hover:shadow-xl dark:hover:shadow-2xl hover:bg-white/90 dark:hover:bg-black/50' : '';
  const glowClasses = glow ? 'shadow-2xl shadow-[#f45a4e]/20' : 'shadow-lg';

  return (
    <div className={`${baseClasses} ${hoverClasses} ${glowClasses} ${className}`}>
      {children}
    </div>
  );
};