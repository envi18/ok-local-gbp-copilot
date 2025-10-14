// src/lib/loginAsService.ts
// Service for handling admin "Login As" functionality

import { supabase } from './supabase';

interface LoginAsSession {
  originalUserId: string;
  originalUserEmail: string;
  targetUserId: string;
  targetUserEmail: string;
  startedAt: string;
}

const LOGIN_AS_STORAGE_KEY = 'gbp_copilot_login_as_session';

export class LoginAsService {
  /**
   * Start a "Login As" session for admin to impersonate a customer
   * Opens in a new tab instead of replacing current page
   */
  static async startLoginAsSession(
    targetUserId: string,
    targetUserEmail: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current admin user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        return { success: false, error: 'Not authenticated' };
      }

      // Store session info in localStorage (will be read by new tab)
      const sessionData: LoginAsSession = {
        originalUserId: currentUser.id,
        originalUserEmail: currentUser.email || '',
        targetUserId,
        targetUserEmail,
        startedAt: new Date().toISOString()
      };

      // Store in localStorage
      localStorage.setItem(LOGIN_AS_STORAGE_KEY, JSON.stringify(sessionData));

      console.log('🔐 Login As session started:', {
        admin: currentUser.email,
        customer: targetUserEmail
      });

      // Open in new tab with Login As session active
      window.open(window.location.origin, '_blank');

      // Clear from current tab after brief delay (so new tab can read it)
      setTimeout(() => {
        // Only clear if we're not in a Login As session ourselves
        if (!this.isInLoginAsSession()) {
          localStorage.removeItem(LOGIN_AS_STORAGE_KEY);
        }
      }, 1000);

      return { success: true };
    } catch (error: any) {
      console.error('❌ Failed to start Login As session:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * End "Login As" session and return to admin account
   */
  static async endLoginAsSession(): Promise<{ success: boolean; error?: string }> {
    try {
      const session = this.getActiveSession();
      
      if (!session) {
        return { success: false, error: 'No active Login As session' };
      }

      // Clear session data
      localStorage.removeItem(LOGIN_AS_STORAGE_KEY);

      console.log('🔐 Login As session ended, returning to admin:', session.originalUserEmail);

      // Reload to reset application state
      window.location.href = '/';

      return { success: true };
    } catch (error: any) {
      console.error('❌ Failed to end Login As session:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get active "Login As" session if one exists
   */
  static getActiveSession(): LoginAsSession | null {
    try {
      const sessionData = localStorage.getItem(LOGIN_AS_STORAGE_KEY);
      
      if (!sessionData) {
        return null;
      }

      return JSON.parse(sessionData) as LoginAsSession;
    } catch (error) {
      console.error('❌ Failed to parse Login As session:', error);
      return null;
    }
  }

  /**
   * Check if currently in a "Login As" session
   */
  static isInLoginAsSession(): boolean {
    return this.getActiveSession() !== null;
  }

  /**
   * Get user profile override for Login As session
   * This returns the target user's profile when in a Login As session
   */
  static async getEffectiveUserProfile(currentUserId: string) {
    const session = this.getActiveSession();
    
    if (!session) {
      // Not in Login As session, return current user's profile
      return null;
    }

    // In Login As session, return target user's profile
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          organization:organizations (
            id,
            name,
            slug,
            plan_tier
          )
        `)
        .eq('id', session.targetUserId)
        .single();

      if (error) {
        console.error('❌ Failed to fetch target user profile:', error);
        return null;
      }

      console.log('🔐 Using Login As target profile:', profile);
      return profile;
    } catch (error) {
      console.error('❌ Error in getEffectiveUserProfile:', error);
      return null;
    }
  }
}

export const loginAsService = new LoginAsService();