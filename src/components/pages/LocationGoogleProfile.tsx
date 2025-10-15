// src/components/pages/LocationGoogleProfile.tsx
// Interactive Mock Google Business Profile interface

import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  Globe,
  MapPin,
  Phone,
  RefreshCw,
  Star,
  TrendingUp,
  Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getMockApiDelay, shouldUseMockData } from '../../config/featureFlags';
import type { BusinessLocation } from '../../lib/googleBusinessProfileService';
import { mockGoogleBusinessData } from '../../lib/mockGoogleBusinessData';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface LocationGoogleProfileProps {
  locationId?: string; // From route params
}

export const LocationGoogleProfile: React.FC<LocationGoogleProfileProps> = ({ 
  locationId = 'location-001' 
}) => {
  const [location, setLocation] = useState<BusinessLocation | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Load location data on mount
  useEffect(() => {
    loadLocationData();
  }, [locationId]);

  const loadLocationData = async () => {
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get mock location data
    const allLocations = mockGoogleBusinessData.locations;
    const foundLocation = allLocations.find(loc => 
      loc.name.includes(locationId)
    ) || allLocations[0];
    
    setLocation(foundLocation);
    setLoading(false);
  };

  // Handle sync button click
  const handleSync = async () => {
    setSyncing(true);
    setSyncSuccess(false);
    
    // Simulate sync operation
    const delay = getMockApiDelay();
    await new Promise(resolve => setTimeout(resolve, delay + 1000));
    
    // Update last sync time
    setLastSync(new Date());
    setSyncSuccess(true);
    setSyncing(false);
    
    // Clear success message after 3 seconds
    setTimeout(() => setSyncSuccess(false), 3000);
  };

  // Format time ago
  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!location) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Location not found</p>
        </div>
      </div>
    );
  }

  const isMockData = shouldUseMockData();

  return (
    <div className="space-y-6">
      {/* Connection Status Banner */}
      <Card className="border-l-4 border-green-500">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Connected to Google Business Profile
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {location.locationName}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Last synced: {formatTimeAgo(lastSync)}
                </span>
                {isMockData && (
                  <Badge variant="info" size="sm">
                    Mock Data
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Button
            variant="primary"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            icon={RefreshCw}
            className={syncing ? 'animate-pulse' : ''}
          >
            <RefreshCw 
              size={16} 
              className={`mr-2 ${syncing ? 'animate-spin' : ''}`} 
            />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>

        {/* Success Message */}
        {syncSuccess && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-800 dark:text-green-300">
                Successfully synced with Google Business Profile!
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Location Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Information */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Business Information
            </h3>
            <Badge variant="success" size="sm">
              Verified
            </Badge>
          </div>

          <div className="space-y-4">
            {/* Address */}
            <div className="flex items-start space-x-3">
              <MapPin size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Address</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {location.address.addressLines.join(', ')}<br />
                  {location.address.locality}, {location.address.administrativeArea} {location.address.postalCode}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start space-x-3">
              <Phone size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Phone</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {location.primaryPhone}
                </p>
              </div>
            </div>

            {/* Website */}
            <div className="flex items-start space-x-3">
              <Globe size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Website</p>
                <a 
                  href={location.websiteUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#f45a4e] hover:text-[#e53e3e] flex items-center space-x-1"
                >
                  <span>{location.websiteUri}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Category */}
            <div className="flex items-start space-x-3">
              <Zap size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Category</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {location.primaryCategory.displayName}
                </p>
                {location.additionalCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {location.additionalCategories.map((cat, idx) => (
                      <Badge key={idx} variant="info" size="sm">
                        {cat.displayName}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Business Hours */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Business Hours
            </h3>
            <Clock size={18} className="text-gray-400" />
          </div>

          <div className="space-y-2">
            {location.regularHours.periods.map((period, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {period.openDay}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {period.openTime} - {period.closeTime}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <Star size={32} className="mx-auto text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">4.7</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Average Rating</p>
        </Card>

        <Card className="text-center">
          <TrendingUp size={32} className="mx-auto text-green-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">2,847</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Profile Views (30d)</p>
        </Card>

        <Card className="text-center">
          <Calendar size={32} className="mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">156</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Customer Actions (30d)</p>
        </Card>
      </div>

      {/* Development Note */}
      {isMockData && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-3">
            <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Development Mode Active
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                You're viewing mock data from the development environment. When Google Business Profile API is approved, 
                this will display real data with the same interface. Set VITE_GOOGLE_API_ENABLED=true to switch.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};