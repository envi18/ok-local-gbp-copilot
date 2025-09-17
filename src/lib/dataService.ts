// src/lib/dataService.ts - Hybrid Real/Mock Data Service
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

// Type definitions
export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan_tier: 'free' | 'pro' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  phone?: string;
  website?: string;
  primary_category?: string;
  rating?: number;
  review_count: number;
  gbp_sync_status: 'pending' | 'synced' | 'error';
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  location_id: string;
  author_name?: string;
  rating: number;
  text?: string;
  response_text?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  platform: 'google' | 'facebook' | 'yelp';
  created_at_external?: string;
  created_at: string;
  responded_at?: string;
}

export interface Post {
  id: string;
  location_id: string;
  title?: string;
  body: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  platform: string[];
  view_count: number;
  click_count: number;
  published_at?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role: 'admin' | 'support' | 'reseller' | 'customer';
  created_at: string;
}

// Mock data for missing tables
const generateMockReviews = (locations: Location[]): Review[] => {
  if (locations.length === 0) return [];
  
  return [
    {
      id: 'review-1',
      location_id: locations[0].id,
      author_name: 'Sarah Johnson',
      rating: 5,
      text: 'Amazing coffee and friendly staff! The atmosphere is perfect for working.',
      sentiment: 'positive',
      platform: 'google',
      created_at_external: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'review-2',
      location_id: locations[0].id,
      author_name: 'Mike Chen',
      rating: 4,
      text: 'Great coffee, but can get crowded during rush hour.',
      sentiment: 'positive',
      platform: 'google',
      created_at_external: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
};

const generateMockPosts = (locations: Location[]): Post[] => {
  if (locations.length === 0) return [];
  
  return [
    {
      id: 'post-1',
      location_id: locations[0].id,
      title: 'New Fall Menu Available!',
      body: 'Try our seasonal pumpkin spice latte and apple cinnamon muffins. Perfect for the autumn weather!',
      status: 'published',
      platform: ['gbp'],
      view_count: 245,
      click_count: 18,
      published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
};

// Data service class - Hybrid real/mock data
class DataService {
  private reviewsTableExists = false;
  private postsTableExists = false;

  // Initialize user profile and organization
  async initializeUserData(user: User): Promise<Profile | null> {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        console.log('User profile found:', existingProfile.id);
        return existingProfile;
      }

      // Get demo organization
      const { data: demoOrg } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', 'demo-org')
        .single();

      if (!demoOrg) {
        console.error('Demo organization not found');
        return null;
      }

      // Create new profile linked to demo organization
      const newProfile = {
        id: user.id,
        organization_id: demoOrg.id,
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        email: user.email || '',
        role: 'customer' as const,
      };

      const { data: createdProfile, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }

      console.log('User profile created:', createdProfile.id);
      return createdProfile;

    } catch (error) {
      console.error('Error in initializeUserData:', error);
      return null;
    }
  }

  // Get organization data
  async getOrganization(organizationId: string): Promise<Organization | null> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (error) {
        console.error('Error fetching organization:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getOrganization:', error);
      return null;
    }
  }

  // Get locations for user's organization (REAL DATA)
  async getLocations(organizationId: string): Promise<Location[]> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) {
        console.error('Error fetching locations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getLocations:', error);
      return [];
    }
  }

  // Get reviews (MOCK DATA - table doesn't exist)
  async getReviews(locationId?: string): Promise<Review[]> {
    console.log('Using mock reviews data (table does not exist)');
    
    // Get real locations first to generate realistic mock data
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const profile = await this.initializeUserData(user);
      if (!profile) return [];

      const locations = await this.getLocations(profile.organization_id);
      const mockReviews = generateMockReviews(locations);

      if (locationId) {
        return mockReviews.filter(review => review.location_id === locationId);
      }
      return mockReviews;
    } catch (error) {
      return [];
    }
  }

  // Get posts (MOCK DATA - table doesn't exist)
  async getPosts(locationId?: string): Promise<Post[]> {
    console.log('Using mock posts data (table does not exist)');
    
    // Get real locations first to generate realistic mock data
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const profile = await this.initializeUserData(user);
      if (!profile) return [];

      const locations = await this.getLocations(profile.organization_id);
      const mockPosts = generateMockPosts(locations);

      if (locationId) {
        return mockPosts.filter(post => post.location_id === locationId);
      }
      return mockPosts;
    } catch (error) {
      return [];
    }
  }

  // Dashboard analytics
  async getDashboardStats(organizationId: string) {
    const locations = await this.getLocations(organizationId);
    const reviews = await this.getReviews();
    const posts = await this.getPosts();

    const totalLocations = locations.length;
    const totalReviews = reviews.length;
    const averageRating = locations.length > 0 
      ? locations.reduce((sum, loc) => sum + (loc.rating || 0), 0) / totalLocations 
      : 0;
    
    const recentReviews = reviews.filter(review => {
      const reviewDate = new Date(review.created_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return reviewDate > weekAgo;
    }).length;

    const publishedPosts = posts.filter(post => post.status === 'published').length;
    const totalViews = posts.reduce((sum, post) => sum + post.view_count, 0);

    return {
      totalLocations,
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      recentReviews,
      publishedPosts,
      totalViews,
      syncedLocations: locations.filter(loc => loc.gbp_sync_status === 'synced').length,
      pendingSync: locations.filter(loc => loc.gbp_sync_status === 'pending').length,
    };
  }
}

// Export singleton instance
export const dataService = new DataService();
