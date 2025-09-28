// src/components/pages/Locations.tsx
// STEP 3: Complete replacement for your Locations component with Google Business Profile integration

import {
  AlertCircle,
  Building,
  CheckCircle,
  Clock,
  ExternalLink,
  Eye,
  Globe,
  Info,
  MapPin,
  MessageSquare,
  MousePointer,
  Navigation,
  Phone,
  Plus,
  RefreshCw,
  Star,
  TrendingUp,
  Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useGoogleBusinessProfile } from '../../hooks/useGoogleBusinessProfile';
import { dataService, type Location } from '../../lib/dataService';
import { googleAuthService, useGoogleConnection } from '../../lib/googleAuth';
import { googleBusinessProfileService, type BusinessLocation } from '../../lib/googleBusinessProfileService';
import { supabase } from '../../lib/supabase';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface BusinessProfileData {
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  phone: string;
  website: string;
  services: string[];
  category?: string;
}

// Mock data for demonstration - this would come from signup/onboarding in real implementation
const mockBusinessProfile: BusinessProfileData = {
  name: "Sample Business Name",
  address: "123 Business St",
  city: "Business City",
  state: "ST",
  postal_code: "12345",
  phone: "(555) 123-4567",
  website: "https://samplebusiness.com",
  services: ["Service 1", "Service 2", "Service 3"],
  category: "Professional Services"
};

interface DataDiscrepancy {
  field: string;
  originalValue: string;
  googleValue: string;
}

