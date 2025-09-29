// src/components/pages/SettingsUsers.tsx
// Complete admin interface for user/customer management

import {
  AlertCircle,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  ExternalLink,
  Plus,
  Search,
  Trash2
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { AdminUserProfile, AuditLogEntry } from '../../types/rbac';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const SettingsUsers: React.FC = () => {
  // Current admin user (get from auth context in production)
  const currentAdmin = {
    id: 'admin-123',
    email: 'admin@example.com',
    role: 'admin' as const,
  };

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserProfile | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const usersPerPage = 20;

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users when search or filter changes
  useEffect(() => {
    filterUsers();
  }, [searchQuery, users, statusFilter]);

  const loadUsers = async () => {
    // TODO: Replace with real API call
    const mockUsers: AdminUserProfile[] = [
      {
        id: '1',
        email: 'customer1@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '(555) 123-4567',
        avatar_url: null,
        organization_id: 'org-1',
        organization_name: 'Acme Landscaping',
        role: 'user',
        status: 'active',
        google_connected: true,
        google_email: 'john@gmail.com',
        google_connected_at: '2025-01-15T10:00:00Z',
        created_at: '2024-12-01T00:00:00Z',
        updated_at: '2025-09-28T12:00:00Z',
        last_login_at: '2025-09-29T08:30:00Z',
        suspended_at: null,
        suspended_by: null,
        suspension_reason: null,
        active_products: ['gbp_management', 'ai_visibility'],
        notes: 'Premium customer - excellent payment history'
      },
      {
        id: '2',
        email: 'customer2@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        phone: '(555) 987-6543',
        avatar_url: null,
        organization_id: 'org-2',
        organization_name: 'Downtown Dental',
        role: 'user',
        status: 'suspended',
        google_connected: false,
        google_email: null,
        google_connected_at: null,
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-09-20T15:00:00Z',
        last_login_at: '2025-09-15T14:20:00Z',
        suspended_at: '2025-09-20T15:00:00Z',
        suspended_by: 'admin-123',
        suspension_reason: 'Payment failed - account past due',
        active_products: ['gbp_management'],
        notes: 'Payment issues - suspended until resolved'
      },
      {
        id: '3',
        email: 'manager@example.com',
        first_name: 'Bob',
        last_name: 'Manager',
        phone: '(555) 111-2222',
        avatar_url: null,
        organization_id: 'org-internal',
        organization_name: 'Internal Staff',
        role: 'manager',
        status: 'active',
        google_connected: false,
        google_email: null,
        google_connected_at: null,
        created_at: '2024-11-01T00:00:00Z',
        updated_at: '2025-09-29T09:00:00Z',
        last_login_at: '2025-09-29T09:00:00Z',
        suspended_at: null,
        suspended_by: null,
        suspension_reason: null,
        active_products: [],
        notes: 'Customer support manager'
      }
    ];
    setUsers(mockUsers);
  };

  const filterUsers = () => {
    let filtered = users;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(query) ||
        user.organization_name.toLowerCase().includes(query) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleLoginAs = (user: AdminUserProfile) => {
    // TODO: Implement actual login-as functionality
    console.log('Login as:', user);
    
    // Log the action
    logAuditAction('login_as', user.id, user.email, {
      target_organization: user.organization_name
    });

    // In production, this would:
    // 1. Create a temporary session token
    // 2. Store the admin's original session
    // 3. Redirect to dashboard with user's context
    alert(`Logging in as ${user.email}...\n\nIn production, you would now see their dashboard.`);
  };

  const handleSuspendUser = async (user: AdminUserProfile) => {
    const reason = prompt('Reason for suspension:');
    if (!reason) return;

    // TODO: API call to suspend user
    console.log('Suspending user:', user.id, reason);

    // Update local state
    setUsers(users.map(u =>
      u.id === user.id
        ? {
            ...u,
            status: 'suspended',
            suspended_at: new Date().toISOString(),
            suspended_by: currentAdmin.id,
            suspension_reason: reason
          }
        : u
    ));

    logAuditAction('user_suspended', user.id, user.email, { reason });
  };

  const handleActivateUser = async (user: AdminUserProfile) => {
    // TODO: API call to activate user
    console.log('Activating user:', user.id);

    // Update local state
    setUsers(users.map(u =>
      u.id === user.id
        ? {
            ...u,
            status: 'active',
            suspended_at: null,
            suspended_by: null,
            suspension_reason: null
          }
        : u
    ));

    logAuditAction('user_activated', user.id, user.email, {});
  };

  const handleAddProduct = async (user: AdminUserProfile, productId: string) => {
    // TODO: API call to add product
    console.log('Adding product:', productId, 'to user:', user.id);

    setUsers(users.map(u =>
      u.id === user.id
        ? { ...u, active_products: [...u.active_products, productId] }
        : u
    ));

    logAuditAction('product_added', user.id, user.email, { product_id: productId });
  };

  const handleRemoveProduct = async (user: AdminUserProfile, productId: string) => {
    // TODO: API call to remove product
    console.log('Removing product:', productId, 'from user:', user.id);

    setUsers(users.map(u =>
      u.id === user.id
        ? { ...u, active_products: u.active_products.filter(p => p !== productId) }
        : u
    ));

    logAuditAction('product_removed', user.id, user.email, { product_id: productId });
  };

  const logAuditAction = (
    action: string,
    targetUserId: string,
    targetEmail: string,
    details: Record<string, any>
  ) => {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      performed_by_user_id: currentAdmin.id,
      performed_by_email: currentAdmin.email,
      performed_by_role: currentAdmin.role,
      action_type: action as any,
      target_user_id: targetUserId,
      target_user_email: targetEmail,
      details,
      ip_address: null,
      user_agent: null,
      created_at: new Date().toISOString()
    };

    setAuditLogs([newLog, ...auditLogs]);
  };

  const loadAuditLogs = async () => {
    // TODO: Replace with real API call
    const mockLogs: AuditLogEntry[] = [
      {
        id: 'log-1',
        performed_by_user_id: 'admin-123',
        performed_by_email: 'admin@example.com',
        performed_by_role: 'admin',
        action_type: 'product_added',
        target_user_id: '1',
        target_user_email: 'customer1@example.com',
        details: { product_id: 'ai_visibility' },
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0...',
        created_at: '2025-09-28T14:30:00Z'
      }
    ];
    setAuditLogs(mockLogs);
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="error" size="sm">Admin</Badge>;
      case 'manager':
        return <Badge variant="warning" size="sm">Manager</Badge>;
      case 'user':
        return <Badge variant="info" size="sm">Customer</Badge>;
      default:
        return <Badge variant="info" size="sm">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage customers, products, and permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => {
            loadAuditLogs();
            setShowAuditLogs(true);
          }}>
            <Clock size={16} />
            Audit Logs
          </Button>
          <Button>
            <Plus size={16} />
            Add User
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Global Search */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or organization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f45a4e]"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f45a4e]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Showing {currentUsers.length} of {filteredUsers.length} users
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Organization</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Role</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Google</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Products</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Last Login</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {currentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-gray-900 dark:text-white">{user.organization_name}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {user.google_connected ? (
                      <Badge variant="success" size="sm">Connected</Badge>
                    ) : (
                      <Badge variant="error" size="sm">Not Connected</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-gray-900 dark:text-white font-medium">
                      {user.active_products.length}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {user.last_login_at ? (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(user.last_login_at).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Never</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleLoginAs(user)}
                        title="Login As"
                      >
                        <ExternalLink size={16} />
                      </Button>
                      {user.status === 'active' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSuspendUser(user)}
                          title="Suspend User"
                        >
                          <Ban size={16} className="text-red-600" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleActivateUser(user)}
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
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* User Detail Modal (placeholder) */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Manage User: {selectedUser.email}
                </h2>
                <button onClick={() => setShowUserModal(false)}>
                  <AlertCircle size={24} className="text-gray-400" />
                </button>
              </div>

              {/* Product Management */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Active Products</h3>
                <div className="space-y-2">
                  {selectedUser.active_products.map(productId => (
                    <div key={productId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-gray-900 dark:text-white capitalize">{productId.replace('_', ' ')}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveProduct(selectedUser, productId)}
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    const product = prompt('Enter product ID to add:');
                    if (product) handleAddProduct(selectedUser, product);
                  }}
                >
                  <Plus size={16} />
                  Add Product
                </Button>
              </div>

              {/* Notes */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Internal Notes</h3>
                <textarea
                  value={selectedUser.notes || ''}
                  readOnly
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                  rows={4}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Audit Log Modal (placeholder) */}
      {showAuditLogs && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Audit Logs</h2>
                <button onClick={() => setShowAuditLogs(false)}>
                  <AlertCircle size={24} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {log.action_type.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          by {log.performed_by_email} → {log.target_user_email}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    {Object.keys(log.details).length > 0 && (
                      <pre className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};