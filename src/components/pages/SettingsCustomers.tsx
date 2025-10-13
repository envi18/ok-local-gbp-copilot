// src/components/pages/SettingsCustomers.tsx
// Customer management page with product display

import {
  AlertCircle,
  Ban,
  CheckCircle,
  Download,
  Edit,
  Eye,
  Package,
  RefreshCw,
  Search,
  UserPlus
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
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

// Customer type based on real database structure
interface Customer extends ProfileWithOrganization {
  // Extends ProfileWithOrganization which has:
  // id, organization_id, first_name, last_name, email, role, status, created_at
  // organization: { id, name, slug, plan_tier }
}

export const SettingsCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgProducts, setOrgProducts] = useState<Record<string, OrganizationProduct[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 20;

  // Edit modal state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Create customer modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Detail view modal state
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Product assignment modal state
  const [productAssignmentOrg, setProductAssignmentOrg] = useState<{ id: string; name: string } | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Load customers and organizations from database
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Loading customers and organizations from database...');
      
      // Load customers
      const customersResult = await UserService.getCustomerUsers();
      if (customersResult.error) {
        console.error('❌ Error loading customers:', customersResult.error);
        setError('Failed to load customers');
      } else {
        console.log('✅ Customers loaded:', customersResult.data?.length);
        const loadedCustomers = customersResult.data || [];
        setCustomers(loadedCustomers);

        // Load products for each organization
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

      // Load organizations
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

  // Filter customers based on search and status
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

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * customersPerPage,
    currentPage * customersPerPage
  );

  // Statistics
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    suspended: customers.filter(c => c.status === 'suspended').length,
    pending: customers.filter(c => c.status === 'pending').length
  };

  const handleExport = () => {
    console.log('Export customers');
    // TODO: Implement CSV export
  };

  const handleCreateCustomer = () => {
    console.log('Create new customer');
    setIsCreateModalOpen(true);
  };

  const handleCustomerCreated = (newCustomer: Customer) => {
    console.log('✅ New customer created:', newCustomer);
    setIsCreateModalOpen(false);
    loadData(); // Refresh the list
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleEditCustomer = (customer: Customer) => {
    console.log('Edit customer:', customer);
    setEditingCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleCustomerUpdated = (updatedCustomer: Customer) => {
    // Update the customer in the list
    setCustomers(prevCustomers =>
      prevCustomers.map(c =>
        c.id === updatedCustomer.id ? updatedCustomer : c
      )
    );
    
    // Close the modal
    setEditingCustomer(null);
    setIsEditModalOpen(false);
    
    console.log('✅ Customer updated successfully in UI:', updatedCustomer);
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
    loadData(); // Refresh to show updated data
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
    // Close detail modal and open edit modal
    setViewingCustomer(null);
    setIsDetailModalOpen(false);
    setEditingCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleManageProductsFromDetail = (customer: Customer) => {
    // Close detail modal and open products modal
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
        // Update the customer in the list
        setCustomers(prevCustomers =>
          prevCustomers.map(c =>
            c.id === customerId ? result.data! : c
          )
        );
        console.log(`✅ Customer ${isCurrentlySuspended ? 'activated' : 'suspended'} successfully`);
      }
    } catch (err: any) {
      console.error('Error updating customer status:', err);
      setError('Failed to update customer status');
    } finally {
      setActionLoading(null);
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

  // Helper to get short product names
  const getShortProductName = (displayName: string): string => {
    const nameMap: Record<string, string> = {
      'GBP Management': 'GBP',
      'AI Visibility': 'AI',
      'Premium Listings': 'Prem',
      'Voice Search': 'Voice'
    };
    
    return nameMap[displayName] || displayName.substring(0, 4);
  };

  const renderProductBadges = (organizationId: string) => {
    const products = orgProducts[organizationId] || [];
    
    if (products.length === 0) {
      return (
        <span className="text-xs text-gray-400 dark:text-gray-500">
          No products
        </span>
      );
    }

    return (
      <div className="flex flex-wrap gap-1">
        {products.map((orgProduct) => (
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
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download size={16} className="mr-2" />
            Export
          </Button>
          <Button variant="primary" size="sm" onClick={handleCreateCustomer}>
            <UserPlus size={16} className="mr-2" />
            New Customer
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.active}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Suspended</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.suspended}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.pending}</p>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f45a4e]/20 focus:border-[#f45a4e]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#f45a4e]/20 focus:border-[#f45a4e]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Customers Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                  Customer
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                  Organization
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                  Plan
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                  Products
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                  Created
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No customers found
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {customer.first_name} {customer.last_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.email}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {customer.organization?.name || 'No Organization'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(customer.status)}
                    </td>
                    <td className="py-3 px-4">
                      {getPlanBadge(customer.organization?.plan_tier || '')}
                    </td>
                    <td className="py-3 px-4">
                      {renderProductBadges(customer.organization_id)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewCustomer(customer)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Edit Customer"
                        >
                          <Edit size={16} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleManageProducts(customer)}
                          className="p-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded transition-colors"
                          title="Manage Products"
                        >
                          <Package size={16} className="text-purple-600 dark:text-purple-400" />
                        </button>
                        <button
                          onClick={() => handleSuspendCustomer(customer.id)}
                          disabled={actionLoading === customer.id}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                          title={customer.status === 'suspended' ? 'Activate' : 'Suspend'}
                        >
                          {actionLoading === customer.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          ) : (
                            <Ban size={16} className="text-red-600 dark:text-red-400" />
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(currentPage - 1) * customersPerPage + 1} to{' '}
              {Math.min(currentPage * customersPerPage, filteredCustomers.length)} of{' '}
              {filteredCustomers.length} customers
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateCustomerModal
          organizations={organizations}
          onClose={handleCloseCreateModal}
          onCustomerCreated={handleCustomerCreated}
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

      {isEditModalOpen && editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          organizations={organizations}
          onClose={handleCloseEditModal}
          onCustomerUpdated={handleCustomerUpdated}
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