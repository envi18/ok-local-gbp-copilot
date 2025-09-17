import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Clock, Share2, Plus, Eye, Edit, Trash2, Copy, BarChart3, Image, Link, Hash, Globe, Facebook, Instagram, Linkedin, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { dataService, type Post, type Location, type Profile } from '../../lib/dataService';
import { supabase } from '../../lib/supabase';

const contentTemplates = [
  {
    id: 'seasonal',
    name: 'Seasonal Promotion',
    content: 'Don\'t miss our seasonal special! Limited time offer with amazing savings. Visit us today!',
    type: 'offer'
  },
  {
    id: 'behind-scenes',
    name: 'Behind the Scenes',
    content: 'Take a peek behind the scenes at our daily operations. We love what we do!',
    type: 'update'
  },
  {
    id: 'customer-spotlight',
    name: 'Customer Spotlight',
    content: 'Featuring one of our amazing customers! Thank you for being part of our community.',
    type: 'update'
  },
  {
    id: 'educational',
    name: 'Educational Content',
    content: 'Did you know? Here\'s a helpful tip that can make a difference in your daily routine!',
    type: 'update'
  }
];

export const Posts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'scheduled' | 'draft' | 'failed'>('all');
  const [selectedLocation, setSelectedLocation] = useState<'all' | string>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    platforms: [] as string[],
    scheduledDate: '',
    locationId: 'all'
  });

  useEffect(() => {
    initializePosts();
  }, []);

  const initializePosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Initialize user profile
      const userProfile = await dataService.initializeUserData(user);
      if (!userProfile) {
        setError('Failed to initialize user profile');
        return;
      }
      setProfile(userProfile);

      // Get locations and posts
      const [locationsData, postsData] = await Promise.all([
        dataService.getLocations(userProfile.organization_id),
        dataService.getPosts()
      ]);

      setLocations(locationsData);
      setPosts(postsData);

    } catch (err) {
      console.error('Posts initialization error:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const getLocationName = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    return location?.name || 'Unknown Location';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const filteredPosts = posts.filter(post => {
    const matchesStatus = selectedStatus === 'all' || post.status === selectedStatus;
    const matchesLocation = selectedLocation === 'all' || post.location_id === selectedLocation;
    return matchesStatus && matchesLocation;
  });

  const stats = {
    totalPosts: posts.length,
    publishedThisMonth: posts.filter(p => p.status === 'published').length,
    scheduledPosts: posts.filter(p => p.status === 'scheduled').length,
    totalEngagement: posts.reduce((sum, p) => sum + p.view_count + p.click_count, 0),
    totalViews: posts.reduce((sum, p) => sum + p.view_count, 0),
    avgEngagementRate: '4.2%'
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    gradient: string;
    subtitle?: string;
    loading?: boolean;
  }> = ({ title, value, icon: Icon, gradient, subtitle, loading = false }) => (
    <Card hover>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          )}
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${gradient}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </Card>
  );

  const getStatusBadge = (status: string) => {
    const badges = {
      published: <Badge variant="success" size="sm">Published</Badge>,
      scheduled: <Badge variant="info" size="sm">Scheduled</Badge>,
      draft: <Badge variant="warning" size="sm">Draft</Badge>,
      failed: <Badge variant="error" size="sm">Failed</Badge>
    };
    return badges[status as keyof typeof badges];
  };

  const getPlatformIcon = (platform: string) => {
    const icons = {
      gbp: <Globe size={14} className="text-blue-600" />,
      google: <Globe size={14} className="text-blue-600" />,
      facebook: <Facebook size={14} className="text-blue-600" />,
      instagram: <Instagram size={14} className="text-pink-600" />,
      linkedin: <Linkedin size={14} className="text-blue-700" />
    };
    return icons[platform as keyof typeof icons] || <Globe size={14} className="text-gray-600" />;
  };

  const PostCard: React.FC<{ post: Post }> = ({ post }) => {
    const locationName = getLocationName(post.location_id);
    const publishedTime = post.published_at ? formatTimeAgo(post.published_at) : formatTimeAgo(post.created_at);
    
    return (
      <Card hover className="group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {post.title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{post.title}</h3>
              )}
              {getStatusBadge(post.status)}
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
              {post.body}
            </p>

            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{publishedTime}</span>
              </div>
              <span>• {locationName}</span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Platforms:</span>
              <div className="flex items-center gap-1">
                {post.platform.map((platform, index) => (
                  <div key={index} className="flex items-center gap-1">
                    {getPlatformIcon(platform)}
                  </div>
                ))}
              </div>
            </div>

            {post.status === 'published' && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{post.view_count.toLocaleString()}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Views</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{post.click_count}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Clicks</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
            <Button variant="ghost" size="sm">
              <Eye size={16} />
            </Button>
            <Button variant="ghost" size="sm">
              <Edit size={16} />
            </Button>
            <Button variant="ghost" size="sm">
              <Copy size={16} />
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600">
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Content Calendar
            </h1>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-64 mt-2"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
          {[1, 2, 3, 4, 5].map(i => (
            <StatCard key={i} title="Loading..." value="" icon={FileText} gradient="bg-gray-400" loading />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <Card>
          <div className="text-center py-8">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Posts</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={initializePosts}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Content Calendar
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {stats.totalPosts} total posts • {stats.publishedThisMonth} published this month
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary">Templates</Button>
          <Button variant="secondary">Bulk Upload</Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Create Post
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        <StatCard
          title="Posts This Month"
          value={stats.publishedThisMonth}
          icon={FileText}
          gradient="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
        />
        <StatCard
          title="Scheduled Posts"
          value={stats.scheduledPosts}
          icon={Calendar}
          gradient="bg-gradient-to-r from-[#f093fb] to-[#f5576c]"
        />
        <StatCard
          title="Total Views"
          value={stats.totalViews.toLocaleString()}
          icon={Eye}
          gradient="bg-gradient-to-r from-[#11998e] to-[#38ef7d]"
        />
        <StatCard
          title="Total Clicks"
          value={posts.reduce((sum, p) => sum + p.click_count, 0)}
          icon={Share2}
          gradient="bg-gradient-to-r from-[#f45a4e] to-[#e53e3e]"
        />
        <StatCard
          title="Engagement Rate"
          value={stats.avgEngagementRate}
          icon={BarChart3}
          gradient="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
          subtitle="average"
        />
      </div>

      {/* Filters and View Toggle */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-3 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
            >
              <option value="all">All Locations</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>

            <Button variant="secondary" size="sm">
              <Calendar size={16} />
              This Month
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </Button>
          </div>
        </div>
      </Card>

      {/* Content Templates */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Templates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {contentTemplates.map(template => (
            <div
              key={template.id}
              className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => {
                setNewPost(prev => ({
                  ...prev,
                  title: template.name,
                  content: template.content
                }));
                setShowCreateModal(true);
              }}
            >
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">{template.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{template.content}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <Card className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="inline-flex p-6 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full mb-6">
                <FileText size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {posts.length === 0 ? 'No Posts Yet' : 'No Posts Found'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {posts.length === 0 
                  ? 'Create your first post to start building your content calendar!'
                  : 'No posts match your current filters. Try adjusting your search criteria.'
                }
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus size={16} />
                Create Your First Post
              </Button>
            </div>
          </Card>
        ) : (
          filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create New Post
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Post Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
                    placeholder="Enter post title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content *
                  </label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent resize-none"
                    placeholder="Write your post content..."
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {newPost.content.length}/2000 characters
                    </span>
                    <Button variant="ghost" size="sm">
                      <Hash size={14} />
                      Add Hashtags
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Platforms *
                  </label>
                  <div className="space-y-2">
                    {['gbp', 'facebook', 'instagram', 'linkedin'].map(platform => (
                      <label key={platform} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newPost.platforms.includes(platform)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewPost(prev => ({ ...prev, platforms: [...prev.platforms, platform] }));
                            } else {
                              setNewPost(prev => ({ ...prev, platforms: prev.platforms.filter(p => p !== platform) }));
                            }
                          }}
                          className="rounded border-gray-300 text-[#f45a4e] focus:ring-[#f45a4e]"
                        />
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(platform)}
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {platform === 'gbp' ? 'Google Business Profile' : platform}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Schedule Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newPost.scheduledDate}
                    onChange={(e) => setNewPost(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <select
                    value={newPost.locationId}
                    onChange={(e) => setNewPost(prev => ({ ...prev, locationId: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
                  >
                    <option value="all">All Locations</option>
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Media
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <Image size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Drag & drop images or videos here
                    </p>
                    <Button variant="ghost" size="sm" className="mt-2">
                      Browse Files
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowCreateModal(false)}
              >
                Save as Draft
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
              >
                Preview
              </Button>
              <Button
                className="flex-1"
                disabled={!newPost.content || newPost.platforms.length === 0}
              >
                {newPost.scheduledDate ? 'Schedule Post' : 'Publish Now'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
