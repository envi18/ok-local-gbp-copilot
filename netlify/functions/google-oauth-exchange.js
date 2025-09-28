// Update your netlify/functions/google-oauth-exchange.js
// Replace the token storage section with this code:

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
    } else {
      console.log('Deactivated existing tokens');
    }

    // Store new tokens
    const tokenRecord = {
      id: crypto.randomUUID(),
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

    console.log('Inserting new token record');

    const { data: insertData, error: insertError } = await supabase
      .from('google_oauth_tokens')
      .insert(tokenRecord)
      .select()
      .single();

    if (insertError) {
      console.error('Error storing tokens in database:', insertError);
      
      // If it's still a duplicate error, try to update the existing record
      if (insertError.code === '23505') {
        console.log('Attempting to update existing token record...');
        
        const { data: updateData, error: updateError } = await supabase
          .from('google_oauth_tokens')
          .update({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
            token_type: tokenData.token_type || 'Bearer',
            scopes: tokenData.scope ? tokenData.scope.split(' ') : [],
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('google_user_id', googleUserInfo.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating existing token:', updateError);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: 'Failed to update existing tokens',
              details: updateError.message
            }),
          };
        }

        console.log('Successfully updated existing token record');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true,
            message: 'OAuth tokens updated successfully',
            tokenId: updateData.id
          }),
        };
      }

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to store tokens in database',
          details: insertError.message
        }),
      };
    }

    console.log('Successfully stored new tokens in database');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'OAuth tokens stored successfully',
        tokenId: insertData.id
      }),
    };