// src/hooks/useProductAccess.ts
import { useCallback, useEffect, useState } from 'react';
import { productAccessService } from '../lib/productAccessService';
import type { ProductName } from '../types/products';

interface UseProductAccessResult {
  hasAccess: boolean;
  loading: boolean;
  error: string | null;
  requestAccess: () => Promise<void>;
  refreshAccess: () => Promise<void>;
}

export function useProductAccess(
  organizationId: string | null,
  productName: ProductName
): UseProductAccessResult {
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkAccess = useCallback(async () => {
    if (!organizationId) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const access = await productAccessService.hasProductAccess(organizationId, productName);
      setHasAccess(access);
    } catch (err) {
      console.error('Error checking product access:', err);
      setError('Failed to verify product access');
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }, [organizationId, productName]);

  const requestAccess = async () => {
    if (!organizationId) {
      throw new Error('No organization ID');
    }

    const result = await productAccessService.requestProductAccess(organizationId, productName);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to request access');
    }
  };

  const refreshAccess = async () => {
    await checkAccess();
  };

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return {
    hasAccess,
    loading,
    error,
    requestAccess,
    refreshAccess,
  };
}