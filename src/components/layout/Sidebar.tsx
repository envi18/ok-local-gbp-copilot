// src/components/layout/Sidebar.tsx
// Updated to remove hardcoded role restrictions - let route protection handle access control

import {
  AlertTriangle,
  BarChart3,
  Brain,
  ChevronDown,
  ChevronUp,
  Code,
  Crown,
  Database,
  FileText,
  Globe,
  Image,
  LayoutDashboard,
  MapPin,
  Mic,
  Search,
  Settings,
  Shield,
  Star,
  TrendingUp,
  User,
  UserCheck,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { useDeveloperMode } from '../../hooks/useDeveloperMode';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: 'warning' | 'error' | 'success' | 'info' | 'gradient';
  requiredRole?: 'user' | 'manager' | 'admin';
  allowedRoles?: ('user' | 'manager' | 'admin')[];
}

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  isDeveloperModeActive?: boolean;
}

// Updated menu items - removed most role restrictions, let route protection handle them
const managementItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'locations', label: 'Locations', icon: MapPin, badge: '1' },
  { id: 'reports', label: 'Reports', icon: BarChart3 }, // Now visible to all users
  { id: 'ai-visibility', label: 'AI Visibility', icon: Brain, badge: 'New', badgeVariant: 'gradient' },
  { id: 'reviews', label: 'Reviews', icon: Star, badge: 'Mock', badgeVariant: 'warning' },
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'media', label: 'Media', icon: Image },
  { id: 'rankings', label: 'Map Rankings', icon: TrendingUp },
  { id: 'automations', label: 'Automations', icon: Zap }, // Now visible to all users
  { id: 'voice-search', label: 'Voice Search', icon: Mic, badge: 'New', badgeVariant: 'gradient' },
  { id: 'premium-listings', label: 'Premium Listings', icon: Globe }, // Now visible to all users
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: '3', badgeVariant: 'error', allowedRoles: ['manager', 'admin'] }, // Keep manager/admin restriction
];

