// src/types/products.ts
// Product Access Control Types

export type ProductType = 'core' | 'addon';
export type ProductAccessRequestStatus = 'pending' | 'approved' | 'denied';

export interface Product {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  product_type: ProductType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationProduct {
  id: string;
  organization_id: string;
  product_id: string;
  is_active: boolean;
  activated_at: string;
  deactivated_at: string | null;
  created_at: string;
  updated_at: string;
  product?: Product; // Joined product data
}

export interface ProductAccessRequest {
  id: string;
  organization_id: string;
  product_id: string;
  user_id: string;
  status: ProductAccessRequestStatus;
  notes: string | null;
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
  created_at: string;
  updated_at: string;
  product?: Product; // Joined product data
}

// Product names as constants for type safety
export const PRODUCTS = {
  GBP_MANAGEMENT: 'gbp_management',
  AI_VISIBILITY: 'ai_visibility',
  VOICE_SEARCH: 'voice_search',
  PREMIUM_LISTINGS: 'premium_listings',
} as const;

export type ProductName = typeof PRODUCTS[keyof typeof PRODUCTS];

// Pages/routes that require specific products
export const PRODUCT_ROUTES: Record<string, ProductName> = {
  '/locations': PRODUCTS.GBP_MANAGEMENT,
  '/reviews': PRODUCTS.GBP_MANAGEMENT,
  '/posts': PRODUCTS.GBP_MANAGEMENT,
  '/media': PRODUCTS.GBP_MANAGEMENT,
  '/rankings': PRODUCTS.GBP_MANAGEMENT,
  '/reports': PRODUCTS.GBP_MANAGEMENT,
  '/alerts': PRODUCTS.GBP_MANAGEMENT,
  '/automation': PRODUCTS.GBP_MANAGEMENT,
  '/ai-visibility': PRODUCTS.AI_VISIBILITY,
  '/voice-search': PRODUCTS.VOICE_SEARCH,
  '/premium-listings': PRODUCTS.PREMIUM_LISTINGS,
};

// src/lib/productAccessService.ts
// Product Access Service

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
      .order('product_type', { ascending: true });

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
   * Request access to a product
   */
  static async requestProductAccess(
    organizationId: string,
    productName: ProductName,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get the product ID
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, display_name')
        .eq('name', productName)
        .single();

      if (productError || !product) {
        return { success: false, error: 'Product not found' };
      }

      // Check if there's already a pending request
      const { data: existingRequest } = await supabase
        .from('product_access_requests')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('product_id', product.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingRequest) {
        return { success: false, error: 'Access request already pending' };
      }

      // Create the access request
      const { error: insertError } = await supabase
        .from('product_access_requests')
        .insert({
          organization_id: organizationId,
          product_id: product.id,
          user_id: user.id,
          notes: notes || null,
        });

      if (insertError) {
        console.error('Error creating access request:', insertError);
        return { success: false, error: 'Failed to create access request' };
      }

      // TODO: Send notification email to staff
      // This would integrate with your email service
      console.log(`Access request created for ${product.display_name}`);

      return { success: true };
    } catch (error) {
      console.error('Unexpected error requesting product access:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Get organization's product access requests
   */
  static async getAccessRequests(organizationId: string): Promise<ProductAccessRequest[]> {
    const { data, error } = await supabase
      .from('product_access_requests')
      .select(`
        *,
        product:products(*)
      `)
      .eq('organization_id', organizationId)
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching access requests:', error);
      return [];
    }

    return data || [];
  }
}

export const productAccessService = ProductAccessService;