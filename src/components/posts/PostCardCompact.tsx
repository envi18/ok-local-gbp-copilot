// src/components/posts/PostCardCompact.tsx
// Compact post card for grid layout - better space utilization

import { Calendar, Clock, Edit, MoreVertical, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import type { Post } from '../../types/posts';
import { PlatformBadge, PostTypeBadge, StatusBadge, formatPostDate, truncateContent } from './PostHelpers';

interface PostCardCompactProps {
  post: Post;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
  onPublish: (post: Post) => void;
}

export const PostCardCompact: React.FC<PostCardCompactProps> = ({ post, onEdit, onDelete, onPublish }) => {
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const isDraft = post.status === 'draft';
  const isScheduled = post.status === 'scheduled';
  const isPublished = post.status === 'published';
  const isFailed = post.status === 'failed';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {/* Header with Menu */}
      <div className="p-4 flex items-start justify-between border-b border-gray-100 dark:border-gray-700">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <StatusBadge status={post.status || 'draft'} />
            {post.post_type && <PostTypeBadge type={post.post_type} />}
            {post.platform && <PlatformBadge platform={post.platform} />}
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
            {post.title || 'Untitled Post'}
          </h3>
        </div>

        {/* Actions Menu */}
        <div className="relative ml-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <MoreVertical size={16} className="text-gray-600 dark:text-gray-400" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <button
                  onClick={() => {
                    onEdit(post);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 rounded-t-lg"
                >
                  <Edit size={14} />
                  Edit
                </button>
                {(isDraft || isScheduled) && (
                  <button
                    onClick={() => {
                      onPublish(post);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-green-600 dark:text-green-400"
                  >
                    Publish Now
                  </button>
                )}
                <button
                  onClick={() => {
                    onDelete(post);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 flex items-center gap-2 rounded-b-lg"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content - Flexible grow */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Post Content Preview */}
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-3">
          {truncateContent(post.content, 120)}
        </p>

        {/* Media Thumbnail */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="mb-3 -mx-4 -mt-1">
            <img
              src={post.media_urls[0]}
              alt={post.title || 'Post media'}
              className="w-full h-32 object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            {post.media_urls.length > 1 && (
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                +{post.media_urls.length - 1}
              </div>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Timestamps - Compact */}
        <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          {/* Created */}
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span className="font-medium">Created:</span>
            <span className="truncate">{formatPostDate(post.created_at)}</span>
          </div>

          {/* Published */}
          {isPublished && post.published_at && (
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
              <Clock size={12} />
              <span className="font-medium">Published:</span>
              <span className="truncate">{formatPostDate(post.published_at)}</span>
            </div>
          )}

          {/* Scheduled */}
          {isScheduled && post.scheduled_for && (
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <Calendar size={12} />
              <span className="font-medium">Scheduled:</span>
              <span className="truncate">{formatPostDate(post.scheduled_for)}</span>
            </div>
          )}

          {/* Failed */}
          {isFailed && (
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <span className="text-xs">⚠️ Failed</span>
            </div>
          )}
        </div>

        {/* Engagement Stats */}
        {isPublished && post.engagement_stats && (
          <div className="flex items-center gap-3 pt-2 mt-2 border-t border-gray-100 dark:border-gray-700 text-xs">
            {post.engagement_stats.views !== undefined && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Views:</span>
                <span className="ml-1 font-medium text-gray-900 dark:text-white">
                  {post.engagement_stats.views}
                </span>
              </div>
            )}
            {post.engagement_stats.clicks !== undefined && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Clicks:</span>
                <span className="ml-1 font-medium text-gray-900 dark:text-white">
                  {post.engagement_stats.clicks}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};