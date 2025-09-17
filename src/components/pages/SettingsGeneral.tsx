import React, { useState } from 'react';
import { Save, Building, Globe, Mail, Phone, MapPin, Clock, Shield, Bell, Zap } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface OrganizationSettings {
  name: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
  plan: 'starter' | 'professional' | 'enterprise';
  industry: string;
}

interface NotificationSettings {
  emailAlerts: boolean;
  reviewNotifications: boolean;
  rankingAlerts: boolean;
  weeklyReports: boolean;
  systemUpdates: boolean;
}

export const SettingsGeneral: React.FC = () => {
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings>({
    name: 'Acme Corporation',
    website: 'https://acmecorp.com',
    email: 'contact@acmecorp.com',
    phone: '+1 (555) 123-4567',
    address: '123 Business Ave, Suite 100, New York, NY 10001',
    timezone: 'America/New_York',
    plan: 'professional',
    industry: 'Restaurant & Food Service'
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailAlerts: true,
    reviewNotifications: true,
    rankingAlerts: true,
    weeklyReports: true,
    systemUpdates: false
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleOrgChange = (field: keyof OrganizationSettings, value: string) => {
    setOrgSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleNotificationChange = (field: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Simulate save
    setTimeout(() => {
      setHasChanges(false);
    }, 1000);
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'starter':
        return <Badge variant="info">Starter</Badge>;
      case 'professional':
        return <Badge variant="gradient">Professional</Badge>;
      case 'enterprise':
        return <Badge variant="success">Enterprise</Badge>;
      default:
        return <Badge variant="info">{plan}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            General Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your organization settings and preferences
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} icon={Save}>
            Save Changes
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Organization Information */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg">
                <Building size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Organization Information
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Basic information about your organization
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={orgSettings.name}
                  onChange={(e) => handleOrgChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <div className="relative">
                    <Globe size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <input
                      type="url"
                      value={orgSettings.website}
                      onChange={(e) => handleOrgChange('website', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Industry
                  </label>
                  <select
                    value={orgSettings.industry}
                    onChange={(e) => handleOrgChange('industry', e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
                  >
                    <option>Restaurant & Food Service</option>
                    <option>Retail & Shopping</option>
                    <option>Healthcare & Medical</option>
                    <option>Professional Services</option>
                    <option>Automotive</option>
                    <option>Beauty & Wellness</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      value={orgSettings.email}
                      onChange={(e) => handleOrgChange('email', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <input
                      type="tel"
                      value={orgSettings.phone}
                      onChange={(e) => handleOrgChange('phone', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-3 text-gray-500" />
                  <textarea
                    value={orgSettings.address}
                    onChange={(e) => handleOrgChange('address', e.target.value)}
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timezone
                </label>
                <div className="relative">
                  <Clock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <select
                    value={orgSettings.timezone}
                    onChange={(e) => handleOrgChange('timezone', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-[#f093fb] to-[#f5576c] rounded-lg">
                <Bell size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Notification Preferences
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose how you want to be notified about important events
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-start sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {key === 'emailAlerts' && 'Receive email notifications for critical alerts'}
                      {key === 'reviewNotifications' && 'Get notified when new reviews are posted'}
                      {key === 'rankingAlerts' && 'Alerts for significant ranking changes'}
                      {key === 'weeklyReports' && 'Weekly performance summary reports'}
                      {key === 'systemUpdates' && 'Notifications about system updates and maintenance'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleNotificationChange(key as keyof NotificationSettings, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#f45a4e]/20 dark:peer-focus:ring-[#f45a4e]/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-[#f45a4e] peer-checked:to-[#e53e3e]"></div>
                  </label>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Plan Information */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-[#11998e] to-[#38ef7d] rounded-lg">
                <Zap size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Current Plan</h3>
                {getPlanBadge(orgSettings.plan)}
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Locations</span>
                <span className="font-medium text-gray-900 dark:text-white">12 / 25</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Users</span>
                <span className="font-medium text-gray-900 dark:text-white">3 / 10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">API Calls</span>
                <span className="font-medium text-gray-900 dark:text-white">8.2k / 50k</span>
              </div>
            </div>

            <Button variant="secondary" className="w-full mt-4">
              Upgrade Plan
            </Button>
          </Card>

          {/* Security */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg">
                <Shield size={20} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Security</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Two-Factor Auth</span>
                <Badge variant="success" size="sm">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">SSO Integration</span>
                <Badge variant="info" size="sm">Available</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">API Access</span>
                <Badge variant="success" size="sm">Active</Badge>
              </div>
            </div>

            <Button variant="secondary" className="w-full mt-4">
              Security Settings
            </Button>
          </Card>

          {/* Support */}
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Need Help?</h3>
            <div className="space-y-3">
              <Button variant="ghost" className="w-full justify-start text-sm">
                📚 Documentation
              </Button>
              <Button variant="ghost" className="w-full justify-start text-sm">
                💬 Contact Support
              </Button>
              <Button variant="ghost" className="w-full justify-start text-sm">
                🎥 Video Tutorials
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};