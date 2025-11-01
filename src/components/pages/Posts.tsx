// src/components/pages/Posts.tsx
// Main Posts page - modular architecture

import {
  AlertCircle,
  Calendar,
  FileText,
  Loader,
  Plus,
  RefreshCw,
  Send
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { LoginAsService } from '../../lib/loginAsService';
import { PostsService } from '../../lib/postsService';
import { supabase } from '../../lib/supabase';
import type { Post, PostPlatform, PostStatus, PostType } from '../../types/posts';
import { PostCard } from '../posts/PostCard';
import { PostFilters } from '../posts/PostFilters';
import { PostForm, type PostFormData } from '../posts/PostForm';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const Posts: React.FC = () => {
  // State
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<PostType | 'all'>('all');
  const [platformFilter, setPlatformFilter] = useState<PostPlatform | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Form states
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<Post | undefined>(undefined);
  const [savingPost, setSavingPost] = useState<boolean>(false);

  // Notification state
  const [notifications, setNotifications] = useState<Array<{
    type: 'success' | 'error' | 'info';
    message: string;
  }>>([]);

  // Load posts on mount
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user (with Login As support)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Check for Login As session
      const loginAsSession = LoginAsService.getActiveSession();
      const effectiveUserId = loginAsSession?.targetUserId || user.id;

      // Get user's organization and first location
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', effectiveUserId)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Get first location for this organization
      const { data: locations } = await supabase
        .from('locations')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .limit(1);

      if (!locations || locations.length === 0) {
        throw new Error('No locations found');
      }

      const locationId = locations[0].id;
      setLocationId(locationId);

// Load posts for this location
const postsData = await PostsService.getPostsByLocation(locationId);

// 🚀 AUTO-PUBLISH: Check for overdue scheduled posts
const now = new Date();
const overdueScheduledPosts = postsData.filter(post => 
  post.status === 'scheduled' && 
  post.scheduled_for && 
  new Date(post.scheduled_for) <= now
);

if (overdueScheduledPosts.length > 0) {
  console.log(`🚀 Auto-publishing ${overdueScheduledPosts.length} overdue scheduled posts`);
  
  // Auto-publish each overdue post
  for (const post of overdueScheduledPosts) {
    try {
      await PostsService.publishPost(post.id);
      console.log(`✅ Auto-published: "${post.title}"`);
      
      // Add success notification
      addNotification('success', `📤 Auto-published: "${post.title}"`);
    } catch (err) {
      console.error(`❌ Failed to auto-publish: "${post.title}"`, err);
      addNotification('error', `Failed to auto-publish: "${post.title}"`);
    }
  }
  
  // Reload posts to get updated statuses
  const updatedPosts = await PostsService.getPostsByLocation(locationId);
  setPosts(updatedPosts);
} else {
  setPosts(postsData);
}

    } catch (err) {
      console.error('Failed to load posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // Add notification
  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const newNotification = { type, message };
    setNotifications(prev => [...prev, newNotification]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== newNotification));
    }, 5000);
  };

  // Create/Update post
  const handleSavePost = async (formData: PostFormData) => {
    if (!locationId) {
      addNotification('error', 'Location not found');
      return;
    }

    try {
      setSavingPost(true);

      if (editingPost) {
        // Update existing post
        const updated = await PostsService.updatePost(editingPost.id, formData);
        if (updated) {
          setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
          addNotification('success', '✅ Post updated successfully!');
          setShowForm(false);
          setEditingPost(undefined);
        } else {
          addNotification('error', 'Failed to update post');
        }
      } else {
        // Create new post
        const created = await PostsService.createPost({
          ...formData,
          location_id: locationId
        });
        if (created) {
          setPosts(prev => [created, ...prev]);
          addNotification('success', '✅ Post created successfully!');
          setShowForm(false);
        } else {
          addNotification('error', 'Failed to create post');
        }
      }
    } catch (err) {
      console.error('Failed to save post:', err);
      addNotification('error', 'An error occurred while saving');
    } finally {
      setSavingPost(false);
    }
  };

  // Edit post
  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setShowForm(true);
  };

  // Delete post
  const handleDeletePost = async (post: Post) => {
    if (!confirm(`Are you sure you want to delete "${post.title}"?`)) {
      return;
    }

    try {
      const success = await PostsService.deletePost(post.id);
      if (success) {
        setPosts(prev => prev.filter(p => p.id !== post.id));
        addNotification('success', '✅ Post deleted successfully!');
      } else {
        addNotification('error', 'Failed to delete post');
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
      addNotification('error', 'An error occurred while deleting');
    }
  };

  // Publish post
  const handlePublishPost = async (post: Post) => {
    try {
      const published = await PostsService.publishPost(post.id);
      if (published) {
        setPosts(prev => prev.map(p => p.id === published.id ? published : p));
        addNotification('success', '✅ Post published successfully!');
      } else {
        addNotification('error', 'Failed to publish post');
      }
    } catch (err) {
      console.error('Failed to publish post:', err);
      addNotification('error', 'An error occurred while publishing');
    }
  };

  // Cancel form
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPost(undefined);
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesType = typeFilter === 'all' || post.post_type === typeFilter;
    const matchesPlatform = platformFilter === 'all' || post.platform === platformFilter;
    const matchesSearch = searchTerm === '' ||
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesType && matchesPlatform && matchesSearch;
  });

  // Calculate stats
  const stats = {
    totalPosts: posts.length,
    draftCount: posts.filter(p => p.status === 'draft').length,
    scheduledCount: posts.filter(p => p.status === 'scheduled').length,
    publishedCount: posts.filter(p => p.status === 'published').length,
    failedCount: posts.filter(p => p.status === 'failed').length
  };

  // Stat Card Component
  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: any;
    gradient: string;
  }> = ({ title, value, icon: Icon, gradient }) => (
    <Card hover={false}>
      <div className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${gradient}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin text-gray-400" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-12">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Posts
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={loadPosts}>Try Again</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {notifications.map((notification, index) => (
            <Card
              key={index}
              className={`p-4 shadow-lg ${
                notification.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' :
                notification.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
              }`}
            >
              <p className="text-sm font-medium">{notification.message}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Posts Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {stats.totalPosts} total posts • {stats.publishedCount} published
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadPosts}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <Plus size={16} className="mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Draft"
          value={stats.draftCount}
          icon={FileText}
          gradient="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
        />
        <StatCard
          title="Scheduled"
          value={stats.scheduledCount}
          icon={Calendar}
          gradient="bg-gradient-to-r from-[#f093fb] to-[#f5576c]"
        />
        <StatCard
          title="Published"
          value={stats.publishedCount}
          icon={Send}
          gradient="bg-gradient-to-r from-[#11998e] to-[#38ef7d]"
        />
        <StatCard
          title="Failed"
          value={stats.failedCount}
          icon={AlertCircle}
          gradient="bg-gradient-to-r from-[#f45a4e] to-[#e53e3e]"
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <PostFilters
            statusFilter={statusFilter}
            typeFilter={typeFilter}
            platformFilter={platformFilter}
            searchTerm={searchTerm}
            onStatusChange={setStatusFilter}
            onTypeChange={setTypeFilter}
            onPlatformChange={setPlatformFilter}
            onSearchChange={setSearchTerm}
            totalCount={posts.length}
            filteredCount={filteredPosts.length}
          />
        </div>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Posts
          </h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredPosts.length === 0 ? (
          <Card className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="inline-flex p-6 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full mb-6">
                <FileText size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                No Posts Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || platformFilter !== 'all'
                  ? 'No posts match your current filters. Try adjusting your search criteria.'
                  : 'No posts yet. Create your first post to get started!'}
              </p>
              {posts.length === 0 && (
                <Button variant="primary" onClick={() => setShowForm(true)}>
                  <Plus size={16} className="mr-2" />
                  Create Your First Post
                </Button>
              )}
            </div>
          </Card>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={handleEditPost}
              onDelete={handleDeletePost}
              onPublish={handlePublishPost}
            />
          ))
        )}
      </div>

      {/* Post Form Modal */}
      {showForm && locationId && (
        <PostForm
          post={editingPost}
          locationId={locationId}
          onSave={handleSavePost}
          onCancel={handleCancelForm}
          saving={savingPost}
        />
      )}
    </div>
  );
};