// src/components/ui/OrganizationSelector.tsx
// Searchable organization dropdown with inline creation

import { Building2, Check, ChevronDown, Plus, Search, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import type { Organization } from '../../lib/userService';
import { Badge } from './Badge';

interface OrganizationSelectorProps {
  organizations: Organization[];
  selectedOrgId: string;
  onSelect: (orgId: string) => void;
  onCreateNew?: (newOrg: Organization) => void;
  error?: string;
  disabled?: boolean;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  organizations,
  selectedOrgId,
  onSelect,
  onCreateNew,
  error,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [newOrgPlan, setNewOrgPlan] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [creating, setCreating] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get selected organization
  const selectedOrg = organizations.find(org => org.id === selectedOrgId);

  // Filter organizations based on search
  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Auto-generate slug from name
  useEffect(() => {
    if (showCreateForm && newOrgName) {
      const slug = newOrgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setNewOrgSlug(slug);
    }
  }, [newOrgName, showCreateForm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = (orgId: string) => {
    onSelect(orgId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleCreateNew = async () => {
    if (!newOrgName.trim() || !newOrgSlug.trim()) {
      return;
    }

    setCreating(true);

    // Create new organization object
    const newOrg: Organization = {
      id: crypto.randomUUID(),
      name: newOrgName.trim(),
      slug: newOrgSlug.trim(),
      plan_tier: newOrgPlan,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('✅ New organization created (local):', newOrg);

    // Callback to parent
    if (onCreateNew) {
      onCreateNew(newOrg);
    }

    // Select the new organization
    onSelect(newOrg.id);

    // Reset form
    setNewOrgName('');
    setNewOrgSlug('');
    setNewOrgPlan('free');
    setShowCreateForm(false);
    setIsOpen(false);
    setCreating(false);
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return <Badge variant="gradient" size="sm">Enterprise</Badge>;
      case 'pro':
        return <Badge variant="success" size="sm">Pro</Badge>;
      case 'free':
        return <Badge variant="info" size="sm">Free</Badge>;
      default:
        return <Badge variant="info" size="sm">{plan}</Badge>;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Value / Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-lg flex items-center justify-between transition-colors ${
          error
            ? 'border-red-500 dark:border-red-500'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-gray-400" />
          <span className={selectedOrg ? '' : 'text-gray-400'}>
            {selectedOrg ? selectedOrg.name : 'Select organization...'}
          </span>
          {selectedOrg && selectedOrg.plan_tier && (
            <span className="ml-2">{getPlanBadge(selectedOrg.plan_tier)}</span>
          )}
        </div>
        <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Search Bar */}
          {!showCreateForm && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search organizations..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f45a4e]/20 focus:border-[#f45a4e]"
                />
              </div>
            </div>
          )}

          {/* Create New Organization Button */}
          {!showCreateForm && onCreateNew && (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="w-full px-4 py-3 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 text-[#f45a4e] font-medium transition-colors"
            >
              <Plus size={18} />
              <span>Create New Organization</span>
            </button>
          )}

          {/* Create Organization Form */}
          {showCreateForm && (
            <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">New Organization</h4>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Acme Corporation"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f45a4e]/20 focus:border-[#f45a4e]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                  placeholder="acme-corporation"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f45a4e]/20 focus:border-[#f45a4e]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plan
                </label>
                <select
                  value={newOrgPlan}
                  onChange={(e) => setNewOrgPlan(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f45a4e]/20 focus:border-[#f45a4e]"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleCreateNew}
                disabled={!newOrgName.trim() || !newOrgSlug.trim() || creating}
                className="w-full px-4 py-2 bg-[#f45a4e] text-white rounded-lg hover:bg-[#e53e3e] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Create Organization
                  </>
                )}
              </button>
            </div>
          )}

          {/* Organization List */}
          {!showCreateForm && (
            <div className="max-h-64 overflow-y-auto">
              {filteredOrgs.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No organizations found
                </div>
              ) : (
                filteredOrgs.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => handleSelect(org.id)}
                    className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedOrgId === org.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 size={18} className="text-gray-400" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">{org.name}</div>
                        {org.slug && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{org.slug}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {org.plan_tier && getPlanBadge(org.plan_tier)}
                      {selectedOrgId === org.id && (
                        <Check size={18} className="text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
};