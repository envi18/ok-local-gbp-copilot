// src/components/modal/EditUserModal.tsx
// Modal for editing system user information with real database operations

import { AlertCircle, Building, Loader, Mail, Save, User, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ProfileWithOrganization, UserService } from '../../lib/userService';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ProfileWithOrganization | null;
  onUserUpdated: (updatedUser: ProfileWithOrganization) => void;
}

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'support' | 'reseller' | 'customer';
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  general?: string;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated
}) => {
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    role: 'customer'
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      const initialData = {
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        role: user.role
      };
      setFormData(initialData);
      setHasChanges(false);
      setErrors({});
    }
  }, [user]);

  // Track form changes
  useEffect(() => {
    if (user) {
      const hasFormChanges = 
        formData.first_name !== (user.first_name || '') ||
        formData.last_name !== (user.last_name || '') ||
        formData.email !== (user.email || '') ||
        formData.role !== user.role;
      
      setHasChanges(hasFormChanges);
    }
  }, [formData, user]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // First name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    }

    // Last name validation
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.trim().length < 2) {
      newErrors.last_name = 'Last name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Role validation
    if (!['admin', 'support', 'reseller', 'customer'].includes(formData.role)) {
      newErrors.role = 'Please select a valid role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const updateData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role
      };

      const { data: updatedUser, error } = await UserService.updateUser(user.id, updateData);

      if (error) {
        console.error('Error updating user:', error);
        setErrors({ general: 'Failed to update user. Please try again.' });
        return;
      }

      if (!updatedUser) {
        setErrors({ general: 'No data returned from update operation.' });
        return;
      }

      // Success
      console.log('User updated successfully:', updatedUser);
      onUserUpdated(updatedUser);
      onClose();

    } catch (error) {
      console.error('Unexpected error updating user:', error);
      setErrors({ 
        general: error instanceof Error ? error.message : 'An unexpected error occurred.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (hasChanges && !loading) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
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

  if (!isOpen || !user) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit User
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update user information and permissions
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current User Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Current User</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span>{user.first_name} {user.last_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-400" />
                <span>{user.organization?.name || 'No Organization'}</span>
              </div>
              {getRoleBadge(user.role)}
            </div>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-700 dark:text-red-300">{errors.general}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.first_name 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter first name"
                disabled={loading}
              />
              {errors.first_name && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.first_name}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.last_name 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter last name"
                disabled={loading}
              />
              {errors.last_name && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.last_name}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                errors.email 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter email address"
              disabled={loading}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              User Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value as FormData['role'])}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                errors.role 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              disabled={loading}
            >
              <option value="admin">Admin - Full system access</option>
              <option value="support">Support - Customer support access</option>
              <option value="reseller">Reseller - Partner management access</option>
              <option value="customer">Customer - Standard user access</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.role}</p>
            )}
          </div>

          {/* Change Indicator */}
          {hasChanges && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                You have unsaved changes. Click "Save Changes" to update the user.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !hasChanges}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};