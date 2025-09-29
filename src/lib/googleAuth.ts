// src/lib/googleAuth.ts
// Complete Google Auth Service with all required methods
import { supabase } from './supabase';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/locations`;

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
  scope: string;
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

class GoogleAuthService {
  private clientId: string;
  private redirectUri: string;
  private scope: string[];

  constructor() {
    this.clientId = GOOGLE_CLIENT_ID;
    this.redirectUri = REDIRECT_URI;
    this.scope = [
      'https://www.googleapis.com/auth/business.manage',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    if (!this.clientId) {
      throw new Error('Google Client ID not configured');
    }
  }

  generateSecurityToken(): string {
    return `security_token_${Math.random().toString(36).substr(2, 15)}`;
  }

  getAuthUrl(): string {
    const state = this.generateSecurityToken();
    const params = new URLSearchParams({
      access_type: 'offline',
      client_id: this.clientId,
      include_granted_scopes: 'true',
      prompt: 'consent',
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: SCOPES,
      state: state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('Starting token exchange...');
      
      // Call our Netlify function - FIXED URL
      const response = await fetch('/.netlify/functions/google-oauth-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          userId,
          redirectUri: this.redirectUri,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        const textResponse = await response.text();
        console.error('Raw response:', textResponse);
        throw new Error(`Server returned invalid response: ${textResponse}`);
      }

      if (!response.ok) {
        console.error('OAuth exchange failed:', responseData);
        throw new Error(responseData.error || `HTTP ${response.status}: ${responseData.details || 'Unknown error'}`);
      }

      console.log('OAuth exchange successful');
      return { success: true, data: responseData };

    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to authenticate with Google');
    }
  }

  async refreshAccessToken(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('Attempting to refresh access token...');
      
      const response = await fetch('/.netlify/functions/google-refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Token refresh successful');
      return { success: true, data };

    } catch (error) {
      console.error('Error refreshing token:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Token refresh failed' 
      };
    }
  }

  // Check Google connection status
  async checkConnectionStatus(userId: string): Promise<ConnectionStatus> {
    try {
      console.log('Checking Google connection status for user:', userId);
      
      // Query for active tokens for this user
      const { data, error } = await supabase
        .from('google_oauth_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle() to handle no results gracefully

      if (error) {
        console.error('Error checking Google connection:', error);
        return {
          connected: false,
          loading: false,
          error: `Database error: ${error.message}`
        };
      }

      if (!data) {
        console.log('No active Google connection found');
        return {
          connected: false,
          loading: false,
          error: null
        };
      }

      console.log('Found active Google connection:', {
        google_email: data.google_email,
        expires_at: data.expires_at,
        created_at: data.created_at
      });

      // Check if token is still valid (not expired)
      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      
      if (expiresAt <= now) {
        console.log('Token expired, attempting automatic refresh...');
        
        // Try to refresh the token automatically
        try {
          await this.refreshAccessToken(userId);
          
          // Re-check status after refresh
          const { data: refreshedData, error: refreshError } = await supabase
            .from('google_oauth_tokens')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (refreshError || !refreshedData) {
            throw new Error('Failed to retrieve refreshed token');
          }

          console.log('Token refreshed successfully');
          return {
            connected: true,
            loading: false,
            error: null,
            tokenData: refreshedData
          };
        } catch (refreshError) {
          console.error('Failed to refresh expired token:', refreshError);
          return {
            connected: false,
            loading: false,
            error: 'Token expired and refresh failed - please reconnect to Google',
            tokenData: data
          };
        }
      }

      return {
        connected: true,
        loading: false,
        error: null,
        tokenData: data
      };
      
    } catch (err) {
      console.error('Unexpected error checking Google connection:', err);
      return {
        connected: false,
        loading: false,
        error: 'Failed to check connection status'
      };
    }
  }

  // Get valid access token (refresh if needed)
  async getValidAccessToken(userId: string): Promise<string | null> {
    try {
      const status = await this.checkConnectionStatus(userId);
      
      if (!status.connected || !status.tokenData) {
        return null;
      }

      return status.tokenData.access_token;
    } catch (error) {
      console.error('Error getting valid access token:', error);
      return null;
    }
  }

  // Disconnect Google account
  async disconnect(userId: string): Promise<boolean> {
    try {
      console.log('Disconnecting Google account for user:', userId);
      
      const { error } = await supabase
        .from('google_oauth_tokens')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) {
        console.error('Error disconnecting Google account:', error);
        return false;
      }

      console.log('Successfully disconnected Google account');
      return true;
    } catch (error) {
      console.error('Unexpected error disconnecting Google account:', error);
      return false;
    }
  }

  // Clear expired tokens and force reconnection
  async clearExpiredTokens(userId: string): Promise<boolean> {
    try {
      console.log('Clearing expired tokens for user:', userId);
      
      const { error } = await supabase
        .from('google_oauth_tokens')
        .update({ is_active: false })
        .eq('user_id', userId)
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error clearing expired tokens:', error);
        return false;
      }

      console.log('Successfully cleared expired tokens');
      return true;
    } catch (error) {
      console.error('Unexpected error clearing expired tokens:', error);
      return false;
    }
  }
}

export const googleAuthService = new GoogleAuthService();