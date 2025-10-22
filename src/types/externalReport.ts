// src/types/externalReport.ts
// PHASE B: Updated with AI Knowledge Comparison

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

export interface ExternalReport {
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
  
  // PHASE B: AI Knowledge Comparison
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
  
  // Timestamps
  created_at: string;
  generation_completed_at: string | null;
  deleted_at: string | null;
  
  // Metadata
  processing_duration_ms: number | null;
  api_cost_usd: number | null;
  query_count: number | null;
}