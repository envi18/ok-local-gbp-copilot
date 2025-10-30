// src/lib/postsService.ts
// Database service for Posts management

import type { CreatePostInput, Post, UpdatePostInput } from '../types/posts';
import { supabase } from './supabase';

export class PostsService {
  /**
   * Get all posts for a location
   */
  static async getPostsByLocation(locationId: string): Promise<Post[]> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[PostsService] Error fetching posts:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[PostsService] getPostsByLocation failed:', error);
      return [];
    }
  }

  /**
   * Get all posts for an organization (across all locations)
   */
  static async getPostsByOrganization(organizationId: string): Promise<Post[]> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          locations!inner(organization_id)
        `)
        .eq('locations.organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[PostsService] Error fetching org posts:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[PostsService] getPostsByOrganization failed:', error);
      return [];
    }
  }

  /**
   * Get a single post by ID
   */
  static async getPost(postId: string): Promise<Post | null> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) {
        console.error('[PostsService] Error fetching post:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[PostsService] getPost failed:', error);
      return null;
    }
  }

  /**
   * Create a new post
   */
  static async createPost(input: CreatePostInput): Promise<Post | null> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      const postData = {
        ...input,
        status: input.status || 'draft',
        created_by: user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (error) {
        console.error('[PostsService] Error creating post:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[PostsService] createPost failed:', error);
      return null;
    }
  }

  /**
   * Update an existing post
   */
  static async updatePost(postId: string, updates: UpdatePostInput): Promise<Post | null> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId)
        .select()
        .single();

      if (error) {
        console.error('[PostsService] Error updating post:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[PostsService] updatePost failed:', error);
      return null;
    }
  }

  /**
   * Delete a post
   */
  static async deletePost(postId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('[PostsService] Error deleting post:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[PostsService] deletePost failed:', error);
      return false;
    }
  }

  /**
   * Publish a post (change status to published and set published_at)
   */
  static async publishPost(postId: string): Promise<Post | null> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single();

      if (error) {
        console.error('[PostsService] Error publishing post:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[PostsService] publishPost failed:', error);
      return null;
    }
  }

  /**
   * Schedule a post for future publishing
   */
  static async schedulePost(postId: string, scheduledFor: string): Promise<Post | null> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({
          status: 'scheduled',
          scheduled_for: scheduledFor,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single();

      if (error) {
        console.error('[PostsService] Error scheduling post:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[PostsService] schedulePost failed:', error);
      return null;
    }
  }

  /**
   * Get posts by status
   */
  static async getPostsByStatus(
    locationId: string,
    status: 'draft' | 'scheduled' | 'published' | 'failed'
  ): Promise<Post[]> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('location_id', locationId)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[PostsService] Error fetching posts by status:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[PostsService] getPostsByStatus failed:', error);
      return [];
    }
  }

  /**
   * Get upcoming scheduled posts
   */
  static async getUpcomingPosts(locationId: string): Promise<Post[]> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('location_id', locationId)
        .eq('status', 'scheduled')
        .gte('scheduled_for', now)
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('[PostsService] Error fetching upcoming posts:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[PostsService] getUpcomingPosts failed:', error);
      return [];
    }
  }
}