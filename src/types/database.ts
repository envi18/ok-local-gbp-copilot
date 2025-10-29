// src/types/database.ts
// TypeScript types matching the actual Supabase database schema

/**
 * Database Review Type
 * Matches the actual 'reviews' table structure in Supabase
 */
export interface DatabaseReview {
  id: string;
  location_id: string;
  customer_name: string;           // ← Database uses this name
  rating: number;                  // 1-5 stars
  review_text: string | null;      // ← Database uses this name
  review_date: string;             // ← Database uses this name (timestamptz)
  response_text: string | null;
  response_date: string | null;    // ← Database uses this name (timestamptz)
  source: string;                  // 'manual' | 'google' | 'simulator'
  last_synced: string | null;
  created_at: string;
  updated_at: string;
  google_review_id: string | null;
  customer_photo: string | null;
  is_google_review: boolean;
  
  // NEW automation fields (added by our SQL script)
  requires_approval?: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
  automation_rule?: string;        // '5_star_auto' | '4_star_auto' | '1-3_star_manual'
  ai_generated_response?: string | null;
  sentiment?: 'positive' | 'neutral' | 'negative';
  response_approved_by?: string | null;
  response_approved_at?: string | null;
}

/**
 * Notification Type
 */
export interface DatabaseNotification {
  id: string;
  user_id?: string | null;         // Optional - can be null for org-wide notifications
  profile_id?: string | null;      // Optional - can be null for org-wide notifications
  organization_id: string;
  location_id: string | null;
  type: 'review_received' | 'review_requires_approval' | 'review_responded' | 'sync_completed';
  title: string;
  message: string;
  related_id: string | null;       // review_id or other related entity
  read: boolean;
  created_at: string;
  read_at: string | null;
  metadata: Record<string, any>;
}

/**
 * Review Automation Log Type
 */
export interface DatabaseAutomationLog {
  id: string;
  review_id: string;
  location_id: string;
  action: 'auto_responded' | 'flagged_for_review' | 'sentiment_analyzed' | 'response_generated';
  automation_rule: string | null;
  ai_response: string | null;
  confidence_score: number | null;
  processing_time_ms: number | null;
  created_at: string;
  metadata: Record<string, any>;
}

/**
 * Sync History Type
 */
export interface DatabaseSyncHistory {
  id: string;
  location_id: string;
  sync_type: 'manual' | 'automatic' | 'background' | 'force';
  status: 'success' | 'partial' | 'failed' | 'in_progress';
  reviews_processed: number;
  reviews_responded: number;
  reviews_flagged: number;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  log_entries: Array<{
    timestamp: string;
    level: 'info' | 'success' | 'warning' | 'error';
    message: string;
    details?: any;
  }>;
  created_at: string;
  created_by: string | null;
}

/**
 * Helper: Convert DatabaseReview to GoogleProfileSimulator Review format
 * Maps database column names to the format expected by the simulator
 */
export function databaseReviewToSimulatorReview(dbReview: DatabaseReview) {
  return {
    id: dbReview.id,
    name: `reviews/${dbReview.id}`,
    reviewId: dbReview.google_review_id || dbReview.id,
    reviewer: {
      profilePhotoUrl: dbReview.customer_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(dbReview.customer_name)}&background=667eea&color=fff`,
      displayName: dbReview.customer_name,
      isAnonymous: false
    },
    starRating: dbReview.rating,
    comment: dbReview.review_text || '',
    createTime: dbReview.review_date,
    updateTime: dbReview.updated_at,
    reviewReply: dbReview.response_text ? {
      comment: dbReview.response_text,
      updateTime: dbReview.response_date || dbReview.updated_at
    } : undefined,
    
    // Automation metadata
    requiresApproval: dbReview.requires_approval || false,
    approvalStatus: dbReview.approval_status || 'approved',
    automationRule: dbReview.automation_rule,
    aiGeneratedResponse: dbReview.ai_generated_response,
    sentiment: dbReview.sentiment || 'neutral'
  };
}

/**
 * Helper: Convert simulator review submission to database format
 */
export function simulatorReviewToDatabaseReview(
  review: {
    customerName: string;
    rating: number;
    reviewText: string;
    customerPhoto?: string;
  },
  locationId: string
): Partial<DatabaseReview> {
  return {
    location_id: locationId,
    customer_name: review.customerName,
    rating: review.rating,
    review_text: review.reviewText,
    review_date: new Date().toISOString(),
    source: 'simulator',
    is_google_review: false,
    customer_photo: review.customerPhoto,
    requires_approval: review.rating <= 3, // Flag 1-3 star reviews
    approval_status: review.rating <= 3 ? 'pending' : 'approved',
    sentiment: review.rating >= 4 ? 'positive' : review.rating === 3 ? 'neutral' : 'negative'
  };
}

/**
 * Sarah Thompson's Account IDs (from database verification)
 */
export const SARAH_THOMPSON_ACCOUNT = {
  profileId: 'e0383a3a-5a64-4702-8670-9cad5c5ff4f6',
  organizationId: 'aaaaaaaa-bbbb-cccc-dddd-000000000001',
  locationId: 'aaaaaaaa-bbbb-cccc-dddd-111111111111',
  email: 'sarah@downtowncoffee.com',
  locationName: 'Downtown Coffee Shop'
} as const;