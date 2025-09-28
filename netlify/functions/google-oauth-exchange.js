// netlify/functions/google-oauth-exchange.js
// Enhanced with better error handling and debugging

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

exports.handler = async (event, context) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('Starting OAuth exchange process...');
    
    // Check environment variables
    const requiredEnvVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'VITE_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error('Missing environment variables:', missingVars);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error',
          details: `Missing environment variables: ${missingVars.join(', ')}`
        }),
      };
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
      console.log('Request received with keys:', Object.keys(requestBody));
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }

    const { code, userId, redirectUri } = requestBody;

    // Validate required fields
    if (!code || !userId || !redirectUri) {
      console.error('Missing required fields:', { code: !!code, userId: !!userId, redirectUri: !!redirectUri });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          required: ['code', 'userId', 'redirectUri']
        }),
      };
    }

    console.log('Exchanging code for tokens with Google...');
    console.log('Redirect URI:', redirectUri);
    
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Google token exchange failed:', tokenData);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Google OAuth token exchange failed',
          details: tokenData.error_description || tokenData.error
        }),
      };
    }

    console.log('Successfully received tokens from Google');
    console.log('Token data keys:', Object.keys(tokenData));

    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Storing tokens in Supabase...');

    // First, deactivate any existing tokens for this user
    const { error: deactivateError } = await supabase
      .from('google_oauth_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (deactivateError) {
      console.error('Error deactivating existing tokens:', deactivateError);
      // Continue anyway, this is not critical
    }

    // Get user's organization_id from their profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('user_id', userId)
      .single();

    if (profileError || !userProfile?.organization_id) {
      console.error('Error getting user organization:', profileError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'User organization not found',
          details: 'User must have a valid organization to connect Google account'
        }),
      };
    }

    // Get Google user info to store additional data
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    let googleUserInfo = {};
    if (userInfoResponse.ok) {
      googleUserInfo = await userInfoResponse.json();
      console.log('Retrieved Google user info');
    } else {
      console.warn('Could not retrieve Google user info');
    }

    // Store new tokens
    const tokenRecord = {
      id: crypto.randomUUID(), // Generate UUID for primary key
      user_id: userId,
      organization_id: userProfile.organization_id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
      token_type: tokenData.token_type || 'Bearer',
      google_user_id: googleUserInfo.id || 'unknown',
      google_email: googleUserInfo.email || 'unknown',
      google_name: googleUserInfo.name || null,
      google_picture: googleUserInfo.picture || null,
      scopes: tokenData.scope ? tokenData.scope.split(' ') : [],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Inserting token record with keys:', Object.keys(tokenRecord));

    const { data: insertData, error: insertError } = await supabase
      .from('google_oauth_tokens')
      .insert(tokenRecord)
      .select()
      .single();

    if (insertError) {
      console.error('Error storing tokens in database:', insertError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to store tokens in database',
          details: insertError.message
        }),
      };
    }

    console.log('Successfully stored tokens in database');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'OAuth tokens stored successfully',
        tokenId: insertData.id
      }),
    };

  } catch (error) {
    console.error('Unexpected error in OAuth exchange:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
    };
  }
};