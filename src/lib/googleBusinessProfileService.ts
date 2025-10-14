// src/lib/googleBusinessProfileService.ts
// UPDATED: Google Business Profile API service with mock data adapter

import {
  getMockApiDelay,
  isGoogleApiEnabled,
  logDataSource,
  shouldUseMockData
} from '../config/featureFlags';
import {
  getLocationsByAccount,
  getReviewsByLocation,
  mockGoogleBusinessData
} from './mockGoogleBusinessData';

// Type definitions for Google Business Profile API responses
export interface BusinessAccount {
  name: string;
  accountName: string;
  type: string;
  role: string;
  state: {
    status: string;
  };
}

export interface BusinessLocation {
  name: string;
  languageCode: string;
  storeCode: string;
  locationName: string;
  primaryPhone: string;
  additionalPhones: string[];
  address: {
    regionCode: string;
    languageCode: string;
    postalCode: string;
    administrativeArea: string;
    locality: string;
    addressLines: string[];
  };
  primaryCategory: {
    categoryId: string;
    displayName: string;
  };
  additionalCategories: Array<{
    categoryId: string;
    displayName: string;
  }>;
  websiteUri: string;
  regularHours: {
    periods: Array<{
      openDay: string;
      openTime: string;
      closeDay: string;
      closeTime: string;
    }>;
  };
  specialHours: {
    specialHourPeriods: Array<{
      specialDate: {
        year: number;
        month: number;
        day: number;
      };
      openTime: string;
      closeTime: string;
      closed: boolean;
    }>;
  };
  serviceArea: {
    businessType: string;
    places: {
      placeInfos: Array<{
        name: string;
        placeId: string;
      }>;
    };
  };
  labels: string[];
  adWordsLocationExtensions: {
    adPhone: string;
  };
  latlng: {
    latitude: number;
    longitude: number;
  };
  openInfo: {
    status: string;
    canReopen: boolean;
    openingDate: {
      year: number;
      month: number;
      day: number;
    };
  };
  locationKey: {
    placeId: string;
    plusPageId: string;
    explicitNoPlaceId: boolean;
  };
  profile: {
    description: string;
  };
  relationshipData: {
    parentChain: Array<{
      chainId: string;
      chainName: string;
    }>;
  };
  moreHours: Array<{
    hoursTypeId: string;
    periods: Array<{
      openDay: string;
      openTime: string;
      closeDay: string;
      closeTime: string;
    }>;
  }>;
}

export interface BusinessReview {
  name: string;
  reviewId: string;
  reviewer: {
    profilePhotoUrl: string;
    displayName: string;
    isAnonymous: boolean;
  };
  starRating?: number;
  comment: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

export interface LocationInsights {
  locationMetrics: Array<{
    locationName: string;
    timeZone: string;
    metricValues: Array<{
      metric: string;
      dimensionalValues: Array<{
        dimension: string;
        value: string;
        metricValues: Array<{
          metric: string;
          value: string;
        }>;
      }>;
    }>;
  }>;
}

export interface GoogleBusinessProfilePost {
  languageCode: string;
  summary: string;
  callToAction?: {
    actionType: string;
    url: string;
  };
  media?: Array<{
    mediaFormat: string;
    sourceUrl?: string;
  }>;
}

/**
 * Google Business Profile Service
 * Handles both mock data and real API calls based on feature flags
 */
export class GoogleBusinessProfileService {
  
