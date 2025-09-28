// netlify/functions/google-business-proxy.js
// Enhanced proxy with permission validation support

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { user_id, endpoint, method = 'GET', data, useOAuth2 = false } = JSON.parse(event.body);

    if (!user_id || !endpoint) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    // Get the user's OAuth token
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .single();

    if (tokenError || !tokenData) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'No valid OAuth token found' })
      };
    }

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    
    if (expiresAt <= now) {
      // Try to refresh the token
      const refreshResult = await refreshAccessToken(tokenData.refresh_token, user_id);
      if (!refreshResult.success) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Token expired and refresh failed' })
        };
      }
      tokenData.access_token = refreshResult.access_token;
    }

    // Determine the base URL based on the endpoint type
    let baseUrl;
    if (useOAuth2 || endpoint === '/userinfo') {
      // Use OAuth2 API for user info
      baseUrl = 'https://www.googleapis.com/oauth2/v2';
    } else {
      // Use Google Business Profile API
      baseUrl = 'https://mybusinessbusinessinformation.googleapis.com/v1';
    }

    // Construct the full URL
    const url = `${baseUrl}${endpoint}`;

    // Make the request to Google API
    const requestOptions = {
      method: method,
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestOptions.body = JSON.stringify(data);
    }

    console.log(`Making ${method} request to: ${url}`);

    const response = await fetch(url, requestOptions);
    const responseData = await response.text();

    // Log the response for debugging
    console.log(`Response status: ${response.status}`);
    console.log(`Response data: ${responseData.substring(0, 500)}...`);

    // Return the response
    return {
      statusCode: response.status,
      headers,
      body: responseData
    };

  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      })
    };
  }
};

// Helper function to refresh access token
async function refreshAccessToken(refreshToken, userId) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Token refresh failed:', errorData);
      return { success: false, error: errorData.error_description || 'Token refresh failed' };
    }

    const tokenData = await response.json();
    
    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    // Update the database with new token
    const { error: updateError } = await supabase
      .from('google_oauth_tokens')
      .update({
        access_token: tokenData.access_token,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (updateError) {
      console.error('Failed to update refreshed token:', updateError);
      return { success: false, error: 'Failed to store refreshed token' };
    }

    return { 
      success: true, 
      access_token: tokenData.access_token,
      expires_at: expiresAt.toISOString()
    };

  } catch (error) {
    console.error('Token refresh error:', error);
    return { success: false, error: error.message };
  }
}