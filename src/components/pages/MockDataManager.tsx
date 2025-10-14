// src/components/pages/MockDataManager.tsx
// Admin interface for managing mock Google Business Profile data

import {
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Globe,
  MapPin,
  Phone,
  RefreshCw,
  Star,
  Store
} from 'lucide-react';
import React, { useState } from 'react';
import { FEATURE_FLAGS, getConfigStatus } from '../../config/featureFlags';
import {
  calculateAverageRating,
  mockGoogleBusinessData,
  type BusinessAccount,
  type BusinessLocation,
  type BusinessReview
} from '../../lib/mockGoogleBusinessData';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const MockDataManager: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const configStatus = getConfigStatus();
  
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mock Google Business Data
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Development and QA testing data while waiting for Google API access
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Configuration Status */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Current Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${FEATURE_FLAGS.USE_MOCK_GOOGLE_DATA ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Data Source</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{configStatus.dataSource}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${FEATURE_FLAGS.GOOGLE_API_ENABLED ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Google API</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {configStatus.apiEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${FEATURE_FLAGS.DEBUG_MODE ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Debug Mode</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {configStatus.debugMode ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${FEATURE_FLAGS.SIMULATE_API_DELAYS ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">API Delays</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {configStatus.simulateDelays ? 'Simulated' : 'Instant'}
                </p>
              </div>
            </div>
          </div>
          
          {!FEATURE_FLAGS.USE_MOCK_GOOGLE_DATA && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start space-x-3">
                <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    Mock Data is Currently Disabled
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                    Set VITE_USE_MOCK_GOOGLE_DATA=true in your .env file to use mock data
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Business Accounts</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {mockGoogleBusinessData.accounts.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Store size={24} className="text-white" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
              Different account ownership types
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Business Locations</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {mockGoogleBusinessData.locations.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <MapPin size={24} className="text-white" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
              Various business types with complete data
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Customer Reviews</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {mockGoogleBusinessData.reviews.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <Star size={24} className="text-white" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
              Realistic review distribution
            </p>
          </div>
        </Card>
      </div>

      {/* Business Accounts */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Database size={20} className="mr-2" />
            Mock Business Accounts
          </h2>
          <div className="space-y-3">
            {mockGoogleBusinessData.accounts.map((account: BusinessAccount) => (
              <div
                key={account.name}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {account.accountName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {account.name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={account.type === 'PERSONAL' ? 'info' : 'gradient'} size="sm">
                      {account.type}
                    </Badge>
                    <Badge variant={account.role === 'OWNER' ? 'success' : 'warning'} size="sm">
                      {account.role}
                    </Badge>
                    <Badge variant="success" size="sm">
                      <CheckCircle size={12} className="mr-1" />
                      {account.state.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Business Locations */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <MapPin size={20} className="mr-2" />
            Mock Business Locations
          </h2>
          <div className="space-y-4">
            {mockGoogleBusinessData.locations.map((location: BusinessLocation) => {
              const locationReviews = mockGoogleBusinessData.reviews.filter((r: BusinessReview) => 
                r.name.includes(location.name.split('/').pop() || '')
              );
              const avgRating = calculateAverageRating(locationReviews);
              
              return (
                <div
                  key={location.name}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {location.locationName}
                        </h3>
                        <Badge variant="gradient" size="sm">
                          {location.primaryCategory.displayName}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {location.name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star size={16} className="text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {avgRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({locationReviews.length})
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start space-x-2">
                      <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {location.address.addressLines.join(', ')}, {location.address.locality}, {location.address.administrativeArea}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Phone size={16} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {location.primaryPhone}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Globe size={16} className="text-gray-400 flex-shrink-0" />
                      <a 
                        href={location.websiteUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {location.websiteUri}
                      </a>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock size={16} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {location.regularHours.periods.length} day schedule
                      </span>
                    </div>
                  </div>
                  
                  {location.labels.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {location.labels.map((label: string) => (
                        <Badge key={label} variant="info" size="sm">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Review Statistics */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Star size={20} className="mr-2" />
            Mock Reviews Overview
          </h2>
          <div className="space-y-4">
            {mockGoogleBusinessData.locations.map((location: BusinessLocation) => {
              const locationReviews = mockGoogleBusinessData.reviews.filter((r: BusinessReview) => 
                r.name.includes(location.name.split('/').pop() || '')
              );
              
              if (locationReviews.length === 0) return null;
              
              const avgRating = calculateAverageRating(locationReviews);
              const ratingDistribution = locationReviews.reduce((acc: Record<number, number>, review: BusinessReview) => {
                const rating = review.starRating || 0;
                acc[rating] = (acc[rating] || 0) + 1;
                return acc;
              }, {} as Record<number, number>);
              
              const reviewsWithReplies = locationReviews.filter((r: BusinessReview) => r.reviewReply).length;
              const responseRate = (reviewsWithReplies / locationReviews.length) * 100;
              
              return (
                <div
                  key={location.name}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {location.locationName}
                    </h3>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {avgRating.toFixed(1)} ⭐
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Response Rate</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {responseRate.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = ratingDistribution[rating] || 0;
                      const percentage = (count / locationReviews.length) * 100;
                      
                      return (
                        <div key={rating} className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400 w-12">
                            {rating} ⭐
                          </span>
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Instructions */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            How to Use Mock Data
          </h2>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Enable Mock Data Mode</p>
                <p className="mt-1">Set <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">VITE_USE_MOCK_GOOGLE_DATA=true</code> in your .env file</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Test All Features</p>
                <p className="mt-1">All Google Business Profile features will use this mock data automatically</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Switch to Real API</p>
                <p className="mt-1">Once Google approves API access, set <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">VITE_GOOGLE_API_ENABLED=true</code> and <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">VITE_USE_MOCK_GOOGLE_DATA=false</code></p>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start space-x-3">
                <CheckCircle size={20} className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    Zero Code Changes Required
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                    The adapter pattern automatically switches between mock data and real API based on feature flags. No code changes needed when Google API access is granted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};