// src/components/modals/ProductAssignmentModal.tsx
// Fixed version with proper error handling and service layer usage

import { AlertCircle, Check, Package, Save, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { productAccessService } from '../../lib/productAccessService';
import type { Product } from '../../types/products';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface ProductAssignmentModalProps {
  organizationId: string;
  organizationName: string;
  onClose: () => void;
  onProductsUpdated: () => void;
}

export const ProductAssignmentModal: React.FC<ProductAssignmentModalProps> = ({
  organizationId,
  organizationName,
  onClose,
  onProductsUpdated,
}) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [assignedProducts, setAssignedProducts] = useState<Set<string>>(new Set());
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [organizationId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📦 Loading products for organization:', organizationId);

      // Load all available products using the service
      const products = await productAccessService.getAvailableProducts();
      setAllProducts(products);
      console.log('✅ Loaded all products:', products.length);

      // Load currently assigned products for this organization
      const orgProducts = await productAccessService.getOrganizationProducts(organizationId);
      const assignedIds = new Set(orgProducts.map(op => op.product_id));
      
      setAssignedProducts(assignedIds);
      setSelectedProducts(new Set(assignedIds)); // Initialize selection with current state
      
      console.log('✅ Loaded assigned products:', assignedIds.size);
    } catch (err: any) {
      console.error('❌ Error loading products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Track changes
  useEffect(() => {
    const hasProductChanges = 
      selectedProducts.size !== assignedProducts.size ||
      Array.from(selectedProducts).some(id => !assignedProducts.has(id)) ||
      Array.from(assignedProducts).some(id => !selectedProducts.has(id));
    
    setHasChanges(hasProductChanges);
  }, [selectedProducts, assignedProducts]);

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      console.log('💾 Saving product assignments...');

      // Determine products to add and remove
      const toAdd = Array.from(selectedProducts).filter(id => !assignedProducts.has(id));
      const toRemove = Array.from(assignedProducts).filter(id => !selectedProducts.has(id));

      console.log('Changes:', { toAdd: toAdd.length, toRemove: toRemove.length });

      // Add new products using service layer
      for (const productId of toAdd) {
        const result = await productAccessService.assignProductToOrganization(
          organizationId,
          productId
        );
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to add product');
        }
      }

      // Remove products using service layer
      for (const productId of toRemove) {
        const result = await productAccessService.removeProductFromOrganization(
          organizationId,
          productId
        );
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to remove product');
        }
      }

      // Success!
      console.log('✅ Product assignments saved successfully');
      onProductsUpdated();
      onClose();

    } catch (err: any) {
      console.error('❌ Error saving products:', err);
      setError(err.message || 'Failed to save product assignments');
    } finally {
      setSaving(false);
    }
  };

  const getProductTypeBadge = (productType: string) => {
    return productType === 'core' 
      ? <Badge variant="success" size="sm">Core</Badge>
      : <Badge variant="info" size="sm">Add-on</Badge>;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f45a4e] mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Package size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Product Access
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {organizationName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertCircle size={18} />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Select the products this organization should have access to. Changes will take effect immediately after saving.
            </p>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Products Selected:</span>
              <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white">
                {selectedProducts.size} / {allProducts.length}
              </span>
            </div>
            {hasChanges && (
              <Badge variant="warning" size="sm">Unsaved Changes</Badge>
            )}
          </div>

          {/* Products List */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Available Products
            </h3>
            
            {allProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No products available
              </div>
            ) : (
              <div className="space-y-2">
                {allProducts.map((product) => {
                  const isSelected = selectedProducts.has(product.id);
                  
                  return (
                    <button
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? 'border-[#f45a4e] bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-[#f45a4e] border-[#f45a4e]'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isSelected && <Check size={14} className="text-white" />}
                        </div>
                        
                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {product.display_name}
                            </h4>
                            {getProductTypeBadge(product.product_type)}
                          </div>
                          {product.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!hasChanges || saving}
            icon={saving ? undefined : Save}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};