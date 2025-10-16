// src/components/ui/ReportProgressIndicator.tsx
// Progress indicator for external report generation

import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import React from 'react';

interface PlatformProgress {
  platform: 'chatgpt' | 'claude' | 'gemini' | 'perplexity';
  status: 'pending' | 'analyzing' | 'complete' | 'error';
}

interface ReportProgressIndicatorProps {
  platforms: PlatformProgress[];
  currentPhase: 'initializing' | 'querying' | 'analyzing' | 'complete' | 'error';
  errorMessage?: string;
}

export const ReportProgressIndicator: React.FC<ReportProgressIndicatorProps> = ({
  platforms,
  currentPhase,
  errorMessage
}) => {
  const platformNames: Record<string, string> = {
    chatgpt: 'ChatGPT',
    claude: 'Claude',
    gemini: 'Gemini',
    perplexity: 'Perplexity'
  };

  const getPhaseMessage = (): string => {
    switch (currentPhase) {
      case 'initializing':
        return 'Initializing report generation...';
      case 'querying':
        return 'Querying AI platforms...';
      case 'analyzing':
        return 'Analyzing responses and generating insights...';
      case 'complete':
        return 'Report generation complete!';
      case 'error':
        return 'Error generating report';
      default:
        return 'Processing...';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'analyzing':
        return <Loader size={18} className="text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle size={18} className="text-red-500" />;
      default:
        return (
          <div className="w-[18px] h-[18px] border-2 border-gray-300 rounded-full" />
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {currentPhase === 'error' ? (
          <AlertCircle size={24} className="text-red-500" />
        ) : currentPhase === 'complete' ? (
          <CheckCircle size={24} className="text-green-500" />
        ) : (
          <Loader size={24} className="text-blue-500 animate-spin" />
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {getPhaseMessage()}
          </h3>
          {currentPhase !== 'error' && currentPhase !== 'complete' && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This may take 2-3 minutes
            </p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {currentPhase === 'error' && errorMessage && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-300">{errorMessage}</p>
        </div>
      )}

      {/* Platform Progress */}
      {currentPhase !== 'initializing' && (
        <div className="space-y-3">
          {platforms.map((platform) => (
            <div
              key={platform.platform}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(platform.status)}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {platformNames[platform.platform]}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {platform.status === 'complete'
                  ? 'Analyzed'
                  : platform.status === 'analyzing'
                  ? 'Analyzing...'
                  : platform.status === 'error'
                  ? 'Failed'
                  : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {currentPhase !== 'error' && currentPhase !== 'complete' && (
        <div className="mt-6">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
              style={{
                width: `${
                  currentPhase === 'initializing'
                    ? 10
                    : currentPhase === 'querying'
                    ? 30 +
                      (platforms.filter((p) => p.status === 'complete').length /
                        platforms.length) *
                        40
                    : currentPhase === 'analyzing'
                    ? 80
                    : 100
                }%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};