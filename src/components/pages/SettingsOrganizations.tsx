// src/components/pages/SettingsOrganizations.tsx
// Organizations management page with CSV export

import {
  AlertCircle,
  Building2,
  Package,
  RefreshCw,
  Search,
  Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { CSVExportService } from '../../lib/csvExportService';
import { productAccessService } from '../../lib/productAccessService';
import { supabase } from '../../lib/supabase';
import type { Organization } from '../../lib/userService';
import { UserService } from '../../lib/userService';
import type { OrganizationProduct } from '../../types/products';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ExportButton } from '../ui/ExportButton';

interface OrganizationWithStats extends Organization {
  user_count?: number;
  customer_count?: number;
  products?: OrganizationProduct[];
}

export const SettingsOrganizations: React.FC = () => {
  const [organizations, setOrganizations] = useState<OrganizationWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load organizations
      const orgsResult = await UserService.getAllOrganizations();
      
      if (orgsResult.error) {
        console.error('❌ Error loading organizations:', orgsResult.error);
        setError('Failed to load organizations');
        return;
      }

      const orgs = orgsResult.data || [];
      console.log('✅ Organizations loaded:', orgs.length);

      // Load products and user counts for each organization
      const orgsWithData = await Promise.all(
        orgs.map(async (org) => {
          // Get products
          const products = await productAccessService.getOrganizationProducts(org.id);
          
          // Get user counts (system users and customers)
          const { data: users } = await supabase
            .from('profiles')
            .select('role')
            .eq('organization_id', org.id);

          const user_count = users?.filter(u => u.role !== 'customer').length || 0;
          const customer_count = users?.filter(u => u.role === 'customer').length || 0;

          return {
            ...org,
            products,
            user_count,
            customer_count
          };
        })
      );

      setOrganizations(orgsWithData);
      console.log('✅ Organization data loaded with stats');
    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Filter organizations based on search
  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = 
      searchTerm === '' ||
      org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.slug?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Export organizations to CSV
  const handleExport = () => {
    try {
      const exportData = filteredOrganizations.map(org => ({
        name: org.name || '',
        slug: org.slug || '',
        plan_tier: org.plan_tier || 'free',
        user_count: org.user_count || 0,
        customer_count: org.customer_count || 0,
        total_users: (org.user_count || 0) + (org.customer_count || 0),
        products: org.products?.map(p => p.product?.display_name).join(', ') || 'None',
        created_at: org.created_at
      }));

      CSVExportService.exportToCSV({
        filename: 'organizations_export',
        data: exportData,
        includeMetadata: true
      });

      console.log(`✅ Exported ${exportData.length} organizations to CSV`);
    } catch (err: any) {
      console.error('❌ Export failed:', err);
      throw err;
    }
  };

  const getPlanBadge = (plan: string) => {
    const planConfig: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'gradient', label: string }> = {
      free: { variant: 'info', label: 'Free' },
      pro: { variant: 'warning', label: 'Pro' },
      enterprise: { variant: 'gradient', label: 'Enterprise' }
    };

    const config = planConfig[plan] || planConfig.free;

    return (
      <Badge variant={config.variant} size="sm">
        {config.label}
      </Badge>
    );
  };

  const getShortProductName = (name: string): string => {
    const shortNames: Record<string, string> = {
      'GBP Management': 'GBP',
      'Premium Listings': 'Premium',
      'AI Visibility': 'AI',
      'Voice Search': 'Voice',
      'Review Management': 'Reviews'
    };
    return shortNames[name] || name;
  };

  const renderProductBadges = (org: OrganizationWithStats) => {
    const products = org.products || [];
    
    if (products.length === 0) {
      return <Badge variant="info" size="sm">No Products</Badge>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {products.map(orgProduct => (
          <Badge 
            key={orgProduct.id} 
            variant="info" 
            size="sm"
            className="font-mono"
          >
            {getShortProductName(orgProduct.product?.display_name || 'Unknown')}
          </Badge>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f45a4e] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organizations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage all organizations in your platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadData}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          <ExportButton 
            onExport={handleExport}
            disabled={filteredOrganizations.length === 0}
            size="sm"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card hover={false}>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card hover={false}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Organizations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {organizations.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-[#11998e] to-[#38ef7d] rounded-lg flex items-center justify-center">
                <Building2 className="text-white" size={24} />
              </div>
            </div>
          </div>
        </Card>

        <Card hover={false}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Enterprise Plans</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {organizations.filter(o => o.plan_tier === 'enterprise').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center">
                <Package className="text-white" size={24} />
              </div>
            </div>
          </div>
        </Card>

        <Card hover={false}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {organizations.reduce((sum, org) => sum + (org.user_count || 0) + (org.customer_count || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-[#f093fb] to-[#f5576c] rounded-lg flex items-center justify-center">
                <Users className="text-white" size={24} />
              </div>
            </div>
          </div>
        </Card>

        <Card hover={false}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pro Plans</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {organizations.filter(o => o.plan_tier === 'pro').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] rounded-lg flex items-center justify-center">
                <Building2 className="text-white" size={24} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card hover={false}>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by organization name or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
            />
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredOrganizations.length} of {organizations.length} organizations
          </div>
        </div>
      </Card>

      {/* Organizations Table */}
      <Card hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {filteredOrganizations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      {searchTerm 
                        ? 'No organizations match your search' 
                        : 'No organizations found'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrganizations.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {org.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {org.slug}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getPlanBadge(org.plan_tier)}
                    </td>
                    <td className="px-6 py-4">
                      {renderProductBadges(org)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-gray-900 dark:text-white">
                          {(org.user_count || 0) + (org.customer_count || 0)} total
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {org.user_count || 0} staff • {org.customer_count || 0} customers
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(org.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};