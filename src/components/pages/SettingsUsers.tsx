// src/components/pages/SettingsUsers.tsx
// Enhanced Users page with status management and create user functionality

import {
  AlertTriangle,
  Ban,
  CheckCircle,
  Clock,
  Crown,
  Download,
  Edit,
  Eye,
  LogIn,
  RefreshCw,
  Search,
  Shield,
  UserPlus,
  XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { UserService, type ProfileWithOrganization } from '../../lib/userService';
import { CreateUserModal } from '../modals/CreateUserModal';
import { EditUserModal } from '../modals/EditUserModal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

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
  const resellerCount = users.filter(u => u.role === 'reseller').length;
  const activeCount = users.filter(u => u.status === 'active').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;

  const handleEditUser = (user: SystemUser) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleUserUpdated = (updatedUser: SystemUser) => {
    // Update the user in the list
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      )
    );
    
    // Close the modal
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
    // Add the new user to the list
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
        // Update the user in the list
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? result.data! : user
          )
        );
        console.log(`✅ User ${isCurrentlySuspended ? 'activated' : 'suspended'}:`, result.data);
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      setError('An error occurred while updating user status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLoginAsUser = (user: SystemUser) => {
    console.log('Login as user:', user);
    // TODO: Implement login as user functionality
    alert(`Login as ${user.first_name} ${user.last_name} - Feature coming soon!`);
  };

  const handleViewAuditLog = (user: SystemUser) => {
    console.log('View audit log for:', user);
    // TODO: Implement audit log functionality
    alert(`Audit log for ${user.first_name} ${user.last_name} - Feature coming soon!`);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge variant="error" size="sm" className="flex items-center gap-1">
            <Crown size={12} />
            Admin
          </Badge>
        );
      case 'support':
        return (
          <Badge variant="warning" size="sm" className="flex items-center gap-1">
            <Shield size={12} />
            Support
          </Badge>
        );
      case 'reseller':
        return (
          <Badge variant="info" size="sm" className="flex items-center gap-1">
            <Shield size={12} />
            Reseller
          </Badge>
        );
      default:
        return (
          <Badge variant="info" size="sm">
            {role}
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="success" size="sm" className="flex items-center gap-1">
            <CheckCircle size={12} />
            Active
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="error" size="sm" className="flex items-center gap-1">
            <XCircle size={12} />
            Suspended
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" size="sm" className="flex items-center gap-1">
            <Clock size={12} />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="info" size="sm">
            {status}
          </Badge>
        );
    }
  };

  const formatUserName = (user: SystemUser): string => {
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unnamed User';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw size={24} className="animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading system users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Users</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage Admin, Support, and Reseller accounts with system-level permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={handleRefresh}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          <Button variant="secondary" size="sm">
            <Download size={16} className="mr-2" />
            Export
          </Button>
          <Button variant="primary" size="sm" onClick={handleCreateUser}>
            <UserPlus size={16} className="mr-2" />
            Add System User
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {users.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total System Users</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {activeCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <CheckCircle size={14} />
            Active
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">
            {suspendedCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <XCircle size={14} />
            Suspended
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {adminCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <Crown size={14} />
            Admin Users
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {supportCount + resellerCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <Shield size={14} />
            Support & Resellers
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or organization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredUsers.length} of {users.length} users
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
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
                          {user.organization?.plan_tier || 'free'}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(user.created_at)}
                      </span>
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
                          onClick={() => handleLoginAsUser(user)}
                          title="Login As User"
                        >
                          <LogIn size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewAuditLog(user)}
                          title="View Audit Log"
                        >
                          <Eye size={16} />
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
      <Card className="p-4">
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
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        user={editingUser}
        onUserUpdated={handleUserUpdated}
      />

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
};