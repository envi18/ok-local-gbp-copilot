// src/components/auth/ProtectedRoute.tsx
// Route protection wrapper with product access and role-based access control

import { AlertCircle, Lock } from 'lucide-react';
import React from 'react';
import { useProductAccess } from '../../hooks/useProductAccess';
import type { ProductName } from '../../types/products';
import { ProductUpgradeModal } from '../modal/ProductUpgradeModal';
import { Card } from '../ui/Card';

type UserRole = 'user' | 'manager' | 'admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  
  // Product access requirement (optional)
  requiredProduct?: ProductName;
  
  // Role requirement (optional)
  requiredRole?: UserRole;
  
  // Override product details for modal
  productDisplayName?: string;
  productDescription?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredProduct,
  requiredRole,
  productDisplayName,
  productDescription,
}) => {
  // TODO: Get from auth context in production
  const user = {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user' as UserRole,
    organizationId: 'test-org-id',
    organizationName: 'Test Organization'
  };

  // Check role-based access first (no API call needed)
  if (requiredRole) {
    const hasRoleAccess = checkRoleAccess(user.role, requiredRole);
    
    if (!hasRoleAccess) {
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
                You don't have permission to access this page. This area is restricted to {requiredRole} users and above.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                <AlertCircle size={16} />
                <span>Your role: {user.role}</span>
              </div>
            </div>
          </Card>
        </div>
      );
    }
  }

  // Check product access if required
  if (requiredProduct) {
    const { hasAccess, loading } = useProductAccess(
      user.organizationId,
      requiredProduct
    );

    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f45a4e] mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Verifying access...</p>
          </div>
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
            // Handle access request
            console.log('Access requested for:', requiredProduct);
          }}
          onClose={() => {
            // Navigate back or to dashboard
            window.history.back();
          }}
        />
      );
    }
  }

  // User has access - render children
  return <>{children}</>;
};

/**
 * Check if user's role meets the required role level
 */
function checkRoleAccess(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    user: 1,
    manager: 2,
    admin: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
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
    voice_search: 'Optimize your business for voice search queries across all major voice assistants.',
    premium_listings: 'Enhanced directory listings and citation management across premium platforms.',
  };
  return descriptions[productName] || 'This feature requires an upgrade.';
}