import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'info',
  size = 'md',
  pulse = false,
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-all duration-200';
  
  const variants = {
    success: 'bg-gradient-to-r from-[#11998e] to-[#38ef7d] text-white',
    warning: 'bg-gradient-to-r from-[#f093fb] to-[#f5576c] text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
    gradient: 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const pulseClass = pulse ? 'animate-pulse' : '';

  return (
    <span className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${pulseClass} ${className}`}>
      {children}
    </span>
  );
};