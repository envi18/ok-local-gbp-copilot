// src/types/aiVisibility.ts
// Type definitions for AI Visibility feature

export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'dismissed';
export type ActionPriority = 'low' | 'medium' | 'high' | 'critical';
export type ImpactLevel = 'low' | 'medium' | 'high';
export type SeverityLevel = 'low' | 'moderate' | 'significant' | 'critical';
export type AIPlatform = 'chatgpt' | 'claude' | 'gemini' | 'perplexity';

/**
 * Monthly AI Visibility Report
 */
export interface AIVisibilityReport {
  id: string;
  organization_id: string;
  report_month: string; // ISO date string (first day of month)
  status: ReportStatus;
  overall_score: number | null; // 0-100
  is_initial_report: boolean;
  
  generated_at: string | null;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  error_message: string | null;
  
  created_at: string;
  updated_at: string;
  
  // Joined data (not in database)
  platform_scores?: PlatformScore[];
  achievements?: Achievement[];
  priority_actions?: PriorityAction[];
  content_gaps?: ContentGap[];
}

/**
 * Search Query Set
 */
export interface AIQuery {
  id: string;
  organization_id: string;
  query_text: string;
  is_auto_generated: boolean;
  is_active: boolean;
  display_order: number;
  
  last_used_at: string | null;
  times_used: number;
  
  created_at: string;
  updated_at: string;
}

/**
 * Detected Competitor
 */
export interface Competitor {
  id: string;
  organization_id: string;
  competitor_name: string;
  competitor_website: string | null;
  
  first_detected_at: string;
  detected_in_platforms: AIPlatform[];
  detection_count: number;
  
  is_user_disabled: boolean;
  disabled_at: string | null;
  
  last_seen_report_id: string | null;
  last_seen_at: string | null;
  
  created_at: string;
  updated_at: string;
}

/**
 * Platform Score for a Report
 */
export interface PlatformScore {
  id: string;
  report_id: string;
  platform: AIPlatform;
  score: number; // 0-100
  
  mention_count: number;
  ranking_position: number | null;
  sentiment_score: number | null; // -1 to 1
  
  raw_responses: any; // JSONB data
  
  created_at: string;
}

/**
 * Achievement (Recent Win)
 */
export interface Achievement {
  id: string;
  report_id: string;
  organization_id: string;
  
  achievement_text: string;
  category: string | null;
  impact_level: ImpactLevel;
  
  previous_value: string | null;
  current_value: string | null;
  improvement_percentage: number | null;
  
  created_at: string;
}

/**
 * Priority Action (Recommendation)
 */
export interface PriorityAction {
  id: string;
  report_id: string;
  organization_id: string;
  
  action_title: string;
  action_description: string;
  priority: ActionPriority;
  category: string | null;
  
  fix_instructions: string | null;
  estimated_impact: ImpactLevel | null;
  estimated_effort: 'quick' | 'moderate' | 'extensive' | null;
  
  status: ActionStatus;
  completed_at: string | null;
  dismissed_at: string | null;
  
  created_at: string;
  updated_at: string;
}

/**
 * Query Result from AI Platform
 */
export interface QueryResult {
  id: string;
  report_id: string;
  query_id: string;
  platform: AIPlatform;
  
  raw_response: string;
  business_mentioned: boolean;
  business_ranking: number | null;
  competitors_mentioned: string[];
  
  content_gaps: any; // JSONB
  strengths: any; // JSONB
  recommendations: any; // JSONB
  
  query_executed_at: string;
  response_time_ms: number | null;
  api_cost: number | null;
  
  created_at: string;
}

/**
 * Content Gap Analysis
 */
export interface ContentGap {
  id: string;
  report_id: string;
  organization_id: string;
  
  gap_type: 'structural' | 'thematic' | 'critical_topic' | 'significant_topic';
  gap_title: string;
  gap_description: string;
  severity: SeverityLevel;
  
  competitors_have_this: string[];
  
  recommended_action: string | null;
  content_type: string | null;
  
  created_at: string;
}

/**
 * Report Summary for Display
 */
export interface ReportSummary {
  report: AIVisibilityReport;
  platformScores: PlatformScore[];
  achievements: Achievement[];
  topPriorityActions: PriorityAction[];
  criticalContentGaps: ContentGap[];
  competitorCount: number;
}

/**
 * Trend Data Point for Chart
 */
export interface TrendDataPoint {
  month: string;
  overall_score: number;
  chatgpt_score: number;
  claude_score: number;
  gemini_score: number;
  perplexity_score: number;
}