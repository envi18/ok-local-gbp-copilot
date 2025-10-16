// src/components/pages/PublicReportShare.tsx
// Enhanced public-facing page for shared AI visibility reports

import { AlertCircle, AlertTriangle, Award, BarChart3, Calendar, ExternalLink, Lightbulb, Loader, Target, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ExternalReportService } from '../../lib/externalReportService';
import type { ExternalReport } from '../../types/externalReport';

interface PublicReportShareProps {
  token?: string;
}

export const PublicReportShare: React.FC<PublicReportShareProps> = ({ token: propToken }) => {
  const [report, setReport] = useState<ExternalReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const getTokenFromUrl = (): string | null => {
    const path = window.location.pathname;
    const match = path.match(/\/share\/report\/([^/]+)/);
    return match ? match[1] : null;
  };

  const token = propToken || getTokenFromUrl();

  useEffect(() => {
    loadReport();
  }, [token]);

  const loadReport = async () => {
    if (!token) {
      setError('Invalid share link - no token provided');
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await ExternalReportService.getReportByToken(token);

    if (fetchError || !data) {
      setError('Report not found or access denied');
    } else if (data.status !== 'completed') {
      setError('This report is still being generated');
    } else {
      setReport(data);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <Loader size={48} className="text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center max-w-md mx-4">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Report Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  const reportData = report.report_data;
  const overallScore = reportData?.overall_score || 0;
  const platformScores = report.ai_platform_scores || {};
  const contentGaps = report.content_gap_analysis;
  const recommendations = report.recommendations || [];

  const getGradeColor = (score: number): string => {
    if (score >= 90) return 'from-green-500 to-emerald-600';
    if (score >= 80) return 'from-blue-500 to-cyan-600';
    if (score >= 70) return 'from-yellow-500 to-orange-500';
    if (score >= 60) return 'from-orange-500 to-red-500';
    return 'from-red-600 to-red-700';
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

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <AlertTriangle className="text-red-500" size={20} />;
      case 'significant':
        return <AlertTriangle className="text-orange-500" size={20} />;
      default:
        return <AlertCircle className="text-yellow-500" size={20} />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      significant: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    };
    return colors[severity?.toLowerCase()] || colors.moderate;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <BarChart3 className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {report.business_name || report.target_website}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    AI Visibility Analysis Report
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <ExternalLink size={14} />
                  {report.target_website}
                </span>
                <span>•</span>
                <span>Generated {new Date(report.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br ${getGradeColor(overallScore)} text-white shadow-lg`}>
                <div className="text-center">
                  <div className="text-3xl font-bold">{getGrade(overallScore)}</div>
                  <div className="text-xs opacity-90">{overallScore}/100</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Executive Summary */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-blue-500" size={28} />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Executive Summary
            </h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-6">
            This comprehensive AI visibility analysis evaluates how <strong>{report.business_name || 'this business'}</strong> appears 
            across major AI platforms including ChatGPT, Claude, Gemini, and Perplexity. The overall score of <strong>{overallScore}/100</strong> indicates 
            {overallScore >= 80 ? ' strong visibility' : overallScore >= 60 ? ' moderate visibility with room for improvement' : ' significant opportunities for improvement'} 
            in AI-powered search results.
          </p>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">Overall Score</div>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{overallScore}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-1">Platforms Analyzed</div>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{Object.keys(platformScores).length}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
              <div className="text-sm text-orange-700 dark:text-orange-300 font-medium mb-1">Content Gaps</div>
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{contentGaps?.total_gaps || 0}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="text-sm text-green-700 dark:text-green-300 font-medium mb-1">Recommendations</div>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">{recommendations.length}</div>
            </div>
          </div>
        </div>

        {/* AI Platform Scores */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="text-purple-500" size={28} />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Platform Performance
            </h2>
          </div>
          <div className="space-y-5">
            {Object.entries(platformScores).map(([platform, score]) => {
              const numScore = typeof score === 'number' ? score : 0;
              return (
                <div key={platform} className="group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm uppercase">{platform.substring(0, 2)}</span>
                      </div>
                      <div>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                          {platform}
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {numScore >= 80 ? 'Excellent visibility' : numScore >= 60 ? 'Good visibility' : 'Needs improvement'}
                        </div>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {numScore}
                      <span className="text-sm text-gray-500 dark:text-gray-400">/100</span>
                    </span>
                  </div>
                  <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${
                        numScore >= 80
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                          : numScore >= 60
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                          : 'bg-gradient-to-r from-red-500 to-red-600'
                      }`}
                      style={{ width: `${numScore}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Gap Analysis */}
        {contentGaps && (
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Target className="text-orange-500" size={28} />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Content Gap Analysis
              </h2>
            </div>

            {/* Severity Breakdown */}
            {contentGaps.severity_breakdown && (
              <div className="mb-8 p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-slate-200 dark:border-slate-600">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Gap Severity Overview</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">{contentGaps.severity_breakdown.critical || 0}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Critical</div>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{contentGaps.severity_breakdown.significant || 0}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Significant</div>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{contentGaps.severity_breakdown.moderate || 0}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Moderate</div>
                  </div>
                </div>
              </div>
            )}

            {/* Structural Gaps */}
            {contentGaps.structural_gaps && contentGaps.structural_gaps.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-red-500 rounded-full"></div>
                  Structural Gaps
                </h3>
                <div className="space-y-4">
                  {contentGaps.structural_gaps.map((gap: any, index: number) => (
                    <div key={index} className="p-5 bg-red-50 dark:bg-red-900/20 rounded-xl border-l-4 border-red-500">
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(gap.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{gap.gap || gap.gap_title}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSeverityBadge(gap.severity)}`}>
                              {gap.severity}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            {gap.description || gap.gap_description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Thematic Gaps */}
            {contentGaps.thematic_gaps && contentGaps.thematic_gaps.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                  Thematic Gaps
                </h3>
                <div className="space-y-4">
                  {contentGaps.thematic_gaps.map((gap: any, index: number) => (
                    <div key={index} className="p-5 bg-orange-50 dark:bg-orange-900/20 rounded-xl border-l-4 border-orange-500">
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(gap.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{gap.gap || gap.gap_title}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSeverityBadge(gap.severity)}`}>
                              {gap.severity}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            {gap.description || gap.gap_description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Critical Topic Gaps */}
            {contentGaps.critical_topic_gaps && contentGaps.critical_topic_gaps.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                  Critical Topic Gaps
                </h3>
                <div className="space-y-4">
                  {contentGaps.critical_topic_gaps.map((gap: any, index: number) => (
                    <div key={index} className="p-5 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-l-4 border-purple-500">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="text-purple-600 dark:text-purple-400" size={20} />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{gap.topic || gap.gap_title}</h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
                            {gap.description || gap.gap_description}
                          </p>
                          {gap.competitor_coverage && (
                            <p className="text-xs text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 px-3 py-2 rounded-lg">
                              <strong>Competitor insight:</strong> {gap.competitor_coverage}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Lightbulb className="text-green-500" size={28} />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Priority Recommendations
              </h2>
            </div>
            <div className="space-y-4">
              {recommendations.slice(0, 10).map((action: any, index: number) => (
                <div key={index} className="group p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {action.action_title}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          action.priority === 'critical' || action.priority === 'high'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : action.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {action.priority}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {action.action_description}
                      </p>
                      {action.estimated_impact && (
                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Award size={14} className="text-green-600 dark:text-green-400" />
                            Impact: <strong className="text-gray-900 dark:text-white">{action.estimated_impact}</strong>
                          </span>
                          {action.estimated_effort && (
                            <span className="flex items-center gap-1">
                              <Calendar size={14} className="text-blue-600 dark:text-blue-400" />
                              Effort: <strong className="text-gray-900 dark:text-white">{action.estimated_effort}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 rounded-2xl p-10 text-white text-center shadow-2xl">
          <div className="max-w-3xl mx-auto">
            <Award size={48} className="mx-auto mb-4 opacity-90" />
            <h2 className="text-3xl font-bold mb-4">
              Ready to Improve Your AI Visibility?
            </h2>
            <p className="text-lg mb-8 text-blue-100">
              Get personalized recommendations, monthly tracking, and expert guidance to dominate AI-powered search results.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Schedule Consultation
              </button>
              <button className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 pb-4 text-gray-600 dark:text-gray-400 space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BarChart3 size={20} className="text-blue-500" />
            <span className="font-semibold text-gray-900 dark:text-white">OK Local GBP Copilot</span>
          </div>
          <p className="text-sm">AI Visibility Intelligence for Local Businesses</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Report generated on {new Date(report.created_at).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
        </div>
      </div>
    </div>
  );
};