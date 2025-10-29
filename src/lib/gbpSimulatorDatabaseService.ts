// src/lib/gbpSimulatorDatabaseService.ts
// Database service for GBP Simulator integration

import type {
  DatabaseAutomationLog,
  DatabaseNotification,
  DatabaseReview,
  DatabaseSyncHistory
} from '../types/database';
import { supabase } from './supabase';

/**
 * GBP Simulator Database Service
 * Handles all database operations for the simulator
 */
export class GBPSimulatorDatabaseService {
  
  // ============================================
  // REVIEWS
  // ============================================
  
  /**
   * Get all reviews for a location
   */
  static async getReviewsByLocation(locationId: string): Promise<DatabaseReview[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('location_id', locationId)
        .order('review_date', { ascending: false });

      if (error) {
        console.error('[GBPSimDB] Error fetching reviews:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[GBPSimDB] Failed to get reviews:', error);
      return [];
    }
  }

  /**
   * Insert a new review
   */
  static async insertReview(review: Partial<DatabaseReview>): Promise<DatabaseReview | null> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert(review)
        .select()
        .single();

      if (error) {
        console.error('[GBPSimDB] Error inserting review:', error);
        throw error;
      }

      console.log('[GBPSimDB] ✅ Review inserted:', data.id);
      return data;
    } catch (error) {
      console.error('[GBPSimDB] Failed to insert review:', error);
      return null;
    }
  }

  /**
   * Update review response
   */
  static async updateReviewResponse(
    reviewId: string,
    responseText: string,
    approvedBy?: string
  ): Promise<boolean> {
    try {
      const updateData: Partial<DatabaseReview> = {
        response_text: responseText,
        response_date: new Date().toISOString(),
        approval_status: 'approved',
        updated_at: new Date().toISOString()
      };

      if (approvedBy) {
        updateData.response_approved_by = approvedBy;
        updateData.response_approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('reviews')
        .update(updateData)
        .eq('id', reviewId);

      if (error) {
        console.error('[GBPSimDB] Error updating review response:', error);
        throw error;
      }

      console.log('[GBPSimDB] ✅ Review response updated:', reviewId);
      return true;
    } catch (error) {
      console.error('[GBPSimDB] Failed to update review response:', error);
      return false;
    }
  }

  /**
   * Get reviews requiring approval for a location
   */
  static async getReviewsRequiringApproval(locationId: string): Promise<DatabaseReview[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('location_id', locationId)
        .eq('requires_approval', true)
        .eq('approval_status', 'pending')
        .order('review_date', { ascending: false });

      if (error) {
        console.error('[GBPSimDB] Error fetching reviews requiring approval:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[GBPSimDB] Failed to get reviews requiring approval:', error);
      return [];
    }
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  /**
   * Create a notification
   */
  static async createNotification(
    notification: Omit<DatabaseNotification, 'id' | 'created_at' | 'read' | 'read_at'>
  ): Promise<DatabaseNotification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[GBPSimDB] Error creating notification:', error);
        throw error;
      }

      console.log('[GBPSimDB] ✅ Notification created:', data.id);
      return data;
    } catch (error) {
      console.error('[GBPSimDB] Failed to create notification:', error);
      return null;
    }
  }

  /**
   * Get unread notifications for an organization
   */
  static async getUnreadNotifications(organizationId: string): Promise<DatabaseNotification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[GBPSimDB] Error fetching notifications:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[GBPSimDB] Failed to get notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        console.error('[GBPSimDB] Error marking notification as read:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('[GBPSimDB] Failed to mark notification as read:', error);
      return false;
    }
  }

  // ============================================
  // AUTOMATION LOGS
  // ============================================

  /**
   * Create an automation log entry
   */
  static async createAutomationLog(
    log: Omit<DatabaseAutomationLog, 'id' | 'created_at'>
  ): Promise<DatabaseAutomationLog | null> {
    try {
      const { data, error } = await supabase
        .from('review_automation_logs')
        .insert({
          ...log,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[GBPSimDB] Error creating automation log:', error);
        throw error;
      }

      console.log('[GBPSimDB] ✅ Automation log created:', data.id);
      return data;
    } catch (error) {
      console.error('[GBPSimDB] Failed to create automation log:', error);
      return null;
    }
  }

  /**
   * Get automation logs for a review
   */
  static async getAutomationLogsByReview(reviewId: string): Promise<DatabaseAutomationLog[]> {
    try {
      const { data, error } = await supabase
        .from('review_automation_logs')
        .select('*')
        .eq('review_id', reviewId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[GBPSimDB] Error fetching automation logs:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[GBPSimDB] Failed to get automation logs:', error);
      return [];
    }
  }

  // ============================================
  // SYNC HISTORY
  // ============================================

  /**
   * Create a sync history entry
   */
  static async createSyncHistory(
    sync: Omit<DatabaseSyncHistory, 'id' | 'created_at'>
  ): Promise<DatabaseSyncHistory | null> {
    try {
      const { data, error } = await supabase
        .from('sync_history')
        .insert({
          ...sync,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[GBPSimDB] Error creating sync history:', error);
        throw error;
      }

      console.log('[GBPSimDB] ✅ Sync history created:', data.id);
      return data;
    } catch (error) {
      console.error('[GBPSimDB] Failed to create sync history:', error);
      return null;
    }
  }

  /**
   * Update sync history (used to mark as completed)
   */
  static async updateSyncHistory(
    syncId: string,
    updates: Partial<DatabaseSyncHistory>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sync_history')
        .update(updates)
        .eq('id', syncId);

      if (error) {
        console.error('[GBPSimDB] Error updating sync history:', error);
        throw error;
      }

      console.log('[GBPSimDB] ✅ Sync history updated:', syncId);
      return true;
    } catch (error) {
      console.error('[GBPSimDB] Failed to update sync history:', error);
      return false;
    }
  }

  /**
   * Get last sync for a location
   */
  static async getLastSync(locationId: string): Promise<DatabaseSyncHistory | null> {
    try {
      const { data, error } = await supabase
        .from('sync_history')
        .select('*')
        .eq('location_id', locationId)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // No sync history yet is not an error
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('[GBPSimDB] Error fetching last sync:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[GBPSimDB] Failed to get last sync:', error);
      return null;
    }
  }

  /**
   * Get sync history for a location
   */
  static async getSyncHistory(
    locationId: string,
    limit: number = 10
  ): Promise<DatabaseSyncHistory[]> {
    try {
      const { data, error } = await supabase
        .from('sync_history')
        .select('*')
        .eq('location_id', locationId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[GBPSimDB] Error fetching sync history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[GBPSimDB] Failed to get sync history:', error);
      return [];
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Helper: Notify organization about new review
   */
  static async notifyNewReview(
    organizationId: string,
    locationId: string,
    reviewId: string,
    reviewData: {
      customerName: string;
      rating: number;
      requiresApproval: boolean;
    }
  ): Promise<void> {
    const notificationType = reviewData.requiresApproval 
      ? 'review_requires_approval' 
      : 'review_received';

    const title = reviewData.requiresApproval
      ? `New ${reviewData.rating}-star review requires your attention`
      : `New ${reviewData.rating}-star review received`;

    const message = reviewData.requiresApproval
      ? `${reviewData.customerName} left a ${reviewData.rating}-star review that needs manual response.`
      : `${reviewData.customerName} left a ${reviewData.rating}-star review. Response has been automated.`;

    await this.createNotification({
      profile_id: null, // Will be visible to all org members
      organization_id: organizationId,
      location_id: locationId,
      type: notificationType,
      title,
      message,
      related_id: reviewId,
      metadata: {
        rating: reviewData.rating,
        customerName: reviewData.customerName,
        requiresApproval: reviewData.requiresApproval
      }
    });
  }

  /**
   * Helper: Log automation action
   */
  static async logAutomationAction(
    reviewId: string,
    locationId: string,
    action: DatabaseAutomationLog['action'],
    rule: string,
    aiResponse?: string,
    processingTime?: number
  ): Promise<void> {
    await this.createAutomationLog({
      review_id: reviewId,
      location_id: locationId,
      action,
      automation_rule: rule,
      ai_response: aiResponse || null,
      confidence_score: null,
      processing_time_ms: processingTime || null,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  }
}

export default GBPSimulatorDatabaseService;