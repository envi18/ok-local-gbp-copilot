// src/components/pages/SettingsCustomers.tsx
// Customer management page with CSV export functionality

import {
  AlertCircle,
  Ban,
  CheckCircle,
  Edit,
  Eye,
  LogIn,
  Package,
  RefreshCw,
  Search,
  UserPlus
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { CSVExportService } from '../../lib/csvExportService';
import { LoginAsService } from '../../lib/loginAsService';
import { productAccessService } from '../../lib/productAccessService';
import type { Organization, ProfileWithOrganization } from '../../lib/userService';
import { UserService } from '../../lib/userService';
import type { OrganizationProduct } from '../../types/products';
import { CreateCustomerModal } from '../modals/CreateCustomerModal';
import { CustomerDetailModal } from '../modals/CustomerDetailModal';
import { EditCustomerModal } from '../modals/EditCustomerModal';
import { ProductAssignmentModal } from '../modals/ProductAssignmentModal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ExportButton } from '../ui/ExportButton';

interface Customer extends ProfileWithOrganization {
  // Extends ProfileWithOrganization
}

export const SettingsCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgProducts, setOrgProducts] = useState<Record<string, OrganizationProduct[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [productAssignmentOrg, setProductAssignmentOrg] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const customersResult = await UserService.getCustomerUsers();
      if (customersResult.error) {
        console.error('❌ Error loading customers:', customersResult.error);
        setError('Failed to load customers');
      } else {
        console.log('✅ Customers loaded:', customersResult.data?.length);
        const loadedCustomers = customersResult.data || [];
        setCustomers(loadedCustomers);

        const productsMap: Record<string, OrganizationProduct[]> = {};
        for (const customer of loadedCustomers) {
          if (customer.organization_id) {
            const products = await productAccessService.getOrganizationProducts(customer.organization_id);
            productsMap[customer.organization_id] = products;
          }
        }
        setOrgProducts(productsMap);
        console.log('✅ Products loaded for organizations');
      }

      const orgsResult = await UserService.getAllOrganizations();
      if (orgsResult.error) {
        console.error('❌ Error loading organizations:', orgsResult.error);
      } else {
        console.log('✅ Organizations loaded:', orgsResult.data?.length);
        setOrganizations(orgsResult.data || []);
      }
    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      searchTerm === '' ||
      customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' ||
      customer.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    try {
      const exportData = filteredCustomers.map(customer => ({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        email: customer.email || '',
        organization_name: customer.organization?.name || 'N/A',
        organization_plan: customer.organization?.plan_tier || 'N/A',
        status: customer.status || 'active',
        products: orgProducts[customer.organization_id]?.map(p => p.product?.display_name).join(', ') || 'None',
        created_at: customer.created_at,
        last_sign_in: customer.last_sign_in_at || 'Never'
      }));

      CSVExportService.exportToCSV({
        filename: 'customers_export',
        data: exportData,
        includeMetadata: true
      });

      console.log(`✅ Exported ${exportData.length} customers to CSV`);
    } catch (err: any) {
      console.error('❌ Export failed:', err);
      throw err;
    }
  };

  const handleCreateCustomer = () => {
    setIsCreateModalOpen(true);
  };

  const handleCustomerCreated = (newCustomer: ProfileWithOrganization) => {
    console.log('✅ Customer created:', newCustomer);
    loadData();
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleEditCustomer = (customer: Customer) => {
    console.log('Edit customer:', customer);
    setEditingCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleCustomerUpdated = (updatedCustomer: ProfileWithOrganization) => {
    console.log('✅ Customer updated:', updatedCustomer);
    setCustomers(prevCustomers =>
      prevCustomers.map(c =>
        c.id === updatedCustomer.id ? updatedCustomer : c
      )
    );
    setEditingCustomer(null);
    setIsEditModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setEditingCustomer(null);
    setIsEditModalOpen(false);
  };

  const handleManageProducts = (customer: Customer) => {
    console.log('Manage products for:', customer);
    setProductAssignmentOrg({
      id: customer.organization_id,
      name: customer.organization?.name || 'Unknown Organization'
    });
    setIsProductModalOpen(true);
  };

  const handleProductsUpdated = () => {
    console.log('✅ Products updated, refreshing customer list');
    loadData();
  };

  const handleCloseProductModal = () => {
    setProductAssignmentOrg(null);
    setIsProductModalOpen(false);
  };

  const handleViewCustomer = (customer: Customer) => {
    console.log('View customer details:', customer);
    setViewingCustomer(customer);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setViewingCustomer(null);
    setIsDetailModalOpen(false);
  };

  const handleEditFromDetail = (customer: Customer) => {
    setViewingCustomer(null);
    setIsDetailModalOpen(false);
    setEditingCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleManageProductsFromDetail = (customer: Customer) => {
    setViewingCustomer(null);
    setIsDetailModalOpen(false);
    setProductAssignmentOrg({
      id: customer.organization_id,
      name: customer.organization?.name || 'Unknown Organization'
    });
    setIsProductModalOpen(true);
  };

  const handleSuspendCustomer = async (customerId: string) => {
    try {
      setActionLoading(customerId);
      
      const customer = customers.find(c => c.id === customerId);
      const isCurrentlySuspended = customer?.status === 'suspended';
      
      const result = isCurrentlySuspended 
        ? await UserService.activateUser(customerId)
        : await UserService.suspendUser(customerId);
      
      if (result.error) {
        console.error('Failed to update customer status:', result.error);
        setError(`Failed to ${isCurrentlySuspended ? 'activate' : 'suspend'} customer`);
      } else if (result.data) {
        setCustomers(prevCustomers =>
          prevCustomers.map(c =>
            c.id === customerId ? result.data! : c
          )
        );
        console.log(`✅ Customer ${isCurrentlySuspended ? 'activated' : 'suspended'} successfully`);
      }
    } catch (err: any) {
      console.error('Error updating customer status:', err);
      setError('An unexpected error occurred');
    } finally {
      setActionLoading(null);
    }
  };

const handleLoginAs = async (customer: Customer) => {
  try {
    setActionLoading(customer.id);
    console.log('🔐 Starting Login As session for:', customer.email);
    
    const result = await LoginAsService.startLoginAsSession(
      customer.id,
      customer.email || ''
    );
    
    if (result.success) {
      console.log('✅ Login As session started in new tab');
      // Success! New tab opened with customer view
      // No need to reload current page
    } else {
      console.error('❌ Failed to start Login As session:', result.error);
      setError(result.error || 'Failed to start Login As session');
    }
  } catch (err: any) {
    console.error('❌ Login As error:', err);
    setError('An error occurred while starting Login As session');
  } finally {
    setActionLoading('');
  }
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

  const renderProductBadges = (customer: Customer) => {
    const products = orgProducts[customer.organization_id] || [];
    
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
          <p className="text-gray-600 dark:text-gray-400">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your customer accounts, products, and usage
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadData}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          <ExportButton 
            onExport={handleExport}
            disabled={filteredCustomers.length === 0}
            size="sm"
          />
          <Button variant="primary" size="sm" onClick={handleCreateCustomer}>
            <UserPlus size={16} className="mr-2" />
            New Customer
          </Button>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card hover={false}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {customers.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-[#11998e] to-[#38ef7d] rounded-lg flex items-center justify-center">
                <UserPlus className="text-white" size={24} />
              </div>
            </div>
          </div>
        </Card>

        <Card hover={false}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {customers.filter(c => c.status === 'active').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center">
                <CheckCircle className="text-white" size={24} />
              </div>
            </div>
          </div>
        </Card>

        <Card hover={false}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Organizations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {organizations.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-[#f093fb] to-[#f5576c] rounded-lg flex items-center justify-center">
                <Package className="text-white" size={24} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card hover={false}>
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, email, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-[#f45a4e] text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-[#f45a4e] text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('suspended')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === 'suspended'
                    ? 'bg-[#f45a4e] text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Suspended
              </button>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredCustomers.length} of {customers.length} customers
          </div>
        </div>
      </Card>

      {/* Customers Table */}
      <Card hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'No customers match your filters' 
                        : 'No customers found'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {customer.first_name} {customer.last_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {customer.organization?.name || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {customer.organization?.plan_tier || 'No Plan'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {renderProductBadges(customer)}
                    </td>
                    <td className="px-6 py-4">
                      {customer.status === 'active' ? (
                        <Badge variant="success" size="sm">Active</Badge>
                      ) : (
                        <Badge variant="error" size="sm">Suspended</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewCustomer(customer)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#f45a4e] dark:hover:text-[#f45a4e] transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        
       {/* Login As Button - NEW */}
    <button
      onClick={() => handleLoginAs(customer)}
      disabled={!!actionLoading}
      className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Login As Customer"
    >
      {actionLoading === customer.id ? (
        <RefreshCw size={18} className="animate-spin" />
      ) : (
        <LogIn size={18} />
      )}
    </button>
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#f45a4e] dark:hover:text-[#f45a4e] transition-colors"
                          title="Edit Customer"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleManageProducts(customer)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#f45a4e] dark:hover:text-[#f45a4e] transition-colors"
                          title="Manage Products"
                        >
                          <Package size={16} />
                        </button>
                        <button
                          onClick={() => handleSuspendCustomer(customer.id)}
                          disabled={actionLoading === customer.id}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors disabled:opacity-50"
                          title={customer.status === 'suspended' ? 'Activate' : 'Suspend'}
                        >
                          {actionLoading === customer.id ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Ban size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals - FIXED: Removed isOpen prop and products prop */}
      {isCreateModalOpen && (
        <CreateCustomerModal
          onClose={handleCloseCreateModal}
          onCustomerCreated={handleCustomerCreated}
          organizations={organizations}
        />
      )}

      {isEditModalOpen && editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          organizations={organizations}
          onClose={handleCloseEditModal}
          onCustomerUpdated={handleCustomerUpdated}
        />
      )}

      {isDetailModalOpen && viewingCustomer && (
        <CustomerDetailModal
          customer={viewingCustomer}
          onClose={handleCloseDetailModal}
          onEdit={handleEditFromDetail}
          onManageProducts={handleManageProductsFromDetail}
        />
      )}

      {isProductModalOpen && productAssignmentOrg && (
        <ProductAssignmentModal
          organizationId={productAssignmentOrg.id}
          organizationName={productAssignmentOrg.name}
          onClose={handleCloseProductModal}
          onProductsUpdated={handleProductsUpdated}
        />
      )}
    </div>
  );
};