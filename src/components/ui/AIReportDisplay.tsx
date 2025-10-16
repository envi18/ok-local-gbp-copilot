// src/components/ui/AIReportDisplay.tsx
// Reusable component for displaying AI visibility reports

import { AlertTriangle, CheckCircle, Target, TrendingUp } from 'lucide-react';
import React from 'react';
import type { AIVisibilityReport } from '../../types/aiVisibility';
import { Badge } from './Badge';

interface AIReportDisplayProps {
  report: AIVisibilityReport;
}

export const AIReportDisplay: React.FC<AIReportDisplayProps> = ({ report }) => {
  const overallScore = report.overall_score || 0;

  const getGradeColor = (score: number): string => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getGrade = (score: number): string => {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'C+';
    if (score >= 65) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <TrendingUp size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Overall AI Visibility Score
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Across all AI platforms
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-5xl font-bold ${getGradeColor(overallScore)}`}>
              {getGrade(overallScore)}
            </div>
            <div className="text-2xl font-semibold text-gray-600 dark:text-gray-400">
              {overallScore}/100
            </div>
          </div>
        </div>
      </div>

      {/* Platform Scores */}
      {report.platform_scores && report.platform_scores.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            AI Platform Scores
          </h3>
          <div className="space-y-4">
            {report.platform_scores.map((platformScore) => (
              <div key={platformScore.platform}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {platformScore.platform}
                    </span>
                    {platformScore.mention_count > 0 && (
                      <Badge variant="info" size="sm">
                        {platformScore.mention_count} mentions
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {platformScore.score}/100
                  </span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      platformScore.score >= 80
                        ? 'bg-green-500'
                        : platformScore.score >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${platformScore.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Gaps */}
      {report.content_gaps && report.content_gaps.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Target size={24} className="text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Content Gap Analysis
            </h3>
          </div>
          <div className="space-y-3">
            {report.content_gaps.slice(0, 5).map((gap, index) => (
              <div
                key={gap.id || index}
                className={`p-4 rounded-lg border ${
                  gap.severity === 'critical'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : gap.severity === 'significant'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {gap.severity === 'critical' ? (
                      <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
                    ) : (
                      <AlertTriangle size={18} className="text-yellow-600 dark:text-yellow-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {gap.gap_title}
                      </span>
                      <Badge
                        variant={gap.severity === 'critical' ? 'error' : 'warning'}
                        size="sm"
                      >
                        {gap.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {gap.gap_description}
                    </p>
                    {gap.recommended_action && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <strong>Recommendation:</strong> {gap.recommended_action}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priority Actions */}
      {report.priority_actions && report.priority_actions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Priority Recommendations
            </h3>
          </div>
          <div className="space-y-3">
            {report.priority_actions.slice(0, 5).map((action, index) => (
              <div
                key={action.id || index}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {action.action_title}
                      </span>
                      <Badge
                        variant={
                          action.priority === 'critical'
                            ? 'error'
                            : action.priority === 'high'
                            ? 'warning'
                            : 'info'
                        }
                        size="sm"
                      >
                        {action.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {action.action_description}
                    </p>
                    {action.estimated_impact && (
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        Expected Impact: <span className="font-medium">{action.estimated_impact}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Platforms Analyzed</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {report.platform_scores?.length || 0}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Content Gaps</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {report.content_gaps?.length || 0}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Recommendations</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {report.priority_actions?.length || 0}
          </div>
        </div>
      </div>
    </div>
  );
};