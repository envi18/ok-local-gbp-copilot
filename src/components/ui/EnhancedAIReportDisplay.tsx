// src/components/ui/EnhancedAIReportDisplay.tsx
// Comprehensive display component for enhanced AI visibility reports

import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Lightbulb,
  Target,
  TrendingUp,
  Users
} from 'lucide-react';
import React, { useState } from 'react';
import type { ExternalReport } from '../../types/externalReport';
import { Badge } from './Badge';

interface EnhancedAIReportDisplayProps {
  report: ExternalReport;
}

export const EnhancedAIReportDisplay: React.FC<EnhancedAIReportDisplayProps> = ({ report }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    timeline: false,
    citations: false,
    knowledge: false,
    competitors: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const contentGaps = report.content_gap_analysis || {} as any;
  const platformScores = report.ai_platform_scores || {};
  const competitorAnalysis = report.competitor_analysis || {} as any;
  const recommendations = report.recommendations || [];
  
  const implementationTimeline = contentGaps.implementation_timeline || {};
  const citationOpportunities = contentGaps.citation_opportunities || [];
  const aiKnowledgeScores = contentGaps.ai_knowledge_scores || {};
  
  const overallScore = Math.round(
    Object.values(platformScores).reduce((sum: number, score: any) => sum + score, 0) / 
    Math.max(Object.keys(platformScores).length, 1)
  );

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
      critical: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800',
      significant: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-800',
      moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800'
    };
    return colors[severity?.toLowerCase()] || colors.moderate;
  };

  const getPriorityColor = (priority: string): 'error' | 'warning' | 'info' => {
    if (priority === 'critical' || priority === 'high') return 'error';
    if (priority === 'medium') return 'warning';
    return 'info';
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Hero Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <TrendingUp size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-bold">AI Visibility Score</h2>
                <p className="text-blue-100 text-sm">Comprehensive analysis across all AI platforms</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-blue-100 text-sm mb-1">Platforms</div>
                <div className="text-2xl font-bold">{Object.keys(platformScores).length}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-blue-100 text-sm mb-1">Competitors</div>
                <div className="text-2xl font-bold">{competitorAnalysis.total_competitors || 0}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-blue-100 text-sm mb-1">Actions</div>
                <div className="text-2xl font-bold">{recommendations.length}</div>
              </div>
            </div>
          </div>
          <div className="text-center ml-8">
            <div className={`inline-block px-8 py-4 bg-gradient-to-br ${getGradeColor(overallScore)} rounded-2xl shadow-xl`}>
              <div className="text-6xl font-bold">{getGrade(overallScore)}</div>
              <div className="text-xl font-semibold mt-2">{overallScore}/100</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Knowledge Scores */}
      {aiKnowledgeScores.platforms && aiKnowledgeScores.platforms.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Award size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Platform Knowledge
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  How well each AI platform knows your business
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleSection('knowledge')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {expandedSections.knowledge ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">Overall Knowledge</div>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {aiKnowledgeScores.overall_knowledge || 0}%
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="text-sm text-green-700 dark:text-green-300 mb-1">Best Platform</div>
              <div className="text-xl font-bold text-green-900 dark:text-green-100 capitalize">
                {aiKnowledgeScores.best_platform?.platform || 'N/A'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="text-sm text-purple-700 dark:text-purple-300 mb-1">High Knowledge</div>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {aiKnowledgeScores.platforms?.filter((p: any) => p.knowledge_level === 'High').length || 0}
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <div className="text-sm text-red-700 dark:text-red-300 mb-1">Need Improvement</div>
              <div className="text-3xl font-bold text-red-900 dark:text-red-100">
                {aiKnowledgeScores.needs_improvement?.length || 0}
              </div>
            </div>
          </div>

          {expandedSections.knowledge && (
            <div className="space-y-4">
              {aiKnowledgeScores.platforms?.map((platform: any, idx: number) => (
                <div key={idx} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                        {platform.platform}
                      </span>
                      <Badge 
                        variant={platform.knowledge_level === 'High' ? 'success' : platform.knowledge_level === 'Moderate' ? 'warning' : 'error'}
                        size="sm"
                      >
                        {platform.knowledge_level}
                      </Badge>
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {platform.score}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full transition-all ${
                        platform.score >= 70 ? 'bg-green-500' : platform.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${platform.score}%` }}
                    />
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Lightbulb size={16} className="mt-0.5 flex-shrink-0" />
                    <p>{platform.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Platform Scores */}
      {Object.keys(platformScores).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Platform Scores
            </h3>
          </div>
          <div className="space-y-4">
            {Object.entries(platformScores).map(([platform, score]: [string, any]) => (
              <div key={platform}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {platform}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {score}/100
                  </span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Competitors Deep Dive */}
      {competitorAnalysis.top_competitors && competitorAnalysis.top_competitors.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Users size={24} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Top Competitors Analysis
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Detailed competitive intelligence
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleSection('competitors')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {expandedSections.competitors ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          <div className="grid gap-4">
            {competitorAnalysis.top_competitors.slice(0, 5).map((comp: any, idx: number) => (
              <div key={idx} className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="text-indigo-600 dark:text-indigo-400">#{idx + 1}</span>
                      {comp.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Mentioned {comp.mention_frequency || comp.detection_count} times across {comp.platforms?.length || 0} platforms
                    </p>
                  </div>
                  {comp.website && (
                    <a
                      href={comp.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <ExternalLink size={18} className="text-gray-600 dark:text-gray-400" />
                    </a>
                  )}
                </div>

                {expandedSections.competitors && (
                  <>
                    {comp.strengths && comp.strengths.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">Strengths</span>
                        </div>
                        <ul className="space-y-1 ml-6">
                          {comp.strengths.map((strength: string, i: number) => (
                            <li key={i} className="text-sm text-gray-700 dark:text-gray-300 list-disc">
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {comp.weaknesses && comp.weaknesses.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle size={16} className="text-orange-600 dark:text-orange-400" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">Weaknesses</span>
                        </div>
                        <ul className="space-y-1 ml-6">
                          {comp.weaknesses?.map((weakness: string, i: number) => (
                            <li key={i} className="text-sm text-gray-700 dark:text-gray-300 list-disc">
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {comp.why_recommended && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-2">
                          <Lightbulb size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                              Why AI Recommends Them
                            </div>
                            <p className="text-sm text-blue-800 dark:text-blue-200">{comp.why_recommended}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Gaps with Severity Breakdown */}
      {contentGaps.total_gaps > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Target size={24} className="text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Content Gap Analysis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {contentGaps.total_gaps} gaps identified
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="error" size="sm">
                {contentGaps.severity_breakdown?.critical || 0} Critical
              </Badge>
              <Badge variant="warning" size="sm">
                {contentGaps.severity_breakdown?.significant || 0} Significant
              </Badge>
              <Badge variant="info" size="sm">
                {contentGaps.severity_breakdown?.moderate || 0} Moderate
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            {[
              ...(contentGaps.critical_topic_gaps || []),
              ...(contentGaps.significant_topic_gaps || []),
              ...(contentGaps.structural_gaps || [])
            ].slice(0, 10).map((gap: any, idx: number) => (
              <div key={idx} className={`p-4 rounded-lg border ${getSeverityColor(gap.severity)}`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{gap.gap_title}</h4>
                  <Badge variant={gap.severity === 'critical' ? 'error' : gap.severity === 'significant' ? 'warning' : 'info'} size="sm">
                    {gap.severity}
                  </Badge>
                </div>
                <p className="text-sm mb-3">{gap.gap_description}</p>
                {gap.competitors_have_this && gap.competitors_have_this.length > 0 && (
                  <div className="text-xs mb-2">
                    <span className="font-semibold">Competitors have this:</span> {gap.competitors_have_this.join(', ')}
                  </div>
                )}
                {gap.recommended_action && (
                  <div className="bg-white dark:bg-gray-800 bg-opacity-50 rounded p-2 text-sm">
                    <span className="font-semibold">Action:</span> {gap.recommended_action}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Citation Opportunities */}
      {citationOpportunities.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                <BookOpen size={24} className="text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Citation Opportunities
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Priority sources to build visibility
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleSection('citations')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {expandedSections.citations ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        <div className="space-y-3">
          {citationOpportunities.slice(0, expandedSections.citations ? undefined : 5).map((cit: any, idx: number) => (
            <div 
              key={idx} 
              className={`p-4 rounded-lg border ${
                cit.priority === 'critical' 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : cit.priority === 'high'
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white capitalize">
                    {cit.platform}
                  </span>
                  <Badge variant={getPriorityColor(cit.priority)} size="sm">
                    {cit.priority}
                  </Badge>
                  <Badge 
                    variant={cit.status === 'required' ? 'error' : cit.status === 'recommended' ? 'warning' : 'info'} 
                    size="sm"
                  >
                    {cit.status}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {cit.description}
              </p>
            </div>
          ))}
        </div>

        {!expandedSections.citations && citationOpportunities.length > 5 && (
          <button
            onClick={() => toggleSection('citations')}
            className="w-full mt-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            Show {citationOpportunities.length - 5} more opportunities
          </button>
        )}
      </div>
    )}

    {/* Implementation Timeline */}
    {(implementationTimeline.immediate || implementationTimeline.short_term || implementationTimeline.long_term) && (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
              <Clock size={24} className="text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Implementation Timeline
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Prioritized action roadmap
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleSection('timeline')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {expandedSections.timeline ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        <div className="space-y-6">
          {/* Immediate Actions */}
          {implementationTimeline.immediate && implementationTimeline.immediate.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Immediate Actions (1-2 weeks)
                </h4>
                <Badge variant="error" size="sm">
                  {implementationTimeline.immediate.length}
                </Badge>
              </div>
              <div className="space-y-2 ml-5 border-l-2 border-red-200 dark:border-red-800 pl-4">
                {implementationTimeline.immediate.map((action: any, idx: number) => (
                  <div key={idx} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{action.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{action.duration}</p>
                      </div>
                      <Badge variant={getPriorityColor(action.priority)} size="sm">
                        {action.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Short-term Actions */}
          {implementationTimeline.short_term && implementationTimeline.short_term.length > 0 && expandedSections.timeline && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Short-term Actions (1-3 months)
                </h4>
                <Badge variant="warning" size="sm">
                  {implementationTimeline.short_term.length}
                </Badge>
              </div>
              <div className="space-y-2 ml-5 border-l-2 border-yellow-200 dark:border-yellow-800 pl-4">
                {implementationTimeline.short_term.map((action: any, idx: number) => (
                  <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{action.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{action.duration}</p>
                      </div>
                      <Badge variant={getPriorityColor(action.priority)} size="sm">
                        {action.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Long-term Actions */}
          {implementationTimeline.long_term && implementationTimeline.long_term.length > 0 && expandedSections.timeline && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Long-term Actions (3-6 months)
                </h4>
                <Badge variant="info" size="sm">
                  {implementationTimeline.long_term.length}
                </Badge>
              </div>
              <div className="space-y-2 ml-5 border-l-2 border-blue-200 dark:border-blue-800 pl-4">
                {implementationTimeline.long_term.map((action: any, idx: number) => (
                  <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{action.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{action.duration}</p>
                      </div>
                      <Badge variant={getPriorityColor(action.priority)} size="sm">
                        {action.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Priority Actions/Recommendations */}
    {recommendations.length > 0 && (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Priority Actions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Recommended improvements to boost AI visibility
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {recommendations.slice(0, 8).map((action: any, idx: number) => (
            <div
              key={idx}
              className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {action.action_title}
                  </span>
                  <Badge variant={getPriorityColor(action.priority)} size="sm">
                    {action.priority}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                {action.action_description}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                {action.estimated_impact && (
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">Impact:</span>
                    <span className="capitalize">{action.estimated_impact}</span>
                  </div>
                )}
                {action.estimated_effort && (
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">Effort:</span>
                    <span className="capitalize">{action.estimated_effort}</span>
                  </div>
                )}
                {action.category && (
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">Category:</span>
                    <span className="capitalize">{action.category}</span>
                  </div>
                )}
              </div>
              {action.fix_instructions && (
                <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 rounded p-2 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-900 dark:text-blue-100">
                    <span className="font-semibold">How to fix:</span> {action.fix_instructions}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Summary Stats */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Generation Time</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {report.processing_duration_ms 
            ? `${(report.processing_duration_ms / 1000).toFixed(1)}s`
            : 'N/A'}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">API Cost</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          ${report.api_cost_usd ? Number(report.api_cost_usd).toFixed(2) : '0.00'}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Queries Executed</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {report.query_count || 0}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Report Views</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {report.share_views || 0}
        </div>
      </div>
    </div>

    {/* Competitive Intelligence Summary */}
    {competitorAnalysis.competitive_advantages || competitorAnalysis.competitive_weaknesses && (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Competitive Intelligence Summary
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          {competitorAnalysis.competitive_advantages && competitorAnalysis.competitive_advantages.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Your Advantages</h4>
              </div>
              <ul className="space-y-2">
                {competitorAnalysis.competitive_advantages.map((adv: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>{adv}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {competitorAnalysis.competitive_weaknesses && competitorAnalysis.competitive_weaknesses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={18} className="text-orange-600 dark:text-orange-400" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Areas to Improve</h4>
              </div>
              <ul className="space-y-2">
                {competitorAnalysis.competitive_weaknesses.map((weak: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
  );
};