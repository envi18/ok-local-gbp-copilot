// src/components/ui/ExportButton.tsx
import { CheckCircle, Download } from 'lucide-react';
import React, { useState } from 'react';

interface ExportButtonProps {
  onExport: () => void | Promise<void>;
  label?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  label = 'Export to CSV',
  disabled = false,
  variant = 'secondary',
  size = 'md',
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const handleExport = async () => {
    if (disabled || isExporting) return;

    try {
      setIsExporting(true);
      await onExport();
      
      // Show success state
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error: any) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const variantClasses: Record<string, string> = {
    primary: 'bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] text-white hover:opacity-90',
    secondary: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700',
    ghost: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
  };

  const sizeClasses: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const iconSizes: Record<string, number> = {
    sm: 14,
    md: 16,
    lg: 18
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isExporting}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {showSuccess ? (
        <>
          <CheckCircle size={iconSizes[size]} className="text-green-500" />
          <span>Exported!</span>
        </>
      ) : (
        <>
          <Download 
            size={iconSizes[size]} 
            className={isExporting ? 'animate-bounce' : ''} 
          />
          <span>{isExporting ? 'Exporting...' : label}</span>
        </>
      )}
    </button>
  );
};