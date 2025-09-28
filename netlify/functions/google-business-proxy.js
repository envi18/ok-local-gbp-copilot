// netlify/functions/google-business-proxy.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to get valid access token
async function getValidAccessToken(userId) {
  try {
    // Get current token
    const { data: tokens, error } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !tokens || tokens.length === 0) {
      throw new Error('No active OAuth token found');
    }

    const token = tokens[0];
    const now = new Date();
    const expiresAt = new Date(token.expires_at);

    // If token is still valid, return it
    if (now < expiresAt) {
      return token.access_token;
    }

    // Token expired, refresh it
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: token.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!refreshResponse.ok) {
      throw new Error('Failed to refresh token');
    }

    const refreshData = await refreshResponse.json();
    const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000);

    // Update token in database
    await supabase
      .from('google_oauth_tokens')
      .update({
        access_token: refreshData.access_token,
        expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    return refreshData.access_token;
  } catch (error) {
    console.error('Error getting valid access token:', error);
    throw error;
  }
}

// Helper function to make Google API requests
async function makeGoogleAPIRequest(accessToken, endpoint, method = 'GET', body = null) {
  const baseUrl = 'https://mybusinessbusinessinformation.googleapis.com/v1';
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': process.env.SITE_URL || 'https://ok-local-gbp.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const { body } = event;
    const requestBody = body ? JSON.parse(body) : null;

    // Extract required parameters from request body
    const userId = requestBody?.user_id;
    const endpoint = requestBody?.endpoint;
    const method = requestBody?.method || 'GET';

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'user_id is required' }),
      };
    }

    if (!endpoint) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'endpoint is required' }),
      };
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(userId);

    // Make the Google API request
    const result = await makeGoogleAPIRequest(
      accessToken,
      endpoint,
      method,
      requestBody?.data
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };

  } catch (error) {
    console.error('Google Business API Proxy Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.stack 
      }),
    };
  }
};