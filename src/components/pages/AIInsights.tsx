import React, { useState } from 'react';
import { Brain, TrendingUp, Target, Users, Search, AlertTriangle, CheckCircle, Zap, Eye, Download, Settings, Plus, Filter, Calendar, BarChart3, PieChart, Activity, Globe, Cpu, Sparkles, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface AIEngine {
  id: string;
  name: string;
  logo: string;
  color: string;
  visibilityScore: number;
  trend: number;
  citations: number;
  lastUpdated: string;
}

interface QueryPerformance {
  id: string;
  query: string;
  visibility: number;
  change: number;
  engine: string;
  intent: 'high' | 'medium' | 'low';
  mentions: number;
}

interface Competitor {
  id: string;
  name: string;
  domain: string;
  overallScore: number;
  mentions: number;
  trend: number;
  engines: {
    chatgpt: number;
    claude: number;
    gemini: number;
    perplexity: number;
  };
}

interface ContentGap {
  id: string;
  category: string;
  severity: 'critical' | 'important' | 'minor';
  description: string;
  impact: number;
  effort: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'completed';
}

const mockAIEngines: AIEngine[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    logo: '🤖',
    color: 'from-green-500 to-green-600',
    visibilityScore: 78,
    trend: 12,
    citations: 23,
    lastUpdated: '2 hours ago'
  },
  {
    id: 'claude',
    name: 'Claude',
    logo: '🧠',
    color: 'from-blue-500 to-blue-600',
    visibilityScore: 65,
    trend: 8,
    citations: 18,
    lastUpdated: '3 hours ago'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    logo: '💎',
    color: 'from-orange-500 to-orange-600',
    visibilityScore: 72,
    trend: -3,
    citations: 21,
    lastUpdated: '1 hour ago'
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    logo: '🔍',
    color: 'from-purple-500 to-purple-600',
    visibilityScore: 69,
    trend: 15,
    citations: 19,
    lastUpdated: '4 hours ago'
  }
];

const mockQueries: QueryPerformance[] = [
  {
    id: '1',
    query: 'best dermatologist downtown',
    visibility: 85,
    change: 12,
    engine: 'ChatGPT',
    intent: 'high',
    mentions: 8
  },
  {
    id: '2',
    query: 'acne treatment specialist near me',
    visibility: 72,
    change: -5,
    engine: 'Claude',
    intent: 'high',
    mentions: 6
  },
  {
    id: '3',
    query: 'skin care clinic reviews',
    visibility: 68,
    change: 18,
    engine: 'Gemini',
    intent: 'medium',
    mentions: 12
  },
  {
    id: '4',
    query: 'dermatology services downtown',
    visibility: 91,
    change: 7,
    engine: 'Perplexity',
    intent: 'medium',
    mentions: 15
  },
  {
    id: '5',
    query: 'cosmetic dermatology procedures',
    visibility: 56,
    change: -8,
    engine: 'ChatGPT',
    intent: 'low',
    mentions: 4
  }
];

const mockCompetitors: Competitor[] = [
  {
    id: '1',
    name: 'Elite Dermatology Center',
    domain: 'elitederm.com',
    overallScore: 82,
    mentions: 45,
    trend: 8,
    engines: {
      chatgpt: 85,
      claude: 78,
      gemini: 84,
      perplexity: 81
    }
  },
  {
    id: '2',
    name: 'Downtown Skin Clinic',
    domain: 'downtownskin.com',
    overallScore: 71,
    mentions: 32,
    trend: -3,
    engines: {
      chatgpt: 68,
      claude: 72,
      gemini: 75,
      perplexity: 69
    }
  },
  {
    id: '3',
    name: 'Advanced Dermatology',
    domain: 'advancedderm.com',
    overallScore: 76,
    mentions: 38,
    trend: 12,
    engines: {
      chatgpt: 79,
      claude: 74,
      gemini: 78,
      perplexity: 73
    }
  }
];

