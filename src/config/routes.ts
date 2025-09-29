// src/config/routes.ts
// Updated route configuration with new access control definitions

import type { ProductName } from '../types/products';

type UserRole = 'user' | 'manager' | 'admin';

export interface RouteConfig {
  section: string;
  label: string;
  requiredProduct?: ProductName;
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
  description?: string;
  isPublic?: boolean; // Public routes don't require any checks
}

/**
 * Route access control configuration
 * Updated based on new requirements
 */
export const ROUTE_CONFIG: Record<string, RouteConfig> = {
  // Public routes - no restrictions
  dashboard: {
    section: 'dashboard',
    label: 'Dashboard',
    isPublic: true,
    description: 'Main dashboard overview'
  },
  
  settings: {
    section: 'settings',
    label: 'Settings',
    isPublic: true,
    description: 'General account settings'
  },

  // Always accessible to all users - no product restrictions
  locations: {
    section: 'locations',
    label: 'Locations',
    isPublic: true,
    description: 'Manage your Google Business Profile locations and connections'
  },

  reports: {
    section: 'reports',
    label: 'Reports',
    isPublic: true,
    description: 'View performance reports and analytics'
  },

  // Premium Listings - accessible to all users but requires product check
  'premium-listings': {
    section: 'premium-listings',
    label: 'Premium Listings',
    requiredProduct: 'premium_listings',
    description: 'Enhanced listing management with premium features'
  },

  // GBP Management product routes - requires gbp_management product
  reviews: {
    section: 'reviews',
    label: 'Reviews',
    requiredProduct: 'gbp_management',
    description: 'View and manage customer reviews'
  },
  
  posts: {
    section: 'posts',
    label: 'Posts',
    requiredProduct: 'gbp_management',
    description: 'Create and manage Google Business Profile posts'
  },
  
  media: {
    section: 'media',
    label: 'Media',
    requiredProduct: 'gbp_management',
    description: 'Manage photos and videos'
  },
  
  rankings: {
    section: 'rankings',
    label: 'Rankings',
    requiredProduct: 'gbp_management',
    description: 'Track your local search rankings'
  },
  
  automations: {
    section: 'automations',
    label: 'Automations',
    requiredProduct: 'gbp_management',
    description: 'Configure automated workflows'
  },

  // Manager/Admin routes - still need elevated permissions
  alerts: {
    section: 'alerts',
    label: 'Alerts',
    requiredProduct: 'gbp_management',
    allowedRoles: ['manager', 'admin'],
    description: 'Set up automated alerts and notifications'
  },

  // AI Visibility product routes  
  'ai-visibility': {
    section: 'ai-visibility',
    label: 'AI Visibility',
    requiredProduct: 'ai_visibility',
    description: 'Track your visibility across AI platforms'
  },

  // Voice Search product routes
  'voice-search': {
    section: 'voice-search',
    label: 'Voice Search',
    requiredProduct: 'voice_search',
    description: 'Optimize for voice search queries'
  },

  // Admin-only routes
  users: {
    section: 'users',
    label: 'Users',
    requiredRole: 'admin',
    description: 'Manage Admin and Manager user accounts'
  },

  // Manager/Admin routes for customer management
  customers: {
    section: 'customers',
    label: 'Customers',
    allowedRoles: ['manager', 'admin'],
    description: 'Manage customer accounts and product access'
  },
  
  'admin-setup': {
    section: 'admin-setup',
    label: 'Database Setup',
    requiredRole: 'admin',
    description: 'Database configuration and setup'
  },
  
  'db-check': {
    section: 'db-check',
    label: 'Database Check',
    requiredRole: 'admin',
    description: 'Verify database connection and health'
  },
  
  'fix-profile': {
    section: 'fix-profile',
    label: 'Fix Profile',
    requiredRole: 'admin',
    description: 'Fix user profile issues'
  },

  // Manager/Admin routes
  onboarding: {
    section: 'onboarding',
    label: 'Onboarding',
    allowedRoles: ['manager', 'admin'],
    description: 'Organization onboarding process'
  }
};

/**
 * Check if a user has access to a specific route
 */
export function hasRouteAccess(
  section: string,
  userRole: UserRole,
  userProductAccess?: ProductName[]
): boolean {
  const config = ROUTE_CONFIG[section];
  
  // Route doesn't exist in config - deny access
  if (!config) {
    return false;
  }
  
  // Public routes are always accessible
  if (config.isPublic) {
    return true;
  }
  
  // Check role requirements first
  if (config.requiredRole) {
    const roleHierarchy: Record<UserRole, number> = {
      user: 1,
      manager: 2,
      admin: 3,
    };
    
    if (roleHierarchy[userRole] < roleHierarchy[config.requiredRole]) {
      return false;
    }
  }
  
  // Check allowed roles (exact match)
  if (config.allowedRoles && config.allowedRoles.length > 0) {
    if (!config.allowedRoles.includes(userRole)) {
      return false;
    }
  }
  
  // Check product access
  if (config.requiredProduct) {
    if (!userProductAccess || !userProductAccess.includes(config.requiredProduct)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get route configuration for a section
 */
export function getRouteConfig(section: string): RouteConfig | null {
  return ROUTE_CONFIG[section] || null;
}

/**
 * Get all routes a user has access to
 */
export function getAccessibleRoutes(
  userRole: UserRole,
  userProductAccess?: ProductName[]
): RouteConfig[] {
  return Object.values(ROUTE_CONFIG).filter(config =>
    hasRouteAccess(config.section, userRole, userProductAccess)
  );
}

/**
 * Check if a route requires product access (for showing upgrade prompts)
 */
export function requiresProductAccess(section: string): boolean {
  const config = ROUTE_CONFIG[section];
  return !!(config && config.requiredProduct && !config.isPublic);
}

/**
 * Get the required product for a route
 */
export function getRequiredProduct(section: string): ProductName | null {
  const config = ROUTE_CONFIG[section];
  return config?.requiredProduct || null;
}