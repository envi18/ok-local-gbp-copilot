import { AlertTriangle, Bell, CheckCircle, Clock, MapPin, Search, X } from 'lucide-react';
import React, { useState } from 'react';
import { Alert } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

const mockAlerts: Alert[] = [
  {
    id: '1',
    title: 'New Negative Review',
    message: 'Downtown Location received a 2-star review from Sarah M.: "Service was slow and food was cold. Very disappointed with the experience."',
    severity: 'error',
    timestamp: '2 hours ago',
    read: false
  },
  {
    id: '2',
    title: 'Ranking Drop Alert',
    message: 'Main Street location dropped 3 positions for "pizza near me" keyword. Now ranking #6 (was #3).',
    severity: 'warning',
    timestamp: '5 hours ago',
    read: false
  },
  {
    id: '3',
    title: 'Profile Updated Successfully',
    message: 'Business hours updated for Oak Avenue location. Changes are now live on Google Business Profile.',
    severity: 'success',
    timestamp: '1 day ago',
    read: true
  },
  {
    id: '4',
    title: 'Review Response Needed',
    message: 'Downtown Location has 3 unresponded reviews from the past week. Response rate is now 87%.',
    severity: 'warning',
    timestamp: '1 day ago',
    read: false
  },
  {
    id: '5',
    title: 'New 5-Star Review',
    message: 'Oak Avenue Bistro received a 5-star review from Mike D.: "Absolutely fantastic! Best dining experience in the area."',
    severity: 'success',
    timestamp: '2 days ago',
    read: true
  },
  {
    id: '6',
    title: 'Photo Sync Failed',
    message: 'Failed to sync 3 photos to Main Street Pizza location. Please check your Google Business Profile connection.',
    severity: 'error',
    timestamp: '3 days ago',
    read: true
  },
  {
    id: '7',
    title: 'Competitor Analysis Update',
    message: 'Weekly competitor analysis complete. 2 new competitors detected in your area with higher ratings.',
    severity: 'info',
    timestamp: '3 days ago',
    read: true
  },
  {
    id: '8',
    title: 'Automation Completed',
    message: 'Weekly post automation completed successfully. 12 posts published across all locations.',
    severity: 'success',
    timestamp: '1 week ago',
    read: true
  }
];

export const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [filter, setFilter] = useState<'all' | 'unread' | 'error' | 'warning' | 'success' | 'info'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !alert.read) || 
      alert.severity === filter;
    
    const matchesSearch = searchTerm === '' || 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const unreadCount = alerts.filter(alert => !alert.read).length;

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

  const AlertItem: React.FC<{ alert: Alert }> = ({ alert }) => {
    const getSeverityIcon = () => {
      switch (alert.severity) {
        case 'error':
          return <AlertTriangle size={20} className="text-red-500" />;
        case 'warning':
          return <AlertTriangle size={20} className="text-yellow-500" />;
        case 'success':
          return <CheckCircle size={20} className="text-green-500" />;
        default:
          return <Bell size={20} className="text-blue-500" />;
      }
    };

    const getLocationIcon = () => {
      if (alert.message.includes('Downtown')) return <MapPin size={14} className="text-gray-500" />;
      if (alert.message.includes('Main Street')) return <MapPin size={14} className="text-gray-500" />;
      if (alert.message.includes('Oak Avenue')) return <MapPin size={14} className="text-gray-500" />;
      return null;
    };

    return (
      <Card hover={false} className={`transition-all duration-200 ${
        alert.read 
          ? 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-200/50 dark:border-gray-700/50' 
          : 'bg-white dark:bg-gray-800 border-white/20 dark:border-white/10 shadow-md'
      }`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            {getSeverityIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-semibold text-sm ${
                    alert.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'
                  }`}>
                    {alert.title}
                  </h4>
                  {getLocationIcon()}
                  <Badge 
                    variant={alert.severity} 
                    size="sm" 
                    pulse={!alert.read}
                  >
                    {alert.severity}
                  </Badge>
                </div>
                
                <p className={`text-sm mb-3 ${
                  alert.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {alert.message}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                  <Clock size={12} />
                  <span>{alert.timestamp}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!alert.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsRead(alert.id)}
                    className="text-xs"
                  >
                    Mark Read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissAlert(alert.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Alerts
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor important notifications and system alerts across all locations
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button variant="secondary" onClick={markAllAsRead}>
              Mark All Read ({unreadCount})
            </Button>
          )}
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Monitoring Active
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Alerts"
          value={alerts.length}
          icon={Bell}
          gradient="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
        />
        <StatCard
          title="Unread Alerts"
          value={unreadCount}
          icon={AlertTriangle}
          gradient="bg-gradient-to-r from-[#f45a4e] to-[#e53e3e]"
        />
        <StatCard
          title="Critical Issues"
          value={alerts.filter(a => a.severity === 'error').length}
          icon={AlertTriangle}
          gradient="bg-gradient-to-r from-[#f093fb] to-[#f5576c]"
        />
        <StatCard
          title="Success Notifications"
          value={alerts.filter(a => a.severity === 'success').length}
          icon={CheckCircle}
          gradient="bg-gradient-to-r from-[#11998e] to-[#38ef7d]"
        />
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'unread', 'error', 'warning', 'success', 'info'] as const).map((filterType) => (
              <Button
                key={filterType}
                variant={filter === filterType ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter(filterType)}
                className="capitalize"
              >
                {filterType === 'all' ? 'All Alerts' : filterType}
                {filterType === 'unread' && unreadCount > 0 && (
                  <Badge variant="error" size="sm" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
          
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full lg:w-64 pl-10 pr-4 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
            />
          </div>
        </div>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="inline-flex p-6 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full mb-6">
                <Bell size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {searchTerm ? 'No Matching Alerts' : 'No Alerts Found'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm 
                  ? `No alerts match your search for "${searchTerm}"`
                  : filter === 'unread' 
                    ? 'All alerts have been read. Great job staying on top of things!'
                    : 'No alerts match the selected filter.'
                }
              </p>
            </div>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} />
          ))
        )}
      </div>
    </div>
  );
};