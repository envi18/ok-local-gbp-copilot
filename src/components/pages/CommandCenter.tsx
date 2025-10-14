// src/components/pages/CommandCenter.tsx
// Real-time admin monitoring and system health dashboard

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Database,
  DollarSign,
  Download,
  Server,
  TrendingDown,
  TrendingUp,
  Users,
  UserX,
  Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

// Types
interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  usersOnline: number;
  dormantUsers: number;
  atRiskUsers: number;
  newSignupsToday: number;
  newSignupsThisWeek: number;
}

interface BillingMetrics {
  totalRevenueMRR: number;
  todayCharges: number;
  todayDeclines: number;
  declineRate: number;
  successfulCharges: number;
  avgTransactionValue: number;
}

interface HealthScore {
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  factors: {
    userEngagement: number;
    billingHealth: number;
    systemPerformance: number;
    customerSatisfaction: number;
  };
}

interface ActivityItem {
  id: string;
  type: 'signup' | 'login' | 'export' | 'charge' | 'decline' | 'error';
  message: string;
  timestamp: Date;
  user?: string;
}

interface DeclineDataPoint {
  date: string;
  declines: number;
  total: number;
  rate: number;
}

export const CommandCenter: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    usersOnline: 0,
    dormantUsers: 0,
    atRiskUsers: 0,
    newSignupsToday: 0,
    newSignupsThisWeek: 0
  });

  const [billing, setBilling] = useState<BillingMetrics>({
    totalRevenueMRR: 0,
    todayCharges: 0,
    todayDeclines: 0,
    declineRate: 0,
    successfulCharges: 0,
    avgTransactionValue: 0
  });

  const [healthScore, setHealthScore] = useState<HealthScore>({
    score: 0,
    status: 'good',
    factors: {
      userEngagement: 0,
      billingHealth: 0,
      systemPerformance: 0,
      customerSatisfaction: 0
    }
  });

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [declineTrend, setDeclineTrend] = useState<DeclineDataPoint[]>([]);
  const [isLive, setIsLive] = useState(true);

  // Simulated real-time updates
  useEffect(() => {
    loadInitialData();
    
    const interval = setInterval(() => {
      if (isLive) {
        updateRealTimeData();
      }
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [isLive]);

  const loadInitialData = () => {
    // Mock initial data - replace with real API calls
    setMetrics({
      totalUsers: 247,
      activeUsers: 189,
      usersOnline: 12,
      dormantUsers: 34,
      atRiskUsers: 24,
      newSignupsToday: 5,
      newSignupsThisWeek: 28
    });

    setBilling({
      totalRevenueMRR: 48750,
      todayCharges: 24,
      todayDeclines: 3,
      declineRate: 11.1,
      successfulCharges: 21,
      avgTransactionValue: 197
    });

    setHealthScore({
      score: 87,
      status: 'good',
      factors: {
        userEngagement: 92,
        billingHealth: 88,
        systemPerformance: 95,
        customerSatisfaction: 85
      }
    });

    // Generate mock decline trend data for last 14 days
    const trend: DeclineDataPoint[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trend.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        declines: Math.floor(Math.random() * 8) + 2,
        total: Math.floor(Math.random() * 20) + 50,
        rate: Math.random() * 15 + 5
      });
    }
    setDeclineTrend(trend);

    setRecentActivity([
      { id: '1', type: 'signup', message: 'New signup: john@example.com', timestamp: new Date(), user: 'john@example.com' },
      { id: '2', type: 'charge', message: 'Successful charge: $197', timestamp: new Date(Date.now() - 120000), user: 'sarah@example.com' },
      { id: '3', type: 'export', message: 'CSV export: customers list', timestamp: new Date(Date.now() - 240000), user: 'admin@oklocal.com' },
      { id: '4', type: 'decline', message: 'Payment declined: $147', timestamp: new Date(Date.now() - 360000), user: 'mike@example.com' },
      { id: '5', type: 'login', message: 'User login: jane@company.com', timestamp: new Date(Date.now() - 480000), user: 'jane@company.com' }
    ]);
  };

  const updateRealTimeData = () => {
    // Simulate real-time updates
    setMetrics(prev => ({
      ...prev,
      usersOnline: prev.usersOnline + (Math.random() > 0.5 ? 1 : -1)
    }));

    // Randomly add new activity
    if (Math.random() > 0.7) {
      const activities: ActivityItem['type'][] = ['signup', 'login', 'export', 'charge', 'decline'];
      const type = activities[Math.floor(Math.random() * activities.length)];
      const newActivity: ActivityItem = {
        id: Date.now().toString(),
        type,
        message: `${type.charAt(0).toUpperCase() + type.slice(1)}: Real-time update`,
        timestamp: new Date(),
        user: 'user@example.com'
      };
      
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 9)]);
    }
  };

  const getHealthColor = () => {
    if (healthScore.score >= 90) return 'from-green-500 to-green-600';
    if (healthScore.score >= 75) return 'from-blue-500 to-blue-600';
    if (healthScore.score >= 60) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getHealthStatus = () => {
    if (healthScore.score >= 90) return { icon: CheckCircle, text: 'Excellent', color: 'text-green-600' };
    if (healthScore.score >= 75) return { icon: CheckCircle, text: 'Good', color: 'text-blue-600' };
    if (healthScore.score >= 60) return { icon: AlertTriangle, text: 'Warning', color: 'text-yellow-600' };
    return { icon: AlertCircle, text: 'Critical', color: 'text-red-600' };
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'signup': return <Users size={16} className="text-green-600" />;
      case 'login': return <CheckCircle size={16} className="text-blue-600" />;
      case 'export': return <Download size={16} className="text-purple-600" />;
      case 'charge': return <DollarSign size={16} className="text-green-600" />;
      case 'decline': return <CreditCard size={16} className="text-red-600" />;
      case 'error': return <AlertCircle size={16} className="text-red-600" />;
    }
  };

  const healthStatus = getHealthStatus();
  const HealthIcon = healthStatus.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
              <Zap className="text-white" size={24} />
            </div>
            Command Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time system monitoring and health metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isLive ? 'success' : 'info'} size="sm">
            <Activity size={12} className={isLive ? 'animate-pulse' : ''} />
            <span className="ml-1">{isLive ? 'LIVE' : 'PAUSED'}</span>
          </Badge>
          <button
            onClick={() => setIsLive(!isLive)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {isLive ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* System Health Score */}
      <Card hover={false}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">System Health</h2>
            <HealthIcon size={24} className={healthStatus.color} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Score Circle */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-48 h-48">
                <svg className="transform -rotate-90 w-48 h-48">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="url(#gradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(healthScore.score / 100) * 553} 553`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" className="text-green-500" stopColor="currentColor" />
                      <stop offset="100%" className="text-green-600" stopColor="currentColor" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">
                    {healthScore.score}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{healthStatus.text}</span>
                </div>
              </div>
            </div>

            {/* Health Factors */}
            <div className="space-y-4">
              {Object.entries(healthScore.factors).map(([key, value]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${getHealthColor()} transition-all duration-500`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card hover={false}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                <Users className="text-white" size={24} />
              </div>
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {metrics.totalUsers}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
            <div className="mt-2 text-xs text-green-600 dark:text-green-400">
              +{metrics.newSignupsThisWeek} this week
            </div>
          </div>
        </Card>

        {/* Users Online */}
        <Card hover={false}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                <Activity className="text-white animate-pulse" size={24} />
              </div>
              <Badge variant="success" size="sm">LIVE</Badge>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {metrics.usersOnline}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Online Now</div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
              {metrics.activeUsers} active users
            </div>
          </div>
        </Card>

        {/* At-Risk Users */}
        <Card hover={false}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
                <UserX className="text-white" size={24} />
              </div>
              <AlertTriangle size={20} className="text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {metrics.atRiskUsers}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">At-Risk Clients</div>
            <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
              {metrics.dormantUsers} dormant users
            </div>
          </div>
        </Card>

        {/* MRR */}
        <Card hover={false}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                <DollarSign className="text-white" size={24} />
              </div>
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              ${(billing.totalRevenueMRR / 1000).toFixed(1)}k
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue</div>
            <div className="mt-2 text-xs text-green-600 dark:text-green-400">
              +8.2% vs last month
            </div>
          </div>
        </Card>
      </div>

      {/* Billing & Declines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Billing */}
        <Card hover={false}>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard size={20} />
              Today's Billing Activity
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {billing.successfulCharges}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Successful</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {billing.todayDeclines}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Declined</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Decline Rate</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {billing.declineRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-red-500 to-red-600"
                  style={{ width: `${billing.declineRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Transaction</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  ${billing.avgTransactionValue}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Decline Trend Chart */}
        <Card hover={false}>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingDown size={20} />
              14-Day Decline Trend
            </h3>
            
            <div className="h-48 flex items-end justify-between gap-1">
              {declineTrend.map((point, index) => (
                <div key={index} className="flex-1 flex flex-col items-center group">
                  <div
                    className="w-full bg-gradient-to-t from-red-500 to-red-400 rounded-t hover:opacity-80 transition-opacity relative"
                    style={{ height: `${(point.rate / 20) * 100}%`, minHeight: '4px' }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {point.rate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 transform -rotate-45 origin-top-left">
                    {point.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Real-Time Activity Feed & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <Card hover={false} className="lg:col-span-2">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity size={20} className="animate-pulse text-green-600" />
              Real-Time Activity
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">{activity.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {activity.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* System Status */}
        <Card hover={false}>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Server size={20} />
              System Status
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-green-600" />
                  <span className="text-sm text-gray-900 dark:text-white">Database</span>
                </div>
                <Badge variant="success" size="sm">Online</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Server size={16} className="text-green-600" />
                  <span className="text-sm text-gray-900 dark:text-white">API</span>
                </div>
                <Badge variant="success" size="sm">Online</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-green-600" />
                  <span className="text-sm text-gray-900 dark:text-white">Functions</span>
                </div>
                <Badge variant="success" size="sm">Online</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-blue-600" />
                  <span className="text-sm text-gray-900 dark:text-white">Response Time</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">24ms</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-purple-600" />
                  <span className="text-sm text-gray-900 dark:text-white">Uptime</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">99.98%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};