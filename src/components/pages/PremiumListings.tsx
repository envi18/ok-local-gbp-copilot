import React, { useState } from 'react';
import { Globe, CheckCircle, AlertCircle, Clock, FolderSync as Sync, Download, Settings, Plus, Filter, Search, BarChart3, TrendingUp, MapPin, Star, Zap, Eye, RefreshCw, ExternalLink, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface Directory {
  id: string;
  name: string;
  logo: string;
  tier: 1 | 2 | 3;
  category: 'search' | 'social' | 'directory' | 'industry' | 'local' | 'niche';
  status: 'synced' | 'syncing' | 'error' | 'inactive';
  lastUpdated: string;
  traffic: number;
  conversions: number;
  priority: boolean;
}

interface CitationHealth {
  napConsistency: number;
  directoryCoverage: number;
  syncStatus: number;
  inconsistencies: number;
}

const mockDirectories: Directory[] = [
  // Tier 1 - Search Engines & Maps
  { id: 'google', name: 'Google Business Profile', logo: '🔍', tier: 1, category: 'search', status: 'synced', lastUpdated: '2 hours ago', traffic: 2847, conversions: 156, priority: true },
  { id: 'bing', name: 'Bing Places', logo: '🅱️', tier: 1, category: 'search', status: 'syncing', lastUpdated: '1 day ago', traffic: 234, conversions: 12, priority: true },
  { id: 'apple', name: 'Apple Maps', logo: '🍎', tier: 1, category: 'search', status: 'synced', lastUpdated: '3 hours ago', traffic: 567, conversions: 34, priority: true },
  { id: 'yahoo', name: 'Yahoo Local', logo: '🟣', tier: 1, category: 'search', status: 'synced', lastUpdated: '5 hours ago', traffic: 123, conversions: 8, priority: true },

  // Tier 1 - Social Platforms
  { id: 'facebook', name: 'Facebook Business', logo: '📘', tier: 1, category: 'social', status: 'synced', lastUpdated: '1 hour ago', traffic: 1234, conversions: 67, priority: true },
  { id: 'instagram', name: 'Instagram Business', logo: '📷', tier: 1, category: 'social', status: 'syncing', lastUpdated: '4 hours ago', traffic: 890, conversions: 45, priority: true },
  { id: 'linkedin', name: 'LinkedIn Company', logo: '💼', tier: 1, category: 'social', status: 'synced', lastUpdated: '2 hours ago', traffic: 345, conversions: 23, priority: true },
  { id: 'twitter', name: 'Twitter Business', logo: '🐦', tier: 1, category: 'social', status: 'synced', lastUpdated: '6 hours ago', traffic: 456, conversions: 19, priority: true },

  // Tier 1 - Major Directories
  { id: 'yelp', name: 'Yelp', logo: '⭐', tier: 1, category: 'directory', status: 'synced', lastUpdated: '1 hour ago', traffic: 1567, conversions: 89, priority: true },
  { id: 'yellowpages', name: 'Yellow Pages', logo: '📞', tier: 1, category: 'directory', status: 'synced', lastUpdated: '3 hours ago', traffic: 678, conversions: 34, priority: true },
  { id: 'foursquare', name: 'Foursquare', logo: '📍', tier: 1, category: 'directory', status: 'syncing', lastUpdated: '2 days ago', traffic: 234, conversions: 12, priority: true },
  { id: 'bbb', name: 'Better Business Bureau', logo: '🛡️', tier: 1, category: 'directory', status: 'synced', lastUpdated: '1 day ago', traffic: 345, conversions: 18, priority: true },

  // Tier 2 - Industry Specific
  { id: 'healthgrades', name: 'Healthgrades', logo: '🏥', tier: 2, category: 'industry', status: 'synced', lastUpdated: '4 hours ago', traffic: 456, conversions: 28, priority: false },
  { id: 'avvo', name: 'Avvo', logo: '⚖️', tier: 2, category: 'industry', status: 'inactive', lastUpdated: 'N/A', traffic: 0, conversions: 0, priority: false },
  { id: 'angieslist', name: 'Angie\'s List', logo: '🔧', tier: 2, category: 'industry', status: 'syncing', lastUpdated: '1 day ago', traffic: 234, conversions: 15, priority: false },
  { id: 'tripadvisor', name: 'TripAdvisor', logo: '🦉', tier: 2, category: 'industry', status: 'inactive', lastUpdated: 'N/A', traffic: 0, conversions: 0, priority: false },

  // Tier 2 - Local Directories
  { id: 'citysearch', name: 'Citysearch', logo: '🏙️', tier: 2, category: 'local', status: 'synced', lastUpdated: '6 hours ago', traffic: 123, conversions: 7, priority: false },
  { id: 'local', name: 'Local.com', logo: '📍', tier: 2, category: 'local', status: 'synced', lastUpdated: '8 hours ago', traffic: 89, conversions: 4, priority: false },
  { id: 'superpages', name: 'Superpages', logo: '📄', tier: 2, category: 'local', status: 'syncing', lastUpdated: '1 day ago', traffic: 67, conversions: 3, priority: false },
  { id: 'merchantcircle', name: 'MerchantCircle', logo: '⭕', tier: 2, category: 'local', status: 'synced', lastUpdated: '5 hours ago', traffic: 45, conversions: 2, priority: false },

  // Tier 3 - Niche Platforms
  { id: 'manta', name: 'Manta', logo: '🐠', tier: 3, category: 'niche', status: 'synced', lastUpdated: '12 hours ago', traffic: 34, conversions: 1, priority: false },
  { id: 'chamber', name: 'Chamberofcommerce.com', logo: '🏛️', tier: 3, category: 'niche', status: 'synced', lastUpdated: '1 day ago', traffic: 23, conversions: 1, priority: false },
  { id: 'hotfrog', name: 'Hotfrog', logo: '🐸', tier: 3, category: 'niche', status: 'syncing', lastUpdated: '2 days ago', traffic: 12, conversions: 0, priority: false },
  { id: 'cylex', name: 'Cylex', logo: '📋', tier: 3, category: 'niche', status: 'synced', lastUpdated: '8 hours ago', traffic: 18, conversions: 1, priority: false }
];

const mockCitationHealth: CitationHealth = {
  napConsistency: 87,
  directoryCoverage: 92,
  syncStatus: 78,
  inconsistencies: 5
};

export const PremiumListings: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<'all' | 1 | 2 | 3>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'search' | 'social' | 'directory' | 'industry' | 'local' | 'niche'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'synced' | 'syncing' | 'error' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDirectories, setSelectedDirectories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredDirectories = mockDirectories.filter(directory => {
    const matchesTier = selectedTier === 'all' || directory.tier === selectedTier;
    const matchesCategory = selectedCategory === 'all' || directory.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || directory.status === selectedStatus;
    const matchesSearch = searchTerm === '' || directory.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTier && matchesCategory && matchesStatus && matchesSearch;
  });

  const stats = {
    totalDirectories: mockDirectories.length,
    syncedDirectories: mockDirectories.filter(d => d.status === 'synced').length,
    syncingDirectories: mockDirectories.filter(d => d.status === 'syncing').length,
    errorDirectories: mockDirectories.filter(d => d.status === 'error').length,
    totalTraffic: mockDirectories.reduce((sum, d) => sum + d.traffic, 0),
    totalConversions: mockDirectories.reduce((sum, d) => sum + d.conversions, 0)
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    gradient: string;
    trend?: number;
    subtitle?: string;
  }> = ({ title, value, icon: Icon, gradient, trend, subtitle }) => (
    <Card hover glow className="group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-1 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? <ArrowUp size={14} /> : trend < 0 ? <ArrowDown size={14} /> : <Minus size={14} />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-4 rounded-full bg-gradient-to-r ${gradient}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </Card>
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'syncing':
        return <RefreshCw size={16} className="text-yellow-600 animate-spin" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-600" />;
      case 'inactive':
        return <Clock size={16} className="text-gray-400" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return <Badge variant="success" size="sm">Synced</Badge>;
      case 'syncing':
        return <Badge variant="warning" size="sm">Syncing</Badge>;
      case 'error':
        return <Badge variant="error" size="sm">Error</Badge>;
      case 'inactive':
        return <Badge variant="info" size="sm">Inactive</Badge>;
      default:
        return <Badge variant="info" size="sm">Unknown</Badge>;
    }
  };

  const getTierBadge = (tier: number) => {
    const variants = {
      1: 'error',
      2: 'warning',
      3: 'info'
    } as const;
    
    return <Badge variant={variants[tier as keyof typeof variants]} size="sm">Tier {tier}</Badge>;
  };

  const DirectoryCard: React.FC<{ directory: Directory }> = ({ directory }) => (
    <Card hover className="group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{directory.logo}</div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{directory.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {getStatusIcon(directory.status)}
              <span className="text-sm text-gray-600 dark:text-gray-400">{directory.lastUpdated}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getTierBadge(directory.tier)}
          {directory.priority && <Badge variant="gradient" size="sm">Priority</Badge>}
        </div>
      </div>

      <div className="mb-4">
        {getStatusBadge(directory.status)}
      </div>

      {directory.status !== 'inactive' && (
        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-4">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{directory.traffic.toLocaleString()}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Monthly Traffic</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{directory.conversions}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Conversions</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="ghost" size="sm" className="flex-1">
          <Eye size={14} />
          View
        </Button>
        <Button variant="ghost" size="sm" className="flex-1">
          <ExternalLink size={14} />
          Edit
        </Button>
        {directory.status !== 'synced' && (
          <Button variant="primary" size="sm" className="flex-1">
            <Sync size={14} />
            Sync
          </Button>
        )}
      </div>
    </Card>
  );

  const DirectoryRow: React.FC<{ directory: Directory }> = ({ directory }) => (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedDirectories.includes(directory.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedDirectories(prev => [...prev, directory.id]);
              } else {
                setSelectedDirectories(prev => prev.filter(id => id !== directory.id));
              }
            }}
            className="rounded border-gray-300 text-[#f45a4e] focus:ring-[#f45a4e]"
          />
          <div className="text-lg">{directory.logo}</div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{directory.name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{directory.category}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">{getTierBadge(directory.tier)}</td>
      <td className="px-4 py-3 text-center">{getStatusBadge(directory.status)}</td>
      <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">{directory.lastUpdated}</td>
      <td className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
        {directory.traffic.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
        {directory.conversions}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Eye size={14} />
          </Button>
          <Button variant="ghost" size="sm">
            <ExternalLink size={14} />
          </Button>
          {directory.status !== 'synced' && (
            <Button variant="primary" size="sm">
              <Sync size={14} />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Premium Listings & Citations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your presence across 90+ directories and platforms
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary">
            <Download size={16} />
            Citation Report
          </Button>
          <Button variant="secondary">
            <Settings size={16} />
            Fix Inconsistencies
          </Button>
          <Button>
            <Sync size={16} />
            Sync All Listings
          </Button>
        </div>
      </div>

      {/* Citation Health Score */}
      <Card glow className="text-center py-8 bg-gradient-to-br from-white via-green-50/30 to-blue-50/30 dark:from-gray-900 dark:via-green-900/10 dark:to-blue-900/10">
        <div className="inline-flex p-6 bg-gradient-to-r from-[#11998e] to-[#38ef7d] rounded-full mb-4">
          <Globe size={32} className="text-white" />
        </div>
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{mockCitationHealth.napConsistency}</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">Citation Health Score</p>
        <div className="flex items-center justify-center gap-2 text-lg text-green-600">
          <ArrowUp size={20} />
          <span>+5% from last audit</span>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        <StatCard
          title="Total Directories"
          value={stats.totalDirectories}
          icon={Globe}
          gradient="from-[#667eea] to-[#764ba2]"
        />
        <StatCard
          title="Synced Listings"
          value={stats.syncedDirectories}
          icon={CheckCircle}
          gradient="from-[#11998e] to-[#38ef7d]"
          trend={8}
        />
        <StatCard
          title="Currently Syncing"
          value={stats.syncingDirectories}
          icon={RefreshCw}
          gradient="from-[#f093fb] to-[#f5576c]"
        />
        <StatCard
          title="Monthly Traffic"
          value={stats.totalTraffic.toLocaleString()}
          icon={TrendingUp}
          gradient="from-[#f45a4e] to-[#e53e3e]"
          trend={12}
          subtitle="from directories"
        />
        <StatCard
          title="Conversions"
          value={stats.totalConversions}
          icon={Star}
          gradient="from-[#667eea] to-[#764ba2]"
          trend={15}
          subtitle="this month"
        />
      </div>

      {/* Citation Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <div className="text-center">
            <div className="inline-flex p-3 bg-gradient-to-r from-[#11998e] to-[#38ef7d] rounded-full mb-3">
              <CheckCircle size={20} className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">NAP Consistency</h3>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{mockCitationHealth.napConsistency}%</div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#11998e] to-[#38ef7d] h-2 rounded-full"
                style={{ width: `${mockCitationHealth.napConsistency}%` }}
              ></div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="inline-flex p-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full mb-3">
              <Globe size={20} className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Directory Coverage</h3>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{mockCitationHealth.directoryCoverage}%</div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#667eea] to-[#764ba2] h-2 rounded-full"
                style={{ width: `${mockCitationHealth.directoryCoverage}%` }}
              ></div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="inline-flex p-3 bg-gradient-to-r from-[#f093fb] to-[#f5576c] rounded-full mb-3">
              <Sync size={20} className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Sync Status</h3>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{mockCitationHealth.syncStatus}%</div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#f093fb] to-[#f5576c] h-2 rounded-full"
                style={{ width: `${mockCitationHealth.syncStatus}%` }}
              ></div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="inline-flex p-3 bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] rounded-full mb-3">
              <AlertCircle size={20} className="text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Inconsistencies</h3>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{mockCitationHealth.inconsistencies}</div>
            <Button variant="primary" size="sm" className="mt-2">
              Fix Now
            </Button>
          </div>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search directories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full lg:w-64 pl-10 pr-4 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
              />
            </div>

            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value as any)}
              className="px-3 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
            >
              <option value="all">All Tiers</option>
              <option value={1}>Tier 1</option>
              <option value={2}>Tier 2</option>
              <option value={3}>Tier 3</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-3 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="search">Search Engines</option>
              <option value="social">Social Platforms</option>
              <option value="directory">Major Directories</option>
              <option value="industry">Industry Specific</option>
              <option value="local">Local Directories</option>
              <option value="niche">Niche Platforms</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-3 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="synced">Synced</option>
              <option value="syncing">Syncing</option>
              <option value="error">Error</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
        </div>

        {selectedDirectories.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedDirectories.length} directories selected
              </span>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm">
                  <Sync size={14} />
                  Sync Selected
                </Button>
                <Button variant="secondary" size="sm">
                  <Settings size={14} />
                  Update Hours
                </Button>
                <Button variant="secondary" size="sm">
                  <Zap size={14} />
                  Push NAP Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Directory Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDirectories.map(directory => (
            <DirectoryCard key={directory.id} directory={directory} />
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Directory</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Tier</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Last Updated</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Traffic</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Conversions</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDirectories.map(directory => (
                  <DirectoryRow key={directory.id} directory={directory} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {filteredDirectories.length === 0 && (
        <Card className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="inline-flex p-6 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full mb-6">
              <Search size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Directories Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              No directories match your current filters. Try adjusting your search criteria.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};