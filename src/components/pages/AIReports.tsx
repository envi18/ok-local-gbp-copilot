// src/components/pages/AIReports.tsx
// Combined page with tabs for Generator and History

import { FileBarChart, History } from 'lucide-react';
import React, { useState } from 'react';
import { AIReportGenerator } from './AIReportGenerator';
import { AIReportHistory } from './AIReportHistory';

type TabType = 'generator' | 'history';

export const AIReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('generator');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          AI Reports
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Generate and manage AI Visibility reports for prospects, competitors, and clients
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('generator')}
            className={`
              flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'generator'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }
            `}
          >
            <FileBarChart size={18} />
            Generate Report
          </button>
          
          <button
            onClick={() => setActiveTab('history')}
            className={`
              flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'history'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }
            `}
          >
            <History size={18} />
            Report History
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'generator' && <AIReportGenerator />}
        {activeTab === 'history' && <AIReportHistory />}
      </div>
    </div>
  );
};