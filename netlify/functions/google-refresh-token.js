// netlify/functions/google-refresh-token.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    console.log('Starting token refresh process...');
    
    const { userId } = JSON.parse(event.body);
    console.log('Refresh request for user:', userId);

    if (!userId) {
      console.error('Missing userId parameter');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing userId parameter' })
      };
    }

    if (!googleClientId || !googleClientSecret) {
      console.error('Missing Google OAuth credentials');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    // Get the current active token for this user
    console.log('Fetching current token from database...');
    const { data: tokenData, error: fetchError } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      console.error('Database error fetching token:', fetchError.message);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'No active Google token found for user',
          details: fetchError.message
        })
      };
    }

    if (!tokenData) {
      console.error('No active token found for user');
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No active Google token found for user' })
      };
    }

    if (!tokenData.refresh_token) {
      console.error('No refresh token available');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'No refresh token available - user must reconnect',
          reconnect_required: true
        })
      };
    }

    console.log('Found token, attempting refresh...');
    console.log('Token expires at:', tokenData.expires_at);
    console.log('Current time:', new Date().toISOString());

    // Use the refresh token to get a new access token
    console.log('Making request to Google token endpoint...');
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    console.log('Google response status:', refreshResponse.status);

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error('Google token refresh failed:', refreshResponse.status, errorText);
      
      // Parse error response if it's JSON
      let errorDetails = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.error_description || errorJson.error || errorText;
      } catch (e) {
        // Keep original text if not JSON
      }
      
      // If refresh token is invalid, mark the token as inactive
      if (errorText.includes('invalid_grant') || errorText.includes('invalid_request')) {
        console.log('Refresh token is invalid, deactivating token...');
        await supabase
          .from('google_oauth_tokens')
          .update({ is_active: false })
          .eq('id', tokenData.id);
          
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ 
            error: 'Refresh token expired - user must reconnect',
            reconnect_required: true,
            details: errorDetails
          })
        };
      }
      
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to refresh token',
          details: errorDetails
        })
      };
    }

    const newTokens = await refreshResponse.json();
    console.log('Successfully received refreshed tokens from Google');
    console.log('New token expires in:', newTokens.expires_in, 'seconds');

    // Calculate new expiration time
    const expiresAt = newTokens.expires_in 
      ? new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString()
      : null;

    if (!expiresAt) {
      console.error('No expiration time provided by Google');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Invalid token response from Google' })
      };
    }

    // Update the token in the database
    console.log('Updating token in database...');
    const updateData = {
      access_token: newTokens.access_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString()
    };

    // If a new refresh token was provided, update it too
    if (newTokens.refresh_token) {
      updateData.refresh_token = newTokens.refresh_token;
      console.log('New refresh token also provided');
    }

    const { data: updatedToken, error: updateError } = await supabase
      .from('google_oauth_tokens')
      .update(updateData)
      .eq('id', tokenData.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating token in database:', updateError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to update refreshed token in database',
          details: updateError.message
        })
      };
    }

    console.log('Successfully updated token in database');
    console.log('New expiration time:', expiresAt);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'Token refreshed successfully',
        expires_at: expiresAt
      })
    };

  } catch (error) {
    console.error('Unexpected error in token refresh:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error during token refresh',
        details: error.message
      })
    };
  }
};