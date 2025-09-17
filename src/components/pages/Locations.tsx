import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Globe, Star, MessageSquare, TrendingUp, Plus, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { dataService, type Location, type Profile } from '../../lib/dataService';
import { supabase } from '../../lib/supabase';

export const Locations: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeLocations();
  }, []);

  const initializeLocations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Initialize user profile
      const userProfile = await dataService.initializeUserData(user);
      if (!userProfile) {
        setError('Failed to initialize user profile');
        return;
      }
      setProfile(userProfile);

      // Get locations for user's organization
      const locationsData = await dataService.getLocations(userProfile.organization_id);
      setLocations(locationsData);

    } catch (err) {
      console.error('Locations initialization error:', err);
      setError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced': return CheckCircle;
      case 'pending': return Clock;
      case 'error': return AlertCircle;
      default: return AlertCircle;
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'synced': return 'success';
      case 'pending': return 'warning';
      case 'error': return 'error';
      default: return 'warning';
    }
  };

  const LocationCard: React.FC<{ location: Location }> = ({ location }) => {
    const StatusIcon = getStatusIcon(location.gbp_sync_status);
    const fullAddress = [location.address, location.city, location.state, location.postal_code]
      .filter(Boolean)
      .join(', ');

    return (
      <Card hover className="group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{location.name}</h3>
              <div className="flex items-center gap-1">
                <StatusIcon size={16} className={`${
                  location.gbp_sync_status === 'synced' ? 'text-green-500' :
                  location.gbp_sync_status === 'pending' ? 'text-yellow-500' : 'text-red-500'
                }`} />
                <Badge 
                  variant={getStatusVariant(location.gbp_sync_status)}
                  size="sm"
                >
                  {location.gbp_sync_status}
                </Badge>
              </div>
            </div>
            {location.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{location.description}</p>
            )}
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {fullAddress && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  <span>{fullAddress}</span>
                </div>
              )}
              {location.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  <span>{location.phone}</span>
                </div>
              )}
              {location.website && (
                <div className="flex items-center gap-2">
                  <Globe size={14} />
                  <a 
                    href={location.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#f45a4e] hover:underline"
                  >
                    {location.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {location.primary_category && (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 bg-gray-400 rounded-sm flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                  <span>{location.primary_category}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star size={14} className="text-yellow-500 fill-current" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {location.rating ? location.rating.toFixed(1) : 'N/A'}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Rating</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MessageSquare size={14} className="text-blue-500" />
              <span className="font-semibold text-gray-900 dark:text-white">{location.review_count}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Reviews</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp size={14} className="text-green-500" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {location.gbp_sync_status === 'synced' ? 'Good' : 'Pending'}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Status</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="primary" size="sm" className="flex-1">
            Manage
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            disabled={location.gbp_sync_status === 'synced'}
          >
            <RefreshCw size={14} className="mr-1" />
            {location.gbp_sync_status === 'synced' ? 'Synced' : 'Sync GBP'}
          </Button>
        </div>
      </Card>
    );
  };

  const SummaryCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    gradient: string;
    loading?: boolean;
  }> = ({ title, value, icon: Icon, gradient, loading = false }) => (
    <Card hover>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${gradient}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Locations
            </h1>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-64 mt-2"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Locations</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={initializeLocations}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <div className="inline-flex p-6 bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] rounded-full mb-4">
              <MapPin size={32} className="text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No Locations Yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Start by adding your first business location to begin managing your Google Business Profile.
          </p>
          <Button icon={Plus} size="lg">
            Add Your First Location
          </Button>
        </div>
      </div>
    );
  }

  // Calculate summary statistics
  const totalReviews = locations.reduce((sum, loc) => sum + loc.review_count, 0);
  const averageRating = locations.reduce((sum, loc) => sum + (loc.rating || 0), 0) / locations.length;
  const syncedLocations = locations.filter(loc => loc.gbp_sync_status === 'synced').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Locations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all your business locations in one place
          </p>
        </div>
        <Button icon={Plus}>
          Add Location
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <SummaryCard
          title="Total Locations"
          value={locations.length}
          icon={MapPin}
          gradient="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
        />
        <SummaryCard
          title="Average Rating"
          value={averageRating.toFixed(1)}
          icon={Star}
          gradient="bg-gradient-to-r from-[#f093fb] to-[#f5576c]"
        />
        <SummaryCard
          title="Total Reviews"
          value={totalReviews.toLocaleString()}
          icon={MessageSquare}
          gradient="bg-gradient-to-r from-[#11998e] to-[#38ef7d]"
        />
        <SummaryCard
          title="Synced Locations"
          value={syncedLocations}
          icon={CheckCircle}
          gradient="bg-gradient-to-r from-[#f45a4e] to-[#e53e3e]"
        />
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {locations.map((location) => (
          <LocationCard key={location.id} location={location} />
        ))}
      </div>
    </div>
  );
};
