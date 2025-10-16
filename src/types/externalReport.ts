// src/types/externalReport.ts
// Type definitions for external AI visibility reports

import type { AIVisibilityReport, Competitor, ContentGap, PriorityAction } from './aiVisibility';

/**
 * External Report Status
 */
export type ExternalReportStatus = 'pending' | 'generating' | 'completed' | 'error';

/**
 * External Report (matches database schema)
 */
export interface ExternalReport {
  id: string;
  
  // Generation metadata
  generated_by_user_id: string;
  generated_by_name: string | null;
  generated_by_email: string | null;
  
  // Target business info
  target_website: string;
  business_name: string | null;
  business_type: string;
  business_location: string;
  competitor_websites: string[] | null;
  
  // Report data
  report_data: AIVisibilityReport | null;
  content_gap_analysis: EnhancedContentGapAnalysis | null;
  ai_platform_scores: Record<string, number> | null;
  competitor_analysis: CompetitorAnalysis | null;
  recommendations: PriorityAction[] | null;
  
  // Sharing
  share_token: string | null;
  share_url: string | null;
  share_enabled: boolean;
  share_views: number;
  
  // Status
  status: ExternalReportStatus;
  error_message: string | null;
  generation_started_at: string | null;
  generation_completed_at: string | null;
  processing_duration_ms: number | null;
  
  // Cost tracking
  api_cost_usd: number | null;
  query_count: number | null;
  
  // Soft delete
  deleted_at: string | null;
  deleted_by_user_id: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Extended External Report with joined data
 */
export interface ExternalReportWithDetails extends ExternalReport {
  generator?: {
    name: string;
    email: string;
    role: string;
  };
}

/**
 * Primary Brand Analysis
 */
export interface PrimaryBrandAnalysis {
  name: string;
  website: string;
  strengths: string[];
  weaknesses: string[];
  ai_visibility_score: number;
}

/**
 * Top Competitor
 */
export interface TopCompetitor {
  name: string;
  strengths: string[];
  mention_frequency: number;
}

/**
 * Implementation Timeline
 */
export interface ImplementationTimeline {
  immediate?: Array<{
    title: string;
    duration: string;
    priority: string;
  }>;
  short_term?: Array<{
    title: string;
    duration: string;
    priority: string;
  }>;
  long_term?: Array<{
    title: string;
    duration: string;
    priority: string;
  }>;
}

/**
 * Citation Opportunity
 */
export interface CitationOpportunity {
  platform: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'required' | 'recommended' | 'opportunity';
  description: string;
}

/**
 * AI Knowledge Score Platform
 */
export interface AIKnowledgePlatform {
  platform: string;
  score: number;
  knowledge_level: 'High' | 'Moderate' | 'Low';
  recommendation: string;
}

/**
 * AI Knowledge Scores
 */
export interface AIKnowledgeScores {
  platforms: AIKnowledgePlatform[];
  overall_knowledge: number;
  best_platform: AIKnowledgePlatform;
  needs_improvement: AIKnowledgePlatform[];
}

/**
 * Enhanced Content Gap Analysis Structure (matching competitor format)
 */
export interface EnhancedContentGapAnalysis {
  primary_brand: PrimaryBrandAnalysis;
  top_competitors: TopCompetitor[];
  structural_gaps: ContentGap[];
  thematic_gaps: ContentGap[];
  critical_topic_gaps: ContentGap[];
  significant_topic_gaps: ContentGap[];
  total_gaps: number;
  severity_breakdown: {
    critical: number;
    significant: number;
    moderate: number;
  };
  implementation_timeline?: ImplementationTimeline;
  citation_opportunities?: CitationOpportunity[];
  ai_knowledge_scores?: AIKnowledgeScores;
}

/**
 * Competitor Analysis Structure
 */
export interface CompetitorAnalysis {
  competitors: Competitor[];
  total_competitors: number;
  top_competitors: Array<{
    name: string;
    website: string | null;
    detection_count: number;
    platforms: string[];
  }>;
  competitive_advantages: string[];
  competitive_weaknesses: string[];
}

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
 * Report Generation Response
 */
export interface GenerateExternalReportResponse {
  report_id: string;
  status: ExternalReportStatus;
  message: string;
}

/**
 * Report Filter Options
 */
export interface ExternalReportFilters {
  search?: string; // Search website or business name
  status?: ExternalReportStatus;
  user_id?: string;
  date_from?: string;
  date_to?: string;
}

/**
 * Report Export Format
 */
export type ReportExportFormat = 'pdf' | 'json' | 'email';

/**
 * Report Statistics
 */
export interface ExternalReportStats {
  total_reports: number;
  completed_reports: number;
  pending_reports: number;
  error_reports: number;
  total_cost_usd: number;
  avg_processing_time_ms: number;
}

/**
 * Share Link Configuration
 */
export interface ShareLinkConfig {
  enabled: boolean;
  token: string;
  url: string;
  views: number;
  created_at: string;
}

/**
 * PDF Export Options
 */
export interface PDFExportOptions {
  include_cover_page: boolean;
  include_executive_summary: boolean;
  include_charts: boolean;
  include_recommendations: boolean;
  include_branding: boolean;
}

/**
 * Email Template Data
 */
export interface EmailTemplateData {
  recipient_name: string;
  business_name: string;
  overall_score: number;
  key_findings: string[];
  share_url: string;
  sender_name: string;
}

/**
 * Report Summary for Quick View
 */
export interface ExternalReportSummary {
  id: string;
  business_name: string;
  target_website: string;
  overall_score: number | null;
  status: ExternalReportStatus;
  generated_by: string;
  generated_at: string;
  share_url: string | null;
}