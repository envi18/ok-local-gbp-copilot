// src/components/pages/SettingsCustomers.tsx
// Customer management page connected to real database

import {
  AlertCircle,
  Ban,
  CheckCircle,
  Download,
  Edit,
  Eye,
  Filter,
  Package,
  RefreshCw,
  Search,
  UserPlus
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { Organization, ProfileWithOrganization } from '../../lib/userService';
import { UserService } from '../../lib/userService';
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
        setCustomers(customersResult.data || []);
      }

      // Load organizations
      const orgsResult = await UserService.getAllOrganizations();
      if (orgsResult.error) {
        console.error('❌ Error loading organizations:', orgsResult.error);
      } else {
        console.log('✅ Organizations loaded:', orgsResult.data?.length);
        setOrganizations(orgsResult.data || []);
      }
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase();
    const email = (customer.email || '').toLowerCase();
    const orgName = (customer.organization?.name || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    const matchesSearch = fullName.includes(search) || email.includes(search) || orgName.includes(search);
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
  const startIndex = (currentPage - 1) * customersPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + customersPerPage);

  // Statistics
  const activeCount = customers.filter(c => c.status === 'active').length;
  const suspendedCount = customers.filter(c => c.status === 'suspended').length;
  const pendingCount = customers.filter(c => c.status === 'pending').length;
  
  // Get unique organizations
  const totalOrganizations = new Set(customers.map(c => c.organization_id)).size;

  // Action handlers
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
    // TODO: Implement customer detail view (Phase 8B)
  };

  const handleLoginAsCustomer = (customer: Customer) => {
    console.log('Login as customer:', customer);
    // TODO: Implement login as customer functionality (Future phase)
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
        setError(null);
      }
    } catch (err) {
      console.error('Error updating customer status:', err);
      setError('An unexpected error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddCustomer = () => {
    console.log('Add new customer');
    // TODO: Implement add customer modal (Phase 8B)
  };

  const handleExport = () => {
    console.log('Export customers');
    // TODO: Implement CSV export (Phase 8B)
  };

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

  const getPlanBadge = (planTier?: string) => {
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
          <Button variant="primary" size="sm" onClick={handleAddCustomer}>
            <UserPlus size={16} className="mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertCircle size={18} />
            <span className="font-medium">{error}</span>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {customers.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Customers</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {activeCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {suspendedCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Suspended</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {pendingCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f45a4e]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f45a4e]"
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
                  <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
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
                      {getPlanBadge(customer.organization?.plan_tier)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManageProducts(customer)}
                          title="Manage Products"
                        >
                          <Package size={16} className="text-purple-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewCustomer(customer)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCustomer(customer)}
                          title="Edit Customer"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSuspendCustomer(customer.id)}
                          disabled={actionLoading === customer.id}
                          title={customer.status === 'suspended' ? 'Activate' : 'Suspend'}
                        >
                          {actionLoading === customer.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
                          ) : customer.status === 'suspended' ? (
                            <CheckCircle size={16} className="text-green-600" />
                          ) : (
                            <Ban size={16} className="text-red-600" />
                          )}
                        </Button>
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + customersPerPage, filteredCustomers.length)} of {filteredCustomers.length} customers
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Customer Modal */}
      {isEditModalOpen && editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          organizations={organizations}
          onClose={handleCloseEditModal}
          onCustomerUpdated={handleCustomerUpdated}
        />
      )}

      {/* Product Assignment Modal */}
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