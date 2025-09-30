// src/components/pages/SettingsUsers.tsx
// Updated to use real Supabase data via UserService with Edit User Modal integration

import {
  Ban,
  Crown,
  Download,
  Edit,
  Eye,
  Loader,
  LogIn,
  Search,
  Shield,
  UserPlus
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ProfileWithOrganization, UserService } from '../../lib/userService';
import { EditUserModal } from '../modal/EditUserModal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

// Real user interface matching your database schema
interface SystemUser extends ProfileWithOrganization {}

export const SettingsUsers: React.FC = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'support' | 'reseller'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const usersPerPage = 20;

  // Fetch users from database
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await UserService.getSystemUsers();
        
        if (error) {
          console.error('Error fetching system users:', error);
          setError('Failed to load system users. Please try again.');
        } else {
          setUsers(data || []);
          console.log('Loaded system users:', data?.length || 0);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred while loading users.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, []);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    const email = user.email || '';
    const orgName = user.organization?.name || '';
    
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         orgName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  const handleEditUser = async (user: SystemUser) => {
    console.log('Edit system user:', user);
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleUserUpdated = (updatedUser: SystemUser) => {
    // Update the user in the local state
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
    console.log('Create new admin/manager user');
    // TODO: Implement create user functionality
  };

  const handleSuspendUser = async (userId: string) => {
    console.log('Suspend user:', userId);
    // TODO: Implement suspend user functionality
  };

  const handleLoginAsUser = (user: SystemUser) => {
    console.log('Login as user:', user);
    // TODO: Implement login as user functionality
  };

  const handleViewAuditLog = (user: SystemUser) => {
    console.log('View audit log for:', user);
    // TODO: Implement audit log functionality
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

  const formatUserName = (user: SystemUser): string => {
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || user.email || 'Unknown User';
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  // Statistics from real data
  const adminCount = users.filter(u => u.role === 'admin').length;
  const supportCount = users.filter(u => u.role === 'support').length;
  const resellerCount = users.filter(u => u.role === 'reseller').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading system users...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full w-fit mx-auto mb-4">
              <Ban className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Error Loading Users
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <Button 
              variant="primary" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </Card>
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
            Manage Admin, Support, and Reseller accounts with system-level permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {users.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total System Users</div>
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
            {supportCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <Shield size={14} />
            Support Users
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {resellerCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <Shield size={14} />
            Reseller Users
          </div>
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
                onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'support' | 'reseller')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="support">Support</option>
                <option value="reseller">Reseller</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto mb-4">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No users found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'Try adjusting your search terms or filters.' : 'No system users have been created yet.'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-white">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Organization</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Plan Tier</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Created</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatUserName(user)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {user.email || 'No email'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {user.organization?.name || 'No Organization'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="py-4 px-4">
                      <Badge 
                        variant={user.organization?.plan_tier === 'enterprise' ? 'gradient' : 'info'} 
                        size="sm"
                      >
                        {user.organization?.plan_tier || 'free'}
                      </Badge>
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
                          title="Suspend User"
                        >
                          <Ban size={16} className="text-red-600" />
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
                ✅ Connected to database - showing {users.length} real users
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        user={editingUser}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
};