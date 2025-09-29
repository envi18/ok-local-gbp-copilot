// src/hooks/useUserAccess.ts
// Hook to manage user access to products and routes

import { useCallback, useEffect, useState } from 'react';
import { getAccessibleRoutes, hasRouteAccess } from '../config/routes';
import { productAccessService } from '../lib/productAccessService';
import type { ProductName } from '../types/products';

type UserRole = 'user' | 'manager' | 'admin';

interface UserAccessData {
  products: ProductName[];
  loading: boolean;
  error: string | null;
}

interface UseUserAccessResult extends UserAccessData {
  hasProductAccess: (productName: ProductName) => boolean;
  hasRouteAccess: (section: string) => boolean;
  getAccessibleRoutes: () => Array<{
    section: string;
    label: string;
    description?: string;
  }>;
  refreshAccess: () => Promise<void>;
}

export function useUserAccess(
  organizationId: string | null,
  userRole: UserRole
): UseUserAccessResult {
  const [accessData, setAccessData] = useState<UserAccessData>({
    products: [],
    loading: true,
    error: null
  });

  const fetchUserAccess = useCallback(async () => {
    if (!organizationId) {
      setAccessData({
        products: [],
        loading: false,
        error: null
      });
      return;
    }

    setAccessData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch all products the organization has access to
      const products = await productAccessService.getOrganizationProducts(organizationId);
      const activeProducts = products
        .filter(p => p.is_active)
        .map(p => p.product?.name as ProductName)
        .filter(Boolean);

      setAccessData({
        products: activeProducts,
        loading: false,
        error: null
      });
    } catch (err) {
      console.error('Error fetching user access:', err);
      setAccessData({
        products: [],
        loading: false,
        error: 'Failed to load access permissions'
      });
    }
  }, [organizationId]);

  const hasProductAccess = useCallback((productName: ProductName): boolean => {
    return accessData.products.includes(productName);
  }, [accessData.products]);

  const hasRouteAccessCheck = useCallback((section: string): boolean => {
    return hasRouteAccess(section, userRole, accessData.products);
  }, [userRole, accessData.products]);

  const getAccessibleRoutesForUser = useCallback(() => {
    return getAccessibleRoutes(userRole, accessData.products);
  }, [userRole, accessData.products]);

  const refreshAccess = useCallback(async () => {
    await fetchUserAccess();
  }, [fetchUserAccess]);

  useEffect(() => {
    fetchUserAccess();
  }, [fetchUserAccess]);

  return {
    ...accessData,
    hasProductAccess,
    hasRouteAccess: hasRouteAccessCheck,
    getAccessibleRoutes: getAccessibleRoutesForUser,
    refreshAccess,
  };
}