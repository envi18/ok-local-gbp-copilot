// src/components/posts/PostCard.tsx
// Individual post card with actions - ENHANCED with dual timestamps

import { Calendar, Clock, Edit, MoreVertical, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import type { Post } from '../../types/posts';
import { PlatformBadge, PostTypeBadge, StatusBadge, formatPostDate, truncateContent } from './PostHelpers';

interface PostCardProps {
  post: Post;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
  onPublish: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onEdit, onDelete, onPublish }) => {
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const isDraft = post.status === 'draft';
  const isScheduled = post.status === 'scheduled';
  const isPublished = post.status === 'published';
  const isFailed = post.status === 'failed';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={post.status || 'draft'} />
            {post.post_type && <PostTypeBadge type={post.post_type} />}
            {post.platform && <PlatformBadge platform={post.platform} />}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {post.title || 'Untitled Post'}
          </h3>
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <button
                  onClick={() => {
                    onEdit(post);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Edit size={16} />
                  Edit
                </button>
                {(isDraft || isScheduled) && (
                  <button
                    onClick={() => {
                      onPublish(post);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-green-600 dark:text-green-400"
                  >
                    Publish Now
                  </button>
                )}
                <button
                  onClick={() => {
                    onDelete(post);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content Preview */}
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 whitespace-pre-wrap">
        {truncateContent(post.content, 150)}
      </p>

      {/* Media Preview */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
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

      {/* ENHANCED: Dual Timestamps - Always show both Created and Published/Scheduled */}
      <div className="space-y-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
        {/* Created At - Always show */}
        <div className="flex items-center gap-1">
          <Clock size={14} />
          <span className="font-medium">Created:</span>
          <span>{formatPostDate(post.created_at)}</span>
        </div>

        {/* Published At - Show if published */}
        {isPublished && post.published_at && (
          <div className="flex items-center gap-1">
            <Clock size={14} className="text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-600 dark:text-green-400">Published:</span>
            <span className="text-green-600 dark:text-green-400">{formatPostDate(post.published_at)}</span>
          </div>
        )}

        {/* Scheduled For - Show if scheduled */}
        {isScheduled && post.scheduled_for && (
          <div className="flex items-center gap-1">
            <Calendar size={14} className="text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-600 dark:text-blue-400">Scheduled:</span>
            <span className="text-blue-600 dark:text-blue-400">{formatPostDate(post.scheduled_for)}</span>
          </div>
        )}

        {/* Failed - Show if failed */}
        {isFailed && (
          <div className="flex items-center gap-1">
            <span className="font-medium text-red-600 dark:text-red-400">⚠️ Publishing failed</span>
          </div>
        )}
      </div>

      {/* Engagement Stats */}
      {isPublished && post.engagement_stats && (
        <div className="flex items-center gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          {post.engagement_stats.views !== undefined && (
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Views:</span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                {post.engagement_stats.views}
              </span>
            </div>
          )}
          {post.engagement_stats.clicks !== undefined && (
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Clicks:</span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                {post.engagement_stats.clicks}
              </span>
            </div>
          )}
          {post.engagement_stats.shares !== undefined && (
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Shares:</span>
              <span className="ml-1 font-medium text-gray-900 dark:text-white">
                {post.engagement_stats.shares}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};