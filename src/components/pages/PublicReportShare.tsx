// src/components/pages/PublicReportShare.tsx
// Public report display matching competitor format exactly

import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle,
  ExternalLink,
  Lightbulb,
  Loader,
  MapPin,
  Target,
  TrendingUp
} from 'lucide-react';
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

  // Force light theme
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader size={48} className="text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-4">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h2>
          <p className="text-gray-600">{error || 'This report could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  const contentGaps = report.content_gap_analysis || {} as any;
  const primaryBrand = contentGaps.primary_brand || {} as any;
  const topCompetitors = (contentGaps.top_competitors || []) as any[];
  const recommendations = report.recommendations || [];
  const platformScores = report.ai_platform_scores || {};
  const implementationTimeline = (contentGaps.implementation_timeline || {}) as any;
  const citationOpportunities = (contentGaps.citation_opportunities || []) as any[];
  const aiKnowledgeScores = (contentGaps.ai_knowledge_scores || {}) as any;
  
  const overallScore = report.report_data?.overall_score || 0;

  const getGrade = (score: number): string => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const getGradeColor = (score: number): string => {
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 60) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getSeverityColor = (severity: string): string => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      significant: 'bg-orange-100 text-orange-800 border-orange-200',
      moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[severity?.toLowerCase()] || colors.moderate;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <BarChart3 className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {primaryBrand.name || report.business_name || report.target_website}
                  </h1>
                  <p className="text-sm text-gray-600">AI Visibility Analysis Report</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <ExternalLink size={14} />
                  {primaryBrand.website || report.target_website}
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
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        
        {/* Primary Brand Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-blue-500" size={28} />
            <h2 className="text-2xl font-bold text-gray-900">
              {primaryBrand.name || 'Your Business'}
            </h2>
          </div>
          
          {/* Strengths */}
          {primaryBrand.strengths && primaryBrand.strengths.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="text-green-500" size={20} />
                Strengths
              </h3>
              <ul className="space-y-2">
                {primaryBrand.strengths.map((strength: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-green-500 mt-1">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {primaryBrand.weaknesses && primaryBrand.weaknesses.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="text-orange-500" size={20} />
                Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {primaryBrand.weaknesses.map((weakness: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Top Competitors */}
        {topCompetitors.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Target className="text-purple-500" size={28} />
              <h2 className="text-2xl font-bold text-gray-900">Top Competitors</h2>
            </div>
            
            <div className="space-y-6">
              {topCompetitors.map((competitor: any, index: number) => (
                <div key={index} className="border-l-4 border-purple-500 pl-6 py-2">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {competitor.name}
                  </h3>
                  {competitor.strengths && competitor.strengths.length > 0 && (
                    <ul className="space-y-2">
                      {competitor.strengths.map((strength: string, sIndex: number) => (
                        <li key={sIndex} className="flex items-start gap-2 text-gray-700">
                          <span className="text-purple-500 mt-1">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Platform Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="text-blue-500" size={28} />
            <h2 className="text-2xl font-bold text-gray-900">AI Platform Performance</h2>
          </div>
          <div className="space-y-5">
            {Object.entries(platformScores).map(([platform, score]) => {
              const numScore = typeof score === 'number' ? score : 0;
              return (
                <div key={platform}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {platform}
                    </span>
                    <span className="text-sm font-bold text-gray-900">{numScore}/100</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        numScore >= 80
                          ? 'bg-green-500'
                          : numScore >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
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
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Target className="text-orange-500" size={28} />
            <h2 className="text-2xl font-bold text-gray-900">Content Gap Analysis</h2>
          </div>

          {/* Structural Gaps */}
          {contentGaps.structural_gaps && (contentGaps.structural_gaps as any[]).length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-red-500 rounded-full"></div>
                Structural Gaps
              </h3>
              <div className="space-y-4">
                {(contentGaps.structural_gaps as any[]).map((gap: any, index: number) => (
                  <div key={index} className={`p-5 rounded-xl border-l-4 ${getSeverityColor(gap.severity)}`}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">{gap.gap_title}</h4>
                        <p className="text-sm leading-relaxed mb-3">{gap.gap_description}</p>
                        <div className="text-sm bg-white/50 px-4 py-2 rounded-lg border">
                          <strong>Recommendation:</strong> {gap.recommended_action}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Thematic Gaps */}
          {contentGaps.thematic_gaps && (contentGaps.thematic_gaps as any[]).length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                Thematic Gaps
              </h3>
              <div className="space-y-4">
                {(contentGaps.thematic_gaps as any[]).map((gap: any, index: number) => (
                  <div key={index} className={`p-5 rounded-xl border-l-4 ${getSeverityColor(gap.severity)}`}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">{gap.gap_title}</h4>
                        <p className="text-sm leading-relaxed mb-3">{gap.gap_description}</p>
                        <div className="text-sm bg-white/50 px-4 py-2 rounded-lg border">
                          <strong>Recommendation:</strong> {gap.recommended_action}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critical Topic Gaps */}
          {contentGaps.critical_topic_gaps && (contentGaps.critical_topic_gaps as any[]).length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                Critical Topic Gaps
              </h3>
              <div className="space-y-4">
                {(contentGaps.critical_topic_gaps as any[]).map((gap: any, index: number) => (
                  <div key={index} className={`p-5 rounded-xl border-l-4 ${getSeverityColor(gap.severity)}`}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">{gap.gap_title}</h4>
                        <p className="text-sm leading-relaxed mb-3">{gap.gap_description}</p>
                        <div className="text-sm bg-white/50 px-4 py-2 rounded-lg border">
                          <strong>Recommendation:</strong> {gap.recommended_action}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Significant Topic Gaps */}
          {contentGaps.significant_topic_gaps && (contentGaps.significant_topic_gaps as any[]).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-yellow-500 rounded-full"></div>
                Significant Topic Gaps
              </h3>
              <div className="space-y-4">
                {(contentGaps.significant_topic_gaps as any[]).map((gap: any, index: number) => (
                  <div key={index} className={`p-5 rounded-xl border-l-4 ${getSeverityColor(gap.severity)}`}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">{gap.gap_title}</h4>
                        <p className="text-sm leading-relaxed mb-3">{gap.gap_description}</p>
                        <div className="text-sm bg-white/50 px-4 py-2 rounded-lg border">
                          <strong>Recommendation:</strong> {gap.recommended_action}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Implementation Timeline */}
        {implementationTimeline && (implementationTimeline.immediate?.length > 0 || implementationTimeline.short_term?.length > 0) && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="text-green-500" size={28} />
              <h2 className="text-2xl font-bold text-gray-900">Implementation Timeline</h2>
            </div>

            <div className="space-y-6">
              {/* Immediate Actions */}
              {implementationTimeline.immediate && implementationTimeline.immediate.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-bold text-sm">1</span>
                    </div>
                    Immediate (0-30 days)
                  </h3>
                  <ul className="space-y-2 ml-10">
                    {implementationTimeline.immediate.map((item: any, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700">
                        <span className="text-red-500 mt-1">•</span>
                        <span>{item.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Short-term Actions */}
              {implementationTimeline.short_term && implementationTimeline.short_term.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-bold text-sm">2</span>
                    </div>
                    Short-term (30-60 days)
                  </h3>
                  <ul className="space-y-2 ml-10">
                    {implementationTimeline.short_term.map((item: any, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>{item.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Long-term Actions */}
              {implementationTimeline.long_term && implementationTimeline.long_term.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">3</span>
                    </div>
                    Long-term (60-90 days)
                  </h3>
                  <ul className="space-y-2 ml-10">
                    {implementationTimeline.long_term.map((item: any, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{item.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Citation Opportunities */}
        {citationOpportunities.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="text-indigo-500" size={28} />
              <h2 className="text-2xl font-bold text-gray-900">Citation Opportunities</h2>
            </div>

            <div className="space-y-3">
              {citationOpportunities.map((opportunity: any, index: number) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full mt-1 ${
                      opportunity.priority === 'critical' ? 'bg-red-500' :
                      opportunity.priority === 'high' ? 'bg-orange-500' :
                      opportunity.priority === 'medium' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900">{opportunity.platform}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        opportunity.status === 'required' ? 'bg-red-100 text-red-700' :
                        opportunity.status === 'recommended' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {opportunity.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{opportunity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Knowledge Scores */}
        {aiKnowledgeScores.platforms && aiKnowledgeScores.platforms.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Lightbulb className="text-yellow-500" size={28} />
              <h2 className="text-2xl font-bold text-gray-900">AI Knowledge Scores</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiKnowledgeScores.platforms.map((platform: any, index: number) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900 capitalize">{platform.platform}</span>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      platform.knowledge_level === 'High' ? 'bg-green-100 text-green-700' :
                      platform.knowledge_level === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {platform.knowledge_level}
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          platform.score >= 70 ? 'bg-green-500' :
                          platform.score >= 40 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${platform.score}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 mt-1">{platform.score}/100</span>
                  </div>
                  <p className="text-xs text-gray-600">{platform.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Priority Actions */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Lightbulb className="text-blue-500" size={28} />
              <h2 className="text-2xl font-bold text-gray-900">Priority Actions</h2>
            </div>
            <div className="space-y-4">
              {recommendations.map((action: any, index: number) => (
                <div
                  key={action.id || index}
                  className="p-5 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border border-blue-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        action.priority === 'high' ? 'bg-red-500' :
                        action.priority === 'medium' ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{action.action_title}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          action.estimated_impact === 'high' ? 'bg-green-100 text-green-700' :
                          action.estimated_impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {action.estimated_impact} impact
                        </span>
                        {action.timeframe && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                            {action.timeframe}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {action.action_description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-gray-600 text-sm">
          <p>Generated by OK Local GBP Copilot - AI Visibility Analysis Platform</p>
          <p className="mt-2">Report generated on {new Date(report.created_at).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};