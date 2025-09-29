// src/components/pages/AIInsights.tsx
// Complete redesign with automated monthly reports

import {
  AlertCircle,
  Award,
  Brain,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Target,
  TrendingUp,
  Users,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AIVisibilityMockService } from '../../lib/aiVisibilityMockService';
import type {
  AIQuery,
  AIVisibilityReport,
  Achievement,
  Competitor,
  PlatformScore,
  PriorityAction,
  TrendDataPoint
} from '../../types/aiVisibility';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const AIInsights: React.FC = () => {
  const organizationId = 'test-org-id'; // Get from auth context in production

  // State
  const [reports, setReports] = useState<AIVisibilityReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [platformScores, setPlatformScores] = useState<PlatformScore[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [priorityActions, setPriorityActions] = useState<PriorityAction[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [queries, setQueries] = useState<AIQuery[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'queries' | 'competitors'>('queries');

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsData, competitorsData, queriesData, trendDataResult] = await Promise.all([
        AIVisibilityMockService.getReports(organizationId),
        AIVisibilityMockService.getCompetitors(organizationId),
        AIVisibilityMockService.getQueries(organizationId),
        AIVisibilityMockService.getTrendData(organizationId)
      ]);

      setReports(reportsData);
      setCompetitors(competitorsData);
      setQueries(queriesData);
      setTrendData(trendDataResult);

      // Load most recent report by default
      if (reportsData.length > 0) {
        const mostRecentReport = reportsData[0];
        setSelectedReportId(mostRecentReport.id);
        await loadReportDetails(mostRecentReport.id);
      }
    } catch (error) {
      console.error('Error loading AI Visibility data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReportDetails = async (reportId: string) => {
    try {
      const reportDetails = await AIVisibilityMockService.getReportById(reportId, organizationId);
      setPlatformScores(reportDetails.platformScores);
      setAchievements(reportDetails.achievements);
      setPriorityActions(reportDetails.priorityActions);
    } catch (error) {
      console.error('Error loading report details:', error);
    }
  };

  const toggleActionExpanded = (actionId: string) => {
    const newExpanded = new Set(expandedActions);
    if (newExpanded.has(actionId)) {
      newExpanded.delete(actionId);
    } else {
      newExpanded.add(actionId);
    }
    setExpandedActions(newExpanded);
  };

  const toggleCompetitorDisabled = async (competitorId: string) => {
    setCompetitors(competitors.map(c => 
      c.id === competitorId 
        ? { ...c, is_user_disabled: !c.is_user_disabled }
        : c
    ));
  };

  const currentReport = reports.find(r => r.id === selectedReportId);
  const activeCompetitors = competitors.filter(c => !c.is_user_disabled);
  const activeQueries = queries.filter(q => q.is_active);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'chatgpt': return '🤖';
      case 'claude': return '🧠';
      case 'gemini': return '💎';
      case 'perplexity': return '🔍';
      default: return '🤖';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'chatgpt': return 'from-green-500 to-green-600';
      case 'claude': return 'from-blue-500 to-blue-600';
      case 'gemini': return 'from-orange-500 to-orange-600';
      case 'perplexity': return 'from-purple-500 to-purple-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f45a4e] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading AI Visibility data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Report Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            AI Visibility
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Automated monthly reports tracking your visibility across AI platforms
          </p>
        </div>

        {/* Month Selector */}
        <div className="relative">
          <select
            value={selectedReportId || ''}
            onChange={(e) => {
              setSelectedReportId(e.target.value);
              loadReportDetails(e.target.value);
            }}
            className="appearance-none px-4 py-2 pr-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#f45a4e] cursor-pointer"
          >
            {reports.map((report) => {
              const date = new Date(report.report_month);
              const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              return (
                <option key={report.id} value={report.id}>
                  {monthName} Report
                </option>
              );
            })}
          </select>
          <Calendar size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Overall Score Card */}
      <Card glow className="text-center py-8 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10">
        <div className="inline-flex p-6 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full mb-4">
          <Brain size={32} className="text-white" />
        </div>
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {currentReport?.overall_score || 0}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">Overall AI Visibility Score</p>
        <div className="flex items-center justify-center gap-2 text-lg text-green-600">
          <TrendingUp size={20} />
          <span>+8 points from last month</span>
        </div>
      </Card>

      {/* Platform Scores */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">AI Platform Performance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {platformScores.map((score) => (
            <Card key={score.platform} hover className="group cursor-pointer">
              <div className="text-center">
                <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${getPlatformColor(score.platform)} mb-4 transition-transform duration-300 group-hover:scale-110`}>
                  <span className="text-2xl">{getPlatformIcon(score.platform)}</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 capitalize">
                  {score.platform}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {score.score}
                    </span>
                    {score.score > 0 && (
                      <Badge variant="success" size="sm">Active</Badge>
                    )}
                  </div>
                  {score.mention_count > 0 ? (
                    <>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {score.mention_count} mentions
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Avg rank: {score.ranking_position?.toFixed(1)}
                      </p>
                    </>
                  ) : (
                    <Badge variant="error" size="sm">Not Detected</Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Trends Chart */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Visibility Trends
          </h3>
          
          {/* Line Chart */}
          <div className="relative h-64 mb-4">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-500">
              <span>100</span>
              <span>75</span>
              <span>50</span>
              <span>25</span>
              <span>0</span>
            </div>

            {/* Chart area */}
            <div className="ml-10 mr-4 h-full relative pb-6">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="border-t border-gray-200 dark:border-gray-700"></div>
                ))}
              </div>

              {/* SVG for lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Overall Score Line (thicker, on top) */}
                <polyline
                  points={trendData.map((point, index) => {
                    const x = (index / (trendData.length - 1)) * 100;
                    const y = 100 - point.overall_score;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#f45a4e"
                  strokeWidth="1"
                  className="drop-shadow-lg"
                />

                {/* ChatGPT Line */}
                <polyline
                  points={trendData.map((point, index) => {
                    const x = (index / (trendData.length - 1)) * 100;
                    const y = 100 - point.chatgpt_score;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="0.6"
                />

                {/* Claude Line */}
                <polyline
                  points={trendData.map((point, index) => {
                    const x = (index / (trendData.length - 1)) * 100;
                    const y = 100 - point.claude_score;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="0.6"
                />

                {/* Gemini Line */}
                <polyline
                  points={trendData.map((point, index) => {
                    const x = (index / (trendData.length - 1)) * 100;
                    const y = 100 - point.gemini_score;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="0.6"
                />

                {/* Perplexity Line */}
                <polyline
                  points={trendData.map((point, index) => {
                    const x = (index / (trendData.length - 1)) * 100;
                    const y = 100 - point.perplexity_score;
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="0.6"
                />

                {/* Data points for overall score */}
                {trendData.map((point, index) => {
                  const x = (index / (trendData.length - 1)) * 100;
                  const y = 100 - point.overall_score;
                  return (
                    <circle
                      key={`overall-${index}`}
                      cx={x}
                      cy={y}
                      r="1.2"
                      fill="#f45a4e"
                      className="drop-shadow"
                    />
                  );
                })}
              </svg>

              {/* X-axis labels */}
              <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-gray-600 dark:text-gray-400">
                {trendData.map((point, index) => (
                  <span key={index} className="transform -rotate-0">
                    {point.month}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Platform Legend */}
          <div className="flex flex-wrap gap-4 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-[#f45a4e]"></div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Overall</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-green-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">ChatGPT</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-blue-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Claude</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-orange-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Gemini</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-purple-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Perplexity</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Achievements */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award size={20} className="text-[#f45a4e]" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Achievements
            </h3>
          </div>
          <div className="space-y-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <Check size={20} className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white font-medium">
                    {achievement.achievement_text}
                  </p>
                  {achievement.improvement_percentage && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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

      {/* Priority Actions */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} className="text-[#f45a4e]" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Priority Actions
            </h3>
          </div>
          <div className="space-y-3">
            {priorityActions.map((action) => (
              <div
                key={action.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <div className="p-4 bg-white dark:bg-gray-800">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertCircle size={18} className={getPriorityColor(action.priority)} />
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {action.action_title}
                        </h4>
                        <Badge
                          variant={action.priority === 'high' || action.priority === 'critical' ? 'error' : 'warning'}
                          size="sm"
                        >
                          {action.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {action.action_description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                        <span>Impact: {action.estimated_impact}</span>
                        <span>•</span>
                        <span>Effort: {action.estimated_effort}</span>
                      </div>
                    </div>
                    <Button
                      variant={expandedActions.has(action.id) ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => toggleActionExpanded(action.id)}
                    >
                      {expandedActions.has(action.id) ? (
                        <>
                          <ChevronUp size={16} className="mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <ChevronDown size={16} className="mr-1" />
                          Fix
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expandable Instructions */}
                {expandedActions.has(action.id) && action.fix_instructions && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Implementation Guide:
                    </h5>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {action.fix_instructions.split('\n').map((line, idx) => {
                        if (line.startsWith('##')) {
                          return (
                            <h3 key={idx} className="text-base font-semibold text-gray-900 dark:text-white mt-4 mb-2">
                              {line.replace('##', '').trim()}
                            </h3>
                          );
                        }
                        if (line.startsWith('**')) {
                          return (
                            <p key={idx} className="font-semibold text-gray-900 dark:text-white mt-2">
                              {line.replace(/\*\*/g, '')}
                            </p>
                          );
                        }
                        if (line.startsWith('-')) {
                          return (
                            <li key={idx} className="text-gray-700 dark:text-gray-300 ml-4">
                              {line.substring(1).trim()}
                            </li>
                          );
                        }
                        if (line.trim()) {
                          return (
                            <p key={idx} className="text-gray-700 dark:text-gray-300 mt-2">
                              {line}
                            </p>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Query Sets and Competitors Tabs */}
      <Card>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4 px-6 pt-6">
            <button
              onClick={() => setActiveTab('queries')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'queries'
                  ? 'border-[#f45a4e] text-[#f45a4e]'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Query Sets ({activeQueries.length})
            </button>
            <button
              onClick={() => setActiveTab('competitors')}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'competitors'
                  ? 'border-[#f45a4e] text-[#f45a4e]'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Competitors ({activeCompetitors.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'queries' ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI-generated queries used to analyze your visibility ({activeQueries.length}/10)
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={activeQueries.length >= 10}
                >
                  <Plus size={16} className="mr-1" />
                  Add Query
                </Button>
              </div>
              <div className="space-y-2">
                {activeQueries.map((query, index) => (
                  <div
                    key={query.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-500 w-8">
                        #{index + 1}
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {query.query_text}
                      </span>
                      {query.is_auto_generated && (
                        <Badge variant="info" size="sm">Auto</Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      Used {query.times_used} times
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Competitors detected across AI platforms
              </p>
              <div className="space-y-2">
                {competitors.map((competitor) => (
                  <div
                    key={competitor.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      competitor.is_user_disabled
                        ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-50'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Users size={18} className="text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {competitor.competitor_name}
                          </p>
                          {competitor.competitor_website && (
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                              {competitor.competitor_website}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {competitor.detected_in_platforms.map((platform) => (
                          <Badge key={platform} variant="info" size="sm">
                            {platform}
                          </Badge>
                        ))}
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          • Detected {competitor.detection_count} times
                        </span>
                      </div>
                    </div>
                    <Button
                      variant={competitor.is_user_disabled ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => toggleCompetitorDisabled(competitor.id)}
                    >
                      {competitor.is_user_disabled ? (
                        <>
                          <Check size={16} className="mr-1" />
                          Enable
                        </>
                      ) : (
                        <>
                          <X size={16} className="mr-1" />
                          Not a Competitor
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};