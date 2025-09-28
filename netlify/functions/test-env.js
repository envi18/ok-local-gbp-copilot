// netlify/functions/test-env.js
// Temporary function to test environment variables

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  const envStatus = {
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  // Show partial values for debugging (first 10 chars)
  const envPartials = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 10) + '...' : 'MISSING',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.substring(0, 10) + '...' : 'MISSING',
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? process.env.VITE_SUPABASE_URL.substring(0, 30) + '...' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...' : 'MISSING',
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ 
      envStatus,
      envPartials,
      message: 'Environment variables check complete'
    }),
  };
};