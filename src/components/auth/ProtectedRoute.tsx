// src/components/auth/ProtectedRoute.tsx
// Fixed route protection with proper navigation handling

import { AlertCircle, Lock, Shield } from 'lucide-react';
import React from 'react';
import { useProductAccess } from '../../hooks/useProductAccess';
import type { ProductName } from '../../types/products';
import { ProductUpgradeModal } from '../modals/ProductUpgradeModal';
import { Card } from '../ui/Card';

type UserRole = 'user' | 'manager' | 'admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  
  // Product access requirement (optional)
  requiredProduct?: ProductName;
  
  // Role requirement (optional)
  requiredRole?: UserRole;
  
  // Allow multiple roles (alternative to requiredRole)
  allowedRoles?: UserRole[];
  
  // Override product details for modal
  productDisplayName?: string;
  productDescription?: string;
  
  // Current user data
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    organizationId: string;
    organizationName?: string;
  };
  
  // Custom fallback component for access denied
  fallback?: React.ReactNode;
  
  // Show loading state during access check
  showLoading?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredProduct,
  requiredRole,
  allowedRoles,
  productDisplayName,
  productDescription,
  user,
  fallback,
  showLoading = true,
}) => {
  // Default user for development/testing
  const defaultUser = {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user' as UserRole,
    organizationId: 'test-org-id',
    organizationName: 'Test Organization'
  };

  const currentUser = user || defaultUser;

  // Check role-based access first (no API call needed)
  const hasRoleAccess = checkRoleAccess(currentUser.role, requiredRole, allowedRoles);
  
  if (!hasRoleAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <div className="p-8 text-center">
            <div className="inline-flex p-4 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
              <Lock size={32} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don't have permission to access this page. This area is restricted to{' '}
              {requiredRole ? (
                `${requiredRole} users and above`
              ) : allowedRoles ? (
                `${allowedRoles.join(', ')} users`
              ) : (
                'authorized users'
              )}.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-500">
              <Shield size={16} />
              <span>Your role: {currentUser.role}</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Check product access if required
  if (requiredProduct) {
    const { hasAccess, loading, error } = useProductAccess(
      currentUser.organizationId,
      requiredProduct
    );

    if (loading && showLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f45a4e] mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Verifying access...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <div className="p-8 text-center">
              <div className="inline-flex p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4">
                <AlertCircle size={32} className="text-yellow-600 dark:text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Access Check Failed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Unable to verify your access to this feature. Please try again or contact support.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Error: {error}
              </p>
            </div>
          </Card>
        </div>
      );
    }

    if (!hasAccess) {
      return (
        <ProductUpgradeModal
          product={{
            id: requiredProduct,
            name: requiredProduct,
            display_name: productDisplayName || getDefaultProductName(requiredProduct),
            description: productDescription || getDefaultProductDescription(requiredProduct),
            product_type: 'addon',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }}
          onRequestAccess={async () => {
            console.log('Access requested for:', requiredProduct);
            // TODO: Implement actual access request logic
            // For now, just log and close modal
            navigateToDashboard();
          }}
          onClose={() => {
            // Navigate back to dashboard instead of Google OAuth
            navigateToDashboard();
          }}
        />
      );
    }
  }

  // User has access - render children
  return <>{children}</>;
};

/**
 * Navigate to dashboard safely without triggering OAuth
 */
function navigateToDashboard() {
  console.log('🏠 Navigating to dashboard');
  
  // Method 1: Try to trigger section change if we're in a SPA
  const event = new CustomEvent('navigate-to-dashboard', { 
    detail: { section: 'dashboard' }
  });
  window.dispatchEvent(event);
  
  // Method 2: If we're not in a SPA context, just reload current page
  // This avoids redirecting to external OAuth URLs
  setTimeout(() => {
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    } else {
      window.location.reload();
    }
  }, 100);
}

/**
 * Check if user's role meets the required role level
 */
function checkRoleAccess(
  userRole: UserRole, 
  requiredRole?: UserRole, 
  allowedRoles?: UserRole[]
): boolean {
  // If no role requirement specified, allow access
  if (!requiredRole && !allowedRoles) {
    return true;
  }

  const roleHierarchy: Record<UserRole, number> = {
    user: 1,
    manager: 2,
    admin: 3,
  };

  // Check exact role match from allowedRoles array
  if (allowedRoles && allowedRoles.length > 0) {
    return allowedRoles.includes(userRole);
  }

  // Check hierarchical role access (user can access if role is equal or higher)
  if (requiredRole) {
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  return false;
}

/**
 * Get default product display name
 */
function getDefaultProductName(productName: ProductName): string {
  const names: Record<ProductName, string> = {
    gbp_management: 'GBP Management',
    ai_visibility: 'AI Visibility',
    voice_search: 'Voice Search',
    premium_listings: 'Premium Listings',
  };
  return names[productName] || productName;
}

/**
 * Get default product description
 */
function getDefaultProductDescription(productName: ProductName): string {
  const descriptions: Record<ProductName, string> = {
    gbp_management: 'Complete Google Business Profile management suite with location, review, and post management.',
    ai_visibility: 'Monthly automated reports tracking your visibility across ChatGPT, Claude, Gemini, and Perplexity.',
    voice_search: 'Advanced voice search optimization and tracking tools.',
    premium_listings: 'Enhanced listing management with premium features and analytics.',
  };
  return descriptions[productName] || `Access to ${productName} features.`;
}