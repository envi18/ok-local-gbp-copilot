// src/components/layout/Sidebar.tsx
// Sidebar without developer mode toggle

import {
  AlertTriangle,
  BarChart3,
  Brain,
  FileText,
  Globe,
  Image,
  LayoutDashboard,
  MapPin,
  Mic,
  Settings,
  Star,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import React from 'react';
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

// Menu items
const managementItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'locations', label: 'Locations', icon: MapPin, badge: '1' },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'ai-visibility', label: 'AI Visibility', icon: Brain },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'media', label: 'Media', icon: Image },
  { id: 'rankings', label: 'Map Rankings', icon: TrendingUp },
  { id: 'automations', label: 'Automations', icon: Zap },
  { id: 'voice-search', label: 'Voice Search', icon: Mic },
  { id: 'premium-listings', label: 'Premium Listings', icon: Globe },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: '3', badgeVariant: 'error', allowedRoles: ['manager', 'admin'] },
];

const settingsItems: NavItem[] = [
  { id: 'settings', label: 'General', icon: Settings },
  { id: 'customers', label: 'Customers', icon: Users, allowedRoles: ['manager', 'admin'] },
  { id: 'users', label: 'Users', icon: UserCheck, requiredRole: 'admin' },
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
  
  const hasAccess = (item: NavItem): boolean => {
    if (!item.requiredRole && !item.allowedRoles) return true;
    
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
    
    if (item.allowedRoles) {
      return item.allowedRoles.includes(userRole as 'user' | 'manager' | 'admin');
    }
    
    return true;
  };

  const NavItemComponent: React.FC<{ item: NavItem }> = ({ item }) => {
    const canAccess = hasAccess(item);
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
              ? 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/5'
              : 'text-gray-400 dark:text-gray-600'
        }`}
      >
        <item.icon size={18} />
        <span className="font-medium flex-1">{item.label}</span>
        
        {!canAccess && isDeveloperModeActive && (
          <div className="flex items-center gap-1">
            <Badge variant="error" size="sm">
              {item.requiredRole ? item.requiredRole : item.allowedRoles?.join('/')}
            </Badge>
          </div>
        )}
        
        {item.badge && (canAccess || !isDeveloperModeActive) && (
          <Badge variant={item.badgeVariant ?? 'info'} size="sm" className="ml-auto">
            {item.badge}
          </Badge>
        )}
      </button>
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
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">
                Management
              </h3>
              <nav className="space-y-1">
                {managementItems.map(item => (
                  <NavItemComponent key={item.id} item={item} />
                ))}
              </nav>
            </div>
            
            {/* Settings Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">
                Settings & Admin
              </h3>
              <nav className="space-y-1">
                {settingsItems.map(item => (
                  <NavItemComponent key={item.id} item={item} />
                ))}
              </nav>
            </div>
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
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{roleInfo.label}</p>
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