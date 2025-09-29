// src/components/pages/SettingsUsers.tsx
// Updated to focus on Admin and Manager user management only

import {
  Ban,
  CheckCircle,
  Crown,
  Download,
  Edit,
  Eye,
  LogIn,
  Search,
  Shield,
  UserPlus
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

// Mock user data (Admin and Manager roles only)
interface SystemUser {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: 'admin' | 'manager';
  status: 'active' | 'suspended';
  lastLogin: string;
  accountCreated: string;
  permissions: string[];
  createdBy: string;
}

const mockSystemUsers: SystemUser[] = [
  {
    id: '1',
    name: 'John Admin',
    email: 'john@gbp-platform.com',
    organization: 'GBP Platform',
    role: 'admin',
    status: 'active',
    lastLogin: '1 hour ago',
    accountCreated: '2023-12-01',
    permissions: ['full_system_access', 'user_management', 'billing_access'],
    createdBy: 'System'
  },
  {
    id: '2',
    name: 'Maria Manager',
    email: 'maria@gbp-platform.com',
    organization: 'GBP Platform',
    role: 'manager',
    status: 'active',
    lastLogin: '3 hours ago',
    accountCreated: '2024-01-15',
    permissions: ['customer_management', 'support_access'],
    createdBy: 'john@gbp-platform.com'
  },
  {
    id: '3',
    name: 'David Director',
    email: 'david@subsidiary.com',
    organization: 'Subsidiary Corp',
    role: 'manager',
    status: 'active',
    lastLogin: '2 days ago',
    accountCreated: '2024-02-10',
    permissions: ['customer_management', 'reports_access'],
    createdBy: 'john@gbp-platform.com'
  }
];

export const SettingsUsers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'manager'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  // const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 20;

  const filteredUsers = mockSystemUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.organization.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  const handleEditUser = (user: SystemUser) => {
    console.log('Edit system user:', user);
    // TODO: Implement edit user functionality
  };

  const handleCreateUser = () => {
    console.log('Create new admin/manager user');
    // TODO: Implement create user functionality
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <Badge variant="error" size="sm" className="flex items-center gap-1">
          <Crown size={12} />
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="info" size="sm" className="flex items-center gap-1">
        <Shield size={12} />
        Manager
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? <Badge variant="success" size="sm">Active</Badge>
      : <Badge variant="error" size="sm">Suspended</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Users</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage Admin and Manager accounts with system-level permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm">
            <Download size={16} className="mr-2" />
            Export
          </Button>
          <Button variant="primary" size="sm" onClick={handleCreateUser}>
            <UserPlus size={16} className="mr-2" />
            Add Admin/Manager
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {mockSystemUsers.filter(u => u.role === 'admin').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <Crown size={14} />
            Admin Users
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {mockSystemUsers.filter(u => u.role === 'manager').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <Shield size={14} />
            Manager Users
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {mockSystemUsers.filter(u => u.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
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
                placeholder="Search system users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'manager')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'suspended')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-white">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Organization</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Permissions</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Last Login</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Created By</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-medium text-gray-900 dark:text-white">{user.organization}</span>
                  </td>
                  <td className="py-4 px-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1 max-w-32">
                      {user.permissions.slice(0, 2).map(permission => (
                        <Badge key={permission} variant="info" size="sm" className="text-xs">
                          {permission.replace('_', ' ')}
                        </Badge>
                      ))}
                      {user.permissions.length > 2 && (
                        <Badge variant="info" size="sm" className="text-xs">
                          +{user.permissions.length - 2}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{user.lastLogin}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{user.createdBy}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        title="Edit User & Permissions"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => console.log('Login as user:', user)}
                        title="Login As User"
                      >
                        <LogIn size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => console.log('View audit log')}
                        title="View Audit Log"
                      >
                        <Eye size={16} />
                      </Button>
                      {user.status === 'active' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => console.log('Suspend user')}
                          title="Suspend User"
                        >
                          <Ban size={16} className="text-red-600" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => console.log('Activate user')}
                          title="Activate User"
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
              Showing {startIndex + 1} to {Math.min(startIndex + usersPerPage, filteredUsers.length)} of {filteredUsers.length} system users
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

      {/* Admin Notes */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Crown size={16} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">System User Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This page is for managing Admin and Manager accounts with system-level permissions. Only Admins can create new Admin/Manager accounts 
              or modify permissions. For managing customer accounts, use the Customers page.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};