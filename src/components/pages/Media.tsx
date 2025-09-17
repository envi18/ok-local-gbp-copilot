import React, { useState } from 'react';
import { Image, Upload, Folder, Search, Filter, Grid3X3, List, Download, Edit, Trash2, Share, Star, Eye, Play, FileText, Calendar, Tag, Zap } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  url: string;
  thumbnail: string;
  size: string;
  dimensions?: string;
  uploadDate: string;
  tags: string[];
  usageCount: number;
  isOptimized: boolean;
  isFavorite: boolean;
  location: string;
  description?: string;
}

const mockMediaFiles: MediaFile[] = [
  {
    id: '1',
    name: 'summer-sale-banner.jpg',
    type: 'image',
    url: 'https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg',
    thumbnail: 'https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
    size: '2.4 MB',
    dimensions: '1920x1080',
    uploadDate: '2 days ago',
    tags: ['sale', 'summer', 'promotion', 'banner'],
    usageCount: 5,
    isOptimized: true,
    isFavorite: true,
    location: 'All Locations',
    description: 'Summer sale promotional banner for social media'
  },
  {
    id: '2',
    name: 'team-photo.jpg',
    type: 'image',
    url: 'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg',
    thumbnail: 'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
    size: '3.1 MB',
    dimensions: '2048x1365',
    uploadDate: '1 week ago',
    tags: ['team', 'staff', 'people', 'office'],
    usageCount: 3,
    isOptimized: true,
    isFavorite: false,
    location: 'Downtown Location',
    description: 'Team photo for new employee introduction'
  },
  {
    id: '3',
    name: 'product-demo.mp4',
    type: 'video',
    url: '#',
    thumbnail: 'https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
    size: '15.7 MB',
    dimensions: '1920x1080',
    uploadDate: '3 days ago',
    tags: ['product', 'demo', 'video', 'launch'],
    usageCount: 2,
    isOptimized: false,
    isFavorite: true,
    location: 'All Locations',
    description: 'Product demonstration video for launch campaign'
  },
  {
    id: '4',
    name: 'store-interior.jpg',
    type: 'image',
    url: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg',
    thumbnail: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
    size: '1.8 MB',
    dimensions: '1600x1200',
    uploadDate: '5 days ago',
    tags: ['interior', 'store', 'ambiance', 'space'],
    usageCount: 8,
    isOptimized: true,
    isFavorite: false,
    location: 'Main Street Location',
    description: 'Interior shot showcasing store layout and design'
  },
  {
    id: '5',
    name: 'customer-testimonial.jpg',
    type: 'image',
    url: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg',
    thumbnail: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
    size: '2.2 MB',
    dimensions: '1800x1200',
    uploadDate: '1 week ago',
    tags: ['customer', 'testimonial', 'review', 'happy'],
    usageCount: 4,
    isOptimized: true,
    isFavorite: true,
    location: 'Oak Avenue Location',
    description: 'Happy customer testimonial photo'
  },
  {
    id: '6',
    name: 'menu-2024.pdf',
    type: 'document',
    url: '#',
    thumbnail: '/api/placeholder/300/200',
    size: '890 KB',
    uploadDate: '2 weeks ago',
    tags: ['menu', 'pdf', 'document', '2024'],
    usageCount: 12,
    isOptimized: true,
    isFavorite: false,
    location: 'All Locations',
    description: 'Updated menu for 2024 season'
  }
];

const collections = [
  { id: 'recent', name: 'Recent Uploads', count: 12, type: 'smart' },
  { id: 'favorites', name: 'Favorites', count: 8, type: 'smart' },
  { id: 'videos', name: 'Videos Only', count: 5, type: 'smart' },
  { id: 'promotional', name: 'Promotional Content', count: 15, type: 'custom' },
  { id: 'team-photos', name: 'Team Photos', count: 7, type: 'custom' },
  { id: 'products', name: 'Product Images', count: 23, type: 'custom' }
];

