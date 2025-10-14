// src/components/pages/AIInsights.tsx
// Complete redesign with real AI Visibility Service integration

import { createClient } from '@supabase/supabase-js';
import {
  AlertCircle,
  Award,
  Brain,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader,
  Plus,
  RefreshCw,
  Target,
  TrendingUp,
  Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getOrganizationReports, getPlatformScoreHistory, getReportById, getScoreHistory } from '../../lib/aiVisibilityDatabase';
import { AIVisibilityService } from '../../lib/aiVisibilityService';
import type {
  AIVisibilityReport,
  Achievement,
  ContentGap,
  PlatformScore,
  PriorityAction
} from '../../types/aiVisibility';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface TrendDataPoint {
  month: string;
  overall_score: number;
  chatgpt_score: number;
  claude_score: number;
  gemini_score: number;
  perplexity_score: number;
}

export const AIInsights: React.FC = () => {
  // State
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [reports, setReports] = useState<AIVisibilityReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [platformScores, setPlatformScores] = useState<PlatformScore[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [priorityActions, setPriorityActions] = useState<PriorityAction[]>([]);
  const [contentGaps, setContentGaps] = useState<ContentGap[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());

  // Get authenticated user and organization
  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // Get user profile with organization_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profile?.organization_id) {
        setOrganizationId(profile.organization_id);
      } else {
        setError('Organization not found');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error initializing user:', err);
      setError('Failed to load user data');
      setLoading(false);
    }
  };

  // Load reports when organization is set
  useEffect(() => {
    if (organizationId) {
      loadReports();
    }
  }, [organizationId]);

  const loadReports = async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch reports from database
      const reportsData = await getOrganizationReports(organizationId, 12);
      setReports(reportsData);

      // Load most recent report by default
      if (reportsData.length > 0) {
        await loadReportDetails(reportsData[0].id);
      }

      // Load trend data
      const [scoreHistory, platformHistory] = await Promise.all([
        getScoreHistory(organizationId, 12),
        getPlatformScoreHistory(organizationId, 12)
      ]);

      // Merge trend data
      const trendMap = new Map<string, TrendDataPoint>();
      
      scoreHistory.forEach(item => {
        trendMap.set(item.date, {
          month: item.date,
          overall_score: item.score,
          chatgpt_score: 0,
          claude_score: 0,
          gemini_score: 0,
          perplexity_score: 0
        });
      });

      platformHistory.forEach(item => {
        const existing = trendMap.get(item.report_month) || {
          month: item.report_month,
          overall_score: 0,
          chatgpt_score: 0,
          claude_score: 0,
          gemini_score: 0,
          perplexity_score: 0
        };
        
        trendMap.set(item.report_month, {
          ...existing,
          chatgpt_score: item.chatgpt_score,
          claude_score: item.claude_score,
          gemini_score: item.gemini_score,
          perplexity_score: item.perplexity_score
        });
      });

      setTrendData(Array.from(trendMap.values()).reverse());

    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const loadReportDetails = async (reportId: string) => {
    try {
      const reportData = await getReportById(reportId);
      
      if (reportData) {
        setSelectedReportId(reportId);
        setPlatformScores(reportData.platform_scores || []);
        setAchievements(reportData.achievements || []);
        setPriorityActions(reportData.priority_actions || []);
        setContentGaps(reportData.content_gaps || []);
      }
    } catch (err) {
      console.error('Error loading report details:', err);
    }
  };

  const handleGenerateReport = async () => {
    if (!organizationId) return;

    setGenerating(true);
    setError(null);

    try {
      // Get organization details for business context
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single();

      // TODO: Replace these with actual organization settings
      const businessName = orgData?.name || 'Your Business';
      const businessType = 'restaurant'; // Should come from org settings
      const location = 'Seattle, WA'; // Should come from org settings

      console.log('🚀 Starting report generation...');

      // Generate report using AI Visibility Service
      const service = new AIVisibilityService();
      const report = await service.generateMonthlyReport({
        organization_id: organizationId,
        business_name: businessName,
        business_type: businessType,
        location: location,
        query_count: 10,
        platforms: ['chatgpt', 'claude', 'gemini', 'perplexity']
      });

      console.log('✅ Report generated, storing to database...');

      // Import and call storeReport
      const { storeReport } = await import('../../lib/aiVisibilityDatabase');
      await storeReport(report);

      console.log('✅ Report stored, refreshing UI...');

      // Refresh reports list
      await loadReports();

      console.log('✅ All complete!');

      // Show success message
      alert('Report generated and saved successfully!');

    } catch (err) {
      console.error('❌ Error generating report:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to generate report'}`);
    } finally {
      setGenerating(false);
    }
  };

  const toggleAction = (actionId: string) => {
    const newExpanded = new Set(expandedActions);
    if (newExpanded.has(actionId)) {
      newExpanded.delete(actionId);
    } else {
      newExpanded.add(actionId);
    }
    setExpandedActions(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const getPriorityBadgeVariant = (priority: string): 'error' | 'warning' | 'info' | 'success' => {
    const variants: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
      critical: 'error',
      high: 'warning',
      medium: 'info',
      low: 'success'
    };
    return variants[priority] || 'info';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-500' };
    if (score >= 80) return { grade: 'A', color: 'text-green-500' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-500' };
    if (score >= 60) return { grade: 'C', color: 'text-yellow-500' };
    if (score >= 50) return { grade: 'D', color: 'text-orange-500' };
    return { grade: 'F', color: 'text-red-500' };
  };

  const getSeverityBadgeVariant = (severity: string): 'error' | 'warning' | 'info' => {
    const variants: Record<string, 'error' | 'warning' | 'info'> = {
      critical: 'error',
      significant: 'error',
      moderate: 'warning',
      low: 'info'
    };
    return variants[severity] || 'info';
  };

  const selectedReport = reports.find(r => r.id === selectedReportId);

  // Empty state
  if (loading && !organizationId) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin text-gray-400" size={48} />
      </div>
    );
  }

  if (error && !reports.length) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {error}
        </h3>
        <Button onClick={loadReports} variant="primary" size="sm">
          <RefreshCw size={16} className="mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!loading && reports.length === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="mx-auto text-gray-400 mb-4" size={64} />
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          No AI Visibility Reports Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Generate your first report to see how your business appears in AI search results
          across ChatGPT, Claude, Gemini, and Perplexity.
        </p>
        <Button 
          onClick={handleGenerateReport} 
          disabled={generating}
          variant="primary"
          size="md"
        >
          {generating ? (
            <>
              <Loader className="animate-spin mr-2" size={16} />
              Generating Report...
            </>
          ) : (
            <>
              <Plus className="mr-2" size={16} />
              Generate First Report
            </>
          )}
        </Button>
        {generating && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            This may take 1-2 minutes...
          </p>
        )}
      </div>
    );
  }

  const scoreGrade = selectedReport?.overall_score !== null && selectedReport?.overall_score !== undefined 
    ? getScoreGrade(selectedReport.overall_score) 
    : null;

  return (
    <div className="space-y-6">
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            AI Visibility Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track how your business appears in AI-powered search
          </p>
        </div>
        <Button 
          onClick={handleGenerateReport}
          disabled={generating}
          variant="primary"
          size="md"
        >
          {generating ? (
            <>
              <Loader className="animate-spin mr-2" size={16} />
              Generating...
            </>
          ) : (
            <>
              <Plus className="mr-2" size={16} />
              Generate Report
            </>
          )}
        </Button>
      </div>

      {/* Report Selector */}
      <Card hover={false}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-gray-400" />
            <div>
              <select
                value={selectedReportId || ''}
                onChange={(e) => loadReportDetails(e.target.value)}
                className="text-lg font-medium bg-transparent border-none focus:outline-none cursor-pointer text-gray-900 dark:text-white"
              >
                {reports.map(report => (
                  <option key={report.id} value={report.id}>
                    {formatDate(report.report_month)}
                  </option>
                ))}
              </select>
              {selectedReport?.generated_at && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generated {new Date(selectedReport.generated_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <Button onClick={loadReports} variant="ghost" size="sm">
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Score Overview */}
      {selectedReport && selectedReport.overall_score !== null && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card hover={false}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Overall Score
                </h3>
                <Brain size={20} className="text-blue-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  {selectedReport.overall_score}
                </span>
                <span className="text-2xl text-gray-400">/100</span>
              </div>
              {scoreGrade && (
                <div className="mt-2">
                  <span className={`text-lg font-bold ${scoreGrade.color}`}>
                    Grade: {scoreGrade.grade}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {platformScores.slice(0, 3).map(platform => (
            <Card key={platform.platform} hover={false}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                    {platform.platform}
                  </h3>
                  <Target size={20} className="text-purple-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {platform.score}
                  </span>
                  <span className="text-2xl text-gray-400">/100</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {platform.mention_count > 0 ? (
                    <Badge variant="success" size="sm">Mentioned</Badge>
                  ) : (
                    <Badge variant="error" size="sm">Not Found</Badge>
                  )}
                  {platform.ranking_position !== null && (
                    <Badge variant="info" size="sm">#{platform.ranking_position}</Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <Card hover={false}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Performance Trend
              </h2>
              <TrendingUp className="text-green-500" size={24} />
            </div>
            <div className="h-64 flex items-end justify-between gap-2">
              {trendData.slice(-6).map((point, index) => {
                const maxScore = 100;
                const height = (point.overall_score / maxScore) * 100;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative" style={{ height: '200px' }}>
                      <div 
                        className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t transition-all duration-300"
                        style={{ height: `${height}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {point.overall_score}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      {new Date(point.month).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <Card hover={false}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Award className="text-yellow-500" size={24} />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Recent Achievements
              </h2>
            </div>
            <div className="space-y-3">
              {achievements.slice(0, 3).map(achievement => (
                <div 
                  key={achievement.id}
                  className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
                >
                  <Award className="text-yellow-500 flex-shrink-0 mt-1" size={20} />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {achievement.achievement_text}
                    </h4>
                    {achievement.improvement_percentage !== null && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        +{achievement.improvement_percentage.toFixed(1)}% improvement
                      </p>
                    )}
                  </div>
                  <Badge variant="success" size="sm">
                    {achievement.impact_level}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Priority Actions */}
      {priorityActions.length > 0 && (
        <Card hover={false}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Target className="text-blue-500" size={24} />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Priority Actions
              </h2>
            </div>
            <div className="space-y-3">
              {priorityActions
                .sort((a, b) => {
                  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
                  return priorityOrder[a.priority] - priorityOrder[b.priority];
                })
                .map(action => (
                  <div 
                    key={action.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => toggleAction(action.id)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Badge variant={getPriorityBadgeVariant(action.priority)} size="sm">
                          {action.priority}
                        </Badge>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {action.action_title}
                        </span>
                        {action.estimated_impact && (
                          <Badge variant="info" size="sm">
                            Impact: {action.estimated_impact}
                          </Badge>
                        )}
                      </div>
                      {expandedActions.has(action.id) ? (
                        <ChevronUp size={20} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                      )}
                    </div>
                    {expandedActions.has(action.id) && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {action.action_description}
                        </p>
                        {action.fix_instructions && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                              Fix Instructions:
                            </h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {action.fix_instructions}
                            </p>
                          </div>
                        )}
                        {action.estimated_effort && (
                          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>Effort: {action.estimated_effort}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </Card>
      )}

      {/* Content Gaps */}
      {contentGaps.length > 0 && (
        <Card hover={false}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="text-orange-500" size={24} />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Content Gaps
              </h2>
            </div>
            <div className="space-y-3">
              {contentGaps
                .sort((a, b) => {
                  const severityOrder: Record<string, number> = { critical: 0, significant: 1, moderate: 2, low: 3 };
                  return severityOrder[a.severity] - severityOrder[b.severity];
                })
                .slice(0, 5)
                .map(gap => (
                  <div 
                    key={gap.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {gap.gap_title}
                      </h4>
                      <Badge 
                        variant={getSeverityBadgeVariant(gap.severity)}
                        size="sm"
                      >
                        {gap.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {gap.gap_description}
                    </p>
                    {gap.competitors_have_this.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Users size={14} />
                        <span>
                          Competitors with this: {gap.competitors_have_this.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};