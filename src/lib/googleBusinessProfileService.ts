// src/lib/googleBusinessProfileService.ts
// Google Business Profile API service for managing business data

import { googleAuthService } from './googleAuth';

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
  topicType: string;
}

class GoogleBusinessProfileService {
  private readonly baseUrl = 'https://mybusinessbusinessinformation.googleapis.com/v1';
  private readonly baseUrlGBP = 'https://mybusiness.googleapis.com/v4';

  /**
   * Get all business accounts accessible by the authenticated user
   */
  async getBusinessAccounts(userId: string): Promise<BusinessAccount[]> {
    try {
      const accessToken = await googleAuthService.getValidAccessToken(userId);
      if (!accessToken) {
        throw new Error('No valid access token available');
      }

      const response = await fetch(`${this.baseUrl}/accounts`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch accounts: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.accounts || [];
    } catch (error) {
      console.error('Error fetching business accounts:', error);
      throw error;
    }
  }

  /**
   * Get all locations for a specific business account
   */
  async getBusinessLocations(userId: string, accountName: string): Promise<BusinessLocation[]> {
    try {
      const accessToken = await googleAuthService.getValidAccessToken(userId);
      if (!accessToken) {
        throw new Error('No valid access token available');
      }

      const response = await fetch(`${this.baseUrl}/${accountName}/locations`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch locations: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.locations || [];
    } catch (error) {
      console.error('Error fetching business locations:', error);
      throw error;
    }
  }

  /**
   * Get reviews for a specific location
   */
  async getLocationReviews(userId: string, locationName: string): Promise<BusinessReview[]> {
    try {
      const accessToken = await googleAuthService.getValidAccessToken(userId);
      if (!accessToken) {
        throw new Error('No valid access token available');
      }

      const response = await fetch(`${this.baseUrlGBP}/${locationName}/reviews`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.reviews || [];
    } catch (error) {
      console.error('Error fetching location reviews:', error);
      throw error;
    }
  }

  /**
   * Get insights/analytics for a specific location
   */
  async getLocationInsights(userId: string, locationName: string): Promise<LocationInsights> {
    try {
      const accessToken = await googleAuthService.getValidAccessToken(userId);
      if (!accessToken) {
        throw new Error('No valid access token available');
      }

      // Get insights for the last 90 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);

      const requestBody = {
        locationNames: [locationName],
        basicRequest: {
          metricRequests: [
            { metric: 'QUERIES_DIRECT' },
            { metric: 'QUERIES_INDIRECT' },
            { metric: 'VIEWS_MAPS' },
            { metric: 'VIEWS_SEARCH' },
            { metric: 'ACTIONS_WEBSITE' },
            { metric: 'ACTIONS_PHONE' },
            { metric: 'ACTIONS_DRIVING_DIRECTIONS' },
          ],
          timeRange: {
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        },
      };

      const response = await fetch(`${this.baseUrlGBP}/accounts/*/locations:reportInsights`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch insights: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching location insights:', error);
      throw error;
    }
  }

  /**
   * Reply to a customer review
   */
  async replyToReview(userId: string, reviewName: string, replyText: string): Promise<boolean> {
    try {
      const accessToken = await googleAuthService.getValidAccessToken(userId);
      if (!accessToken) {
        throw new Error('No valid access token available');
      }

      const response = await fetch(`${this.baseUrlGBP}/${reviewName}/reply`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: replyText,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to reply to review: ${response.status} ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error replying to review:', error);
      return false;
    }
  }

  /**
   * Create a post for a specific location
   */
  async createLocationPost(userId: string, locationName: string, postData: GoogleBusinessProfilePost): Promise<boolean> {
    try {
      const accessToken = await googleAuthService.getValidAccessToken(userId);
      if (!accessToken) {
        throw new Error('No valid access token available');
      }

      const response = await fetch(`${this.baseUrlGBP}/${locationName}/localPosts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create post: ${response.status} ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error creating location post:', error);
      return false;
    }
  }

  /**
   * Helper method to format business hours for display
   */
  formatBusinessHours(location: BusinessLocation): string {
    if (!location.regularHours?.periods || location.regularHours.periods.length === 0) {
      return 'Hours not available';
    }

    const periods = location.regularHours.periods;
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return periods.map(period => {
      const openDay = dayNames[parseInt(period.openDay)];
      const closeDay = dayNames[parseInt(period.closeDay)];
      
      if (openDay === closeDay) {
        return `${openDay}: ${period.openTime} - ${period.closeTime}`;
      } else {
        return `${openDay} ${period.openTime} - ${closeDay} ${period.closeTime}`;
      }
    }).join(', ');
  }

  /**
   * Helper method to get primary category display name
   */
  getPrimaryCategory(location: BusinessLocation): string {
    return location.primaryCategory?.displayName || 'Business';
  }

  /**
   * Helper method to format address for display
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
}

export const googleBusinessProfileService = new GoogleBusinessProfileService();