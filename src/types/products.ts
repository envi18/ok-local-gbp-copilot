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