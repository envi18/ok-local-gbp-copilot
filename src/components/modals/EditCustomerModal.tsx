// src/components/modals/EditCustomerModal.tsx
// Modal for editing customer information

import { AlertCircle, Save, User, X } from 'lucide-react';
import React, { useState } from 'react';
import type { Organization, ProfileWithOrganization } from '../../lib/userService';
import { UserService } from '../../lib/userService';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface EditCustomerModalProps {
  customer: ProfileWithOrganization;
  organizations: Organization[];
  onClose: () => void;
  onCustomerUpdated: (updatedCustomer: ProfileWithOrganization) => void;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  customer,
  organizations,
  onClose,
  onCustomerUpdated,
}) => {
  const [formData, setFormData] = useState({
    first_name: customer.first_name || '',
    last_name: customer.last_name || '',
    email: customer.email || '',
    organization_id: customer.organization_id || '',
    role: customer.role || 'customer',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if form has changes
  const hasChanges = 
    formData.first_name !== (customer.first_name || '') ||
    formData.last_name !== (customer.last_name || '') ||
    formData.email !== (customer.email || '') ||
    formData.organization_id !== (customer.organization_id || '') ||
    formData.role !== (customer.role || 'customer');

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name?.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name?.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.organization_id) {
      newErrors.organization_id = 'Organization is required';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      console.log('💾 Updating customer:', customer.id, formData);

      const result = await UserService.updateUser(customer.id, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        organization_id: formData.organization_id,
        role: formData.role,
      });

      if (result.error) {
        console.error('❌ Error updating customer:', result.error);
        setError(result.error);
      } else if (result.data) {
        console.log('✅ Customer updated successfully:', result.data);
        onCustomerUpdated(result.data);
      }
    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Handle input changes
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle close with unsaved changes warning
  const handleClose = () => {
    if (hasChanges && !saving) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Get organization details
  const selectedOrg = organizations.find(org => org.id === formData.organization_id);

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm">Active</Badge>;
      case 'suspended':
        return <Badge variant="error" size="sm">Suspended</Badge>;
      case 'pending':
        return <Badge variant="warning" size="sm">Pending</Badge>;
      default:
        return <Badge variant="info" size="sm">{status}</Badge>;
    }
  };

  // Get role badge
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <User size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Edit Customer
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Update customer information and organization assignment
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertCircle size={18} />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Current Status Info */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                <div className="mt-1">{getStatusBadge(customer.status)}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Current Role:</span>
                <div className="mt-1">{getRoleBadge(customer.role)}</div>
              </div>
            </div>
            {hasChanges && (
              <Badge variant="warning" size="sm">Unsaved Changes</Badge>
            )}
          </div>

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name *
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f45a4e] ${
                errors.first_name
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
              placeholder="John"
            />
            {errors.first_name && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.first_name}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f45a4e] ${
                errors.last_name
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
              placeholder="Doe"
            />
            {errors.last_name && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.last_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f45a4e] ${
                errors.email
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
              placeholder="john.doe@example.com"
            />
            {errors.email && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Organization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Organization *
            </label>
            <select
              value={formData.organization_id}
              onChange={(e) => handleChange('organization_id', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f45a4e] ${
                errors.organization_id
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
            >
              <option value="">Select organization...</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.plan_tier})
                </option>
              ))}
            </select>
            {errors.organization_id && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.organization_id}</p>
            )}
            {selectedOrg && (
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-800 dark:text-blue-200">
                    Plan: <strong>{selectedOrg.plan_tier}</strong>
                  </span>
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    ID: {selectedOrg.id.substring(0, 8)}...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              User Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f45a4e] ${
                errors.role
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
            >
              <option value="customer">Customer</option>
              <option value="reseller">Reseller</option>
              <option value="support">Support</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.role}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Change the user's role to adjust their permissions and access level.
            </p>
          </div>

          {/* Account Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Account ID:</span>
                <code className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  {customer.id.substring(0, 8)}...
                </code>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {new Date(customer.created_at).toLocaleDateString()}
                </span>
              </div>
              {customer.updated_at && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {new Date(customer.updated_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving || !hasChanges}
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
        </form>
      </Card>
    </div>
  );
};