export const Media: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [showDetailsPanel, setShowDetailsPanel] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'usage'>('date');

  const filteredFiles = mockMediaFiles.filter(file => {
    const matchesFilter = selectedFilter === 'all' || file.type === selectedFilter;
    const matchesSearch = searchTerm === '' || 
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCollection = selectedCollection === 'all' || 
      (selectedCollection === 'favorites' && file.isFavorite) ||
      (selectedCollection === 'videos' && file.type === 'video') ||
      (selectedCollection === 'recent' && file.uploadDate.includes('day'));
    
    return matchesFilter && matchesSearch && matchesCollection;
  });

  const stats = {
    totalFiles: mockMediaFiles.length,
    totalImages: mockMediaFiles.filter(f => f.type === 'image').length,
    totalVideos: mockMediaFiles.filter(f => f.type === 'video').length,
    totalSize: '127.3 GB',
    storageUsed: 68,
    optimizedFiles: mockMediaFiles.filter(f => f.isOptimized).length
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    gradient: string;
    subtitle?: string;
  }> = ({ title, value, icon: Icon, gradient, subtitle }) => (
    <Card hover>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${gradient}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </Card>
  );

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play size={16} className="text-red-500" />;
      case 'document':
        return <FileText size={16} className="text-blue-500" />;
      default:
        return <Image size={16} className="text-green-500" />;
    }
  };

  const MediaCard: React.FC<{ file: MediaFile }> = ({ file }) => (
    <Card hover className="group relative overflow-hidden">
      <div className="relative">
        <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          {file.type === 'image' ? (
            <img
              src={file.thumbnail}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          ) : file.type === 'video' ? (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative">
              <Play size={32} className="text-gray-500" />
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {file.size}
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <FileText size={32} className="text-blue-500" />
            </div>
          )}
        </div>

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm">
            <Eye size={16} />
          </Button>
          <Button variant="secondary" size="sm">
            <Download size={16} />
          </Button>
          <Button variant="secondary" size="sm">
            <Edit size={16} />
          </Button>
          <Button variant="secondary" size="sm">
            <Share size={16} />
          </Button>
        </div>

        {/* File Type Badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="info" size="sm" className="flex items-center gap-1">
            {getFileIcon(file.type)}
            {file.type}
          </Badge>
        </div>

        {/* Favorite Star */}
        {file.isFavorite && (
          <div className="absolute top-2 right-2">
            <Star size={16} className="text-yellow-500 fill-current" />
          </div>
        )}

        {/* Optimization Status */}
        {file.isOptimized && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="success" size="sm">
              <Zap size={12} />
              Optimized
            </Badge>
          </div>
        )}

        {/* Usage Count */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          Used {file.usageCount}x
        </div>
      </div>

      <div className="p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-1 truncate">
          {file.name}
        </h4>
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>{file.size}</span>
          {file.dimensions && <span>{file.dimensions}</span>}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
          <span>{file.uploadDate}</span>
          <span>{file.location}</span>
        </div>
        
        {file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {file.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="info" size="sm" className="text-xs">
                {tag}
              </Badge>
            ))}
            {file.tags.length > 3 && (
              <Badge variant="info" size="sm" className="text-xs">
                +{file.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Media Library
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {stats.totalFiles} files • {stats.totalSize} total storage
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary">Create Collection</Button>
          <Button variant="secondary">Bulk Upload</Button>
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload size={16} />
            Upload Media
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        <StatCard
          title="Total Files"
          value={stats.totalFiles}
          icon={Folder}
          gradient="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
        />
        <StatCard
          title="Images"
          value={stats.totalImages}
          icon={Image}
          gradient="bg-gradient-to-r from-[#11998e] to-[#38ef7d]"
        />
        <StatCard
          title="Videos"
          value={stats.totalVideos}
          icon={Play}
          gradient="bg-gradient-to-r from-[#f093fb] to-[#f5576c]"
        />
        <StatCard
          title="Storage Used"
          value={`${stats.storageUsed}%`}
          icon={Upload}
          gradient="bg-gradient-to-r from-[#f45a4e] to-[#e53e3e]"
          subtitle={stats.totalSize}
        />
        <StatCard
          title="Optimized"
          value={stats.optimizedFiles}
          icon={Zap}
          gradient="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
          subtitle="files"
        />
      </div>

      {/* Upload Area */}
      <Card>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          <Upload size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Drag & Drop Files Here
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Or click to browse and select files from your computer
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button>Browse Files</Button>
            <Button variant="secondary">Upload from URL</Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
            Supports: JPG, PNG, GIF, MP4, MOV, PDF, DOC • Max file size: 100MB
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Collections */}
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Collections</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCollection('all')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedCollection === 'all'
                    ? 'bg-[#f45a4e] text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">All Files</span>
                  <span className="text-xs">{stats.totalFiles}</span>
                </div>
              </button>
              {collections.map(collection => (
                <button
                  key={collection.id}
                  onClick={() => setSelectedCollection(collection.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCollection === collection.id
                      ? 'bg-[#f45a4e] text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{collection.name}</span>
                    <span className="text-xs">{collection.count}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Storage Usage */}
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Storage Usage</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Used</span>
                <span className="font-medium text-gray-900 dark:text-white">{stats.totalSize}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.storageUsed}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
                <span>{stats.storageUsed}% used</span>
                <span>200 GB total</span>
              </div>
            </div>
            <Button variant="secondary" className="w-full mt-4" size="sm">
              Upgrade Storage
            </Button>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Filters and Controls */}
          <Card>
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full lg:w-64 pl-10 pr-4 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
                  />
                </div>

                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value as any)}
                  className="px-3 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                  <option value="document">Documents</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="size">Sort by Size</option>
                  <option value="usage">Sort by Usage</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 size={16} />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List size={16} />
                </Button>
              </div>
            </div>
          </Card>

          {/* Media Grid */}
          {filteredFiles.length === 0 ? (
            <Card className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="inline-flex p-6 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full mb-6">
                  <Image size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  No Media Found
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  No files match your current filters. Upload your first media file to get started!
                </p>
                <Button onClick={() => setShowUploadModal(true)}>
                  <Upload size={16} />
                  Upload Your First File
                </Button>
              </div>
            </Card>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {filteredFiles.map((file) => (
                <MediaCard key={file.id} file={file} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};