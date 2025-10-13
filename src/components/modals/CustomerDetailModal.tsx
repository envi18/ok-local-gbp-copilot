// src/components/modals/CustomerDetailModal.tsx
// Modal for viewing customer details

import { Ban, Calendar, CheckCircle, Edit, Mail, Package, User, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { productAccessService } from '../../lib/productAccessService';
import type { ProfileWithOrganization } from '../../lib/userService';
import type { OrganizationProduct } from '../../types/products';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface CustomerDetailModalProps {
  customer: ProfileWithOrganization;
  onClose: () => void;
  onEdit: (customer: ProfileWithOrganization) => void;
  onManageProducts: (customer: ProfileWithOrganization) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  onClose,
  onEdit,
  onManageProducts,
}) => {
  const [products, setProducts] = useState<OrganizationProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [customer.organization_id]);

  const loadProducts = async () => {
    if (!customer.organization_id) {
      setLoadingProducts(false);
      return;
    }

    try {
      const orgProducts = await productAccessService.getOrganizationProducts(customer.organization_id);
      setProducts(orgProducts);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm"><CheckCircle size={12} className="mr-1" />Active</Badge>;
      case 'suspended':
        return <Badge variant="error" size="sm"><Ban size={12} className="mr-1" />Suspended</Badge>;
      case 'pending':
        return <Badge variant="warning" size="sm">Pending</Badge>;
      default:
        return <Badge variant="info" size="sm">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="error" size="sm">Admin</Badge>;
      case 'support':
        return <Badge variant="warning" size="sm">Support</Badge>;
      case 'reseller':
        return <Badge variant="info" size="sm">Reseller</Badge>;
      case 'customer':
        return <Badge variant="success" size="sm">Customer</Badge>;
      default:
        return <Badge variant="info" size="sm">{role}</Badge>;
    }
  };

  const getPlanBadge = (planTier: string) => {
    if (!planTier) return <Badge variant="info" size="sm">No Plan</Badge>;
    
    switch (planTier) {
      case 'enterprise':
        return <Badge variant="gradient" size="sm">Enterprise</Badge>;
      case 'pro':
        return <Badge variant="success" size="sm">Pro</Badge>;
      case 'free':
        return <Badge variant="info" size="sm">Free</Badge>;
      default:
        return <Badge variant="info" size="sm">{planTier}</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <User size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Customer Details
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {customer.first_name} {customer.last_name}
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
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Status</p>
              {getStatusBadge(customer.status)}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Role</p>
              {getRoleBadge(customer.role)}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Plan</p>
              {getPlanBadge(customer.organization?.plan_tier || '')}
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Personal Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <User size={18} className="text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {customer.first_name} {customer.last_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Mail size={18} className="text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email Address</p>
                  <p className="text-gray-900 dark:text-white font-medium">{customer.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Organization Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Organization
            </h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Organization Name</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {customer.organization?.name || 'No Organization'}
                </p>
              </div>
              {customer.organization?.slug && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Organization Slug</p>
                  <code className="text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                    {customer.organization.slug}
                  </code>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Organization ID</p>
                <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  {customer.organization_id}
                </code>
              </div>
            </div>
          </div>

          {/* Product Access */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Product Access
              </h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onManageProducts(customer)}
                icon={Package}
              >
                Manage Products
              </Button>
            </div>
            {loadingProducts ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f45a4e] mx-auto mb-2"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Package size={32} className="text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">No products assigned</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Click "Manage Products" to assign products
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {products.map((orgProduct) => (
                  <div
                    key={orgProduct.id}
                    className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {orgProduct.product?.display_name}
                      </h4>
                      <Badge variant="success" size="sm">Active</Badge>
                    </div>
                    {orgProduct.product?.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {orgProduct.product.description}
                      </p>
                    )}
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                      Activated: {new Date(orgProduct.activated_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={16} className="text-gray-600 dark:text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                </div>
                <p className="text-gray-900 dark:text-white font-medium">
                  {new Date(customer.created_at).toLocaleDateString()}
                </p>
              </div>
              {customer.updated_at && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={16} className="text-gray-600 dark:text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {new Date(customer.updated_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg md:col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Account ID</p>
                <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  {customer.id}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={() => onEdit(customer)} icon={Edit}>
            Edit Customer
          </Button>
        </div>
      </Card>
    </div>
  );
};