// Settings items - keep admin restrictions for admin tools
const settingsItems: NavItem[] = [
  { id: 'settings', label: 'General', icon: Settings },
  { id: 'customers', label: 'Customers', icon: Users, allowedRoles: ['manager', 'admin'] },
  { id: 'users', label: 'Users', icon: UserCheck, requiredRole: 'admin' },
  { id: 'admin-setup', label: 'Database Setup', icon: Database, requiredRole: 'admin' },
  { id: 'db-check', label: 'Database Check', icon: Search, requiredRole: 'admin' },
  { id: 'fix-profile', label: 'Fix Profile', icon: UserCheck, requiredRole: 'admin' },
  { id: 'onboarding', label: 'Onboarding', icon: UserPlus, badge: 'Step-by-step', badgeVariant: 'info', allowedRoles: ['manager', 'admin'] },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSectionChange,
  isOpen,
  onClose,
  userRole = 'user',
  isDeveloperModeActive = false,
}) => {
  const [developerToggleOpen, setDeveloperToggleOpen] = useState(false);
  const { isDeveloperMode, developerRole, setRole, clearDeveloperMode } = useDeveloperMode();
  
  const hasAccess = (item: NavItem): boolean => {
    // If no role restrictions, everyone can access
    if (!item.requiredRole && !item.allowedRoles) return true;
    
    // Check required role (hierarchical - user can access user+, manager can access user+manager+, etc)
    if (item.requiredRole) {
      const roleHierarchy: Record<string, number> = {
        user: 1,
        manager: 2,
        admin: 3,
      };
      
      const userRoleLevel = roleHierarchy[userRole] || 1;
      const requiredRoleLevel = roleHierarchy[item.requiredRole] || 1;
      
      return userRoleLevel >= requiredRoleLevel;
    }
    
    // Check allowed roles (exact match)
    if (item.allowedRoles) {
      return item.allowedRoles.includes(userRole as 'user' | 'manager' | 'admin');
    }
    
    return true;
  };

  const NavItemComponent: React.FC<{ item: NavItem }> = ({ item }) => {
    const canAccess = hasAccess(item);
    
    // Show all items to users - let the route protection handle access control
    // Only hide admin-only items from non-admin users (unless in developer mode)
    const shouldShow = canAccess || isDeveloperModeActive;
    
    if (!shouldShow) {
      return null;
    }
    
    return (
      <button
        onClick={() => {
          onSectionChange(item.id);
          onClose();
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group relative ${
          activeSection === item.id
            ? 'bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] text-white shadow-md'
            : canAccess 
              ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              : 'text-gray-400 dark:text-gray-600 opacity-50'
        }`}
      >
        {/* Icon */}
        <item.icon
          size={18}
          className={`transition-colors ${
            activeSection === item.id 
              ? 'text-white' 
              : canAccess
                ? 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
                : 'text-gray-400'
          }`}
        />
        {/* Label */}
        <span className="font-medium text-sm">{item.label}</span>
        
        {/* Role restriction indicator (only show in developer mode for restricted items) */}
        {isDeveloperModeActive && !canAccess && (
          <div className="ml-auto flex items-center gap-1">
            <Badge variant="error" size="sm">
              {item.requiredRole ? item.requiredRole : item.allowedRoles?.join('/')}
            </Badge>
          </div>
        )}
        
        {/* Regular badge */}
        {item.badge && (canAccess || !isDeveloperModeActive) && (
          <Badge variant={item.badgeVariant ?? 'info'} size="sm" className="ml-auto">
            {item.badge}
          </Badge>
        )}
      </button>
    );
  };

  const DeveloperToggleComponent = () => {
    if (!isDeveloperMode) return null;

    const roles = [
      { value: 'user', label: 'Customer User', icon: User, color: 'text-blue-500' },
      { value: 'manager', label: 'Manager', icon: Shield, color: 'text-green-500' },
      { value: 'admin', label: 'Admin', icon: Crown, color: 'text-purple-500' }
    ] as const;

    const currentRole = userRole;
    const currentRoleData = roles.find(role => role.value === currentRole);

    return (
      <div className="px-3 pb-2">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-red-500 text-white px-3 py-1 text-xs font-bold flex items-center gap-1">
            <Code size={12} />
            DEVELOPER MODE
          </div>
          
          {/* Current Role Display & Toggle */}
          <button
            onClick={() => setDeveloperToggleOpen(!developerToggleOpen)}
            className="w-full p-3 flex items-center gap-3 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          >
            {currentRoleData && (
              <>
                <currentRoleData.icon size={16} className={currentRoleData.color} />
                <div className="text-left flex-1">
                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                    {currentRoleData.label}
                    {developerRole && <span className="text-red-500 ml-1">(Override)</span>}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {developerRole ? `Testing as ${currentRole}` : `Real role: ${currentRole}`}
                  </div>
                </div>
              </>
            )}
            {developerToggleOpen ? (
              <ChevronUp size={16} className="text-gray-400" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
            )}
          </button>

          {/* Dropdown Options */}
          {developerToggleOpen && (
            <div className="border-t border-red-200 dark:border-red-800">
              {/* Use Real Role */}
              <button
                onClick={() => {
                  clearDeveloperMode();
                  setDeveloperToggleOpen(false);
                }}
                className={`w-full p-3 flex items-center gap-3 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-left ${
                  !developerRole ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500' : ''
                }`}
              >
                <User size={16} className="text-gray-500" />
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900 dark:text-white">Use Real Role</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Your actual role</div>
                </div>
                {!developerRole && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </button>

              <div className="border-t border-red-200 dark:border-red-800 mx-3"></div>

              {/* Role Override Options */}
              {roles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => {
                    setRole(role.value);
                    setDeveloperToggleOpen(false);
                  }}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-left ${
                    developerRole === role.value ? 'bg-red-100 dark:bg-red-900/40 border-l-4 border-red-500' : ''
                  }`}
                >
                  <role.icon size={16} className={role.color} />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900 dark:text-white">{role.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Override as {role.value}</div>
                  </div>
                  {developerRole === role.value && (
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getRoleDisplayInfo = () => {
    switch (userRole) {
      case 'admin':
        return { label: 'Admin', color: 'from-purple-500 to-purple-600' };
      case 'manager':
        return { label: 'Manager', color: 'from-green-500 to-green-600' };
      default:
        return { label: 'Customer', color: 'from-[#f45a4e] to-[#e53e3e]' };
    }
  };

  const roleInfo = getRoleDisplayInfo();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 bg-white/80 dark:bg-black/40 backdrop-blur-md border-r border-white/20 dark:border-white/10 z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Management Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">Management</h3>
              <nav className="space-y-1">
                {managementItems.map(item => (
                  <NavItemComponent key={item.id} item={item} />
                ))}
              </nav>
            </div>
            {/* Settings Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">Settings & Admin</h3>
              <nav className="space-y-1">
                {settingsItems.map(item => (
                  <NavItemComponent key={item.id} item={item} />
                ))}
              </nav>
            </div>

            {/* Developer Toggle - Integrated after Onboarding */}
            <DeveloperToggleComponent />
          </div>
          
          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/20 dark:border-white/10">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${roleInfo.color} flex items-center justify-center`}>
                  <span className="text-white text-sm font-medium">DU</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Demo User</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{roleInfo.label}</p>
                    {isDeveloperModeActive && (
                      <Badge variant="warning" size="sm">Override</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="secondary" size="sm" className="w-full">
                <Settings size={14} className="mr-2" />
                Account Settings
              </Button>
            </Card>
          </div>
        </div>
      </aside>
    </>
  );
};