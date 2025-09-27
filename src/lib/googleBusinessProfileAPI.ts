// src/lib/googleBusinessProfileAPI.ts
import { supabase } from './supabase';

export interface GoogleBusinessAccount {
  name: string;
  accountId: string;
  displayName: string;
  type: string;
}

export interface GoogleBusinessLocation {
  name: string;
  locationName: string;
  primaryPhone?: string;
  websiteUri?: string;
  regularHours?: any;
  latlng?: {
    latitude: number;
    longitude: number;
  };
  primaryCategory?: {
    displayName: string;
  };
  storefrontAddress?: {
    addressLines: string[];
    locality: string;
    administrativeArea: string;
    postalCode: string;
  };
}

export class GoogleBusinessProfileAPI {
  private baseUrl = 'https://mybusinessbusinessinformation.googleapis.com/v1';

  async getValidAccessToken(userId: string): Promise<string> {
    const { data: tokens, error } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !tokens) {
      throw new Error('No active Google OAuth token found');
    }

    // Check if token is expired
    if (tokens.expires_at && new Date(tokens.expires_at) < new Date()) {
      // Token expired, refresh it
      const refreshResponse = await fetch('/api/google-refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh access token');
      }

      const refreshData = await refreshResponse.json();
      return refreshData.access_token;
    }

    return tokens.access_token;
  }

  async makeAuthenticatedRequest(url: string, userId: string) {
    const accessToken = await this.getValidAccessToken(userId);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google API request failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async getBusinessAccounts(userId: string): Promise<GoogleBusinessAccount[]> {
    try {
      const data = await this.makeAuthenticatedRequest(
        'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
        userId
      );
      
      return data.accounts || [];
    } catch (error) {
      console.error('Error fetching business accounts:', error);
      throw error;
    }
  }

  async getLocationsForAccount(accountName: string, userId: string): Promise<GoogleBusinessLocation[]> {
    try {
      const data = await this.makeAuthenticatedRequest(
        `${this.baseUrl}/${accountName}/locations`,
        userId
      );
      
      return data.locations || [];
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  }
}

export const googleBusinessAPI = new GoogleBusinessProfileAPI();