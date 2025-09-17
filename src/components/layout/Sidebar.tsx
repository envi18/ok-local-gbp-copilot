import {
  AlertTriangle,
  BarChart3,
  Brain,
  Database,
  ExternalLink,
  FileText,
  Globe,
  Image,
  LayoutDashboard,
  MapPin,
  Mic,
  Search,
  Settings,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  Zap
} from 'lucide-react';
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: 'default' | 'warning' | 'error' | 'success' | 'info' | 'gradient';
}

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const managementItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'locations', label: 'Locations', icon: MapPin, badge: '1' },
  { id: 'google-business', label: 'Google Business', icon: ExternalLink, badge: 'New', badgeVariant: 'success' },
  { id: 'ai-visibility', label: 'AI Visibility', icon: Brain, badge: 'New', badgeVariant: 'gradient' },
  { id: 'reviews', label: 'Reviews', icon: Star, badge: 'Mock', badgeVariant: 'warning' },
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'media', label: 'Media', icon: Image },
  { id: 'rankings', label: 'Map Rankings', icon: TrendingUp },
  { id: 'voice-search', label: 'Voice Search', icon: Mic, badge: 'New', badgeVariant: 'gradient' },
  { id: 'premium-listings', label: 'Premium Listings', icon: Globe },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: '3', badgeVariant: 'error' },
  { id: 'automations', label: 'Automations', icon: Zap },
];

const settingsItems: NavItem[] = [
  { id: 'settings', label: 'General', icon: Settings },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'admin-setup', label: 'Database Setup', icon: Database },
  { id: 'db-check', label: 'Database Check', icon: Search },
  { id: 'fix-profile', label: 'Fix Profile', icon: UserCheck },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSectionChange,
  isOpen,
  onClose,
}) => {
  const { theme } = useTheme();

  const NavItemComponent: React.FC<{ item: NavItem }> = ({ item }) => (
    <button
      onClick={() => {
        onSectionChange(item.id);
        onClose();
      }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
        activeSection === item.id
          ? 'bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] text-white shadow-md'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <item.icon
        size={18}
        className={`transition-colors ${
          activeSection === item.id ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
        }`}
      />
      <span className="font-medium text-sm">{item.label}</span>
      {item.badge && (
        <Badge
          variant={item.badgeVariant || 'default'}
          size="sm"
          className="ml-auto"
        >
          {item.badge}
        </Badge>
      )}
    </button>
  );

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
          {/* Header */}
          

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Management Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">
                Management
              </h3>
              <nav className="space-y-1">
                {managementItems.map((item) => (
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
                {settingsItems.map((item) => (
                  <NavItemComponent key={item.id} item={item} />
                ))}
              </nav>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/20 dark:border-white/10">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] flex items-center justify-center">
                  <span className="text-white text-sm font-medium">DU</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    Demo User
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    Customer
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" className="w-full">
                <Settings size={14} />
                Account Settings
              </Button>
            </Card>
          </div>
        </div>
      </aside>
    </>
  );
};
