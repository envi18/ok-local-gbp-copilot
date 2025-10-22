// src/components/ui/AIKnowledgeScoresTable.tsx
// PHASE B: AI Knowledge Scores Comparison Table
// Visual comparison of AI platform knowledge across businesses

import { ExternalLink } from 'lucide-react';
import React from 'react';

interface AIKnowledgeScoresTableProps {
  aiKnowledgeComparison: {
    main_business: {
      name: string;
      domain: string;
      scores: Record<string, number>;
    };
    competitors: Array<{
      name: string;
      domain: string;
      scores: Record<string, number>;
    }>;
  };
}

export const AIKnowledgeScoresTable: React.FC<AIKnowledgeScoresTableProps> = ({ 
  aiKnowledgeComparison 
}) => {
  if (!aiKnowledgeComparison || !aiKnowledgeComparison.main_business) {
    return null;
  }

  // Get all platforms from main business scores
  const platforms = Object.keys(aiKnowledgeComparison.main_business.scores);
  
  // Helper function to get color based on score
  const getScoreColor = (score: number): string => {
    if (score === 0) return 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500';
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
    if (score >= 60) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
  };

  // Helper function to get badge style
  const getBadgeStyle = (score: number): string => {
    const baseStyle = 'inline-flex items-center justify-center min-w-[48px] px-3 py-1 rounded-md font-semibold text-sm transition-all';
    return `${baseStyle} ${getScoreColor(score)}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          AI Knowledge Scores Comparison
        </h3>
        <p className="text-indigo-100 text-sm mt-1">
          How well each AI platform knows your business vs competitors
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Business
              </th>
              {platforms.map(platform => (
                <th 
                  key={platform} 
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                >
                  {platform}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Average
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Main Business Row */}
            <tr className="bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              <td className="px-6 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {aiKnowledgeComparison.main_business.name}
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                      Your Business
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {aiKnowledgeComparison.main_business.domain}
                  </div>
                </div>
              </td>
              {platforms.map(platform => {
                const score = aiKnowledgeComparison.main_business.scores[platform] || 0;
                return (
                  <td key={platform} className="px-4 py-4 text-center">
                    <span className={getBadgeStyle(score)}>
                      {score}
                    </span>
                  </td>
                );
              })}
              <td className="px-4 py-4 text-center">
                <span className="inline-flex items-center justify-center min-w-[48px] px-3 py-1 rounded-md font-bold text-sm bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200">
                  {Math.round(
                    Object.values(aiKnowledgeComparison.main_business.scores).reduce((a, b) => a + b, 0) / 
                    platforms.length
                  )}
                </span>
              </td>
            </tr>

            {/* Competitor Rows */}
            {aiKnowledgeComparison.competitors.map((competitor, idx) => {
              const avgScore = Math.round(
                Object.values(competitor.scores).reduce((a, b) => a + b, 0) / platforms.length
              );
              
              return (
                <tr 
                  key={idx} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        {competitor.name}
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                        {competitor.domain}
                        <ExternalLink size={10} />
                      </div>
                    </div>
                  </td>
                  {platforms.map(platform => {
                    const score = competitor.scores[platform] || 0;
                    return (
                      <td key={platform} className="px-4 py-4 text-center">
                        <span className={getBadgeStyle(score)}>
                          {score}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center justify-center min-w-[48px] px-3 py-1 rounded-md font-semibold text-sm ${getScoreColor(avgScore)}`}>
                      {avgScore}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="text-gray-600 dark:text-gray-400 font-medium">Score Legend:</span>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded bg-green-500"></span>
              <span className="text-gray-600 dark:text-gray-400">80-100 (High)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded bg-blue-500"></span>
              <span className="text-gray-600 dark:text-gray-400">60-79 (Medium)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded bg-yellow-500"></span>
              <span className="text-gray-600 dark:text-gray-400">40-59 (Low)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded bg-orange-500"></span>
              <span className="text-gray-600 dark:text-gray-400">1-39 (Very Low)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded bg-gray-300"></span>
              <span className="text-gray-600 dark:text-gray-400">0 (Not Found)</span>
            </div>
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            Based on real AI platform queries
          </div>
        </div>
      </div>
    </div>
  );
};