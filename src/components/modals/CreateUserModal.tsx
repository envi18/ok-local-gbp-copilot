// src/components/modals/CreateUserModal.tsx
// Modal for creating new system users (admin, support, reseller)

import { AlertCircle, Building2, CheckCircle, Lock, Mail, Shield, User, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { UserService, type CreateUserData, type Organization } from '../../lib/userService';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: any) => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onUserCreated
}) => {
  const [formData, setFormData] = useState<CreateUserData>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'support',
    organization_id: ''
  });
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [loadingOrgs, setLoadingOrgs] = useState<boolean>(true);

  // Load organizations when modal opens
  useEffect(() => {
    if (isOpen) {
      loadOrganizations();
      // Reset form when modal opens
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'support',
        organization_id: ''
      });
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const loadOrganizations = async () => {
    try {
      setLoadingOrgs(true);
      const result = await UserService.getOrganizations();
      
      if (result.error) {
        console.error('Failed to load organizations:', result.error);
        setError('Failed to load organizations');
      } else if (result.data) {
        setOrganizations(result.data);
        // Auto-select first organization if available
        if (result.data.length > 0) {
          setFormData(prev => ({ ...prev, organization_id: result.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Error loading organizations:', err);
      setError('Failed to load organizations');
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null); // Clear error when user types
  };

  const generatePassword = () => {
    // Generate a secure random password
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  const validateForm = (): string | null => {
    if (!formData.first_name.trim()) return 'First name is required';
    if (!formData.last_name.trim()) return 'Last name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.email.includes('@')) return 'Please enter a valid email address';
    if (!formData.password) return 'Password is required';
    if (formData.password.length < 8) return 'Password must be at least 8 characters';
    if (!formData.organization_id) return 'Please select an organization';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Creating user with data:', { ...formData, password: '[HIDDEN]' });
      
      const result = await UserService.createUser(formData);
      
      if (result.error) {
        console.error('User creation failed:', result.error);
        
        // Handle specific error types - Fixed TypeScript error handling
        const errorMessage = typeof result.error === 'string' 
          ? result.error 
          : (result.error as any)?.message || JSON.stringify(result.error) || 'Unknown error';
        
        if (errorMessage.includes('duplicate key value violates unique constraint') || 
            errorMessage.includes('already exists')) {
          setError('A user with this email already exists');
        } else if (errorMessage.includes('invalid email') || 
                   errorMessage.includes('email')) {
          setError('Please enter a valid email address');
        } else if (errorMessage.includes('password')) {
          setError('Password requirements not met');
        } else {
          setError(`Failed to create user: ${errorMessage}`);
        }
      } else if (result.data) {
        console.log('✅ User created successfully:', result.data);
        setSuccess(true);
        
        // Call the callback to update the parent component
        onUserCreated(result.data);
        
        // Close modal after a short delay to show success
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
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
      default:
        return <Badge variant="info" size="sm">{role}</Badge>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <User size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Create System User
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add a new admin, support, or reseller account
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">User created successfully!</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john.doe@company.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter password (min 8 characters)"
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={generatePassword}
                  title="Generate Random Password"
                >
                  Generate
                </Button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-gray-400" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="support">Support User</option>
                  <option value="reseller">Reseller</option>
                  <option value="admin">Admin</option>
                </select>
                {getRoleBadge(formData.role)}
              </div>
            </div>

            {/* Organization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Organization
              </label>
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-gray-400" />
                <select
                  name="organization_id"
                  value={formData.organization_id}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={loadingOrgs}
                >
                  <option value="">Select Organization</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.plan_tier})
                    </option>
                  ))}
                </select>
              </div>
              {loadingOrgs && (
                <p className="text-xs text-gray-500 mt-1">Loading organizations...</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || success}
                className="flex-1"
              >
                {loading ? 'Creating...' : success ? 'Created!' : 'Create User'}
              </Button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Note:</strong> The new user will receive login credentials and can access the platform based on their assigned role. Admin users have full system access, Support users can manage customer accounts, and Resellers have limited administrative access.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};