// src/components/modals/EditCustomerModal.tsx
// Modal for editing customer information

import { AlertCircle, Save, X } from 'lucide-react';
import React, { useState } from 'react';
import type { ProfileWithOrganization } from '../../lib/userService';
import { UserService } from '../../lib/userService';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface EditCustomerModalProps {
  customer: ProfileWithOrganization;
  onClose: () => void;
  onCustomerUpdated: (updatedCustomer: ProfileWithOrganization) => void;
  organizations: Array<{ id: string; name: string; plan_tier: string }>;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  customer,
  onClose,
  onCustomerUpdated,
  organizations,
}) => {
  const [formData, setFormData] = useState({
    first_name: customer.first_name || '',
    last_name: customer.last_name || '',
    email: customer.email || '',
    organization_id: customer.organization_id || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      });

      if (result.error) {
        console.error('❌ Error updating customer:', result.error);
        setError('Failed to update customer. Please try again.');
      } else if (result.data) {
        console.log('✅ Customer updated successfully:', result.data);
        onCustomerUpdated(result.data);
      }
    } catch (err) {
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

  // Get organization details
  const selectedOrg = organizations.find(org => org.id === formData.organization_id);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Edit Customer
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Update customer information and organization assignment
            </p>
          </div>
          <button
            onClick={onClose}
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
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
              <Badge
                variant={customer.status === 'active' ? 'success' : customer.status === 'suspended' ? 'error' : 'warning'}
                size="sm"
                className="ml-2"
              >
                {customer.status}
              </Badge>
            </div>
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Role:</span>
              <Badge variant="info" size="sm" className="ml-2">
                Customer
              </Badge>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                } bg-white dark:bg-gray-800`}
                placeholder="John"
              />
              {errors.first_name && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.first_name}</p>
              )}
            </div>

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
                } bg-white dark:bg-gray-800`}
                placeholder="Doe"
              />
              {errors.last_name && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.last_name}</p>
              )}
            </div>
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
              } bg-white dark:bg-gray-800`}
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
              } bg-white dark:bg-gray-800`}
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-800 dark:text-blue-200">
                    Plan: <strong>{selectedOrg.plan_tier}</strong>
                  </span>
                </div>
              </div>
            )}
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
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              icon={Save}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};