const mockContentGaps: ContentGap[] = [
  {
    id: '1',
    category: 'NAP Consistency',
    severity: 'critical',
    description: 'Business address inconsistent across 3 AI engines',
    impact: 25,
    effort: 'low',
    status: 'open'
  },
  {
    id: '2',
    category: 'Service Descriptions',
    severity: 'important',
    description: 'Missing detailed descriptions for cosmetic procedures',
    impact: 18,
    effort: 'medium',
    status: 'in-progress'
  },
  {
    id: '3',
    category: 'Review Integration',
    severity: 'minor',
    description: 'Recent reviews not appearing in AI responses',
    impact: 12,
    effort: 'high',
    status: 'open'
  },
  {
    id: '4',
    category: 'Business Hours',
    severity: 'important',
    description: 'Holiday hours not updated across platforms',
    impact: 15,
    effort: 'low',
    status: 'completed'
  }
];

export const AIInsights: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reports' | 'queries' | 'competitors' | 'settings'>('reports');
  const [activeReportTab, setActiveReportTab] = useState<'all' | 'strengths' | 'gaps' | 'recommendations' | 'implementation' | 'citations' | 'scores'>('all');
  const [timePeriod, setTimePeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null);

  const overallVisibilityScore = Math.round(mockAIEngines.reduce((sum, engine) => sum + engine.visibilityScore, 0) / mockAIEngines.length);
  const overallTrend = Math.round(mockAIEngines.reduce((sum, engine) => sum + engine.trend, 0) / mockAIEngines.length);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    gradient: string;
    trend?: number;
    subtitle?: string;
  }> = ({ title, value, icon: Icon, gradient, trend, subtitle }) => (
    <Card hover glow className="group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-1 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? <ArrowUp size={14} /> : trend < 0 ? <ArrowDown size={14} /> : <Minus size={14} />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-4 rounded-full bg-gradient-to-r ${gradient} shadow-lg`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </Card>
  );

  const AIEngineCard: React.FC<{ engine: AIEngine }> = ({ engine }) => (
    <Card hover className="group cursor-pointer" onClick={() => setSelectedEngine(engine.id)}>
      <div className="text-center">
        <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${engine.color} mb-4 transition-transform duration-300 group-hover:scale-110`}>
          <span className="text-2xl">{engine.logo}</span>
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{engine.name}</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{engine.visibilityScore}</span>
            <div className={`flex items-center gap-1 text-sm ${engine.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {engine.trend > 0 ? <ArrowUp size={12} /> : engine.trend < 0 ? <ArrowDown size={12} /> : <Minus size={12} />}
              <span>{Math.abs(engine.trend)}%</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">{engine.citations} citations</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">Updated {engine.lastUpdated}</p>
        </div>
      </div>
    </Card>
  );

  const QueryRow: React.FC<{ query: QueryPerformance }> = ({ query }) => (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">{query.query}</td>
      <td className="px-4 py-3 text-center">
        <span className="text-lg font-bold text-gray-900 dark:text-white">{query.visibility}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <div className={`flex items-center justify-center gap-1 ${query.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {query.change > 0 ? <ArrowUp size={14} /> : query.change < 0 ? <ArrowDown size={14} /> : <Minus size={14} />}
          <span className="font-medium">{Math.abs(query.change)}%</span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <Badge variant="info" size="sm">{query.engine}</Badge>
      </td>
      <td className="px-4 py-3 text-center">
        <Badge 
          variant={query.intent === 'high' ? 'error' : query.intent === 'medium' ? 'warning' : 'success'} 
          size="sm"
        >
          {query.intent}
        </Badge>
      </td>
    </tr>
  );

  const CompetitorCard: React.FC<{ competitor: Competitor }> = ({ competitor }) => (
    <Card hover className="group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{competitor.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{competitor.domain}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{competitor.overallScore}</span>
            <div className={`flex items-center gap-1 text-sm ${competitor.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {competitor.trend > 0 ? <ArrowUp size={12} /> : competitor.trend < 0 ? <ArrowDown size={12} /> : <Minus size={12} />}
              <span>{Math.abs(competitor.trend)}%</span>
            </div>
          </div>
        </div>
        <Badge variant="info" size="sm">{competitor.mentions} mentions</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{competitor.engines.chatgpt}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">ChatGPT</p>
        </div>
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{competitor.engines.claude}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Claude</p>
        </div>
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{competitor.engines.gemini}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Gemini</p>
        </div>
        <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{competitor.engines.perplexity}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Perplexity</p>
        </div>
      </div>
    </Card>
  );

  const ContentGapCard: React.FC<{ gap: ContentGap }> = ({ gap }) => (
    <Card hover className="group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-gray-900 dark:text-white">{gap.category}</h4>
            <Badge 
              variant={gap.severity === 'critical' ? 'error' : gap.severity === 'important' ? 'warning' : 'info'} 
              size="sm"
            >
              {gap.severity}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{gap.description}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
            <span>Impact: +{gap.impact}% visibility</span>
            <span>Effort: {gap.effort}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={gap.status === 'completed' ? 'success' : gap.status === 'in-progress' ? 'warning' : 'info'} 
            size="sm"
          >
            {gap.status.replace('-', ' ')}
          </Badge>
        </div>
      </div>
      {gap.status === 'open' && (
        <Button variant="primary" size="sm" className="w-full">
          Fix Gap
        </Button>
      )}
    </Card>
  );

  const renderReportsContent = () => {
    switch (activeReportTab) {
      case 'strengths':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="text-green-600" size={24} />
                  <h3 className="font-semibold text-green-900 dark:text-green-100">High Citation Quality</h3>
                </div>
                <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                  Your business is cited by 23 high-authority domains across AI engines.
                </p>
                <Button variant="secondary" size="sm">Leverage This</Button>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="text-blue-600" size={24} />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Strong Local Intent</h3>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  85% visibility for high-intent local queries in your category.
                </p>
                <Button variant="secondary" size="sm">Expand Reach</Button>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="text-purple-600" size={24} />
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100">AI-Optimized Content</h3>
                </div>
                <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
                  Your content structure is well-optimized for AI understanding.
                </p>
                <Button variant="secondary" size="sm">Optimize More</Button>
              </Card>
            </div>
          </div>
        );

      case 'gaps':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockContentGaps.map(gap => (
                <ContentGapCard key={gap.id} gap={gap} />
              ))}
            </div>
          </div>
        );

      case 'recommendations':
        return (
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Priority Recommendations</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertTriangle className="text-red-600 mt-1" size={20} />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900 dark:text-red-100 mb-1">Critical: Fix NAP Inconsistencies</h4>
                    <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                      Address variations detected across AI engines. Estimated impact: +25% visibility.
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="error" size="sm">High Priority</Badge>
                      <Badge variant="success" size="sm">Quick Win</Badge>
                    </div>
                  </div>
                  <Button variant="primary" size="sm">Fix Now</Button>
                </div>

                <div className="flex items-start gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <Target className="text-yellow-600 mt-1" size={20} />
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">Expand Service Descriptions</h4>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                      Add detailed descriptions for cosmetic procedures. Estimated impact: +18% visibility.
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="warning" size="sm">Medium Priority</Badge>
                      <Badge variant="info" size="sm">2-3 weeks</Badge>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">Plan</Button>
                </div>

                <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Zap className="text-blue-600 mt-1" size={20} />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Optimize for Perplexity</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                      Improve structured data for better Perplexity visibility. Estimated impact: +15% visibility.
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="info" size="sm">Low Priority</Badge>
                      <Badge variant="warning" size="sm">Technical</Badge>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">Schedule</Button>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'implementation':
        return (
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">30-60-90 Day Roadmap</h3>
              
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">30</div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">First 30 Days - Quick Wins</h4>
                  </div>
                  <div className="ml-11 space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="text-green-600" size={16} />
                      <span className="text-sm text-gray-900 dark:text-white">Fix NAP inconsistencies across all platforms</span>
                      <Badge variant="success" size="sm">Completed</Badge>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-900 dark:text-white">Update business hours for holiday season</span>
                      <Badge variant="warning" size="sm">In Progress</Badge>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-900 dark:text-white">Optimize Google Business Profile description</span>
                      <Badge variant="info" size="sm">Planned</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">60</div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Next 30 Days - Content Enhancement</h4>
                  </div>
                  <div className="ml-11 space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-900 dark:text-white">Create detailed service descriptions</span>
                      <Badge variant="info" size="sm">Planned</Badge>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-900 dark:text-white">Implement structured data markup</span>
                      <Badge variant="info" size="sm">Planned</Badge>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-900 dark:text-white">Launch review response automation</span>
                      <Badge variant="info" size="sm">Planned</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">90</div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Long-term - Advanced Optimization</h4>
                  </div>
                  <div className="ml-11 space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-900 dark:text-white">AI-specific content optimization</span>
                      <Badge variant="info" size="sm">Planned</Badge>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-900 dark:text-white">Competitive intelligence automation</span>
                      <Badge variant="info" size="sm">Planned</Badge>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-900 dark:text-white">Advanced citation building campaign</span>
                      <Badge variant="info" size="sm">Planned</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'citations':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Citation Sources by Engine</h3>
                <div className="space-y-4">
                  {mockAIEngines.map(engine => (
                    <div key={engine.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{engine.logo}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{engine.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">{engine.citations}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">citations</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Citation Domains</h3>
                <div className="space-y-3">
                  {[
                    { domain: 'healthgrades.com', citations: 8, authority: 92 },
                    { domain: 'yelp.com', citations: 6, authority: 89 },
                    { domain: 'google.com', citations: 12, authority: 100 },
                    { domain: 'webmd.com', citations: 4, authority: 85 },
                    { domain: 'zocdoc.com', citations: 5, authority: 78 }
                  ].map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{source.domain}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Authority: {source.authority}</p>
                      </div>
                      <Badge variant="info" size="sm">{source.citations} citations</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        );

      case 'scores':
        return (
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Detailed AI Engine Scoring</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Engine</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Overall Score</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Accuracy</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Completeness</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Recency</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {mockAIEngines.map(engine => (
                      <tr key={engine.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{engine.logo}</span>
                            <span className="font-medium text-gray-900 dark:text-white">{engine.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-xl font-bold text-gray-900 dark:text-white">{engine.visibilityScore}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-gray-900 dark:text-white">{Math.floor(engine.visibilityScore * 0.9)}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-gray-900 dark:text-white">{Math.floor(engine.visibilityScore * 1.1)}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-gray-900 dark:text-white">{Math.floor(engine.visibilityScore * 0.95)}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className={`flex items-center justify-center gap-1 ${engine.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {engine.trend > 0 ? <ArrowUp size={14} /> : engine.trend < 0 ? <ArrowDown size={14} /> : <Minus size={14} />}
                            <span>{Math.abs(engine.trend)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Achievements</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="text-green-600" size={20} />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">ChatGPT Visibility +12%</p>
                      <p className="text-sm text-green-800 dark:text-green-200">Improved ranking for "dermatologist near me"</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Target className="text-blue-600" size={20} />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">New Citation Source</p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">Added to Healthgrades directory</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Sparkles className="text-purple-600" size={20} />
                    <div>
                      <p className="font-medium text-purple-900 dark:text-purple-100">Perplexity Optimization</p>
                      <p className="text-sm text-purple-800 dark:text-purple-200">Structured data implementation complete</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Priority Actions</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <AlertTriangle className="text-red-600" size={20} />
                    <div className="flex-1">
                      <p className="font-medium text-red-900 dark:text-red-100">Fix NAP Inconsistency</p>
                      <p className="text-sm text-red-800 dark:text-red-200">Critical impact on AI visibility</p>
                    </div>
                    <Button variant="primary" size="sm">Fix</Button>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <Target className="text-yellow-600" size={20} />
                    <div className="flex-1">
                      <p className="font-medium text-yellow-900 dark:text-yellow-100">Expand Service Descriptions</p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">Improve content completeness</p>
                    </div>
                    <Button variant="secondary" size="sm">Plan</Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            AI Visibility
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your visibility across AI engines and optimize for the future of search
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as any)}
            className="px-3 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="custom">Custom range</option>
          </select>
          <Button variant="secondary">
            <Download size={16} />
            Generate Report
          </Button>
          <Button>
            <Zap size={16} />
            Run Full Scan
          </Button>
        </div>
      </div>

      {/* Overall AI Visibility Score */}
      <Card glow className="text-center py-8 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10">
        <div className="inline-flex p-6 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full mb-4">
          <Brain size={32} className="text-white" />
        </div>
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{overallVisibilityScore}</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">Overall AI Visibility Score</p>
        <div className={`flex items-center justify-center gap-2 text-lg ${overallTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {overallTrend > 0 ? <ArrowUp size={20} /> : overallTrend < 0 ? <ArrowDown size={20} /> : <Minus size={20} />}
          <span>{Math.abs(overallTrend)}% from last period</span>
        </div>
      </Card>

      {/* Main Dashboard Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* AI Visibility Trend */}
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Visibility Trends</h3>
            <Button variant="ghost" size="sm">
              <Eye size={16} />
              View Details
            </Button>
          </div>
          <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Activity size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Interactive trend chart</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Showing visibility across all AI engines</p>
            </div>
          </div>
        </Card>

        {/* Citation Share */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Citation Share</h3>
            <Button variant="ghost" size="sm">
              <PieChart size={16} />
              Details
            </Button>
          </div>
          <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <PieChart size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Citation distribution</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">vs top 3 competitors</p>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Engine Performance Cards */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">AI Engine Performance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockAIEngines.map(engine => (
            <AIEngineCard key={engine.id} engine={engine} />
          ))}
        </div>
      </div>

      {/* Tabbed Content */}
      <div>
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'reports', label: 'Reports', icon: BarChart3 },
              { id: 'queries', label: 'Query Sets', icon: Search },
              { id: 'competitors', label: 'Competitors', icon: Users },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#f45a4e] text-[#f45a4e]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Report Sub-tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'strengths', label: 'Strengths' },
                { id: 'gaps', label: 'Content Gaps' },
                { id: 'recommendations', label: 'Recommendations' },
                { id: 'implementation', label: 'Implementation' },
                { id: 'citations', label: 'LLM Citations' },
                { id: 'scores', label: 'AI Scores' }
              ].map(tab => (
                <Button
                  key={tab.id}
                  variant={activeReportTab === tab.id ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveReportTab(tab.id as any)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {renderReportsContent()}
          </div>
        )}

        {activeTab === 'queries' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Query Performance</h3>
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm">
                  <Filter size={16} />
                  Filter
                </Button>
                <Button size="sm">
                  <Plus size={16} />
                  Add Query Set
                </Button>
              </div>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Query</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Visibility</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Change</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">AI Engine</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Intent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {mockQueries.map(query => (
                      <QueryRow key={query.id} query={query} />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'competitors' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Competitor Analysis</h3>
              <Button size="sm">
                <Plus size={16} />
                Add Competitor
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {mockCompetitors.map(competitor => (
                <CompetitorCard key={competitor.id} competitor={competitor} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">AI Engine Settings</h3>
              <div className="space-y-4">
                {mockAIEngines.map(engine => (
                  <div key={engine.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{engine.logo}</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{engine.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Last scan: {engine.lastUpdated}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm">
                        <option>Daily</option>
                        <option>Weekly</option>
                        <option>Monthly</option>
                      </select>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#f45a4e]/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#f45a4e]"></div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};