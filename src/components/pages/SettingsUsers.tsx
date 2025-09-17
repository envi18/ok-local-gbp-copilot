import React, { useState } from 'react';
import { Users, Plus, Mail, Shield, MoreVertical, Edit, Trash2, UserCheck, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { User } from '../../types';

const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@acmecorp.com',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
    role: 'admin',
    status: 'online'
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    email: 'sarah@acmecorp.com',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
    role: 'manager',
    status: 'online'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@acmecorp.com',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
    role: 'user',
    status: 'offline'
  },
  {
    id: '4',
    name: 'Emily Chen',
    email: 'emily@acmecorp.com',
    avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
    role: 'manager',
    status: 'online'
  }
];

export const SettingsUsers: React.FC = () => {
  const [users, setUsers] = useState(mockUsers);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'user'>('user');

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="error" size="sm">Admin</Badge>;
      case 'manager':
        return <Badge variant="warning" size="sm">Manager</Badge>;
      case 'user':
        return <Badge variant="info" size="sm">User</Badge>;
      default:
        return <Badge variant="info" size="sm">{role}</Badge>;
    }
  };

  const getStatusIndicator = (status: string) => {
    return (
      <div className={`w-3 h-3 rounded-full ${
        status === 'online' ? 'bg-green-500' : 'bg-gray-400'
      }`} />
    );
  };

  const handleInviteUser = () => {
    if (inviteEmail) {
      const newUser: User = {
        id: Date.now().toString(),
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop',
        role: inviteRole,
        status: 'offline'
      };
      setUsers(prev => [...prev, newUser]);
      setInviteEmail('');
      setInviteRole('user');
      setShowInviteModal(false);
    }
  };

  const removeUser = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    gradient: string;
  }> = ({ title, value, icon: Icon, gradient }) => (
    <Card hover>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${gradient}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </Card>
  );

  const UserCard: React.FC<{ user: User }> = ({ user }) => (
    <Card hover className="group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-12 h-12 rounded-full"
            />
            <div className="absolute -bottom-1 -right-1">
              {getStatusIndicator(user.status)}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{user.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Mail size={14} className="text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {getRoleBadge(user.role)}
              <span className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                {user.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm">
            <Edit size={16} />
          </Button>
          {user.role !== 'admin' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => removeUser(user.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 size={16} />
            </Button>
          )}
          <Button variant="ghost" size="sm">
            <MoreVertical size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );

  const roleStats = {
    admin: users.filter(u => u.role === 'admin').length,
    manager: users.filter(u => u.role === 'manager').length,
    user: users.filter(u => u.role === 'user').length,
    online: users.filter(u => u.status === 'online').length
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage team members and their access permissions
          </p>
        </div>
        <Button onClick={() => setShowInviteModal(true)} icon={Plus}>
          Invite User
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Users"
          value={users.length}
          icon={Users}
          gradient="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
        />
        <StatCard
          title="Administrators"
          value={roleStats.admin}
          icon={Shield}
          gradient="bg-gradient-to-r from-[#f45a4e] to-[#e53e3e]"
        />
        <StatCard
          title="Managers"
          value={roleStats.manager}
          icon={UserCheck}
          gradient="bg-gradient-to-r from-[#f093fb] to-[#f5576c]"
        />
        <StatCard
          title="Online Now"
          value={roleStats.online}
          icon={Clock}
          gradient="bg-gradient-to-r from-[#11998e] to-[#38ef7d]"
        />
      </div>

      {/* Users List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>

      {/* Role Permissions */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Role Permissions
        </h2>
        
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-900 dark:text-white min-w-[200px]">Permission</th>
                <th className="text-center py-3 px-2 sm:px-4 font-medium text-gray-900 dark:text-white min-w-[80px]">Admin</th>
                <th className="text-center py-3 px-2 sm:px-4 font-medium text-gray-900 dark:text-white min-w-[80px]">Manager</th>
                <th className="text-center py-3 px-2 sm:px-4 font-medium text-gray-900 dark:text-white min-w-[80px]">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {[
                'View Dashboard',
                'Manage Locations',
                'Respond to Reviews',
                'Create Posts',
                'Upload Media',
                'View Reports',
                'Manage Users',
                'System Settings',
                'Billing & Plans'
              ].map((permission, index) => (
                <tr key={index}>
                  <td className="py-3 px-2 sm:px-4 text-sm text-gray-900 dark:text-white">{permission}</td>
                  <td className="py-3 px-2 sm:px-4 text-center">
                    <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-center">
                    <div className={`w-5 h-5 rounded-full mx-auto ${
                      ['Manage Users', 'System Settings', 'Billing & Plans'].includes(permission)
                        ? 'bg-gray-300 dark:bg-gray-600'
                        : 'bg-green-500'
                    }`}></div>
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-center">
                    <div className={`w-5 h-5 rounded-full mx-auto ${
                      ['View Dashboard', 'Respond to Reviews', 'Create Posts', 'Upload Media'].includes(permission)
                        ? 'bg-green-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg">
                <Mail size={20} className="text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Invite New User
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-4 py-3 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'manager' | 'user')}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowInviteModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleInviteUser}
                disabled={!inviteEmail}
              >
                Send Invite
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};