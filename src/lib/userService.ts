// src/lib/userService.ts
// Enhanced User management service with status management and user creation

import { supabase } from './supabase';

// Enhanced type definitions matching your database schema
export interface Profile {
  id: string;
  organization_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: 'admin' | 'support' | 'reseller' | 'customer';
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
  updated_at?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan_tier: 'free' | 'pro' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export interface ProfileWithOrganization extends Profile {
  organization?: Organization | null;
}

export interface UserUpdateData {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: 'admin' | 'support' | 'reseller' | 'customer';
  organization_id?: string;
  status?: 'active' | 'suspended' | 'pending';
}

export interface CreateUserData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: 'admin' | 'support' | 'reseller' | 'customer';
  organization_id: string;
}

export class UserService {
  /**
   * Get all system users (admin, support, reseller roles)
   * Used for the Users page - system-level account management
   */
  static async getSystemUsers() {
    try {
      console.log('🔍 Fetching system users...');
      
      const result = await supabase
        .from('profiles')
        .select(`
          *,
          organization:organizations(*)
        `)
        .in('role', ['admin', 'support', 'reseller'])
        .order('created_at', { ascending: false });
      
      console.log('🎯 System users result:', result);
      console.log('🎯 Filtered count:', result.data?.length);
      
      return result;
    } catch (error: any) {
      console.error('Error in getSystemUsers:', error);
      return { data: null, error };
    }
  }

  /**
   * Get all customer users (customer role only)
   * Used for the Customers page - customer account management
   */
  static async getCustomerUsers() {
    try {
      return await supabase
        .from('profiles')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('role', 'customer')
        .order('created_at', { ascending: false });
    } catch (error: any) {
      console.error('Error in getCustomerUsers:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a single user by ID with organization details
   */
  static async getUserById(userId: string) {
    try {
      return await supabase
        .from('profiles')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', userId)
        .single();
    } catch (error: any) {
      console.error('Error in getUserById:', error);
      return { data: null, error };
    }
  }

  /**
   * Update user information
   */
  static async updateUser(userId: string, updates: UserUpdateData) {
    try {
      console.log('🔄 Updating user:', userId, updates);
      
      const result = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select(`
          *,
          organization:organizations(*)
        `)
        .single();
      
      console.log('✅ User update result:', result);
      return result;
    } catch (error: any) {
      console.error('Error in updateUser:', error);
      return { data: null, error };
    }
  }

  /**
   * Suspend a user (set status to suspended)
   */
  static async suspendUser(userId: string) {
    try {
      console.log('🚫 Suspending user:', userId);
      
      const result = await supabase
        .from('profiles')
        .update({ status: 'suspended' })
        .eq('id', userId)
        .select(`
          *,
          organization:organizations(*)
        `)
        .single();
      
      console.log('✅ User suspended:', result);
      return result;
    } catch (error: any) {
      console.error('Error in suspendUser:', error);
      return { data: null, error };
    }
  }

  /**
   * Activate a user (set status to active)
   */
  static async activateUser(userId: string) {
    try {
      console.log('✅ Activating user:', userId);
      
      const result = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', userId)
        .select(`
          *,
          organization:organizations(*)
        `)
        .single();
      
      console.log('✅ User activated:', result);
      return result;
    } catch (error: any) {
      console.error('Error in activateUser:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new user via Netlify function (with admin privileges)
   * This creates both the auth user and the profile
   */
  static async createUser(userData: CreateUserData) {
    try {
      console.log('👤 Creating new user via Netlify function:', userData.email);
      
      // Development fallback - check if we're in local development
      const isDevelopment = window.location.hostname === 'localhost';
      
      if (isDevelopment) {
        console.log('⚠️ Development mode: Creating profile only (no auth user)');
        
        // Generate a fake UUID for development
        const fakeUserId = 'dev-' + Math.random().toString(36).substr(2, 9);
        
        const profileData = {
          id: fakeUserId,
          organization_id: userData.organization_id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          role: userData.role,
          status: 'active' as const
        };

        const { data: profileResult, error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)
          .select(`
            *,
            organization:organizations(*)
          `)
          .single();

        if (profileError) {
          return { data: null, error: profileError };
        }

        console.log('✅ Development user created (profile only):', profileResult);
        return { data: profileResult, error: null };
      }
      
      // Production: Call the Netlify function
      const response = await fetch('/.netlify/functions/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ User creation failed:', result);
        return { data: null, error: result.error || 'Failed to create user' };
      }

      console.log('✅ User created successfully via Netlify function:', result.data);
      return { data: result.data, error: null };

    } catch (error: any) {
      console.error('Error in createUser:', error);
      return { data: null, error: `Network error: ${error.message || error}` };
    }
  }

  /**
   * Delete a user (removes profile only - auth deletion needs Netlify function)
   * Use with extreme caution!
   */
  static async deleteUser(userId: string) {
    try {
      console.log('🗑️ Deleting user profile:', userId);
      
      // For now, just delete the profile (auth user deletion would need another Netlify function)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('❌ Profile deletion failed:', profileError);
        return { data: null, error: profileError };
      }

      console.log('✅ User profile deleted successfully');
      return { data: true, error: null };
    } catch (error: any) {
      console.error('Error in deleteUser:', error);
      return { data: null, error: error.message || error };
    }
  }

  /**
   * Get users by organization ID
   */
  static async getUsersByOrganization(organizationId: string) {
    try {
      return await supabase
        .from('profiles')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
    } catch (error: any) {
      console.error('Error in getUsersByOrganization:', error);
      return { data: null, error };
    }
  }

  /**
   * Search users by name or email
   */
  static async searchUsers(searchTerm: string, userType: 'system' | 'customer' | 'all' = 'all') {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          organization:organizations(*)
        `);

      // Apply role filter
      if (userType === 'system') {
        query = query.in('role', ['admin', 'support', 'reseller']);
      } else if (userType === 'customer') {
        query = query.eq('role', 'customer');
      }

      // Apply search filter
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);

      return await query.order('created_at', { ascending: false });
    } catch (error: any) {
      console.error('Error in searchUsers:', error);
      return { data: null, error };
    }
  }

  /**
   * Get all organizations for user creation dropdown
   */
  static async getOrganizations() {
    try {
      return await supabase
        .from('organizations')
        .select('*')
        .order('name', { ascending: true });
    } catch (error: any) {
      console.error('Error in getOrganizations:', error);
      return { data: null, error };
    }
  }

  // Add this method to UserService class in src/lib/userService.ts
// Insert after the getOrganizations method

  /**
   * Get all organizations (alias for getOrganizations)
   * Used for customer management and user assignment
   */
  static async getAllOrganizations() {
    return this.getOrganizations();
  }

  /**
   * Get user statistics
   */
  static async getUserStats() {
    try {
      // Get total counts by role and status
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('role, status');

      if (!allUsers) return { data: null, error: 'Failed to fetch user stats' };

      const stats = {
        total: allUsers.length,
        active: allUsers.filter(u => u.status === 'active').length,
        suspended: allUsers.filter(u => u.status === 'suspended').length,
        pending: allUsers.filter(u => u.status === 'pending').length,
        admin: allUsers.filter(u => u.role === 'admin').length,
        support: allUsers.filter(u => u.role === 'support').length,
        reseller: allUsers.filter(u => u.role === 'reseller').length,
        customer: allUsers.filter(u => u.role === 'customer').length
      };

      return { data: stats, error: null };
    } catch (error: any) {
      console.error('Error in getUserStats:', error);
      return { data: null, error };
    }
  }
}