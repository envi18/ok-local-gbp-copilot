import {
  AlertCircle,
  Building,
  CheckCircle,
  Clock,
  ExternalLink,
  Globe,
  Info,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Star,
  TrendingUp,
  Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { dataService, type Location, type Profile } from '../../lib/dataService';
import { googleAuthService } from '../../lib/googleAuth';
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

interface GoogleBusinessData {
  name?: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  review_count?: number;
  category?: string;
}

interface DataDiscrepancy {
  field: string;
  originalValue: string;
  googleValue: string;
}

export const Locations: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Google OAuth states
  const [isConnecting, setIsConnecting] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthSuccess, setOauthSuccess] = useState<string | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  
  // Business profile states
  const [businessProfile] = useState<BusinessProfileData>(mockBusinessProfile);
  const [googleBusinessData, setGoogleBusinessData] = useState<GoogleBusinessData | null>(null);
  const [dataDiscrepancies, setDataDiscrepancies] = useState<DataDiscrepancy[]>([]);

  useEffect(() => {
    initializeLocations();
    checkExistingGoogleConnection();
    checkForOAuthCallback();
  }, []);

  // Re-check connection status when isGoogleConnected changes
  useEffect(() => {
    if (isGoogleConnected) {
      fetchGoogleBusinessData();
    }
  }, [isGoogleConnected]);

  const initializeLocations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const userProfile = await dataService.initializeUserData(user);
      if (!userProfile) {
        setError('Failed to initialize user profile');
        return;
      }
      setProfile(userProfile);

      const locationsData = await dataService.getLocations(userProfile.organization_id);
      setLocations(locationsData);

    } catch (err) {
      console.error('Locations initialization error:', err);
      setError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingGoogleConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found for Google connection check');
        return;
      }

      console.log('Checking existing Google connection for user:', user.id);

      const { data: tokens, error } = await supabase
        .from('google_oauth_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.log('No existing Google connection found:', error.message);
        console.log('Google tokens found:', false);
        return;
      }

      console.log('Google tokens found:', !!tokens);

      if (tokens) {
        setIsGoogleConnected(true);
        await fetchGoogleBusinessData();
      }
    } catch (error) {
      console.error('Error checking existing connection:', error);
    }
  };

  const checkForOAuthCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    console.log('Current URL:', window.location.href);
    console.log('URL search params:', window.location.search);
    console.log('Checking OAuth callback - code:', !!code, 'error:', error);
    console.log('Raw code value:', code);

    if (error) {
      setOauthError('Google authentication was cancelled or failed.');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code) {
      console.log('Processing OAuth code...');
      await handleOAuthCallback(code);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const handleOAuthCallback = async (code: string) => {
    setIsConnecting(true);
    setOauthError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      console.log('Exchanging OAuth code for tokens...');
      const result = await googleAuthService.exchangeCodeForTokens(code, user.id);
      console.log('Token exchange result:', result);
      
      if (result.success) {
        setIsGoogleConnected(true);
        setOauthSuccess('Successfully connected Google account!');
        console.log('Setting connected state to true, fetching business data...');
        await fetchGoogleBusinessData();
      } else {
        throw new Error('Token exchange failed');
      }

    } catch (error) {
      console.error('OAuth callback error:', error);
      setOauthError(error instanceof Error ? error.message : 'Failed to connect to Google');
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchGoogleBusinessData = async () => {
    // TODO: Implement Google Business Profile API calls
    // This is where you'll fetch actual business data from Google
    
    // Mock Google Business Profile data for demonstration
    const mockGoogleData: GoogleBusinessData = {
      name: "Sample Business Name (Google)",
      address: "456 Different St", // Different from signup data
      phone: "(555) 987-6543", // Different from signup data
      website: "https://samplebusiness.com",
      rating: 4.5,
      review_count: 127,
      category: "Professional Services"
    };

    // Compare with existing business profile and identify discrepancies
    const discrepancies: DataDiscrepancy[] = [];
    
    if (mockGoogleData.name && mockGoogleData.name !== businessProfile.name) {
      discrepancies.push({
        field: 'Business Name',
        originalValue: businessProfile.name,
        googleValue: mockGoogleData.name
      });
    }
    
    if (mockGoogleData.address && mockGoogleData.address !== businessProfile.address) {
      discrepancies.push({
        field: 'Address',
        originalValue: businessProfile.address,
        googleValue: mockGoogleData.address
      });
    }
    
    if (mockGoogleData.phone && mockGoogleData.phone !== businessProfile.phone) {
      discrepancies.push({
        field: 'Phone Number',
        originalValue: businessProfile.phone,
        googleValue: mockGoogleData.phone
      });
    }

    setGoogleBusinessData(mockGoogleData);
    setDataDiscrepancies(discrepancies);
  };

  const handleConnectToGoogle = () => {
    try {
      const authUrl = googleAuthService.getAuthUrl();
      console.log('Generated OAuth URL:', authUrl);
      setIsConnecting(true);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error generating auth URL:', error);
      setOauthError('Failed to generate Google authentication URL');
      setIsConnecting(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('google_oauth_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id);

      setIsGoogleConnected(false);
      setGoogleBusinessData(null);
      setDataDiscrepancies([]);
      setOauthSuccess('Disconnected from Google Business Profile');
    } catch (error) {
      console.error('Error disconnecting:', error);
      setOauthError('Failed to disconnect from Google');
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

  // Business Profile Card Component
  const BusinessProfileCard: React.FC = () => {
    const displayData = isGoogleConnected && googleBusinessData ? {
      name: googleBusinessData.name || businessProfile.name,
      address: googleBusinessData.address || businessProfile.address,
      phone: googleBusinessData.phone || businessProfile.phone,
      website: googleBusinessData.website || businessProfile.website,
      rating: googleBusinessData.rating,
      review_count: googleBusinessData.review_count,
      category: googleBusinessData.category
    } : businessProfile;

    return (
      <Card className="mb-8">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
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
                      {businessProfile.city && `, ${businessProfile.city}`}
                      {businessProfile.state && `, ${businessProfile.state}`}
                      {businessProfile.postal_code && ` ${businessProfile.postal_code}`}
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

                {isGoogleConnected && googleBusinessData && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Star size={16} className="text-yellow-500 fill-current" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {googleBusinessData.rating?.toFixed(1)} rating
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare size={16} className="text-blue-500" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {googleBusinessData.review_count} reviews
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

              {/* Services */}
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
          </div>

          {/* Google Connection Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isGoogleConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {isGoogleConnected ? 'Google Business Profile Connected' : 'Connect Google Business Profile'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isGoogleConnected 
                      ? 'Your Google Business Profile is connected and synced'
                      : 'Connect your Google Business Profile to sync data and manage your online presence'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                {isGoogleConnected ? (
                  <Button
                    onClick={handleDisconnectGoogle}
                    variant="secondary"
                    size="sm"
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    onClick={handleConnectToGoogle}
                    disabled={isConnecting}
                    variant="primary"
                    size="sm"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin mr-2" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <ExternalLink size={16} className="mr-2" />
                        Connect Google Account
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
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
            <Button onClick={initializeLocations}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Calculate summary statistics
  const totalReviews = locations.reduce((sum, loc) => sum + loc.review_count, 0);
  const averageRating = locations.length > 0 
    ? locations.reduce((sum, loc) => sum + (loc.rating || 0), 0) / locations.length
    : 0;
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
            Manage your business locations and Google Business Profile
          </p>
        </div>
        <Button icon={Plus}>
          Add Location
        </Button>
      </div>

      {/* Alert Messages */}
      {oauthError && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="text-red-500 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{oauthError}</p>
              </div>
              <button onClick={() => setOauthError(null)} className="text-red-500 hover:text-red-700 ml-auto">×</button>
            </div>
          </div>
        </Card>
      )}

      {oauthSuccess && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="text-green-500 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Success</h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">{oauthSuccess}</p>
              </div>
              <button onClick={() => setOauthSuccess(null)} className="text-green-500 hover:text-green-700 ml-auto">×</button>
            </div>
          </div>
        </Card>
      )}

      {/* Data Discrepancies Alert */}
      <DataDiscrepanciesAlert />

      {/* Business Profile Card */}
      <BusinessProfileCard />

      {/* Summary Cards - only show if locations exist */}
      {locations.length > 0 && (
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
      )}

      {/* Additional Locations Grid - only show if there are multiple locations */}
      {locations.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Additional Locations
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {locations.map((location) => (
              <LocationCard key={location.id} location={location} />
            ))}
          </div>
        </>
      )}

      {/* Empty state for additional locations */}
      {locations.length === 0 && isGoogleConnected && (
        <Card>
          <div className="text-center py-12">
            <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Ready to add more locations?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your Google Business Profile is connected. Add additional business locations to manage them all in one place.
            </p>
            <Button icon={Plus} variant="primary">
              Add Additional Location
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};