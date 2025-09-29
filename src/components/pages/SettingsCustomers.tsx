// src/components/pages/SettingsCustomers.tsx
// Customer management page for Manager and Admin users

import {
  Ban,
  CheckCircle,
  Download,
  Edit,
  Eye,
  Filter,
  LogIn,
  Search,
  UserPlus
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

// Mock customer data (User role customers only)
interface Customer {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: 'user';
  status: 'active' | 'suspended';
  lastLogin: string;
  accountCreated: string;
  productsAssigned: string[];
  totalLocations: number;
  monthlyUsage: {
    reviews: number;
    posts: number;
    apiCalls: number;
  };
}

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@pizzapalace.com',
    organization: 'Pizza Palace',
    role: 'user',
    status: 'active',
    lastLogin: '2 hours ago',
    accountCreated: '2024-01-15',
    productsAssigned: ['gbp_management'],
    totalLocations: 3,
    monthlyUsage: {
      reviews: 45,
      posts: 12,
      apiCalls: 2340
    }
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike@techstartup.co',
    organization: 'TechStartup Inc',
    role: 'user',
    status: 'active',
    lastLogin: '1 day ago',
    accountCreated: '2024-02-20',
    productsAssigned: ['gbp_management', 'ai_visibility'],
    totalLocations: 1,
    monthlyUsage: {
      reviews: 23,
      posts: 8,
      apiCalls: 1240
    }
  },
  {
    id: '3',
    name: 'Lisa Rodriguez',
    email: 'lisa@dentalcare.net',
    organization: 'Dental Care Plus',
    role: 'user',
    status: 'suspended',
    lastLogin: '1 week ago',
    accountCreated: '2023-11-10',
    productsAssigned: ['gbp_management'],
    totalLocations: 5,
    monthlyUsage: {
      reviews: 0,
      posts: 0,
      apiCalls: 0
    }
  },
  {
    id: '4',
    name: 'James Wilson',
    email: 'james@localcafe.com',
    organization: 'Local Cafe',
    role: 'user',
    status: 'active',
    lastLogin: '3 days ago',
    accountCreated: '2024-03-05',
    productsAssigned: [],
    totalLocations: 2,
    monthlyUsage: {
      reviews: 8,
      posts: 3,
      apiCalls: 450
    }
  }
];

export const SettingsCustomers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  // const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 20;

  const filteredCustomers = mockCustomers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.organization.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
  const startIndex = (currentPage - 1) * customersPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + customersPerPage);

  const handleEditCustomer = (customer: Customer) => {
    console.log('Edit customer:', customer);
    // TODO: Implement edit customer functionality
  };

  const handleLoginAsCustomer = (customer: Customer) => {
    console.log('Login as customer:', customer);
    // TODO: Implement login as customer functionality
  };

  const handleSuspendCustomer = (customer: Customer) => {
    console.log('Suspend customer:', customer);
    // TODO: Implement suspend customer functionality
  };

  const handleActivateCustomer = (customer: Customer) => {
    console.log('Activate customer:', customer);
    // TODO: Implement activate customer functionality
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? <Badge variant="success" size="sm">Active</Badge>
      : <Badge variant="error" size="sm">Suspended</Badge>;
  };

  const getProductsBadges = (products: string[]) => {
    if (products.length === 0) {
      return <Badge variant="error" size="sm">No Products</Badge>;
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {products.map(product => (
          <Badge key={product} variant="info" size="sm">
            {product.replace('_', ' ')}
          </Badge>
        ))}
      </div>
    );
  };

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
          <Button variant="secondary" size="sm">
            <Download size={16} className="mr-2" />
            Export
          </Button>
          <Button variant="primary" size="sm">
            <UserPlus size={16} className="mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {mockCustomers.filter(c => c.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Customers</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {mockCustomers.reduce((sum, c) => sum + c.totalLocations, 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Locations</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {mockCustomers.reduce((sum, c) => sum + c.monthlyUsage.apiCalls, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Monthly API Calls</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(mockCustomers.reduce((sum, c) => sum + c.monthlyUsage.apiCalls, 0) / mockCustomers.length).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg Usage per Customer</div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'suspended')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
              <Button variant="secondary" size="sm">
                <Filter size={16} className="mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Customer Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-white">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Organization</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Products</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Locations</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Last Login</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Usage</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{customer.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{customer.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-medium text-gray-900 dark:text-white">{customer.organization}</span>
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(customer.status)}
                  </td>
                  <td className="py-4 px-4">
                    {getProductsBadges(customer.productsAssigned)}
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-medium text-gray-900 dark:text-white">{customer.totalLocations}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{customer.lastLogin}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-xs">
                      <div>Reviews: {customer.monthlyUsage.reviews}</div>
                      <div>Posts: {customer.monthlyUsage.posts}</div>
                      <div>API: {customer.monthlyUsage.apiCalls.toLocaleString()}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
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
                        onClick={() => handleLoginAsCustomer(customer)}
                        title="Login As Customer"
                      >
                        <LogIn size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => console.log('View details')}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </Button>
                      {customer.status === 'active' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSuspendCustomer(customer)}
                          title="Suspend Customer"
                        >
                          <Ban size={16} className="text-red-600" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleActivateCustomer(customer)}
                          title="Activate Customer"
                        >
                          <CheckCircle size={16} className="text-green-600" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + customersPerPage, filteredCustomers.length)} of {filteredCustomers.length} customers
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
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
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

      {/* Notes */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Eye size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">Customer Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This page shows all customer accounts (User role). You can edit customer details, manage their product access, 
              view usage statistics, and perform administrative actions. For managing Admin and Manager accounts, use the Users page.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};