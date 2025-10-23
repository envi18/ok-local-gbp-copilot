// src/components/ui/AIKnowledgeScoresTable.tsx
// PHASE B: AI Knowledge Scores Comparison Table
// FIXED: Matches backend data structure with businesses array

import { TrendingUp } from 'lucide-react';
import React from 'react';

interface PlatformScore {
  platform: string;
  score: number;
  knowledge_level: string;
  mention_count: number;
}

interface Business {
  name: string;
  is_target: boolean;
  platform_scores: PlatformScore[];
  overall_score: number;
  total_mentions: number;
}

interface AIKnowledgeComparisonData {
  businesses: Business[];
  platforms: string[];
}

interface AIKnowledgeScoresTableProps {
  aiKnowledgeComparison: AIKnowledgeComparisonData;
}

export const AIKnowledgeScoresTable: React.FC<AIKnowledgeScoresTableProps> = ({ 
  aiKnowledgeComparison 
}) => {
  // Validate data structure
  if (!aiKnowledgeComparison || !aiKnowledgeComparison.businesses || aiKnowledgeComparison.businesses.length === 0) {
    return null;
  }

  const { businesses, platforms } = aiKnowledgeComparison;

  // Helper function to get score color
  const getScoreColor = (score: number): string => {
    if (score === 0) return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
    if (score >= 60) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
    if (score >= 20) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
  };

  // Helper function to get knowledge level badge color
  const getKnowledgeLevelColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'low':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'none':
      default:
        return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // Get platform score for a business
  const getPlatformScore = (business: Business, platform: string): PlatformScore | null => {
    return business.platform_scores.find(ps => ps.platform.toLowerCase() === platform.toLowerCase()) || null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <TrendingUp size={24} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Knowledge Scores Comparison
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              How you compare to competitors across all AI platforms
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Business
              </th>
              {platforms.map((platform) => (
                <th 
                  key={platform}
                  className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white capitalize"
                >
                  {platform}
                </th>
              ))}
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                Overall
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {businesses.map((business, idx) => (
              <tr 
                key={idx}
                className={business.is_target 
                  ? 'bg-blue-50/50 dark:bg-blue-900/10' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-900/30'
                }
              >
                {/* Business Name */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {business.name}
                    </span>
                    {business.is_target && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Mentioned on {business.total_mentions} platform{business.total_mentions !== 1 ? 's' : ''}
                  </div>
                </td>

                {/* Platform Scores */}
                {platforms.map((platform) => {
                  const platformScore = getPlatformScore(business, platform);
                  
                  return (
                    <td key={platform} className="px-6 py-4 text-center">
                      {platformScore ? (
                        <div className="flex flex-col items-center gap-1">
                          {/* Score Badge */}
                          <span className={`inline-flex items-center justify-center min-w-[48px] px-3 py-1 rounded-md font-semibold text-sm ${getScoreColor(platformScore.score)}`}>
                            {platformScore.score}
                          </span>
                          
                          {/* Knowledge Level */}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getKnowledgeLevelColor(platformScore.knowledge_level)}`}>
                            {platformScore.knowledge_level}
                          </span>
                          
                          {/* Mention Count */}
                          {platformScore.mention_count > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {platformScore.mention_count}x
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">-</span>
                      )}
                    </td>
                  );
                })}

                {/* Overall Score */}
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center justify-center min-w-[56px] px-4 py-2 rounded-lg font-bold text-base ${getScoreColor(business.overall_score)}`}>
                    {business.overall_score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Legend */}
      <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className="font-medium">Knowledge Levels:</span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                High
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                Medium
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                Low
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                None
              </span>
            </div>
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            Higher scores indicate better AI platform visibility
          </div>
        </div>
      </div>
    </div>
  );
};