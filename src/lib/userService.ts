// src/lib/userService.ts
// User management service for handling system users and customer users

import { supabase } from './supabase';

// Type definitions matching your database schema
export interface Profile {
  id: string;
  organization_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: 'admin' | 'support' | 'reseller' | 'customer';
  created_at: string;
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
}

export class UserService {
  /**
   * Get all system users (admin, support, reseller roles)
   * Used for the Users page - system-level account management
   */
  static async getSystemUsers() {
    try {
      console.log('🔍 Fetching system users...');
      
      // First, let's see ALL profiles to debug what roles exist
      const allUsers = await supabase
        .from('profiles')
        .select('*');
      
      console.log('📊 All users in database:', allUsers.data);
      console.log('📊 Roles found:', allUsers.data?.map(u => u.role));
      
      // Now try the filtered query
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      console.error('Error in getUserById:', error);
      return { data: null, error };
    }
  }

  /**
   * Update user information
   */
  static async updateUser(userId: string, updates: UserUpdateData) {
    try {
      return await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select(`
          *,
          organization:organizations(*)
        `)
        .single();
    } catch (error) {
      console.error('Error in updateUser:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new user profile
   */
  static async createUser(userData: {
    id: string; // This should come from Supabase auth
    organization_id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: 'admin' | 'support' | 'reseller' | 'customer';
  }) {
    try {
      return await supabase
        .from('profiles')
        .insert(userData)
        .select(`
          *,
          organization:organizations(*)
        `)
        .single();
    } catch (error) {
      console.error('Error in createUser:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a user (be careful with this!)
   */
  static async deleteUser(userId: string) {
    try {
      return await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
    } catch (error) {
      console.error('Error in deleteUser:', error);
      return { data: null, error };
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
    } catch (error) {
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

      // Apply role filter based on user type
      if (userType === 'system') {
        query = query.in('role', ['admin', 'support', 'reseller']);
      } else if (userType === 'customer') {
        query = query.eq('role', 'customer');
      }

      // Add search conditions
      query = query.or(`
        first_name.ilike.%${searchTerm}%,
        last_name.ilike.%${searchTerm}%,
        email.ilike.%${searchTerm}%
      `);

      return await query.order('created_at', { ascending: false });
    } catch (error) {
      console.error('Error in searchUsers:', error);
      return { data: null, error };
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats() {
    try {
      // Get counts for different user types
      const [systemUsersResult, customerUsersResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('role', { count: 'exact' })
          .in('role', ['admin', 'support', 'reseller']),
        supabase
          .from('profiles')
          .select('role', { count: 'exact' })
          .eq('role', 'customer')
      ]);

      const systemCount = systemUsersResult.count || 0;
      const customerCount = customerUsersResult.count || 0;

      // Get role-specific counts
      const roleCountsResult = await supabase
        .from('profiles')
        .select('role')
        .in('role', ['admin', 'support', 'reseller']);

      const roleCounts = {
        admin: 0,
        support: 0,
        reseller: 0
      };

      if (roleCountsResult.data) {
        roleCountsResult.data.forEach(user => {
          if (user.role === 'admin') roleCounts.admin++;
          else if (user.role === 'support') roleCounts.support++;
          else if (user.role === 'reseller') roleCounts.reseller++;
        });
      }

      return {
        data: {
          totalSystemUsers: systemCount,
          totalCustomerUsers: customerCount,
          totalUsers: systemCount + customerCount,
          ...roleCounts
        },
        error: null
      };
    } catch (error) {
      console.error('Error in getUserStats:', error);
      return { data: null, error };
    }
  }
}