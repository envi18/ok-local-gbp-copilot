// src/components/pages/SettingsUsers.tsx
// Enhanced Users page with status management, create user, and CSV export functionality

import {
  AlertTriangle,
  Ban,
  CheckCircle,
  Clock,
  Crown,
  Edit,
  LogIn,
  RefreshCw,
  Search,
  Shield,
  UserPlus,
  XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { CSVExportService } from '../../lib/csvExportService';
import { UserService, type ProfileWithOrganization } from '../../lib/userService';
import { CreateUserModal } from '../modals/CreateUserModal';
import { EditUserModal } from '../modals/EditUserModal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ExportButton } from '../ui/ExportButton';

type SystemUser = ProfileWithOrganization;

export const SettingsUsers: React.FC = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const usersPerPage = 10;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await UserService.getSystemUsers();
      
      if (result.error) {
        console.error('Failed to load users:', result.error);
        setError('Failed to load system users');
      } else if (result.data) {
        setUsers(result.data);
        console.log('✅ Loaded users:', result.data.length);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError('An error occurred while loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    loadUsers();
  };

  // Export users to CSV
  const handleExport = () => {
    try {
      const exportData = filteredUsers.map(user => ({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        role: user.role || 'user',
        status: user.status || 'active',
        organization_name: user.organization?.name || 'N/A',
        organization_plan: user.organization?.plan_tier || 'N/A',
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at || 'Never'
      }));

      CSVExportService.exportToCSV({
        filename: 'system_users_export',
        data: exportData,
        includeMetadata: true
      });

      console.log(`✅ Exported ${exportData.length} users to CSV`);
    } catch (err: any) {
      console.error('❌ Export failed:', err);
      throw err;
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const orgName = (user.organization?.name || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return fullName.includes(search) || email.includes(search) || orgName.includes(search);
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  // Statistics
  const adminCount = users.filter(u => u.role === 'admin').length;
  const supportCount = users.filter(u => u.role === 'support').length;
  const activeCount = users.filter(u => u.status === 'active').length;

  const handleEditUser = (user: SystemUser) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleUserUpdated = (updatedUser: SystemUser) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      )
    );
    setEditingUser(null);
    setIsEditModalOpen(false);
    console.log('User updated successfully in UI:', updatedUser);
  };

  const handleCloseEditModal = () => {
    setEditingUser(null);
    setIsEditModalOpen(false);
  };

  const handleCreateUser = () => {
    setIsCreateModalOpen(true);
  };

  const handleUserCreated = (newUser: SystemUser) => {
    setUsers(prevUsers => [newUser, ...prevUsers]);
    setIsCreateModalOpen(false);
    console.log('New user added to list:', newUser);
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      setActionLoading(userId);
      
      const user = users.find(u => u.id === userId);
      const isCurrentlySuspended = user?.status === 'suspended';
      
      const result = isCurrentlySuspended 
        ? await UserService.activateUser(userId)
        : await UserService.suspendUser(userId);
      
      if (result.error) {
        console.error('Failed to update user status:', result.error);
        setError(`Failed to ${isCurrentlySuspended ? 'activate' : 'suspend'} user`);
      } else if (result.data) {
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? result.data! : user
          )
        );
        console.log(`✅ User ${isCurrentlySuspended ? 'activated' : 'suspended'} successfully`);
      }
    } catch (err: any) {
      console.error('Error updating user status:', err);
      setError('An unexpected error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { variant: 'success' | 'warning' | 'error' | 'info', icon: any, label: string }> = {
      admin: { variant: 'error', icon: Crown, label: 'Admin' },
      support: { variant: 'info', icon: Shield, label: 'Support' },
      reseller: { variant: 'warning', icon: Shield, label: 'Reseller' },
      user: { variant: 'info', icon: Shield, label: 'User' }
    };

    const config = roleConfig[role] || roleConfig.user;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} size="sm">
        <Icon size={12} className="mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <Badge variant="success" size="sm">
          <CheckCircle size={12} className="mr-1" />
          Active
        </Badge>
      );
    } else if (status === 'suspended') {
      return (
        <Badge variant="error" size="sm">
          <XCircle size={12} className="mr-1" />
          Suspended
        </Badge>
      );
    } else {
      return (
        <Badge variant="warning" size="sm">
          <Clock size={12} className="mr-1" />
          Pending
        </Badge>
      );
    }
  };

  const formatUserName = (user: SystemUser): string => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email?.split('@')[0] || 'Unknown User';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f45a4e] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading system users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Users</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage admin, support, and reseller accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={handleRefresh}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          <ExportButton 
            onExport={handleExport}
            disabled={filteredUsers.length === 0}
            size="sm"
          />
          <Button variant="primary" size="sm" onClick={handleCreateUser}>
            <UserPlus size={16} className="mr-2" />
            Add System User
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card hover={false}>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertTriangle size={18} />
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{users.length}</p>
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{adminCount}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] rounded-lg flex items-center justify-center">
                <Crown className="text-white" size={24} />
              </div>
            </div>
          </div>
        </Card>

        <Card hover={false}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Support</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{supportCount}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg flex items-center justify-center">
                <Shield className="text-white" size={24} />
              </div>
            </div>
          </div>
        </Card>

        <Card hover={false}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{activeCount}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-[#38ef7d] to-[#11998e] rounded-lg flex items-center justify-center">
                <CheckCircle className="text-white" size={24} />
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
              placeholder="Search by name, email, or organization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
            />
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredUsers.length} of {users.length} system users
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card hover={false}>
        <div className="overflow-x-auto">
          {paginatedUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <UserPlus size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'No users found' : 'No system users yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm 
                  ? 'Try adjusting your search criteria'
                  : 'Create your first system user to get started'
                }
              </p>
              {!searchTerm && (
                <Button variant="primary" size="sm" onClick={handleCreateUser} className="mt-4">
                  <UserPlus size={16} className="mr-2" />
                  Add System User
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Organization</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Created</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatUserName(user)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(user.status || 'active')}
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {user.organization?.name || 'No Organization'}
                        </div>
                        <Badge 
                          variant={user.organization?.plan_tier === 'enterprise' ? 'gradient' : 'info'} 
                          size="sm"
                        >
                          {user.organization?.plan_tier || 'No Plan'}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                      {user.last_sign_in_at && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1 mt-1">
                          <LogIn size={12} />
                          {new Date(user.last_sign_in_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          title="Edit User"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSuspendUser(user.id)}
                          title={user.status === 'suspended' ? 'Activate User' : 'Suspend User'}
                          disabled={actionLoading === user.id}
                        >
                          {actionLoading === user.id ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : user.status === 'suspended' ? (
                            <CheckCircle size={16} className="text-green-600" />
                          ) : (
                            <Ban size={16} className="text-red-600" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
      <Card hover={false} className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Crown size={16} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">System User Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This page shows real system users from your database with Admin, Support, and Reseller roles. 
              Only Admins can create new system accounts or modify permissions. For managing customer accounts, use the Customers page.
            </p>
            {users.length > 0 && (
              <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                ✅ Connected to database - showing {users.length} real users with status management
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Modals */}
      {isEditModalOpen && editingUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          user={editingUser}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {isCreateModalOpen && (
        <CreateUserModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onUserCreated={handleUserCreated}
        />
      )}
    </div>
  );
};