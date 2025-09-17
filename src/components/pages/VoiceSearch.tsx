import React, { useState } from 'react';
import { Mic, TrendingUp, CheckCircle, AlertCircle, Clock, Zap, Eye, Download, Settings, Plus, Filter, Search, BarChart3, PieChart, Activity, Target, Brain, Sparkles, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface VoiceAssistant {
  id: string;
  name: string;
  logo: string;
  status: 'optimized' | 'ready' | 'needs-attention';
  score: number;
  trend: number;
  metrics: {
    queriesAnswered: number;
    responseAccuracy: number;
    featuredSnippets: number;
  };
}

interface VoiceQuery {
  id: string;
  query: string;
  volume: number;
  intent: 'informational' | 'navigational' | 'transactional';
  accuracy: number;
  trend: number;
  assistants: string[];
}

interface OptimizationItem {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: 'critical' | 'important' | 'minor';
  status: 'completed' | 'in-progress' | 'pending';
  impact: number;
}

const mockAssistants: VoiceAssistant[] = [
  {
    id: 'google',
    name: 'Google Assistant',
    logo: '🎙️',
    status: 'optimized',
    score: 85,
    trend: 12,
    metrics: {
      queriesAnswered: 247,
      responseAccuracy: 92,
      featuredSnippets: 18
    }
  },
  {
    id: 'siri',
    name: 'Siri (Apple)',
    logo: '🍎',
    status: 'ready',
    score: 72,
    trend: 8,
    metrics: {
      queriesAnswered: 156,
      responseAccuracy: 87,
      featuredSnippets: 12
    }
  },
  {
    id: 'alexa',
    name: 'Amazon Alexa',
    logo: '🔵',
    status: 'needs-attention',
    score: 58,
    trend: -3,
    metrics: {
      queriesAnswered: 89,
      responseAccuracy: 74,
      featuredSnippets: 6
    }
  },
  {
    id: 'copilot',
    name: 'Microsoft Copilot',
    logo: '🤖',
    status: 'ready',
    score: 68,
    trend: 15,
    metrics: {
      queriesAnswered: 134,
      responseAccuracy: 81,
      featuredSnippets: 9
    }
  }
];

const mockQueries: VoiceQuery[] = [
  {
    id: '1',
    query: 'best dermatologist near me',
    volume: 1240,
    intent: 'navigational',
    accuracy: 89,
    trend: 15,
    assistants: ['google', 'siri', 'copilot']
  },
  {
    id: '2',
    query: 'what are the hours for downtown dermatology',
    volume: 890,
    intent: 'informational',
    accuracy: 95,
    trend: 8,
    assistants: ['google', 'alexa', 'siri']
  },
  {
    id: '3',
    query: 'book appointment with skin doctor',
    volume: 567,
    intent: 'transactional',
    accuracy: 72,
    trend: -5,
    assistants: ['google', 'copilot']
  },
  {
    id: '4',
    query: 'dermatology clinic phone number',
    volume: 445,
    intent: 'informational',
    accuracy: 98,
    trend: 3,
    assistants: ['google', 'siri', 'alexa', 'copilot']
  },
  {
    id: '5',
    query: 'how much does acne treatment cost',
    volume: 334,
    intent: 'informational',
    accuracy: 65,
    trend: 12,
    assistants: ['google', 'copilot']
  }
];

const mockOptimizations: OptimizationItem[] = [
  {
    id: '1',
    category: 'NAP Consistency',
    title: 'Fix Business Hours Discrepancy',
    description: 'Business hours inconsistent across Google Assistant and Siri',
    priority: 'critical',
    status: 'pending',
    impact: 25
  },
  {
    id: '2',
    category: 'Featured Snippets',
    title: 'Optimize FAQ Content',
    description: 'Structure FAQ content for better voice response extraction',
    priority: 'important',
    status: 'in-progress',
    impact: 18
  },
  {
    id: '3',
    category: 'Schema Markup',
    title: 'Implement Local Business Schema',
    description: 'Add structured data for better voice assistant understanding',
    priority: 'important',
    status: 'completed',
    impact: 22
  },
  {
    id: '4',
    category: 'Conversational Keywords',
    title: 'Add Long-tail Question Keywords',
    description: 'Optimize content for natural language queries',
    priority: 'minor',
    status: 'pending',
    impact: 12
  }
];

export const VoiceSearch: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'queries' | 'optimization' | 'analytics'>('overview');
  const [selectedAssistant, setSelectedAssistant] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const overallScore = Math.round(mockAssistants.reduce((sum, assistant) => sum + assistant.score, 0) / mockAssistants.length);
  const totalQueries = mockQueries.reduce((sum, query) => sum + query.volume, 0);
  const avgAccuracy = Math.round(mockQueries.reduce((sum, query) => sum + query.accuracy, 0) / mockQueries.length);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    gradient: string;
    trend?: number;
    subtitle?: string;
  }> = ({ title, value, icon: Icon, gradient, trend, subtitle }) => (
    <Card hover glow className="group">
      <div className="flex items-center justify-between">
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
        <div className={`p-4 rounded-full bg-gradient-to-r ${gradient}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </Card>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimized':
        return 'text-green-600';
      case 'ready':
        return 'text-yellow-600';
      case 'needs-attention':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimized':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'ready':
        return <Clock size={16} className="text-yellow-600" />;
      case 'needs-attention':
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'optimized':
        return 'Voice Optimized';
      case 'ready':
        return 'Ready to Integrate';
      case 'needs-attention':
        return 'Needs Attention';
      default:
        return 'Unknown';
    }
  };

  const AssistantCard: React.FC<{ assistant: VoiceAssistant }> = ({ assistant }) => (
    <Card hover className="group cursor-pointer" onClick={() => setSelectedAssistant(assistant.id)}>
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="text-4xl mr-3">{assistant.logo}</div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white">{assistant.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {getStatusIcon(assistant.status)}
              <span className={`text-sm ${getStatusColor(assistant.status)}`}>
                {getStatusLabel(assistant.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{assistant.score}</span>
            <span className="text-lg text-gray-600 dark:text-gray-400">/100</span>
            <div className={`flex items-center gap-1 text-sm ${assistant.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {assistant.trend > 0 ? <ArrowUp size={12} /> : assistant.trend < 0 ? <ArrowDown size={12} /> : <Minus size={12} />}
              <span>{Math.abs(assistant.trend)}%</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] h-2 rounded-full transition-all duration-300"
              style={{ width: `${assistant.score}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{assistant.metrics.queriesAnswered}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Queries</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{assistant.metrics.responseAccuracy}%</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Accuracy</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{assistant.metrics.featuredSnippets}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Snippets</p>
          </div>
        </div>

        <Button 
          variant={assistant.status === 'optimized' ? 'secondary' : 'primary'} 
          size="sm" 
          className="w-full mt-4"
        >
          {assistant.status === 'optimized' ? 'Test Voice Response' : 'Optimize Platform'}
        </Button>
      </div>
    </Card>
  );

  const QueryRow: React.FC<{ query: VoiceQuery }> = ({ query }) => (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">{query.query}</td>
      <td className="px-4 py-3 text-center">
        <span className="text-sm font-medium text-gray-900 dark:text-white">{query.volume.toLocaleString()}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <Badge 
          variant={query.intent === 'transactional' ? 'error' : query.intent === 'navigational' ? 'warning' : 'info'} 
          size="sm"
        >
          {query.intent}
        </Badge>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-sm font-medium text-gray-900 dark:text-white">{query.accuracy}%</span>
      </td>
      <td className="px-4 py-3 text-center">
        <div className={`flex items-center justify-center gap-1 ${query.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {query.trend > 0 ? <ArrowUp size={14} /> : query.trend < 0 ? <ArrowDown size={14} /> : <Minus size={14} />}
          <span className="text-sm font-medium">{Math.abs(query.trend)}%</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          {query.assistants.map(assistantId => {
            const assistant = mockAssistants.find(a => a.id === assistantId);
            return assistant ? (
              <span key={assistantId} className="text-lg" title={assistant.name}>
                {assistant.logo}
              </span>
            ) : null;
          })}
        </div>
      </td>
    </tr>
  );

  const OptimizationCard: React.FC<{ item: OptimizationItem }> = ({ item }) => (
    <Card hover className="group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-gray-900 dark:text-white">{item.title}</h4>
            <Badge 
              variant={item.priority === 'critical' ? 'error' : item.priority === 'important' ? 'warning' : 'info'} 
              size="sm"
            >
              {item.priority}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.description}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
            <span>Category: {item.category}</span>
            <span>Impact: +{item.impact}% accuracy</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={item.status === 'completed' ? 'success' : item.status === 'in-progress' ? 'warning' : 'info'} 
            size="sm"
          >
            {item.status.replace('-', ' ')}
          </Badge>
        </div>
      </div>
      {item.status === 'pending' && (
        <Button variant="primary" size="sm" className="w-full">
          Start Optimization
        </Button>
      )}
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Voice Search Optimization
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and optimize for voice assistant discovery
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
          </select>
          <Button variant="secondary">
            <Download size={16} />
            Voice Report
          </Button>
          <Button>
            <Zap size={16} />
            Run Voice Audit
          </Button>
        </div>
      </div>

      {/* Overall Voice Score */}
      <Card glow className="text-center py-8 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 dark:from-gray-900 dark:via-purple-900/10 dark:to-blue-900/10">
        <div className="inline-flex p-6 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full mb-4">
          <Mic size={32} className="text-white" />
        </div>
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{overallScore}</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">Overall Voice Optimization Score</p>
        <div className="flex items-center justify-center gap-2 text-lg text-green-600">
          <ArrowUp size={20} />
          <span>+8% from last period</span>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Voice Queries Detected"
          value={totalQueries.toLocaleString()}
          icon={Search}
          gradient="from-[#667eea] to-[#764ba2]"
          trend={12}
          subtitle="monthly"
        />
        <StatCard
          title="Assistant Coverage"
          value="4/4"
          icon={CheckCircle}
          gradient="from-[#11998e] to-[#38ef7d]"
          subtitle="platforms active"
        />
        <StatCard
          title="Response Accuracy"
          value={`${avgAccuracy}%`}
          icon={Target}
          gradient="from-[#f093fb] to-[#f5576c]"
          trend={5}
        />
        <StatCard
          title="Featured Snippets"
          value="45"
          icon={Sparkles}
          gradient="from-[#f45a4e] to-[#e53e3e]"
          trend={18}
          subtitle="voice-optimized"
        />
      </div>

      {/* Voice Assistant Status Dashboard */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Voice Assistant Platforms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockAssistants.map(assistant => (
            <AssistantCard key={assistant.id} assistant={assistant} />
          ))}
        </div>
      </div>

      {/* Tabbed Content */}
      <div>
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'queries', label: 'Voice Queries', icon: Search },
              { id: 'optimization', label: 'Optimization', icon: Settings },
              { id: 'analytics', label: 'Analytics', icon: Activity }
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
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Voice Analytics Chart */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Voice Query Trends</h3>
                <Button variant="ghost" size="sm">
                  <Eye size={16} />
                  View Details
                </Button>
              </div>
              <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Activity size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Voice query trend chart</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Showing query volume over time</p>
                </div>
              </div>
            </Card>

            {/* Platform Performance */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Platform Performance</h3>
                <Button variant="ghost" size="sm">
                  <PieChart size={16} />
                  Details
                </Button>
              </div>
              <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <PieChart size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Query distribution</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">across voice assistants</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'queries' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Voice Query Performance</h3>
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm">
                  <Filter size={16} />
                  Filter
                </Button>
                <Button size="sm">
                  <Plus size={16} />
                  Track New Query
                </Button>
              </div>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Query</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Volume</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Intent</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Accuracy</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Trend</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Assistants</th>
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

        {activeTab === 'optimization' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Optimization Checklist</h3>
              <Button size="sm">
                <Zap size={16} />
                Optimize All
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockOptimizations.map(item => (
                <OptimizationCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Response Accuracy</h3>
                <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Target size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Accuracy gauge chart</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Voice response accuracy metrics</p>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Optimization Impact</h3>
                <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Improvement areas</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Optimization opportunities</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};