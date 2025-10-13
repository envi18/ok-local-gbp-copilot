// src/lib/productAccessService.ts
// Enhanced Product Access Service with assignment methods

import type { OrganizationProduct, Product, ProductAccessRequest, ProductName } from '../types/products';
import { supabase } from './supabase';

export class ProductAccessService {
  /**
   * Get all available products
   */
  static async getAvailableProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('product_type', { ascending: true })
      .order('display_name', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get organization's active products
   */
  static async getOrganizationProducts(organizationId: string): Promise<OrganizationProduct[]> {
    const { data, error } = await supabase
      .from('organization_products')
      .select(`
        *,
        product:products(*)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching organization products:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Check if organization has access to a specific product
   */
  static async hasProductAccess(organizationId: string, productName: ProductName): Promise<boolean> {
    const { data, error } = await supabase
      .from('organization_products')
      .select(`
        id,
        product:products!inner(name)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .eq('products.name', productName)
      .maybeSingle();

    if (error) {
      console.error('Error checking product access:', error);
      return false;
    }

    return !!data;
  }

  /**
   * Assign a product to an organization
   */
  static async assignProductToOrganization(
    organizationId: string,
    productId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('➕ Assigning product via Netlify function:', { organizationId, productId });

      // Try Netlify function first (production)
      try {
        const response = await fetch('/.netlify/functions/manage-products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'add',
            organizationId,
            productId
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to assign product');
        }

        console.log('✅ Product assigned via Netlify function');
        return { success: true };

      } catch (fetchError) {
        console.warn('Netlify function not available, trying direct database access...', fetchError);
        
        // Fallback to direct database access (development only)
        const { data: existing, error: checkError } = await supabase
          .from('organization_products')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('product_id', productId)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking existing assignment:', checkError);
          return { success: false, error: 'Failed to check existing product assignment' };
        }

        if (existing) {
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
            return { success: false, error: 'Failed to reactivate product' };
          }

          console.log('✅ Product reactivated (direct)');
          return { success: true };
        } else {
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
            return { success: false, error: 'Failed to assign product' };
          }

          console.log('✅ Product assigned (direct)');
          return { success: true };
        }
      }
    } catch (err: any) {
      console.error('Unexpected error assigning product:', err);
      return { success: false, error: err.message || 'Unexpected error occurred' };
    }
  }

  /**
   * Remove a product from an organization (deactivate)
   */
  static async removeProductFromOrganization(
    organizationId: string,
    productId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('➖ Removing product:', { organizationId, productId });

      const { error } = await supabase
        .from('organization_products')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('product_id', productId);

      if (error) {
        console.error('Error removing product:', error);
        return { success: false, error: 'Failed to remove product' };
      }

      console.log('✅ Product removed');
      return { success: true };
    } catch (err: any) {
      console.error('Unexpected error removing product:', err);
      return { success: false, error: err.message || 'Unexpected error occurred' };
    }
  }

  /**
   * Request access to a product
   */
  static async requestProductAccess(
    organizationId: string,
    productName: ProductName,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get the product ID
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('name', productName)
        .single();

      if (productError || !product) {
        return { success: false, error: 'Product not found' };
      }

      // Check if request already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('product_access_requests')
        .select('id, status')
        .eq('organization_id', organizationId)
        .eq('product_id', product.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (checkError) {
        return { success: false, error: 'Failed to check existing requests' };
      }

      if (existingRequest) {
        return { success: false, error: 'A request for this product is already pending' };
      }

      // Create new request
      const { error: insertError } = await supabase
        .from('product_access_requests')
        .insert({
          organization_id: organizationId,
          product_id: product.id,
          user_id: user.id,
          status: 'pending',
          notes: notes || null,
          requested_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating product request:', insertError);
        return { success: false, error: 'Failed to create request' };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Unexpected error requesting product access:', err);
      return { success: false, error: err.message || 'Unexpected error occurred' };
    }
  }

  /**
   * Get pending product access requests (admin view)
   */
  static async getPendingRequests(): Promise<ProductAccessRequest[]> {
    const { data, error } = await supabase
      .from('product_access_requests')
      .select(`
        *,
        product:products(*),
        organization:organizations(name)
      `)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending requests:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Approve a product access request
   */
  static async approveRequest(
    requestId: string,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the request details
      const { data: request, error: fetchError } = await supabase
        .from('product_access_requests')
        .select('organization_id, product_id')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        return { success: false, error: 'Request not found' };
      }

      // Assign the product
      const assignResult = await this.assignProductToOrganization(
        request.organization_id,
        request.product_id
      );

      if (!assignResult.success) {
        return assignResult;
      }

      // Update the request status
      const { error: updateError } = await supabase
        .from('product_access_requests')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString(),
          processed_by: adminUserId,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating request status:', updateError);
        return { success: false, error: 'Failed to update request status' };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Unexpected error approving request:', err);
      return { success: false, error: err.message || 'Unexpected error occurred' };
    }
  }
}

// Export singleton instance for convenience
export const productAccessService = ProductAccessService;
