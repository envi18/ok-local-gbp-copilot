// src/lib/googleBusinessService.ts
import { supabase } from './supabase';

export interface GoogleBusinessLocation {
  name: string;
  locationName: string;
  primaryPhone: string;
  primaryCategory: {
    categoryId: string;
    displayName: string;
  };
  websiteUri: string;
  regularHours: {
    periods: Array<{
      openDay: string;
      openTime: string;
      closeDay: string;
      closeTime: string;
    }>;
  };
  latlng: {
    latitude: number;
    longitude: number;
  };
  profile: {
    description: string;
  };
  metadata: {
    mapsUri: string;
    newReviewUri: string;
  };
  serviceArea?: {
    businessType: string;
  };
}

export interface GoogleBusinessReview {
  name: string;
  reviewer: {
    profilePhotoUri: string;
    displayName: string;
    isAnonymous: boolean;
  };
  starRating: number;
  comment: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

export interface GoogleBusinessPost {
  name: string;
  languageCode: string;
  summary: string;
  event?: {
    title: string;
    schedule: {
      startDate: string;
      startTime: string;
      endDate: string;
      endTime: string;
    };
  };
  media: Array<{
    mediaFormat: string;
    sourceUri: string;
    locationAssociation: {
      category: string;
    };
  }>;
  topicType: string;
  createTime: string;
  updateTime: string;
  state: string;
}

export class GoogleBusinessService {
  private baseUrl = 'https://mybusinessbusinessinformation.googleapis.com/v1';
  private reviewsBaseUrl = 'https://mybusinessaccountmanagement.googleapis.com/v1';

  constructor(private accessToken: string) {}

  private async makeRequest(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Google API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    return response.json();
  }

  /**
   * Get list of accessible accounts
   */
  async getAccounts() {
    try {
      const response = await this.makeRequest(
        `${this.reviewsBaseUrl}/accounts`
      );
      return response.accounts || [];
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  }

  /**
   * Get list of locations for an account
   */
  async getLocations(accountName: string): Promise<GoogleBusinessLocation[]> {
    try {
      const response = await this.makeRequest(
        `${this.baseUrl}/${accountName}/locations?readMask=name,locationName,primaryPhone,primaryCategory,websiteUri,regularHours,latlng,profile.description,metadata.mapsUri,metadata.newReviewUri,serviceArea.businessType`
      );
      return response.locations || [];
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  }

  /**
   * Get reviews for a specific location
   */
  async getLocationReviews(locationName: string): Promise<GoogleBusinessReview[]> {
    try {
      const response = await this.makeRequest(
        `${this.reviewsBaseUrl}/${locationName}/reviews`
      );
      return response.reviews || [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  }

  /**
   * Reply to a review
   */
  async replyToReview(reviewName: string, replyText: string) {
    try {
      const response = await this.makeRequest(
        `${this.reviewsBaseUrl}/${reviewName}/reply`,
        {
          method: 'PUT',
          body: JSON.stringify({
            comment: replyText,
          }),
        }
      );
      return response;
    } catch (error) {
      console.error('Error replying to review:', error);
      throw error;
    }
  }

  /**
   * Get posts for a location
   */
  async getLocationPosts(locationName: string): Promise<GoogleBusinessPost[]> {
    try {
      const response = await this.makeRequest(
        `${this.baseUrl}/${locationName}/localPosts`
      );
      return response.localPosts || [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  /**
   * Create a new post for a location
   */
  async createPost(locationName: string, postData: Partial<GoogleBusinessPost>) {
    try {
      const response = await this.makeRequest(
        `${this.baseUrl}/${locationName}/localPosts`,
        {
          method: 'POST',
          body: JSON.stringify(postData),
        }
      );
      return response;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * Sync location data to our database
   */
  async syncLocationToDatabase(
    locationData: GoogleBusinessLocation,
    organizationId: string,
    userId: string
  ) {
    try {
      // Extract location details
      const locationInfo = {
        organization_id: organizationId,
        name: locationData.locationName,
        address: 'Address from Google API', // You'll need to implement address parsing
        phone: locationData.primaryPhone,
        website: locationData.websiteUri,
        google_place_id: locationData.name,
        google_maps_url: locationData.metadata?.mapsUri,
        latitude: locationData.latlng?.latitude,
        longitude: locationData.latlng?.longitude,
        business_hours: JSON.stringify(locationData.regularHours),
        description: locationData.profile?.description,
        primary_category: locationData.primaryCategory?.displayName,
        last_synced: new Date().toISOString(),
        sync_status: 'synced',
        created_by: userId,
        updated_at: new Date().toISOString(),
      };

      // Insert or update location in database
      const { data, error } = await supabase
        .from('locations')
        .upsert(locationInfo, {
          onConflict: 'google_place_id',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error syncing location to database:', error);
      throw error;
    }
  }

  /**
   * Sync reviews to database
   */
  async syncReviewsToDatabase(
    reviews: GoogleBusinessReview[],
    locationId: string
  ) {
    try {
      const reviewsData = reviews.map(review => ({
        location_id: locationId,
        google_review_id: review.name,
        customer_name: review.reviewer.displayName,
        customer_photo: review.reviewer.profilePhotoUri,
        rating: review.starRating,
        review_text: review.comment,
        review_date: review.createTime,
        response_text: review.reviewReply?.comment || null,
        response_date: review.reviewReply?.updateTime || null,
        last_synced: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('reviews')
        .upsert(reviewsData, {
          onConflict: 'google_review_id',
        })
        .select();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error syncing reviews to database:', error);
      throw error;
    }
  }
}
