// src/hooks/useGoogleBusinessProfile.ts
// STEP 2: Create this new hook file for managing Google Business Profile data

import { useCallback, useEffect, useState } from 'react';
import {
  googleBusinessProfileService,
  type BusinessAccount,
  type BusinessLocation,
  type BusinessReview,
  type GoogleBusinessProfilePost,
  type LocationInsights
} from '../lib/googleBusinessProfileService';

interface BusinessProfileState {
  accounts: BusinessAccount[];
  locations: BusinessLocation[];
  reviews: BusinessReview[];
  insights: LocationInsights | null;
  loading: {
    accounts: boolean;
    locations: boolean;
    reviews: boolean;
    insights: boolean;
  };
  errors: {
    accounts: string | null;
    locations: string | null;
    reviews: string | null;
    insights: string | null;
  };
}

export function useGoogleBusinessProfile(userId: string | null, isConnected: boolean) {
  const [state, setState] = useState<BusinessProfileState>({
    accounts: [],
    locations: [],
    reviews: [],
    insights: null,
    loading: {
      accounts: false,
      locations: false,
      reviews: false,
      insights: false,
    },
    errors: {
      accounts: null,
      locations: null,
      reviews: null,
      insights: null,
    },
  });

  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Reset state when connection status changes
  useEffect(() => {
    if (!isConnected) {
      setState({
        accounts: [],
        locations: [],
        reviews: [],
        insights: null,
        loading: {
          accounts: false,
          locations: false,
          reviews: false,
          insights: false,
        },
        errors: {
          accounts: null,
          locations: null,
          reviews: null,
          insights: null,
        },
      });
      setSelectedAccount(null);
      setSelectedLocation(null);
    }
  }, [isConnected]);

  // Fetch business accounts
  const fetchAccounts = useCallback(async () => {
    if (!userId || !isConnected) return;

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, accounts: true },
      errors: { ...prev.errors, accounts: null }
    }));

    try {
      console.log('Fetching Google Business accounts...');
      const accounts = await googleBusinessProfileService.getBusinessAccounts(userId);
      
      setState(prev => ({
        ...prev,
        accounts,
        loading: { ...prev.loading, accounts: false }
      }));

      // Auto-select first account if available
      if (accounts.length > 0 && !selectedAccount) {
        setSelectedAccount(accounts[0].name);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, accounts: false },
        errors: { ...prev.errors, accounts: error instanceof Error ? error.message : 'Failed to fetch accounts' }
      }));
    }
  }, [userId, isConnected, selectedAccount]);

  // Fetch locations for selected account
  const fetchLocations = useCallback(async () => {
    if (!userId || !isConnected || !selectedAccount) return;

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, locations: true },
      errors: { ...prev.errors, locations: null }
    }));

    try {
      console.log('Fetching locations for account:', selectedAccount);
      const locations = await googleBusinessProfileService.getBusinessLocations(userId, selectedAccount);
      
      setState(prev => ({
        ...prev,
        locations,
        loading: { ...prev.loading, locations: false }
      }));

      // Auto-select first location if available
      if (locations.length > 0 && !selectedLocation) {
        setSelectedLocation(locations[0].name);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, locations: false },
        errors: { ...prev.errors, locations: error instanceof Error ? error.message : 'Failed to fetch locations' }
      }));
    }
  }, [userId, isConnected, selectedAccount, selectedLocation]);

  // Fetch reviews for selected location
  const fetchReviews = useCallback(async () => {
    if (!userId || !isConnected || !selectedLocation) return;

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, reviews: true },
      errors: { ...prev.errors, reviews: null }
    }));

    try {
      console.log('Fetching reviews for location:', selectedLocation);
      const reviews = await googleBusinessProfileService.getLocationReviews(userId, selectedLocation);
      
      setState(prev => ({
        ...prev,
        reviews,
        loading: { ...prev.loading, reviews: false }
      }));
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, reviews: false },
        errors: { ...prev.errors, reviews: error instanceof Error ? error.message : 'Failed to fetch reviews' }
      }));
    }
  }, [userId, isConnected, selectedLocation]);

  // Fetch insights for selected location
  const fetchInsights = useCallback(async () => {
    if (!userId || !isConnected || !selectedLocation) return;

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, insights: true },
      errors: { ...prev.errors, insights: null }
    }));

    try {
      console.log('Fetching insights for location:', selectedLocation);
      const insights = await googleBusinessProfileService.getLocationInsights(userId, selectedLocation);
      
      setState(prev => ({
        ...prev,
        insights,
        loading: { ...prev.loading, insights: false }
      }));
    } catch (error) {
      console.error('Error fetching insights:', error);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, insights: false },
        errors: { ...prev.errors, insights: error instanceof Error ? error.message : 'Failed to fetch insights' }
      }));
    }
  }, [userId, isConnected, selectedLocation]);

  // Reply to a review
  const replyToReview = useCallback(async (reviewName: string, replyText: string): Promise<boolean> => {
    if (!userId || !isConnected) return false;

    try {
      const success = await googleBusinessProfileService.replyToReview(userId, reviewName, replyText);
      if (success) {
        // Refresh reviews after successful reply
        await fetchReviews();
      }
      return success;
    } catch (error) {
      console.error('Error replying to review:', error);
      return false;
    }
  }, [userId, isConnected, fetchReviews]);

  // Create a location post
  const createPost = useCallback(async (postData: GoogleBusinessProfilePost): Promise<boolean> => {
    if (!userId || !isConnected || !selectedLocation) return false;

    try {
      const success = await googleBusinessProfileService.createLocationPost(userId, selectedLocation, postData);
      return success;
    } catch (error) {
      console.error('Error creating post:', error);
      return false;
    }
  }, [userId, isConnected, selectedLocation]);

  // Initial data fetch when connected
  useEffect(() => {
    if (isConnected && userId) {
      fetchAccounts();
    }
  }, [isConnected, userId, fetchAccounts]);

  // Fetch locations when account is selected
  useEffect(() => {
    if (selectedAccount) {
      fetchLocations();
    }
  }, [selectedAccount, fetchLocations]);

  // Fetch reviews and insights when location is selected
  useEffect(() => {
    if (selectedLocation) {
      fetchReviews();
      fetchInsights();
    }
  }, [selectedLocation, fetchReviews, fetchInsights]);

  return {
    // Data
    accounts: state.accounts,
    locations: state.locations,
    reviews: state.reviews,
    insights: state.insights,
    
    // Loading states
    loading: state.loading,
    
    // Error states
    errors: state.errors,
    
    // Selection state
    selectedAccount,
    selectedLocation,
    setSelectedAccount,
    setSelectedLocation,
    
    // Actions
    refreshAccounts: fetchAccounts,
    refreshLocations: fetchLocations,
    refreshReviews: fetchReviews,
    refreshInsights: fetchInsights,
    replyToReview,
    createPost,
    
    // Helper computed values
    hasData: state.accounts.length > 0,
    hasLocations: state.locations.length > 0,
    hasReviews: state.reviews.length > 0,
    averageRating: state.reviews.length > 0 
      ? state.reviews.reduce((sum, review) => sum + (review.starRating || 0), 0) / state.reviews.length
      : 0,
    totalReviews: state.reviews.length,
  };
}