// src/lib/googleBusinessProfileService.ts
// Google Business Profile API service for managing business data

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
  private readonly proxyUrl = '/.netlify/functions/google-business-proxy';

  /**
   * Make a request through the proxy function
   */
  private async makeProxyRequest(
    endpoint: string, 
    userId: string, 
    httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ) {
    try {
      const requestBody = {
        user_id: userId,
        endpoint,
        method: httpMethod, // Pass the HTTP method to the proxy
        ...(data && { data })
      };

      const response = await fetch(this.proxyUrl, {
        method: 'POST', // Always POST to the proxy function
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Proxy request error:', error);
      throw error;
    }
  }

  /**
   * Get all business accounts accessible by the authenticated user
   */
  async getBusinessAccounts(userId: string): Promise<BusinessAccount[]> {
    try {
      const result = await this.makeProxyRequest('/accounts', userId);
      return result.accounts || [];
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
      const result = await this.makeProxyRequest(`/${accountName}/locations`, userId);
      return result.locations || [];
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
      const result = await this.makeProxyRequest(`/${locationName}/reviews`, userId);
      return result.reviews || [];
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
      // Get insights for the last 90 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);

      const requestData = {
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

      const result = await this.makeProxyRequest(
        '/accounts/*/locations:reportInsights', 
        userId, 
        'POST', 
        requestData
      );
      
      return result;
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
      await this.makeProxyRequest(
        `/${reviewName}/reply`,
        userId,
        'PUT',
        { comment: replyText }
      );
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
      await this.makeProxyRequest(
        `/${locationName}/localPosts`,
        userId,
        'POST',
        postData
      );
      return true;
    } catch (error) {
      console.error('Error creating location post:', error);
      return false;
    }
  }

  /**
   * Update location information
   */
  async updateLocation(userId: string, locationName: string, locationData: Partial<BusinessLocation>): Promise<BusinessLocation> {
    try {
      const result = await this.makeProxyRequest(
        `/${locationName}`,
        userId,
        'PUT',
        locationData
      );
      return result;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  /**
   * Get detailed information for a specific location
   */
  async getLocationDetails(userId: string, locationName: string): Promise<BusinessLocation> {
    try {
      const result = await this.makeProxyRequest(`/${locationName}`, userId);
      return result;
    } catch (error) {
      console.error('Error fetching location details:', error);
      throw error;
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
    
    const hoursMap = new Map<string, string>();
    
    periods.forEach(period => {
      const openDay = dayNames[parseInt(period.openDay)] || period.openDay;
      const closeDay = dayNames[parseInt(period.closeDay)] || period.closeDay;
      const openTime = this.formatTime(period.openTime);
      const closeTime = this.formatTime(period.closeTime);
      
      if (openDay === closeDay) {
        hoursMap.set(openDay, `${openTime} - ${closeTime}`);
      } else {
        hoursMap.set(openDay, `${openTime} - ${closeTime} (closes ${closeDay})`);
      }
    });

    return Array.from(hoursMap.entries())
      .map(([day, hours]) => `${day}: ${hours}`)
      .join(', ');
  }

  /**
   * Helper method to format time strings
   */
  private formatTime(time: string): string {
    if (!time || time.length !== 4) return time;
    
    const hours = parseInt(time.substring(0, 2), 10);
    const minutes = time.substring(2, 4);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${displayHours}:${minutes} ${ampm}`;
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

  /**
   * Helper method to compare local business data with Google data
   */
  compareWithLocalData(googleLocation: BusinessLocation, localLocation: any) {
    const discrepancies = [];

    // Compare basic info
    if (googleLocation.locationName !== localLocation.name) {
      discrepancies.push({
        field: 'name',
        local: localLocation.name,
        google: googleLocation.locationName
      });
    }

    if (googleLocation.primaryPhone !== localLocation.phone) {
      discrepancies.push({
        field: 'phone',
        local: localLocation.phone,
        google: googleLocation.primaryPhone
      });
    }

    // Compare address
    const googleAddress = this.formatAddress(googleLocation);
    if (googleAddress !== localLocation.address) {
      discrepancies.push({
        field: 'address',
        local: localLocation.address,
        google: googleAddress
      });
    }

    return discrepancies;
  }

  /**
   * Calculate review statistics
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

    const reviewsWithReplies = reviews.filter(review => review.reviewReply);
    const responseRate = (reviewsWithReplies.length / reviews.length) * 100;

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution,
      responseRate: Math.round(responseRate)
    };
  }

  /**
   * Get business hours in structured format
   */
  getStructuredHours(location: BusinessLocation) {
    if (!location.regularHours?.periods) {
      return [];
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hoursMap = new Map();

    location.regularHours.periods.forEach(period => {
      const day = dayNames[parseInt(period.openDay)] || period.openDay;
      const openTime = this.formatTime(period.openTime);
      const closeTime = this.formatTime(period.closeTime);
      hoursMap.set(day, `${openTime} - ${closeTime}`);
    });

    return dayNames.map(day => ({
      day: day,
      hours: hoursMap.get(day) || 'Closed',
      isOpen: hoursMap.has(day)
    }));
  }
}

export const googleBusinessProfileService = new GoogleBusinessProfileService();