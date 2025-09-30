// netlify/functions/create-user.js
// Netlify function to create users with admin privileges

const { createClient } = require('@supabase/supabase-js');

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const userData = JSON.parse(event.body);
    console.log('Creating user via Netlify function:', userData.email);

    // Validate required fields
    const { first_name, last_name, email, password, role, organization_id } = userData;
    
    if (!first_name || !last_name || !email || !password || !role || !organization_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields: first_name, last_name, email, password, role, organization_id' 
        })
      };
    }

    // Step 1: Create user in Supabase Auth using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: {
        first_name: first_name,
        last_name: last_name,
        role: role
      }
    });

    if (authError) {
      console.error('❌ Auth user creation failed:', authError);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: `Failed to create auth user: ${authError.message}` 
        })
      };
    }

    console.log('✅ Auth user created:', authData.user?.id);

    // Step 2: Create profile record
    const profileData = {
      id: authData.user.id,
      organization_id: organization_id,
      first_name: first_name,
      last_name: last_name,
      email: email,
      role: role,
      status: 'active'
    };

    const { data: profileResult, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)
      .select(`
        *,
        organization:organizations(*)
      `)
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError);
      
      // Clean up: delete the auth user if profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: `Failed to create profile: ${profileError.message}` 
        })
      };
    }

    console.log('✅ User created successfully:', profileResult);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ 
        data: profileResult,
        message: 'User created successfully' 
      })
    };

  } catch (error) {
    console.error('Error in create-user function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: `Server error: ${error.message}` 
      })
    };
  }
};