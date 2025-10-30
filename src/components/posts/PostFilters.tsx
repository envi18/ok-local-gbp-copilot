// src/components/posts/PostFilters.tsx
// Filter controls for posts

import { Search } from 'lucide-react';
import React from 'react';
import type { PostPlatform, PostStatus, PostType } from '../../types/posts';

interface PostFiltersProps {
  statusFilter: PostStatus | 'all';
  typeFilter: PostType | 'all';
  platformFilter: PostPlatform | 'all';
  searchTerm: string;
  onStatusChange: (status: PostStatus | 'all') => void;
  onTypeChange: (type: PostType | 'all') => void;
  onPlatformChange: (platform: PostPlatform | 'all') => void;
  onSearchChange: (search: string) => void;
  totalCount: number;
  filteredCount: number;
}

export const PostFilters: React.FC<PostFiltersProps> = ({
  statusFilter,
  typeFilter,
  platformFilter,
  searchTerm,
  onStatusChange,
  onTypeChange,
  onPlatformChange,
  onSearchChange,
  totalCount,
  filteredCount
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full lg:w-64 pl-10 pr-4 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as PostStatus | 'all')}
          className="px-3 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="failed">Failed</option>
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value as PostType | 'all')}
          className="px-3 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="update">Update</option>
          <option value="event">Event</option>
          <option value="offer">Offer</option>
          <option value="product">Product</option>
        </select>

        {/* Platform Filter */}
        <select
          value={platformFilter}
          onChange={(e) => onPlatformChange(e.target.value as PostPlatform | 'all')}
          className="px-3 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
        >
          <option value="all">All Platforms</option>
          <option value="google">Google</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="twitter">Twitter</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredCount} of {totalCount} posts
      </div>
    </div>
  );
};