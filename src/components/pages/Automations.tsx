import React, { useState } from 'react';
import { Zap, Play, Pause, Settings, Clock, CheckCircle, AlertCircle, Calendar, MessageSquare, Image, Star } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface Automation {
  id: string;
  name: string;
  description: string;
  type: 'review_response' | 'post_scheduling' | 'photo_sync' | 'ranking_monitor';
  status: 'active' | 'paused' | 'error';
  lastRun: string;
  nextRun: string;
  successRate: number;
  locationsCount: number;
}

const mockAutomations: Automation[] = [
  {
    id: '1',
    name: 'Auto Review Responses',
    description: 'Automatically respond to 5-star reviews with personalized thank you messages',
    type: 'review_response',
    status: 'active',
    lastRun: '2 hours ago',
    nextRun: 'Continuous',
    successRate: 98,
    locationsCount: 12
  },
  {
    id: '2',
    name: 'Weekly Post Scheduler',
    description: 'Publish promotional posts every Tuesday and Friday across all locations',
    type: 'post_scheduling',
    status: 'active',
    lastRun: '3 days ago',
    nextRun: 'Tomorrow at 9:00 AM',
    successRate: 95,
    locationsCount: 12
  },
  {
    id: '3',
    name: 'Photo Sync Manager',
    description: 'Sync new photos from your media library to Google Business Profiles',
    type: 'photo_sync',
    status: 'paused',
    lastRun: '1 week ago',
    nextRun: 'Paused',
    successRate: 87,
    locationsCount: 8
  },
  {
    id: '4',
    name: 'Ranking Monitor',
    description: 'Track keyword rankings daily and send alerts for significant changes',
    type: 'ranking_monitor',
    status: 'active',
    lastRun: '6 hours ago',
    nextRun: 'Daily at 6:00 AM',
    successRate: 100,
    locationsCount: 12
  },
  {
    id: '5',
    name: 'Negative Review Alerts',
    description: 'Instantly notify team when reviews below 3 stars are received',
    type: 'review_response',
    status: 'error',
    lastRun: '1 day ago',
    nextRun: 'Error - needs attention',
    successRate: 92,
    locationsCount: 12
  }
];

export const Automations: React.FC = () => {
  const [automations, setAutomations] = useState(mockAutomations);

  const toggleAutomation = (id: string) => {
    setAutomations(prev => prev.map(automation => 
      automation.id === id 
        ? { 
            ...automation, 
            status: automation.status === 'active' ? 'paused' : 'active' 
          }
        : automation
    ));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'review_response':
        return MessageSquare;
      case 'post_scheduling':
        return Calendar;
      case 'photo_sync':
        return Image;
      case 'ranking_monitor':
        return Star;
      default:
        return Zap;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    gradient: string;
  }> = ({ title, value, icon: Icon, gradient }) => (
    <Card hover>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${gradient}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </Card>
  );

  const AutomationCard: React.FC<{ automation: Automation }> = ({ automation }) => {
    const TypeIcon = getTypeIcon(automation.type);
    
    return (
      <Card hover className="group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg">
              <TypeIcon size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {automation.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {automation.description}
              </p>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={getStatusColor(automation.status) as any}
                  size="sm"
                  pulse={automation.status === 'error'}
                >
                  {automation.status}
                </Badge>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {automation.locationsCount} locations
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleAutomation(automation.id)}
              className={automation.status === 'active' ? 'text-orange-600' : 'text-green-600'}
            >
              {automation.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            <Button variant="ghost" size="sm">
              <Settings size={16} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock size={14} className="text-blue-500" />
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                {automation.successRate}%
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Success Rate</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle size={14} className="text-green-500" />
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                {automation.lastRun}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Last Run</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar size={14} className="text-purple-500" />
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                {automation.nextRun.length > 15 ? 'Soon' : automation.nextRun}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Next Run</p>
          </div>
        </div>

        {automation.status === 'error' && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">Action Required</span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              This automation encountered an error and needs your attention.
            </p>
          </div>
        )}
      </Card>
    );
  };

  const activeCount = automations.filter(a => a.status === 'active').length;
  const errorCount = automations.filter(a => a.status === 'error').length;
  const avgSuccessRate = Math.round(automations.reduce((sum, a) => sum + a.successRate, 0) / automations.length);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Automations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Streamline your workflow with intelligent automation rules
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary">
            <Settings size={16} />
            Automation Settings
          </Button>
          <Button>
            <Zap size={16} />
            Create Automation
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Active Automations"
          value={activeCount}
          icon={Zap}
          gradient="bg-gradient-to-r from-[#11998e] to-[#38ef7d]"
        />
        <StatCard
          title="Total Automations"
          value={automations.length}
          icon={Settings}
          gradient="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
        />
        <StatCard
          title="Success Rate"
          value={`${avgSuccessRate}%`}
          icon={CheckCircle}
          gradient="bg-gradient-to-r from-[#f093fb] to-[#f5576c]"
        />
        <StatCard
          title="Needs Attention"
          value={errorCount}
          icon={AlertCircle}
          gradient="bg-gradient-to-r from-[#f45a4e] to-[#e53e3e]"
        />
      </div>

      {/* Automations Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {automations.map((automation) => (
          <AutomationCard key={automation.id} automation={automation} />
        ))}
      </div>

      {/* Quick Setup */}
      <Card>
        <div className="text-center py-8">
          <div className="inline-flex p-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full mb-4">
            <Zap size={24} className="text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Ready to Automate More?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Set up additional automations to save time and ensure consistent management across all your locations.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="secondary" size="sm">
              <MessageSquare size={16} />
              Review Automation
            </Button>
            <Button variant="secondary" size="sm">
              <Calendar size={16} />
              Post Scheduler
            </Button>
            <Button variant="secondary" size="sm">
              <Image size={16} />
              Photo Sync
            </Button>
            <Button variant="secondary" size="sm">
              <Star size={16} />
              Ranking Alerts
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};