// src/components/posts/PostCard.tsx
// Individual post display card

import {
  Calendar,
  Clock,
  Edit,
  Eye,
  Heart,
  MessageCircle,
  MoreVertical,
  Send,
  Share2,
  Trash2
} from 'lucide-react';
import React from 'react';
import type { Post } from '../../types/posts';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import {
  formatEngagementCount,
  formatPostDate,
  PlatformBadge,
  PostTypeBadge,
  StatusBadge,
  truncateContent
} from './PostHelpers';

interface PostCardProps {
  post: Post;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  onPublish?: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onEdit,
  onDelete,
  onPublish
}) => {
  const [showActions, setShowActions] = React.useState(false);

  const canPublish = post.status === 'draft' || post.status === 'failed';
  const isScheduled = post.status === 'scheduled';
  const isPublished = post.status === 'published';

  return (
    <Card hover={true} className="relative">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {post.title}
              </h3>
              <StatusBadge status={post.status || 'draft'} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {post.post_type && <PostTypeBadge type={post.post_type} />}
              {post.platform && <PlatformBadge platform={post.platform} />}
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <MoreVertical size={18} className="text-gray-500" />
            </button>

            {showActions && (
              <div className="absolute right-0 top-10 z-10 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit(post);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Edit size={16} />
                    Edit Post
                  </button>
                )}
                {canPublish && onPublish && (
                  <button
                    onClick={() => {
                      onPublish(post);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Send size={16} />
                    Publish Now
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      onDelete(post);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete Post
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
          {truncateContent(post.content, 200)}
        </p>

        {/* Media Preview */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {post.media_urls.slice(0, 3).map((url, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden"
              >
                <img
                  src={url}
                  alt={`Media ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {post.media_urls.length > 3 && (
              <div className="flex-shrink-0 w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  +{post.media_urls.length - 3}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Timestamps */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
          {isScheduled && post.scheduled_for && (
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>Scheduled: {formatPostDate(post.scheduled_for)}</span>
            </div>
          )}
          {isPublished && post.published_at && (
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>Published: {formatPostDate(post.published_at)}</span>
            </div>
          )}
          {!isScheduled && !isPublished && (
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>Created: {formatPostDate(post.created_at)}</span>
            </div>
          )}
        </div>

        {/* Engagement Stats */}
        {isPublished && post.engagement_stats && (
          <div className="flex items-center gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            {post.engagement_stats.views !== undefined && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Eye size={16} />
                <span>{formatEngagementCount(post.engagement_stats.views)}</span>
              </div>
            )}
            {post.engagement_stats.likes !== undefined && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Heart size={16} />
                <span>{formatEngagementCount(post.engagement_stats.likes)}</span>
              </div>
            )}
            {post.engagement_stats.comments !== undefined && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MessageCircle size={16} />
                <span>{formatEngagementCount(post.engagement_stats.comments)}</span>
              </div>
            )}
            {post.engagement_stats.shares !== undefined && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Share2 size={16} />
                <span>{formatEngagementCount(post.engagement_stats.shares)}</span>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-4">
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(post)}>
              <Edit size={14} className="mr-1" />
              Edit
            </Button>
          )}
          {canPublish && onPublish && (
            <Button variant="primary" size="sm" onClick={() => onPublish(post)}>
              <Send size={14} className="mr-1" />
              Publish
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};