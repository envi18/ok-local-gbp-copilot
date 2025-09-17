import React, { useState, useEffect } from 'react';
import { TrendingUp, Star, MapPin, BarChart3, Plus, MessageSquare, FileText, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { dataService, type Profile, type Location, type Review } from '../../lib/dataService';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalLocations: number;
  averageRating: number;
  totalReviews: number;
  recentReviews: number;
  publishedPosts: number;
  totalViews: number;
  syncedLocations: number;
  pendingSync: number;
}

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'success' | 'warning' | 'error' | 'info';
  timestamp: string;
  read: boolean;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Initialize user profile and get organization data
      const userProfile = await dataService.initializeUserData(user);
      if (!userProfile) {
        setError('Failed to initialize user profile');
        return;
      }
      setProfile(userProfile);

      // Get organization data
      const organization = await dataService.getOrganization(userProfile.organization_id);
      if (!organization) {
        setError('Organization not found');
        return;
      }

      // Get locations and other data
      const [locationsData, statsData] = await Promise.all([
        dataService.getLocations(userProfile.organization_id),
        dataService.getDashboardStats(userProfile.organization_id)
      ]);

      setLocations(locationsData);
      setStats(statsData);

      // Generate alerts based on real data
      const generatedAlerts = await generateAlerts(locationsData);
      setAlerts(generatedAlerts);

    } catch (err) {
      console.error('Dashboard initialization error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = async (locations: Location[]): Promise<Alert[]> => {
    const alerts: Alert[] = [];

    // Check for sync status alerts
    const pendingLocations = locations.filter(loc => loc.gbp_sync_status === 'pending');
    if (pendingLocations.length > 0) {
      alerts.push({
        id: 'sync-pending',
        title: 'Sync Pending',
        message: `${pendingLocations.length} location${pendingLocations.length > 1 ? 's' : ''} pending Google Business Profile sync`,
        severity: 'warning',
        timestamp: '2 hours ago',
        read: false
      });
    }

    // Check for low ratings
    const lowRatedLocations = locations.filter(loc => loc.rating && loc.rating < 4.0);
    if (lowRatedLocations.length > 0) {
      alerts.push({
        id: 'low-rating',
        title: 'Rating Alert',
        message: `${lowRatedLocations[0].name} has a rating below 4.0 stars`,
        severity: 'error',
        timestamp: '5 hours ago',
        read: false
      });
    }

    // Get recent reviews for alert generation
    const reviews = await dataService.getReviews();
    const recentNegativeReviews = reviews.filter(review => 
      review.rating <= 3 && 
      new Date(review.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
    );

    if (recentNegativeReviews.length > 0) {
      const review = recentNegativeReviews[0];
      const location = locations.find(loc => loc.id === review.location_id);
      alerts.push({
        id: 'negative-review',
        title: 'New Negative Review',
        message: `${location?.name || 'A location'} received a ${review.rating}-star review from ${review.author_name}`,
        severity: 'warning',
        timestamp: '3 hours ago',
        read: false
      });
    }

    // Success alert for good performance
    const highRatedLocations = locations.filter(loc => loc.rating && loc.rating >= 4.7);
    if (highRatedLocations.length > 0) {
      alerts.push({
        id: 'high-rating',
        title: 'Excellent Performance',
        message: `${highRatedLocations.length} location${highRatedLocations.length > 1 ? 's have' : ' has'} ratings above 4.7 stars`,
        severity: 'success',
        timestamp: '1 day ago',
        read: true
      });
    }

    return alerts;
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: string;
    gradient: string;
    loading?: boolean;
  }> = ({ title, value, icon: Icon, trend, gradient, loading = false }) => (
    <Card hover glow className="group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          )}
          {trend && !loading && (
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp size={14} />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-4 rounded-full ${gradient} transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </Card>
  );

  const QuickActionCard: React.FC<{
    title: string;
    description: string;
    icon: React.ElementType;
    gradient: string;
  }> = ({ title, description, icon: Icon, gradient }) => (
    <Card hover className="group cursor-pointer">
      <div className="text-center">
        <div className={`inline-flex p-4 rounded-full ${gradient} mb-4 transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={24} className="text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </Card>
  );

  const AlertItem: React.FC<{ alert: Alert }> = ({ alert }) => {
    const getAlertIcon = () => {
      switch (alert.severity) {
        case 'error': return AlertCircle;
        case 'warning': return Clock;
        case 'success': return CheckCircle;
        default: return AlertCircle;
      }
    };

    const AlertIcon = getAlertIcon();

    return (
      <div className={`p-4 rounded-lg border transition-all duration-200 hover:scale-[1.01] ${
        alert.read 
          ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' 
          : 'bg-white dark:bg-gray-800 border-white/20 dark:border-white/10 shadow-md'
      }`}>
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2">
            <AlertIcon size={16} className={`mt-0.5 ${
              alert.severity === 'error' ? 'text-red-500' :
              alert.severity === 'warning' ? 'text-yellow-500' :
              alert.severity === 'success' ? 'text-green-500' : 'text-blue-500'
            }`} />
            <Badge 
              variant={alert.severity} 
              size="sm" 
              pulse={!alert.read}
            >
              {alert.severity}
            </Badge>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">{alert.title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{alert.message}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">{alert.timestamp}</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-64 mt-2"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <Card>
          <div className="text-center py-8">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Dashboard Error</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={initializeDashboard}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back{profile?.first_name ? `, ${profile.first_name}` : ''}! Here's what's happening with your locations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              {stats?.syncedLocations || 0} of {stats?.totalLocations || 0} Synced
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Locations"
          value={stats?.totalLocations || 0}
          icon={MapPin}
          trend="Active locations"
          gradient="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
        />
        <StatCard
          title="Average Rating"
          value={stats?.averageRating || '0.0'}
          icon={Star}
          trend="Across all locations"
          gradient="bg-gradient-to-r from-[#f093fb] to-[#f5576c]"
        />
        <StatCard
          title="Total Reviews"
          value={stats?.totalReviews.toLocaleString() || '0'}
          icon={MessageSquare}
          trend={`${stats?.recentReviews || 0} this week`}
          gradient="bg-gradient-to-r from-[#11998e] to-[#38ef7d]"
        />
        <StatCard
          title="Published Posts"
          value={stats?.publishedPosts || 0}
          icon={FileText}
          trend={`${stats?.totalViews || 0} total views`}
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
            
            {/* Real location performance preview */}
            <div className="space-y-4 mb-6">
              {locations.slice(0, 3).map((location) => (
                <div key={location.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{location.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{location.city}, {location.state}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-500" />
                      <span className="font-medium text-gray-900 dark:text-white">{location.rating}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">({location.review_count})</span>
                    </div>
                    <Badge 
                      variant={location.gbp_sync_status === 'synced' ? 'success' : 'warning'} 
                      size="sm"
                    >
                      {location.gbp_sync_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Advanced charts coming soon</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Alerts */}
        <div>
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Alerts</h2>
              <Badge variant="error" size="sm">
                {alerts.filter(a => !a.read).length} New
              </Badge>
            </div>
            <div className="space-y-4">
              {alerts.length > 0 ? (
                alerts.slice(0, 3).map((alert) => (
                  <AlertItem key={alert.id} alert={alert} />
                ))
              ) : (
                <div className="text-center py-4">
                  <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">No alerts at this time</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <QuickActionCard
            title="Add Location"
            description="Connect a new business location to your dashboard"
            icon={Plus}
            gradient="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
          />
          <QuickActionCard
            title="Create Post"
            description="Schedule a new post across your locations"
            icon={FileText}
            gradient="bg-gradient-to-r from-[#11998e] to-[#38ef7d]"
          />
          <QuickActionCard
            title="Review Inbox"
            description="Respond to recent customer reviews"
            icon={MessageSquare}
            gradient="bg-gradient-to-r from-[#f093fb] to-[#f5576c]"
          />
          <QuickActionCard
            title="View Reports"
            description="Access detailed performance analytics"
            icon={BarChart3}
            gradient="bg-gradient-to-r from-[#f45a4e] to-[#e53e3e]"
          />
        </div>
      </div>
    </div>
  );
};
