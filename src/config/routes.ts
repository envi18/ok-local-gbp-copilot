// src/config/routes.ts
// Route configuration with AI Report Generator added

import type { ProductName } from '../types/products';

type UserRole = 'user' | 'manager' | 'admin';

export interface RouteConfig {
  section: string;
  label: string;
  requiredProduct?: ProductName;
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
  description?: string;
  isPublic?: boolean;
}

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

  locations: {
    section: 'locations',
    label: 'Locations',
    isPublic: true,
    description: 'Manage your Google Business Profile locations and connections'
  },

  // Premium Listings - accessible to all users but requires product check
  'premium-listings': {
    section: 'premium-listings',
    label: 'Premium Listings',
    requiredProduct: 'premium_listings',
    description: 'Enhanced listing management with premium features'
  },

  // GBP Management product routes
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

  customers: {
    section: 'customers',
    label: 'Customers',
    allowedRoles: ['manager', 'admin'],
    description: 'Manage customer accounts and product access'
  },

  // NEW: AI Report Generator routes (Admin only)
  'ai-report-generator': {
    section: 'ai-report-generator',
    label: 'AI Report Generator',
    requiredRole: 'admin',
    description: 'Generate AI visibility reports for any business (prospects, competitors, clients)',
    isPublic: false
  },

  'ai-report-history': {
    section: 'ai-report-history',
    label: 'Report History',
    requiredRole: 'admin',
    description: 'View all generated AI visibility reports with export options',
    isPublic: false
  },

  'public-report-share': {
    section: 'public-report-share',
    label: 'Shared Report',
    description: 'Public AI visibility report (accessible via share link)',
    isPublic: true
  },

  'google-profile': {
    section: 'google-profile',
    label: 'Google Profile',
    requiredRole: 'user',
    description: 'Interactive mock Google Business Profile interface with automation testing'
  },

  'mock-data': {
    section: 'mock-data',
    label: 'Mock Data',
    requiredRole: 'admin',
    description: 'View and manage mock Google Business data for development'
  },

  // Command Center - Admin only
  'command-center': {
    section: 'command-center',
    label: 'Command Center',
    requiredRole: 'admin',
    description: 'Real-time system monitoring and admin dashboard'
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

  'sample-data': {
    section: 'sample-data',
    label: 'Sample Data',
    requiredRole: 'admin',
    description: 'Create and manage sample data for development and testing'
  },

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
  
  if (!config) {
    return false;
  }
  
  if (config.isPublic) {
    return true;
  }
  
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
  
  if (config.allowedRoles && config.allowedRoles.length > 0) {
    if (!config.allowedRoles.includes(userRole)) {
      return false;
    }
  }
  
  if (config.requiredProduct) {
    if (!userProductAccess || !userProductAccess.includes(config.requiredProduct)) {
      return false;
    }
  }
  
  return true;
}

export function getRouteConfig(section: string): RouteConfig | null {
  return ROUTE_CONFIG[section] || null;
}

export function getAccessibleRoutes(
  userRole: UserRole,
  userProductAccess?: ProductName[]
): RouteConfig[] {
  return Object.values(ROUTE_CONFIG).filter(config =>
    hasRouteAccess(config.section, userRole, userProductAccess)
  );
}

export function requiresProductAccess(section: string): boolean {
  const config = ROUTE_CONFIG[section];
  return !!(config && config.requiredProduct && !config.isPublic);
}

export function getRequiredProduct(section: string): ProductName | null {
  const config = ROUTE_CONFIG[section];
  return config?.requiredProduct || null;
}