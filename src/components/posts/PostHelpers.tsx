// src/components/posts/PostHelpers.tsx
// Helper components and utility functions for posts

import React from 'react';
import type { PostPlatform, PostStatus, PostType } from '../../types/posts';
import { Badge } from '../ui/Badge';

/**
 * Status Badge Component
 */
interface StatusBadgeProps {
  status: PostStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const variants: Record<PostStatus, 'success' | 'warning' | 'info' | 'error'> = {
    draft: 'info',
    scheduled: 'warning',
    published: 'success',
    failed: 'error'
  };

  const labels: Record<PostStatus, string> = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    published: 'Published',
    failed: 'Failed'
  };

  return (
    <Badge variant={variants[status]} size={size}>
      {labels[status]}
    </Badge>
  );
};

/**
 * Post Type Badge Component
 */
interface PostTypeBadgeProps {
  type: PostType;
  size?: 'sm' | 'md' | 'lg';
}

export const PostTypeBadge: React.FC<PostTypeBadgeProps> = ({ type, size = 'sm' }) => {
  const labels: Record<PostType, string> = {
    update: 'Update',
    event: 'Event',
    offer: 'Offer',
    product: 'Product'
  };

  return (
    <Badge variant="gradient" size={size}>
      {labels[type]}
    </Badge>
  );
};

/**
 * Platform Badge Component
 */
interface PlatformBadgeProps {
  platform: PostPlatform;
  size?: 'sm' | 'md' | 'lg';
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({ platform, size = 'sm' }) => {
  const labels: Record<PostPlatform, string> = {
    google: 'Google',
    facebook: 'Facebook',
    instagram: 'Instagram',
    twitter: 'Twitter'
  };

  return (
    <Badge variant="info" size={size}>
      {labels[platform]}
    </Badge>
  );
};

/**
 * Format date for post scheduling/publishing
 */
export function formatPostDate(dateString: string | undefined): string {
  if (!dateString) return 'Not set';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Future dates (scheduled)
  if (diffMs > 0) {
    if (diffMins < 60) {
      return `in ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
      return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }
  }

  // Past dates (published)
  const absDiffMins = Math.abs(diffMins);
  const absDiffHours = Math.abs(diffHours);
  const absDiffDays = Math.abs(diffDays);

  if (absDiffMins < 1) {
    return 'just now';
  } else if (absDiffMins < 60) {
    return `${absDiffMins} minute${absDiffMins !== 1 ? 's' : ''} ago`;
  } else if (absDiffHours < 24) {
    return `${absDiffHours} hour${absDiffHours !== 1 ? 's' : ''} ago`;
  } else if (absDiffDays < 7) {
    return `${absDiffDays} day${absDiffDays !== 1 ? 's' : ''} ago`;
  }

  // Format as date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

/**
 * Get status color for UI elements
 */
export function getStatusColor(status: PostStatus): string {
  const colors: Record<PostStatus, string> = {
    draft: 'text-blue-600 dark:text-blue-400',
    scheduled: 'text-yellow-600 dark:text-yellow-400',
    published: 'text-green-600 dark:text-green-400',
    failed: 'text-red-600 dark:text-red-400'
  };

  return colors[status];
}

/**
 * Truncate content for preview
 */
export function truncateContent(content: string, maxLength: number = 150): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
}

/**
 * Format engagement stats
 */
export function formatEngagementCount(count: number | undefined): string {
  if (!count) return '0';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}