// src/lib/googleAuth.ts - Complete Google Auth Service
import { supabase } from './supabase'; // Make sure you import your supabase client

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

export class GoogleAuthService {
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: 'security_token_' + Math.random().toString(36).substring(2)
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, userId: string) {
    try {
      // Using production function URL
      const response = await fetch('https://ok-local-gbp.netlify.app/.netlify/functions/google-oauth-exchange', {
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Token exchange failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to authenticate with Google');
    }
  }

  async refreshAccessToken(userId: string) {
    try {
      // Using production function URL
      const response = await fetch('https://ok-local-gbp.netlify.app/.netlify/functions/google-refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Token refresh failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh Google access token');
    }
  }

  // NEW: Check Google connection status
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
        console.log('Token expired, needs refresh');
        return {
          connected: false,
          loading: false,
          error: 'Token expired - please reconnect to Google',
          tokenData: data
        };
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

  // NEW: Get valid access token (refresh if needed)
  async getValidAccessToken(userId: string): Promise<string | null> {
    try {
      const status = await this.checkConnectionStatus(userId);
      
      if (!status.connected || !status.tokenData) {
        return null;
      }

      // Check if token is close to expiring (within 5 minutes)
      const now = new Date();
      const expiresAt = new Date(status.tokenData.expires_at);
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      if (expiresAt <= fiveMinutesFromNow) {
        console.log('Token expiring soon, refreshing...');
        try {
          await this.refreshAccessToken(userId);
          // Get the new token after refresh
          const refreshedStatus = await this.checkConnectionStatus(userId);
          return refreshedStatus.tokenData?.access_token || null;
        } catch (error) {
          console.error('Failed to refresh token:', error);
          return null;
        }
      }

      return status.tokenData.access_token;
    } catch (error) {
      console.error('Error getting valid access token:', error);
      return null;
    }
  }

  // NEW: Disconnect Google account
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
}

export const googleAuthService = new GoogleAuthService();

// NEW: React hook for Google connection status
import { useEffect, useState } from 'react';

export function useGoogleConnection(userId: string | null) {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!userId) {
      setStatus({ connected: false, loading: false, error: null });
      return;
    }

    let mounted = true;

    const checkStatus = async () => {
      try {
        const result = await googleAuthService.checkConnectionStatus(userId);
        if (mounted) {
          setStatus(result);
        }
      } catch (error) {
        if (mounted) {
          setStatus({
            connected: false,
            loading: false,
            error: 'Failed to check connection status'
          });
        }
      }
    };

    checkStatus();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const refresh = async () => {
    if (!userId) return;
    
    setStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await googleAuthService.checkConnectionStatus(userId);
      setStatus(result);
    } catch (error) {
      setStatus({
        connected: false,
        loading: false,
        error: 'Failed to refresh connection status'
      });
    }
  };

  const disconnect = async () => {
    if (!userId) return false;
    
    const success = await googleAuthService.disconnect(userId);
    if (success) {
      setStatus({ connected: false, loading: false, error: null });
    }
    return success;
  };

  return {
    ...status,
    refresh,
    disconnect
  };
}