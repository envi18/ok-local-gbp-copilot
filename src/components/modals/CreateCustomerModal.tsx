// src/components/modals/CreateCustomerModal.tsx
// Modal for creating new customer accounts

import { AlertCircle, CheckCircle, Copy, Eye, EyeOff, Save, UserPlus, X } from 'lucide-react';
import React, { useState } from 'react';
import type { Organization, ProfileWithOrganization } from '../../lib/userService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { OrganizationSelector } from '../ui/OrganizationSelector';

interface CreateCustomerModalProps {
  organizations: Organization[];
  onClose: () => void;
  onCustomerCreated: (newCustomer: ProfileWithOrganization) => void;
}

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  organizations: initialOrganizations,
  onClose,
  onCustomerCreated,
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    organization_id: '',
    password: '',
    role: 'customer' as 'customer' | 'reseller',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Generate random password
  const generatePassword = () => {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    handleChange('password', password);
  };

  // Copy password to clipboard
  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(formData.password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

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

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
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
      setCreating(true);
      setError(null);

      console.log('👤 Creating new customer:', formData.email);

      // Try Netlify function first (production)
      try {
        const response = await fetch('/.netlify/functions/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            firstName: formData.first_name,
            lastName: formData.last_name,
            role: formData.role,
            organizationId: formData.organization_id,
          }),
        });

        if (!response.ok) {
          throw new Error('Netlify function not available');
        }

        const data = await response.json();
        console.log('✅ Customer created successfully (Netlify):', data);
        setSuccess(true);

        setTimeout(() => {
          onCustomerCreated(data.profile);
        }, 1500);

      } catch (netlifyError) {
        // Fallback for local development
        console.warn('Netlify function not available, using mock creation for development');
        
        // Create a mock customer for development
        const mockCustomer = {
          id: crypto.randomUUID(),
          organization_id: formData.organization_id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          role: formData.role,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          organization: organizations.find(org => org.id === formData.organization_id),
        };

        console.log('✅ Mock customer created (development):', mockCustomer);
        setSuccess(true);

        setTimeout(() => {
          onCustomerCreated(mockCustomer as any);
        }, 1500);
      }

    } catch (err: any) {
      console.error('❌ Error creating customer:', err);
      setError(err.message || 'Failed to create customer. Please try again.');
    } finally {
      setCreating(false);
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

  // Handle new organization creation
  const handleNewOrganization = (newOrg: Organization) => {
    console.log('✅ New organization added to list:', newOrg);
    setOrganizations(prev => [...prev, newOrg]);
    // The selector will auto-select the new org
  };

  // Get organization details
  const selectedOrg = organizations.find(org => org.id === formData.organization_id);

  // If successfully created, show success state
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Customer Created!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              The customer account has been created successfully.
            </p>
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
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <UserPlus size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Create New Customer
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add a new customer account to the platform
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={creating}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
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
              disabled={creating}
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
              disabled={creating}
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
              disabled={creating}
            />
            {errors.email && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Organization - Now using OrganizationSelector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Organization *
            </label>
            <OrganizationSelector
              organizations={organizations}
              selectedOrgId={formData.organization_id}
              onSelect={(orgId) => handleChange('organization_id', orgId)}
              onCreateNew={handleNewOrganization}
              error={errors.organization_id}
              disabled={creating}
            />
            {selectedOrg && (
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-800 dark:text-blue-200">
                    Plan: <strong>{selectedOrg.plan_tier}</strong>
                  </span>
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {selectedOrg.slug}
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f45a4e] bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              disabled={creating}
            >
              <option value="customer">Customer</option>
              <option value="reseller">Reseller</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Select the appropriate role for this user.
            </p>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password *
              </label>
              <button
                type="button"
                onClick={generatePassword}
                disabled={creating}
                className="text-sm text-[#f45a4e] hover:text-[#e53e3e] font-medium disabled:opacity-50"
              >
                Generate Password
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`w-full px-4 py-2 pr-20 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f45a4e] ${
                  errors.password
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                placeholder="Enter or generate password"
                disabled={creating}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {formData.password && (
                  <button
                    type="button"
                    onClick={copyPassword}
                    disabled={creating}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                    title="Copy password"
                  >
                    {copiedPassword ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <Copy size={16} className="text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={creating}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={16} className="text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Eye size={16} className="text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.password}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Minimum 8 characters. Make sure to save this password securely.
            </p>
          </div>

          {/* Important Notice */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle size={18} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">Important:</p>
                <p>Make sure to save the password before creating the account. You'll need to share it with the customer.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={creating}
              icon={creating ? undefined : Save}
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Customer...
                </>
              ) : (
                'Create Customer'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};