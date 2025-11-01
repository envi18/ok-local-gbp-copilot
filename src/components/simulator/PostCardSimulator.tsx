// src/components/simulator/PostCardSimulator.tsx
// Display individual posts in Google Business Profile style
// ENHANCED: Added Read More expansion functionality

import React, { useState } from 'react';
import type { Post } from '../../types/posts';

interface PostCardSimulatorProps {
  post: Post;
}

export const PostCardSimulator: React.FC<PostCardSimulatorProps> = ({ post }) => {
  // State for content expansion
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  /**
   * Format date as relative time (e.g., "2 hours ago", "3 days ago")
   * Falls back to absolute date for posts older than 7 days
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return diffMins <= 1 ? '1 minute ago' : `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  /**
   * Get post type badge configuration
   */
  const getPostTypeBadge = () => {
    const badges: Record<string, { label: string; color: string }> = {
      update: { label: 'Update', color: 'bg-blue-100 text-blue-700' },
      event: { label: 'Event', color: 'bg-purple-100 text-purple-700' },
      offer: { label: 'Offer', color: 'bg-green-100 text-green-700' },
      product: { label: 'Product', color: 'bg-orange-100 text-orange-700' }
    };

    return post.post_type && post.post_type in badges
      ? badges[post.post_type]
      : null;
  };

  /**
   * Get CTA button for specific post types
   */
  const getCtaButton = () => {
    const ctas: Record<string, string> = {
      offer: 'View offer',
      event: 'View event',
      product: 'View product'
    };

    return post.post_type && post.post_type in ctas
      ? ctas[post.post_type]
      : null;
  };

  const badge = getPostTypeBadge();
  const ctaButton = getCtaButton();
  
  // Content display logic
  const maxLength = 200;
  const needsTruncation = post.content.length > maxLength;
  const displayContent = isExpanded || !needsTruncation
    ? post.content
    : post.content.substring(0, maxLength).trim() + '...';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
      {/* Post type badge */}
      {badge && (
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded mb-2 ${badge.color}`}>
          {badge.label}
        </span>
      )}

      {/* Title */}
      {post.title && (
        <h3 className="text-base font-medium text-gray-900 mb-2">
          {post.title}
        </h3>
      )}

      {/* Content with Read More/Show Less */}
      <div className="text-sm text-gray-700 leading-relaxed mb-3">
        <p className="whitespace-pre-wrap inline">
          {displayContent}
        </p>
        {needsTruncation && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-700 ml-1 font-medium transition-colors inline"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Media preview */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className="mb-3 -mx-4">
          <img 
            src={post.media_urls[0]} 
            alt={post.title || 'Post media'}
            className="w-full h-48 object-cover"
            onError={(e) => {
              // Hide image if it fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Footer: Date and CTA */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {formatDate(post.published_at || post.created_at)}
        </span>
        
        {/* CTA button for specific post types */}
        {ctaButton && (
          <button 
            onClick={() => console.log('[PostCard] CTA clicked:', post.post_type, post.id)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            {ctaButton}
          </button>
        )}
      </div>
    </div>
  );
};