  /**
   * Get accessible business accounts
   * ADAPTER: Uses mock data or real API based on feature flags
   */
  async getBusinessAccounts(userId: string): Promise<BusinessAccount[]> {
    // Use mock data during development
    if (shouldUseMockData()) {
      logDataSource('mock', 'Fetching business accounts');
      await this.simulateDelay();
      return mockGoogleBusinessData.accounts;
    }
    
    // Real API call when ready
    if (isGoogleApiEnabled()) {
      logDataSource('api', 'Fetching business accounts');
      const response = await fetch('/api/google-business-proxy/accounts', {
        headers: { 'X-User-ID': userId }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch accounts: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.accounts || [];
    }
    
    throw new Error('Google API not configured. Please check feature flags.');
  }
  
  /**
   * Get business locations for an account
   * ADAPTER: Uses mock data or real API based on feature flags
   */
  async getBusinessLocations(userId: string, accountName: string): Promise<BusinessLocation[]> {
    // Use mock data during development
    if (shouldUseMockData()) {
      logDataSource('mock', `Fetching locations for account: ${accountName}`);
      await this.simulateDelay();
      return getLocationsByAccount(accountName);
    }
    
    // Real API call when ready
    if (isGoogleApiEnabled()) {
      logDataSource('api', `Fetching locations for account: ${accountName}`);
      const response = await fetch(
        `/api/google-business-proxy/${accountName}/locations`,
        {
          headers: { 'X-User-ID': userId }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch locations: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.locations || [];
    }
    
    throw new Error('Google API not configured. Please check feature flags.');
  }
  
  /**
   * Get reviews for a location
   * ADAPTER: Uses mock data or real API based on feature flags
   */
  async getLocationReviews(userId: string, locationName: string): Promise<BusinessReview[]> {
    // Use mock data during development
    if (shouldUseMockData()) {
      logDataSource('mock', `Fetching reviews for location: ${locationName}`);
      await this.simulateDelay();
      return getReviewsByLocation(locationName);
    }
    
    // Real API call when ready
    if (isGoogleApiEnabled()) {
      logDataSource('api', `Fetching reviews for location: ${locationName}`);
      const response = await fetch(
        `/api/google-business-proxy/${locationName}/reviews`,
        {
          headers: { 'X-User-ID': userId }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.reviews || [];
    }
    
    throw new Error('Google API not configured. Please check feature flags.');
  }
  
  /**
   * Get location insights and analytics
   * ADAPTER: Uses mock data or real API based on feature flags
   */
  async getLocationInsights(userId: string, locationName: string): Promise<LocationInsights> {
    // Use mock data during development
    if (shouldUseMockData()) {
      logDataSource('mock', `Fetching insights for location: ${locationName}`);
      await this.simulateDelay();
      return mockGoogleBusinessData.insights;
    }
    
    // Real API call when ready
    if (isGoogleApiEnabled()) {
      logDataSource('api', `Fetching insights for location: ${locationName}`);
      const response = await fetch(
        `/api/google-business-proxy/${locationName}/insights`,
        {
          headers: { 'X-User-ID': userId }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch insights: ${response.statusText}`);
      }
      
      return await response.json();
    }
    
    throw new Error('Google API not configured. Please check feature flags.');
  }
  
  /**
   * Reply to a review
   * ADAPTER: Simulates in mock mode, real API in production
   */
  async replyToReview(
    userId: string,
    reviewName: string,
    replyText: string
  ): Promise<void> {
    // Simulate in mock mode
    if (shouldUseMockData()) {
      logDataSource('mock', `Simulating reply to review: ${reviewName}`);
      await this.simulateDelay();
      console.log('Mock review reply:', { reviewName, replyText });
      return;
    }
    
    // Real API call when ready
    if (isGoogleApiEnabled()) {
      logDataSource('api', `Posting reply to review: ${reviewName}`);
      const response = await fetch(
        `/api/google-business-proxy/${reviewName}/reply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': userId
          },
          body: JSON.stringify({ comment: replyText })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to post review reply: ${response.statusText}`);
      }
    } else {
      throw new Error('Google API not configured. Please check feature flags.');
    }
  }
  
  /**
   * Create a post on Google Business Profile
   * ADAPTER: Simulates in mock mode, real API in production
   */
  async createPost(
    userId: string,
    locationName: string,
    post: GoogleBusinessProfilePost
  ): Promise<void> {
    // Simulate in mock mode
    if (shouldUseMockData()) {
      logDataSource('mock', `Simulating post creation for: ${locationName}`);
      await this.simulateDelay();
      console.log('Mock post created:', { locationName, post });
      return;
    }
    
    // Real API call when ready
    if (isGoogleApiEnabled()) {
      logDataSource('api', `Creating post for location: ${locationName}`);
      const response = await fetch(
        `/api/google-business-proxy/${locationName}/posts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': userId
          },
          body: JSON.stringify(post)
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to create post: ${response.statusText}`);
      }
    } else {
      throw new Error('Google API not configured. Please check feature flags.');
    }
  }
  
  /**
   * Helper: Simulate API delay for realistic testing
   * @private
   */
  private async simulateDelay(): Promise<void> {
    const delay = getMockApiDelay();
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  /**
   * Helper: Format time for display (HH:MM AM/PM)
   */
  formatTime(time: string): string {
    if (!time) return '';
    
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }
  
  /**
   * Helper: Get primary category display name
   */
  getPrimaryCategory(location: BusinessLocation): string {
    return location.primaryCategory?.displayName || 'Business';
  }
  
  /**
   * Helper: Format address for display
   */
  formatAddress(location: BusinessLocation): string {
    if (!location.address) return 'Address not available';
    
    const { addressLines = [], locality = '', administrativeArea = '', postalCode = '' } = location.address;
    
    const parts = [
      ...addressLines,
      locality,
      administrativeArea,
      postalCode
    ].filter(Boolean);
    
    return parts.join(', ');
  }
  
  /**
   * Helper: Calculate review statistics
   */
  calculateReviewStats(reviews: BusinessReview[]) {
    if (!reviews.length) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        responseRate: 0
      };
    }

    const totalRating = reviews.reduce((sum, review) => 
      sum + (review.starRating || 0), 0
    );
    
    const averageRating = totalRating / reviews.length;
    
    const ratingDistribution = reviews.reduce((dist, review) => {
      const rating = review.starRating || 0;
      if (rating >= 1 && rating <= 5) {
        dist[rating] = (dist[rating] || 0) + 1;
      }
      return dist;
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>);
    
    const reviewsWithReplies = reviews.filter(r => r.reviewReply).length;
    const responseRate = (reviewsWithReplies / reviews.length) * 100;
    
    return {
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews: reviews.length,
      ratingDistribution,
      responseRate: Number(responseRate.toFixed(0))
    };
  }
}

// Export singleton instance
export const googleBusinessProfileService = new GoogleBusinessProfileService();