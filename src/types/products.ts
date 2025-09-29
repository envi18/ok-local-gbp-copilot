// src/types/products.ts
// Updated product types to match the new access rules

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

// Updated pages/routes that require specific products based on new requirements
export const PRODUCT_ROUTES: Record<string, ProductName> = {
  // GBP Management product routes
  '/reviews': PRODUCTS.GBP_MANAGEMENT,
  '/posts': PRODUCTS.GBP_MANAGEMENT,
  '/media': PRODUCTS.GBP_MANAGEMENT,
  '/rankings': PRODUCTS.GBP_MANAGEMENT,
  '/automations': PRODUCTS.GBP_MANAGEMENT,
  '/alerts': PRODUCTS.GBP_MANAGEMENT, // Also requires manager/admin role
  
  // Other product routes
  '/ai-visibility': PRODUCTS.AI_VISIBILITY,
  '/voice-search': PRODUCTS.VOICE_SEARCH,
  '/premium-listings': PRODUCTS.PREMIUM_LISTINGS,
  
  // Note: locations and reports are now public routes (no product required)
};