export const Locations: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // Business profile states
  const [businessProfile] = useState<BusinessProfileData>(mockBusinessProfile);
  const [dataDiscrepancies, setDataDiscrepancies] = useState<DataDiscrepancy[]>([]);

  // Use the Google connection hook
  const {
    connected: isGoogleConnected,
    loading: googleLoading,
    error: googleError,
    tokenData,
    refresh: refreshGoogleConnection,
    disconnect: disconnectGoogle,
    clearAndReconnect
  } = useGoogleConnection(user?.id || null);

  // Use the Google Business Profile hook
  const {
    accounts,
    locations: googleLocations,
    reviews,
    insights,
    loading: gbpLoading,
    errors: gbpErrors,
    selectedAccount,
    selectedLocation,
    setSelectedAccount,
    setSelectedLocation,
    refreshAccounts,
    refreshLocations,
    refreshReviews,
    replyToReview,
    hasData,
    hasLocations,
    hasReviews,
    averageRating,
    totalReviews
  } = useGoogleBusinessProfile(user?.id || null, isGoogleConnected);

  useEffect(() => {
    initializeComponent();
  }, []);

  // Handle OAuth callback on component mount
  useEffect(() => {
    checkForOAuthCallback();
  }, [user]);

  // Sync Google location data with local business profile
  useEffect(() => {
    if (googleLocations.length > 0 && selectedLocation) {
      const currentLocation = googleLocations.find(loc => loc.name === selectedLocation);
      if (currentLocation) {
        syncGoogleLocationData(currentLocation);
      }
    }
  }, [googleLocations, selectedLocation]);

  const initializeComponent = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setError('User not authenticated');
        return;
      }
      setUser(currentUser);

      const userProfile = await dataService.initializeUserData(currentUser);
      if (!userProfile) {
        setError('Failed to initialize user profile');
        return;
      }

      const locationsData = await dataService.getLocations(userProfile.organization_id);
      setLocations(locationsData);

    } catch (err) {
      console.error('Locations initialization error:', err);
      setError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const checkForOAuthCallback = async () => {
    if (!user) return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    console.log('Checking OAuth callback - code:', !!code, 'error:', error);

    if (error) {
      console.error('OAuth error:', error);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code) {
      console.log('Processing OAuth callback...');
      try {
        await googleAuthService.exchangeCodeForTokens(code, user.id);
        console.log('OAuth flow completed successfully!');
        
        window.history.replaceState({}, document.title, window.location.pathname);
        refreshGoogleConnection();
      } catch (error) {
        console.error('OAuth callback error:', error);
      }
    }
  };

  const syncGoogleLocationData = (googleLocation: BusinessLocation) => {
    const discrepancies: DataDiscrepancy[] = [];
    
    // Compare business name
    if (googleLocation.locationName && googleLocation.locationName !== businessProfile.name) {
      discrepancies.push({
        field: 'Business Name',
        originalValue: businessProfile.name,
        googleValue: googleLocation.locationName
      });
    }
    
    // Compare address
    const googleAddress = googleBusinessProfileService.formatAddress(googleLocation);
    if (googleAddress && googleAddress !== businessProfile.address) {
      discrepancies.push({
        field: 'Address',
        originalValue: businessProfile.address,
        googleValue: googleAddress
      });
    }
    
    // Compare phone
    if (googleLocation.primaryPhone && googleLocation.primaryPhone !== businessProfile.phone) {
      discrepancies.push({
        field: 'Phone Number',
        originalValue: businessProfile.phone,
        googleValue: googleLocation.primaryPhone
      });
    }

    // Compare website
    if (googleLocation.websiteUri && googleLocation.websiteUri !== businessProfile.website) {
      discrepancies.push({
        field: 'Website',
        originalValue: businessProfile.website,
        googleValue: googleLocation.websiteUri
      });
    }

    setDataDiscrepancies(discrepancies);
  };

  const handleConnectToGoogle = () => {
    try {
      const authUrl = googleAuthService.getAuthUrl();
      console.log('Generated OAuth URL:', authUrl);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error generating auth URL:', error);
    }
  };

  const handleDisconnectGoogle = async () => {
    const success = await disconnectGoogle();
    if (success) {
      console.log('Successfully disconnected from Google');
    } else {
      console.error('Failed to disconnect from Google');
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

  // Google Connection Status Component
  const GoogleConnectionStatus: React.FC = () => {
    if (googleLoading) {
      return (
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-gray-600 dark:text-gray-400">Checking Google connection...</span>
            </div>
          </div>
        </Card>
      );
    }

    if (googleError) {
      return (
        <Card className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="text-red-500 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Google Connection Error</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{googleError}</p>
                <div className="flex space-x-3 mt-3">
                  <button
                    onClick={refreshGoogleConnection}
                    className="text-sm text-red-600 hover:text-red-500 underline"
                  >
                    Try again
                  </button>
                  {googleError.includes('expired') && (
                    <button
                      onClick={clearAndReconnect}
                      className="text-sm text-blue-600 hover:text-blue-500 underline"
                    >
                      Reconnect to Google
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    if (isGoogleConnected && tokenData) {
      return (
        <Card className="mb-6 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="text-green-500" size={20} />
                <div>
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Connected to Google Business Profile
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Connected as {tokenData.google_email}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {hasData ? `${accounts.length} business account(s), ${googleLocations.length} location(s)` : 'Loading business data...'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={refreshGoogleConnection}
                  variant="secondary"
                  size="sm"
                >
                  <RefreshCw size={14} className="mr-1" />
                  Refresh
                </Button>
                <Button
                  onClick={handleDisconnectGoogle}
                  variant="secondary"
                  size="sm"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="mb-6 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Google Business Profile
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Connect to manage your business locations and reviews
                </p>
              </div>
            </div>
            <Button
              onClick={handleConnectToGoogle}
              variant="primary"
              size="sm"
            >
              <ExternalLink size={14} className="mr-1" />
              Connect Google
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  // Google Business Profile Data Display
  const GoogleBusinessData: React.FC = () => {
    if (!isGoogleConnected || !hasData) return null;

    if (gbpLoading.accounts || gbpLoading.locations) {
      return (
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-gray-600 dark:text-gray-400">Loading Google Business Profile data...</span>
            </div>
          </div>
        </Card>
      );
    }

    if (gbpErrors.accounts || gbpErrors.locations) {
      return (
        <Card className="mb-6 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="text-yellow-600 dark:text-yellow-400 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Unable to load Google Business Profile data
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {gbpErrors.accounts || gbpErrors.locations}
                </p>
                <button
                  onClick={refreshAccounts}
                  className="mt-2 text-sm text-yellow-600 hover:text-yellow-500 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <div className="space-y-6 mb-8">
        {/* Account Selection */}
        {accounts.length > 1 && (
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Select Business Account
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {accounts.map((account) => (
                  <button
                    key={account.name}
                    onClick={() => setSelectedAccount(account.name)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      selectedAccount === account.name
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {account.accountName}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {account.type} • {account.role}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Google Locations Grid */}
        {hasLocations && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Google Business Locations
              </h3>
              <Button
                onClick={refreshLocations}
                variant="secondary"
                size="sm"
                disabled={gbpLoading.locations}
              >
                <RefreshCw size={14} className={`mr-1 ${gbpLoading.locations ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {googleLocations.map((location) => (
                <GoogleLocationCard key={location.name} location={location} />
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        {hasReviews && selectedLocation && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Recent Reviews ({totalReviews})
              </h3>
              <Button
                onClick={refreshReviews}
                variant="secondary"
                size="sm"
                disabled={gbpLoading.reviews}
              >
                <RefreshCw size={14} className={`mr-1 ${gbpLoading.reviews ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="space-y-4">
              {reviews.slice(0, 3).map((review) => (
                <GoogleReviewCard key={review.name} review={review} onReply={replyToReview} />
              ))}
            </div>
          </div>
        )}

        {/* Insights Section */}
        {insights && selectedLocation && (
          <GoogleInsightsDisplay insights={insights} loading={gbpLoading.insights} />
        )}
      </div>
    );
  };

  // Google Location Card Component
  const GoogleLocationCard: React.FC<{ location: BusinessLocation }> = ({ location }) => {
    const isSelected = selectedLocation === location.name;
    
    return (
      <div 
        className={`cursor-pointer transition-colors ${
          isSelected ? 'ring-2 ring-blue-500 border-blue-200' : ''
        }`}
        onClick={() => setSelectedLocation(location.name)}
      >
        <Card hover>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {location.locationName}
                </h4>
                {isSelected && (
                  <Badge variant="info" size="sm">
                    <CheckCircle size={12} className="mr-1" />
                    Selected
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {location.address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} />
                    <span>{googleBusinessProfileService.formatAddress(location)}</span>
                  </div>
                )}
                {location.primaryPhone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} />
                    <span>{location.primaryPhone}</span>
                  </div>
                )}
                {location.websiteUri && (
                  <div className="flex items-center gap-2">
                    <Globe size={14} />
                    <a 
                      href={location.websiteUri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#f45a4e] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {location.websiteUri.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {location.primaryCategory && (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 bg-gray-400 rounded-sm flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                    <span>{googleBusinessProfileService.getPrimaryCategory(location)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isSelected && hasReviews && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star size={14} className="text-yellow-500 fill-current" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {averageRating.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Average Rating</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MessageSquare size={14} className="text-blue-500" />
                  <span className="font-semibold text-gray-900 dark:text-white">{totalReviews}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Reviews</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  };

  // Google Review Card Component
  const GoogleReviewCard: React.FC<{ review: any; onReply: (reviewName: string, reply: string) => Promise<boolean> }> = ({ review, onReply }) => {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    const handleReply = async () => {
      if (!replyText.trim()) return;
      
      setIsReplying(true);
      try {
        const success = await onReply(review.name, replyText);
        if (success) {
          setShowReplyForm(false);
          setReplyText('');
        }
      } finally {
        setIsReplying(false);
      }
    };

    const starRating = review.starRating || 0;

    return (
      <Card>
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {review.reviewer.profilePhotoUrl ? (
                <img
                  src={review.reviewer.profilePhotoUrl}
                  alt={review.reviewer.displayName}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <Users size={16} className="text-gray-600 dark:text-gray-300" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {review.reviewer.displayName}
                  </h4>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={`${
                          i < starRating 
                            ? 'text-yellow-500 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(review.createTime).toLocaleDateString()}
                </span>
              </div>
              
              {review.comment && (
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {review.comment}
                </p>
              )}

              {review.reviewReply ? (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Building size={14} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Business Reply
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {review.reviewReply.comment}
                  </p>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    variant="secondary"
                    size="sm"
                  >
                    Reply
                  </Button>
                </div>
              )}

              {showReplyForm && (
                <div className="mt-3 space-y-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleReply}
                      disabled={!replyText.trim() || isReplying}
                      variant="primary"
                      size="sm"
                    >
                      {isReplying ? 'Sending...' : 'Send Reply'}
                    </Button>
                    <Button
                      onClick={() => setShowReplyForm(false)}
                      variant="secondary"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Google Insights Display Component
  const GoogleInsightsDisplay: React.FC<{ insights: any; loading: boolean }> = ({ insights, loading }) => {
    if (loading) {
      return (
        <Card>
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-gray-600 dark:text-gray-400">Loading insights...</span>
            </div>
          </div>
        </Card>
      );
    }

    if (!insights?.locationMetrics?.length) return null;

    const metrics = insights.locationMetrics[0]?.metricValues || [];

    return (
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Performance Insights (Last 30 Days)
        </h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric: any, index: number) => {
            const value = parseInt(metric.totalValue?.value || '0');
            let icon, label, gradient;

            switch (metric.metric) {
              case 'VIEWS_MAPS':
                icon = Eye;
                label = 'Maps Views';
                gradient = 'bg-gradient-to-r from-blue-500 to-blue-600';
                break;
              case 'VIEWS_SEARCH':
                icon = Eye;
                label = 'Search Views';
                gradient = 'bg-gradient-to-r from-green-500 to-green-600';
                break;
              case 'ACTIONS_WEBSITE':
                icon = MousePointer;
                label = 'Website Clicks';
                gradient = 'bg-gradient-to-r from-purple-500 to-purple-600';
                break;
              case 'ACTIONS_PHONE':
                icon = Phone;
                label = 'Phone Calls';
                gradient = 'bg-gradient-to-r from-orange-500 to-orange-600';
                break;
              case 'ACTIONS_DRIVING_DIRECTIONS':
                icon = Navigation;
                label = 'Directions';
                gradient = 'bg-gradient-to-r from-red-500 to-red-600';
                break;
              default:
                icon = TrendingUp;
                label = metric.metric.replace('_', ' ');
                gradient = 'bg-gradient-to-r from-gray-500 to-gray-600';
            }

            return (
              <Card key={index} hover>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${gradient}`}>
                    {React.createElement(icon, { size: 20, className: "text-white" })}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  // Business Profile Card Component (updated to use Google data when available)
  const BusinessProfileCard: React.FC = () => {
    const currentLocation = selectedLocation 
      ? googleLocations.find(loc => loc.name === selectedLocation)
      : null;

    const displayData = currentLocation ? {
      name: currentLocation.locationName || businessProfile.name,
      address: googleBusinessProfileService.formatAddress(currentLocation) || businessProfile.address,
      phone: currentLocation.primaryPhone || businessProfile.phone,
      website: currentLocation.websiteUri || businessProfile.website,
      category: googleBusinessProfileService.getPrimaryCategory(currentLocation) || businessProfile.category
    } : businessProfile;

    return (
      <Card className="mb-8">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building size={24} className="text-[#f45a4e]" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {displayData.name}
            </h2>
            {isGoogleConnected && (
              <Badge variant="success" size="sm">
                <CheckCircle size={12} className="mr-1" />
                Google Connected
              </Badge>
            )}
            {currentLocation && (
              <Badge variant="info" size="sm">
                Live Data
              </Badge>
            )}
          </div>
          
          {displayData.category && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">{displayData.category}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={16} className="text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  {displayData.address}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone size={16} className="text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">{displayData.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Globe size={16} className="text-gray-500" />
                <a 
                  href={displayData.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#f45a4e] hover:underline"
                >
                  {displayData.website?.replace(/^https?:\/\//, '')}
                </a>
              </div>
            </div>

            {isGoogleConnected && hasReviews && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Star size={16} className="text-yellow-500 fill-current" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {averageRating.toFixed(1)} average rating
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare size={16} className="text-blue-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {totalReviews} reviews
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users size={16} className="text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {businessProfile.services.length} services
                  </span>
                </div>
              </div>
            )}
          </div>

          {businessProfile.services.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Services</h4>
              <div className="flex flex-wrap gap-2">
                {businessProfile.services.map((service, index) => (
                  <Badge key={index} variant="info" size="sm">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  // Data Discrepancies Alert
  const DataDiscrepanciesAlert: React.FC = () => {
    if (dataDiscrepancies.length === 0) return null;

    return (
      <Card className="mb-6 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="text-yellow-600 dark:text-yellow-400 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Profile Information Updated from Google Business Profile
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                The following information from your signup differs from your Google Business Profile. 
                We've updated it to match your Google profile:
              </p>
              <div className="space-y-2">
                {dataDiscrepancies.map((discrepancy, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">
                      {discrepancy.field}:
                    </span>
                    <span className="text-yellow-700 dark:text-yellow-300 ml-2">
                      "{discrepancy.originalValue}" → "{discrepancy.googleValue}"
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
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
            <Button onClick={initializeComponent}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Calculate summary statistics - use Google data if available, fallback to local data
  const totalReviewsFromLocal = locations.reduce((sum, loc) => sum + loc.review_count, 0);
  const averageRatingFromLocal = locations.length > 0 
    ? locations.reduce((sum, loc) => sum + (loc.rating || 0), 0) / locations.length
    : 0;
  const syncedLocations = locations.filter(loc => loc.gbp_sync_status === 'synced').length;

  // Use Google data if available, otherwise use local data
  const displayTotalReviews = hasReviews ? totalReviews : totalReviewsFromLocal;
  const displayAverageRating = hasReviews ? averageRating : averageRatingFromLocal;
  const displayTotalLocations = hasLocations ? googleLocations.length : locations.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Locations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your business locations and Google Business Profile
          </p>
        </div>
        <Button icon={Plus}>
          Add Location
        </Button>
      </div>

      {/* Google Connection Status */}
      <GoogleConnectionStatus />

      {/* Data Discrepancies Alert */}
      <DataDiscrepanciesAlert />

      {/* Business Profile Card */}
      <BusinessProfileCard />

      {/* Google Business Profile Data */}
      <GoogleBusinessData />

      {/* Summary Cards - show Google data if available, otherwise local data */}
      {(displayTotalLocations > 0 || isGoogleConnected) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <SummaryCard
            title="Total Locations"
            value={displayTotalLocations}
            icon={MapPin}
            gradient="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
            loading={isGoogleConnected && gbpLoading.locations}
          />
          <SummaryCard
            title="Average Rating"
            value={displayAverageRating.toFixed(1)}
            icon={Star}
            gradient="bg-gradient-to-r from-[#f093fb] to-[#f5576c]"
            loading={isGoogleConnected && gbpLoading.reviews}
          />
          <SummaryCard
            title="Total Reviews"
            value={displayTotalReviews.toLocaleString()}
            icon={MessageSquare}
            gradient="bg-gradient-to-r from-[#11998e] to-[#38ef7d]"
            loading={isGoogleConnected && gbpLoading.reviews}
          />
          <SummaryCard
            title="Synced Locations"
            value={isGoogleConnected ? (hasLocations ? googleLocations.length : 0) : syncedLocations}
            icon={CheckCircle}
            gradient="bg-gradient-to-r from-[#f45a4e] to-[#e53e3e]"
            loading={isGoogleConnected && gbpLoading.locations}
          />
        </div>
      )}

      {/* Local Locations Grid - only show if there are local locations and no Google locations */}
      {locations.length > 0 && !hasLocations && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Local Locations
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {locations.map((location) => (
              <LocationCard key={location.id} location={location} />
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!hasLocations && locations.length === 0 && isGoogleConnected && (
        <Card>
          <div className="text-center py-12">
            <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No business locations found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your Google Business Profile is connected, but no locations were found. You may need to set up your business profile on Google first.
            </p>
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={() => window.open('https://business.google.com', '_blank')}
                variant="secondary"
              >
                <ExternalLink size={16} className="mr-2" />
                Open Google Business
              </Button>
              <Button 
                onClick={refreshLocations}
                variant="primary"
                disabled={gbpLoading.locations}
              >
                <RefreshCw size={16} className={`mr-2 ${gbpLoading.locations ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};