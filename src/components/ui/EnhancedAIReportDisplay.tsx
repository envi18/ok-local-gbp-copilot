// src/components/ui/EnhancedAIReportDisplay.tsx
// PHASE B: Updated with Real AI Platform Scores and Knowledge Comparison
// FIXED: Added showMetadata prop to hide admin-only stats from public reports
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Target,
  TrendingUp,
  Users
} from 'lucide-react';
import React, { useState } from 'react';
import type { ExternalReport } from '../../types/externalReport';
import { AIKnowledgeScoresTable } from './AIKnowledgeScoresTable';
import { Badge } from './Badge';

interface EnhancedAIReportDisplayProps {
  report: ExternalReport;
  showMetadata?: boolean;  // ✅ ADDED: Controls visibility of admin-only stats
}

export const EnhancedAIReportDisplay: React.FC<EnhancedAIReportDisplayProps> = ({ 
  report,
  showMetadata = true  // ✅ ADDED: Defaults to true for backward compatibility
}) => {
  // PHASE A FIX #3: Competitors expanded by default
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    timeline: false,
    citations: false,
    knowledge: false,
    competitors: true  // ✅ Changed from false to true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const contentGaps = report.content_gap_analysis || {} as any;
  
  // Handle platform scores (array format)
  const platformScoresRaw = report.ai_platform_scores || [];
  const platformScores = Array.isArray(platformScoresRaw) ? platformScoresRaw : [];
  
  const competitorAnalysis = report.competitor_analysis || {} as any;
  const recommendations = report.recommendations || [];
  
  // Calculate overall score from array of platform score objects
  const overallScore = platformScores.length > 0
    ? Math.round(
        platformScores.reduce((sum: number, ps: any) => sum + (ps.score || 0), 0) / platformScores.length
      )
    : report.overall_score || 0;

  // Transform ai_knowledge_comparison data from old format to new format
  const transformKnowledgeComparison = (oldFormat: any) => {
    if (!oldFormat || !oldFormat.main_business) return null;

    // Extract all unique platforms from scores
    const allPlatforms = new Set<string>();
    const businesses = [];

    // Process main business
    if (oldFormat.main_business && oldFormat.main_business.scores) {
      Object.keys(oldFormat.main_business.scores).forEach(p => allPlatforms.add(p));
      
      const platformScores = Object.entries(oldFormat.main_business.scores).map(([platform, score]) => ({
        platform,
        score: score as number,
        knowledge_level: (score as number) >= 80 ? 'high' : (score as number) >= 50 ? 'medium' : (score as number) > 0 ? 'low' : 'none',
        mention_count: (score as number) > 0 ? 1 : 0
      }));

      businesses.push({
        name: oldFormat.main_business.name,
        is_target: true,
        platform_scores: platformScores,
        overall_score: Math.round(
          platformScores.reduce((sum, ps) => sum + ps.score, 0) / platformScores.length
        ),
        total_mentions: platformScores.filter(ps => ps.score > 0).length
      });
    }

    // Process competitors
    if (oldFormat.competitors && Array.isArray(oldFormat.competitors)) {
      oldFormat.competitors.forEach((comp: any) => {
        if (comp.scores) {
          Object.keys(comp.scores).forEach(p => allPlatforms.add(p));
          
          const platformScores = Object.entries(comp.scores).map(([platform, score]) => ({
            platform,
            score: score as number,
            knowledge_level: (score as number) >= 80 ? 'high' : (score as number) >= 50 ? 'medium' : (score as number) > 0 ? 'low' : 'none',
            mention_count: (score as number) > 0 ? 1 : 0
          }));

          businesses.push({
            name: comp.name,
            is_target: false,
            platform_scores: platformScores,
            overall_score: Math.round(
              platformScores.reduce((sum, ps) => sum + ps.score, 0) / platformScores.length
            ),
            total_mentions: platformScores.filter(ps => ps.score > 0).length
          });
        }
      });
    }

    return {
      businesses,
      platforms: Array.from(allPlatforms)
    };
  };

  const transformedKnowledgeComparison = report.ai_knowledge_comparison 
    ? transformKnowledgeComparison(report.ai_knowledge_comparison)
    : null;

  // PHASE A FIX #1: Correct school grading scale
  const getGrade = (score: number): string => {
    if (score >= 98) return 'A+';
    if (score >= 94) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 88) return 'B+';
    if (score >= 84) return 'B';   // ✅ 84-87 = B
    if (score >= 81) return 'B-';
    if (score >= 78) return 'C+';
    if (score >= 74) return 'C';
    if (score >= 71) return 'C-';
    if (score >= 68) return 'D+';
    if (score >= 64) return 'D';
    if (score >= 61) return 'D-';
    return 'F';
  };

  // PHASE A FIX #2: Updated grade colors for new scale
  const getGradeColor = (score: number): string => {
    if (score >= 90) return 'from-green-500 to-green-600';    // A range
    if (score >= 80) return 'from-blue-500 to-blue-600';      // B range  
    if (score >= 70) return 'from-yellow-500 to-yellow-600';  // C range
    if (score >= 60) return 'from-orange-500 to-orange-600';  // D range
    return 'from-red-500 to-red-600';                         // F
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
                <div className="text-2xl font-bold">{platformScores.length}</div>
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

      {/* Platform Scores - PHASE B: Shows real mention counts */}
      {platformScores.length > 0 && (
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
            {platformScores.map((platformScore: any, idx: number) => {
              const platform = platformScore.platform || 'unknown';
              const score = platformScore.score || 0;
              const mentioned = platformScore.mentioned || false;
              const mentionCount = platformScore.mention_count || 0;
              const knowledgeLevel = platformScore.knowledge_level || 'None';
              const details = platformScore.details || '';
              
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {platform}
                      </span>
                      {/* PHASE B: Show knowledge level badge */}
                      <Badge 
                        variant={
                          knowledgeLevel === 'High' ? 'success' : 
                          knowledgeLevel === 'Medium' ? 'info' : 
                          knowledgeLevel === 'Low' ? 'warning' : 
                          'error'
                        } 
                        size="sm"
                      >
                        {knowledgeLevel}
                      </Badge>
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {score}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all ${
                        score >= 80 ? 'bg-green-500' :
                        score >= 60 ? 'bg-yellow-500' :
                        score >= 40 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>{details}</span>
                    {mentioned && mentionCount > 0 && (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        Mentioned {mentionCount} {mentionCount === 1 ? 'time' : 'times'}
                      </span>
                    )}
                    {!mentioned && (
                      <span className="text-gray-500 dark:text-gray-500">
                        Not found
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Competitors Analysis */}
      {competitorAnalysis.top_competitors && competitorAnalysis.top_competitors.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users size={24} className="text-purple-600 dark:text-purple-400" />
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
          
          {expandedSections.competitors && (
            <div className="space-y-4">
              {competitorAnalysis.top_competitors.map((competitor: any, idx: number) => (
                <div key={idx} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-bold">
                        #{idx + 1}
                      </span>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {competitor.name}
                      </h4>
                    </div>
                  </div>
                  {competitor.url && (
                    <a
                      href={competitor.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mb-2"
                    >
                      {competitor.url}
                      <ExternalLink size={12} />
                    </a>
                  )}
                  {competitor.strengths && (
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Competitive Strengths:
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {competitor.strengths}
                      </p>
                    </div>
                  )}
                  {competitor.platforms_mentioned > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      Mentioned on {competitor.platforms_mentioned} platform(s)
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Knowledge Comparison Table */}
      {transformedKnowledgeComparison && (
        <AIKnowledgeScoresTable aiKnowledgeComparison={transformedKnowledgeComparison} />
      )}

      {/* Competitive Advantages & Weaknesses */}
      {(competitorAnalysis.competitive_advantages?.length > 0 || 
        competitorAnalysis.competitive_weaknesses?.length > 0) && (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 rounded-lg border border-green-200 dark:border-green-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
            Your Competitive Advantages
          </h3>
          <ul className="space-y-2 mb-6">
            {competitorAnalysis.competitive_advantages.map((advantage: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3">
                <CheckCircle size={18} className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{advantage}</span>
              </li>
            ))}
          </ul>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-600 dark:text-orange-400" />
            Areas to Improve
          </h3>
          <ul className="space-y-2">
            {competitorAnalysis.competitive_weaknesses.map((weakness: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content Gap Analysis */}
      {(contentGaps.structural_gaps?.length > 0 || 
        contentGaps.thematic_gaps?.length > 0 || 
        contentGaps.critical_topic_gaps?.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Content Gap Analysis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {contentGaps.total_gaps || 0} gaps identified
              </p>
            </div>
          </div>

          {contentGaps.severity_breakdown && (
            <div className="flex gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {contentGaps.severity_breakdown.critical || 0} Critical
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {contentGaps.severity_breakdown.significant || 0} Significant
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {contentGaps.severity_breakdown.moderate || 0} Moderate
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {[
              ...(contentGaps.critical_topic_gaps || []),
              ...(contentGaps.structural_gaps || []),
              ...(contentGaps.thematic_gaps || [])
            ].slice(0, 10).map((gap: any, idx: number) => (
              <div key={idx} className={`rounded-lg border p-4 ${getSeverityColor(gap.severity)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{gap.title || gap.gap_title}</h4>
                    <Badge variant={gap.severity === 'Critical' ? 'error' : gap.severity === 'Significant' ? 'warning' : 'info'} size="sm">
                      {gap.severity}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm mb-2">{gap.description}</p>
                {gap.recommendation && (
                  <p className="text-sm font-medium">
                    <span className="text-xs font-semibold">Recommendation:</span> {gap.recommendation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priority Actions */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Target size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Priority Actions
            </h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Recommended improvements to boost AI visibility
            </span>
          </div>
          <div className="space-y-4">
            {recommendations.map((action: any, idx: number) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                      {action.priority || idx + 1}
                    </span>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {action.title || action.action_title}
                    </h4>
                  </div>
                  <div>
                    <Badge variant={getPriorityColor(action.priority_level)} size="sm">
                      {action.priority_level || action.priority}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {action.description || action.action_description}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                  {action.impact && (
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">Impact:</span>
                      <span className="capitalize">{action.impact}</span>
                    </div>
                  )}
                  {action.effort && (
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">Effort:</span>
                      <span className="capitalize">{action.effort}</span>
                    </div>
                  )}
                  {action.category && (
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">Category:</span>
                      <span className="capitalize">{action.category}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats - ADMIN ONLY */}
      {showMetadata && (
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
      )}
    </div>
  );
};