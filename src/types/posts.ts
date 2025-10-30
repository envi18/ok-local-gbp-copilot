// src/types/posts.ts
// TypeScript types for Posts system

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type PostType = 'update' | 'event' | 'offer' | 'product';
export type PostPlatform = 'google' | 'facebook' | 'instagram' | 'twitter';

export interface EngagementStats {
  views?: number;
  clicks?: number;
  likes?: number;
  shares?: number;
  comments?: number;
}

export interface Post {
  id: string;
  location_id: string;
  title: string;
  content: string;
  media_urls?: string[];
  post_type?: PostType;
  platform?: PostPlatform;
  scheduled_for?: string;
  published_at?: string;
  status?: PostStatus;
  engagement_stats?: EngagementStats;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePostInput {
  location_id: string;
  title: string;
  content: string;
  media_urls?: string[];
  post_type?: PostType;
  platform?: PostPlatform;
  scheduled_for?: string;
  status?: PostStatus;
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
  media_urls?: string[];
  post_type?: PostType;
  platform?: PostPlatform;
  scheduled_for?: string;
  status?: PostStatus;
  published_at?: string;
}

export interface PostFilters {
  status?: PostStatus | 'all';
  post_type?: PostType | 'all';
  platform?: PostPlatform | 'all';
  search?: string;
}