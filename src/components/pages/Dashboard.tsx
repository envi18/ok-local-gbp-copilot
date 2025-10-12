// src/components/pages/Dashboard.tsx
// Dashboard without developer mode testing section

import { BarChart3, Eye, FileText, MapPin, MessageSquare, Plus, Star, TrendingUp } from 'lucide-react';
import React from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

// Mock data
const mockStats = {
  totalLocations: 12,
  averageRating: 4.8,
  totalReviews: 1247,
  recentReviews: 47,
  publishedPosts: 89,
  totalViews: 12500,
  syncedLocations: 11
};

const mockAlerts = [
  {
    id: '1',
    title: 'New Negative Review',
    message: 'Downtown Location received a 2-star review',
    severity: 'warning' as const,
    timestamp: '2 hours ago',
    read: false
  },
  {
    id: '2',
    title: 'Ranking Drop Alert',
    message: 'Main Street location dropped 3 positions for "pizza near me"',
    severity: 'error' as const,
    timestamp: '5 hours ago',
    read: false
  },
  {
    id: '3',
    title: 'Profile Updated',
    message: 'Business hours updated for Oak Avenue location',
    severity: 'success' as const,
    timestamp: '1 day ago',
    read: true
  }
];

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: any;
  trend: string;
  gradient: string;
}> = ({ title, value, icon: Icon, trend, gradient }) => (
  <Card hover={true} className="overflow-hidden">
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${gradient}`}>
          <Icon size={24} className="text-white" />
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{trend}</p>
    </div>
  </Card>
);

const AlertCard: React.FC<{ alert: typeof mockAlerts[0] }> = ({ alert }) => (
  <div className={`p-4 rounded-lg border transition-all ${
    !alert.read 
      ? 'bg-white dark:bg-gray-800 border-white/20 dark:border-white/10 shadow-md' 
      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
  }`}>
    <div className="flex items-start gap-3">
      <Badge 
        variant={alert.severity} 
        size="sm" 
        className="mt-0.5"
        pulse={!alert.read}
      >
        {alert.severity}
      </Badge>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">{alert.title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{alert.message}</p>
        <p className="text-xs text-gray-500 dark:text-gray-500">{alert.timestamp}</p>
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening with your locations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              {mockStats.syncedLocations} of {mockStats.totalLocations} Synced
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Locations"
          value={mockStats.totalLocations}
          icon={MapPin}
          trend="Active locations"
          gradient="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
        />
        <StatCard
          title="Average Rating"
          value={mockStats.averageRating}
          icon={Star}
          trend="Across all locations"
          gradient="bg-gradient-to-r from-[#f093fb] to-[#f5576c]"
        />
        <StatCard
          title="Total Reviews"
          value={mockStats.totalReviews.toLocaleString()}
          icon={MessageSquare}
          trend={`${mockStats.recentReviews} this week`}
          gradient="bg-gradient-to-r from-[#11998e] to-[#38ef7d]"
        />
        <StatCard
          title="Published Posts"
          value={mockStats.publishedPosts}
          icon={FileText}
          trend={`${mockStats.totalViews.toLocaleString()} total views`}
          gradient="bg-gradient-to-r from-[#f45a4e] to-[#e53e3e]"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Performance Chart Placeholder */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Performance Overview</h2>
              <Button variant="secondary" size="sm">
                <Eye size={16} />
                <span className="hidden sm:inline ml-2">View Details</span>
              </Button>
            </div>
            <div className="h-48 sm:h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Performance charts coming soon</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Advanced analytics in development</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Alerts */}
        <div>
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Alerts</h2>
              <Badge variant="error" size="sm">{mockAlerts.filter(a => !a.read).length}</Badge>
            </div>
            <div className="space-y-3">
              {mockAlerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-4">
              View All Alerts
            </Button>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="primary" className="w-full">
            <Plus size={16} />
            <span className="ml-2">New Post</span>
          </Button>
          <Button variant="secondary" className="w-full">
            <MessageSquare size={16} />
            <span className="ml-2">Respond to Reviews</span>
          </Button>
          <Button variant="secondary" className="w-full">
            <TrendingUp size={16} />
            <span className="ml-2">Check Rankings</span>
          </Button>
          <Button variant="secondary" className="w-full">
            <MapPin size={16} />
            <span className="ml-2">Manage Locations</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};