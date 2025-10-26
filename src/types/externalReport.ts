// src/types/externalReport.ts
// External AI Visibility Report Type Definitions
// FINAL VERSION: Includes all UI-friendly computed fields

export type ExternalReportStatus = 'pending' | 'generating' | 'completed' | 'error';

/**
 * Report Generation Request
 */
export interface GenerateExternalReportRequest {
  target_website: string;
  business_name?: string;
  business_type: string;
  business_location: string;
  competitor_websites?: string[];
}

/**
 * Report Filters (for filtering report list)
 */
export interface ExternalReportFilters {
  status?: ExternalReportStatus;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

/**
 * Report Statistics (for dashboard/overview)
 */
export interface ExternalReportStats {
  total: number;
  pending: number;
  generating: number;
  completed: number;
  error: number;
  average_score: number;
  total_views: number;
  avg_processing_time_ms?: number;
  total_cost_usd?: number;
}

/**
 * Report Summary (lightweight version for lists)
 * Uses UI-friendly field names as returned by getAllReports()
 */
export interface ExternalReportSummary {
  id: string;
  target_website: string;
  business_name: string | null;
  overall_score: number | null;
  status: ExternalReportStatus;
  generated_at: string;  // UI field (mapped from created_at)
  generated_by: string;  // UI field (mapped from generated_by_name)
  share_url: string | null;
  share_token?: string | null;  // Optional - for share functionality
}

/**
 * Complete External Report
 * Includes BOTH database fields AND UI-friendly computed fields
 * (Service layer adds computed fields via mapReportToUI)
 */
export interface ExternalReport {
  // Primary fields
  id: string;
  generated_by_user_id: string;
  generated_by_name: string;
  generated_by_email: string | null;
  
  // Business info
  target_website: string;
  business_name: string | null;
  business_type: string;
  business_location: string;
  
  // Report data
  report_data: any;
  content_gap_analysis: any;
  ai_platform_scores: any;
  recommendations: any[];
  
  // Competitor data
  competitor_websites: string[];
  competitor_analysis: any;
  
  // AI Knowledge Comparison (Phase B)
  ai_knowledge_comparison?: {
    main_business: {
      name: string;
      domain: string;
      scores: Record<string, number>;
    };
    competitors: Array<{
      name: string;
      domain: string;
      scores: Record<string, number>;
    }>;
  };
  
  // Scores
  overall_score: number | null;
  
  // Status
  status: ExternalReportStatus;
  error_message: string | null;
  
  // Share configuration
  share_token: string | null;
  share_url: string | null;
  share_enabled: boolean;
  share_views: number;
  
  // Timestamps (DATABASE field names)
  created_at: string;
  generation_started_at?: string | null;
  generation_completed_at: string | null;
  deleted_at: string | null;
  
  // Metadata (DATABASE field names)
  processing_duration_ms: number | null;
  api_cost_usd: number | null;
  query_count: number | null;
  
  // UI-FRIENDLY COMPUTED FIELDS (added by service layer)
  generated_at?: string;              // Alias for created_at
  generated_by?: string;              // Alias for generated_by_name
  processing_time_ms?: number | null; // Alias for processing_duration_ms
  estimated_cost_usd?: number | null; // Alias for api_cost_usd
}