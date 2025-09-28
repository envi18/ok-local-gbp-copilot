// src/lib/googleAuth.ts - Fixed to work with existing Netlify function
import { supabase } from './supabase';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/locations`;

// Updated scopes to ensure all required permissions
const SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
].join(' ');

export interface GoogleTokenData {
  id: string;
  user_id: string;
  google_user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scopes: string[];
  google_email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConnectionStatus {
  connected: boolean;
  loading: boolean;
  error: string | null;
  tokenData?: GoogleTokenData;
}

export class GoogleAuthService {
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent', // Force consent screen to ensure all permissions are shown
      state: 'security_token_' + Math.random().toString(36).substring(2),
      include_granted_scopes: 'true' // Include previously granted scopes
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, userId: string) {
    try {
      // Use the correct function name that exists in your project
      const response = await fetch('/.netlify/functions/google-oauth-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          userId,
          redirectUri: REDIRECT_URI
        }),
      });

      const responseData = await response.text();
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseData);
        } catch {
          errorData = { error: 'Unknown error', details: responseData };
        }
        
        console.error('OAuth exchange failed:', errorData);
        throw new Error(errorData.details || errorData.error || 'Token exchange failed');
      }

      const result = JSON.parse(responseData);
      console.log('OAuth exchange successful:', result);
      return result;
      
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to authenticate with Google');
    }
  }

  async refreshAccessToken(userId: string) {
    try {
      // Check if refresh token function exists, otherwise handle it in the main function
      const response = await fetch('/.netlify/functions/google-refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Token refresh failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error refreshing access token:', error);
      // Fallback: try to refresh using the existing tokens directly
      return this.fallbackTokenRefresh(userId);
    }
  }

  private async fallbackTokenRefresh(userId: string) {
    try {
      // Get the current token data directly from Supabase
      const { data: tokenData, error: fetchError } = await supabase
        .from('google_oauth_tokens')
        .select('refresh_token, access_token')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (fetchError || !tokenData?.refresh_token) {
        throw new Error('No refresh token found');
      }

      // Make the refresh request directly
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokenData.refresh_token,
          client_id: GOOGLE_CLIENT_ID,
        }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Token refresh failed at Google');
      }

      const refreshData = await refreshResponse.json();
      
      // Update the database with new token
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + refreshData.expires_in);

      const { error: updateError } = await supabase
        .from('google_oauth_tokens')
        .update({
          access_token: refreshData.access_token,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (updateError) {
        throw new Error('Failed to store refreshed token');
      }

      return { success: true };
    } catch (error) {
      console.error('Fallback token refresh failed:', error);
      throw new Error('Failed to refresh Google access token');
    }
  }

  // Check Google connection status
  async checkConnectionStatus(userId: string): Promise<ConnectionStatus> {
    try {
      if (!userId) {
        return { connected: false, loading: false, error: null };
      }

      const { data, error } = await supabase
        .from('google_oauth_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { connected: false, loading: false, error: null };
      }

      // Check if token is expired
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      
      if (expiresAt <= now) {
        // Try to refresh token
        try {
          await this.refreshAccessToken(userId);
          // Re-fetch updated token data
          const { data: refreshedData } = await supabase
            .from('google_oauth_tokens')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();
          
          return { 
            connected: true, 
            loading: false, 
            error: null, 
            tokenData: refreshedData 
          };
        } catch (refreshError) {
          return { 
            connected: false, 
            loading: false, 
            error: 'Token expired and refresh failed' 
          };
        }
      }

      return { 
        connected: true, 
        loading: false, 
        error: null, 
        tokenData: data 
      };

    } catch (error) {
      console.error('Error checking connection status:', error);
      return { 
        connected: false, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Connection check failed' 
      };
    }
  }
}

// Export singleton instance
export const googleAuthService = new GoogleAuthService();