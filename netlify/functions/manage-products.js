// netlify/functions/manage-products.js
// Secure product assignment using service role

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const { action, organizationId, productId } = JSON.parse(event.body);

    // Validate inputs
    if (!action || !organizationId || !productId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields: action, organizationId, productId' 
        })
      };
    }

    if (!['add', 'remove'].includes(action)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid action. Must be "add" or "remove"' 
        })
      };
    }

    // Initialize Supabase client with service role
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log(`${action === 'add' ? '➕' : '➖'} ${action} product:`, { organizationId, productId });

    if (action === 'add') {
      // Check if assignment already exists
      const { data: existing, error: fetchError } = await supabase
        .from('organization_products')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('product_id', productId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking existing assignment:', fetchError);
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            error: 'Failed to check existing product assignment' 
          })
        };
      }

      if (existing) {
        // Reactivate existing assignment
        const { error: updateError } = await supabase
          .from('organization_products')
          .update({
            is_active: true,
            activated_at: new Date().toISOString(),
            deactivated_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error reactivating product:', updateError);
          return {
            statusCode: 500,
            body: JSON.stringify({ 
              error: 'Failed to reactivate product',
              details: updateError.message 
            })
          };
        }

        console.log('✅ Product reactivated');
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            success: true, 
            message: 'Product reactivated' 
          })
        };
      } else {
        // Create new assignment
        const { error: insertError } = await supabase
          .from('organization_products')
          .insert({
            organization_id: organizationId,
            product_id: productId,
            is_active: true,
            activated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error inserting product assignment:', insertError);
          return {
            statusCode: 500,
            body: JSON.stringify({ 
              error: 'Failed to assign product',
              details: insertError.message 
            })
          };
        }

        console.log('✅ Product assigned');
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            success: true, 
            message: 'Product assigned' 
          })
        };
      }
    } else if (action === 'remove') {
      // Deactivate product
      const { error: updateError } = await supabase
        .from('organization_products')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('product_id', productId);

      if (updateError) {
        console.error('Error removing product:', updateError);
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            error: 'Failed to remove product',
            details: updateError.message 
          })
        };
      }

      console.log('✅ Product removed');
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          message: 'Product removed' 
        })
      };
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};