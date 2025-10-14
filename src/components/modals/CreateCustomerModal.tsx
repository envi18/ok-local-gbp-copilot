// src/components/modals/CreateCustomerModal.tsx
// Fixed version with correct field names and no isOpen prop

import { AlertCircle, Building2, Check, Eye, EyeOff, Mail, Shield, User, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface CreateCustomerModalProps {
  onClose: () => void;
  onCustomerCreated: (customer: any) => void;
}

interface Organization {
  id: string;
  name: string;
}

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: 'customer';
  organization_id: string;
}

interface FormErrors {
  [key: string]: string;
}

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  onClose,
  onCustomerCreated
}) => {
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'customer',
    organization_id: ''
  });

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [creating, setCreating] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loadingOrgs, setLoadingOrgs] = useState<boolean>(true);

  // Load organizations on mount
  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoadingOrgs(true);
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setOrganizations(data || []);
    } catch (err) {
      console.error('Error loading organizations:', err);
      setError('Failed to load organizations');
    } finally {
      setLoadingOrgs(false);
    }
  };

  // Generate a random password
  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData({ ...formData, password });
    setShowPassword(true);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.email.trim()) {
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

      // Call Netlify function with CORRECT field names
      const response = await fetch('/.netlify/functions/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.first_name,        // ✅ Correct field name
          last_name: formData.last_name,          // ✅ Correct field name
          email: formData.email,
          password: formData.password,
          role: formData.role,
          organization_id: formData.organization_id  // ✅ Correct field name
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create customer');
      }

      const data = await response.json();
      console.log('✅ Customer created successfully:', data);
      
      setSuccess(true);
      
      // Wait for success animation, then close and notify parent
      setTimeout(() => {
        onCustomerCreated(data.data);
        handleClose();
      }, 1500);

    } catch (err: any) {
      console.error('❌ Error creating customer:', err);
      setError(err.message || 'Failed to create customer. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // Reset form and close
  const handleClose = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: 'customer',
      organization_id: ''
    });
    setErrors({});
    setError(null);
    setSuccess(false);
    setShowPassword(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] rounded-lg">
              <User size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create New Customer
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add a new customer to the platform
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={creating}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Success Message */}
          {success && (
            <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <Check size={20} className="text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-800 dark:text-green-300">
                Customer created successfully!
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name *
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                disabled={creating || success}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 
                  text-gray-900 dark:text-white transition-colors
                  ${errors.first_name 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-[#f45a4e]'
                  }
                  focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                placeholder="Enter first name"
              />
            </div>
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.first_name}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last Name *
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                disabled={creating || success}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 
                  text-gray-900 dark:text-white transition-colors
                  ${errors.last_name 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-[#f45a4e]'
                  }
                  focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                placeholder="Enter last name"
              />
            </div>
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.last_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={creating || success}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 
                  text-gray-900 dark:text-white transition-colors
                  ${errors.email 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-[#f45a4e]'
                  }
                  focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                placeholder="customer@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Organization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Organization *
            </label>
            <div className="relative">
              <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                name="organization_id"
                value={formData.organization_id}
                onChange={handleChange}
                disabled={creating || success || loadingOrgs}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 
                  text-gray-900 dark:text-white transition-colors appearance-none cursor-pointer
                  ${errors.organization_id 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-[#f45a4e]'
                  }
                  focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option value="">Select an organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.organization_id && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.organization_id}</p>
            )}
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
                disabled={creating || success}
                className="text-sm text-[#f45a4e] hover:text-[#e53e3e] font-medium transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate
              </button>
            </div>
            <div className="relative">
              <Shield size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={creating || success}
                className={`w-full pl-10 pr-12 py-2 border rounded-lg bg-white dark:bg-gray-700 
                  text-gray-900 dark:text-white transition-colors
                  ${errors.password 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-[#f45a4e]'
                  }
                  focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                placeholder="Enter password (min 8 characters)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={creating || success}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 
                  dark:hover:text-gray-300 transition-colors disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Password will be sent to the customer via email
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={creating}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 
                dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || success}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] text-white 
                rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center space-x-2"
            >
              {creating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : success ? (
                <>
                  <Check size={18} />
                  <span>Created!</span>
                </>
              ) : (
                <span>Create Customer</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};