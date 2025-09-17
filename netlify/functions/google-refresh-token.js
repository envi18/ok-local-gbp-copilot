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

  try {
    const { userId } = JSON.parse(event.body);
    const { data: tokenData } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const newTokens = await refreshResponse.json();
    const expiresAt = newTokens.expires_in 
      ? new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString()
      : null;

    await supabase
      .from('google_oauth_tokens')
      .update({
        access_token: newTokens.access_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenData.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
