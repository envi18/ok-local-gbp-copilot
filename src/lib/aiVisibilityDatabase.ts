// src/lib/aiVisibilityDatabase.ts
// Database integration for AI Visibility feature

import { createClient } from '@supabase/supabase-js';
import type {
  ActionStatus,
  AIQuery,
  AIVisibilityReport,
  Competitor,
  QueryResult
} from '../types/aiVisibility';

// Lazy initialization of Supabase client
let supabaseClient: any = null;

const getSupabase = () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  // In Node.js environment (testing), read from process.env
  // In browser environment, read from import.meta.env
  let supabaseUrl: string | undefined;
  let supabaseAnonKey: string | undefined;

  if (typeof process !== 'undefined' && process.env) {
    // Node.js environment
    supabaseUrl = process.env.VITE_SUPABASE_URL;
    supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  } else if (typeof window !== 'undefined' && (import.meta as any).env) {
    // Browser environment (Vite)
    supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
    supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase credentials. Make sure .env file exists with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
};

/**
 * Store complete AI Visibility report to database
 */
export async function storeReport(report: AIVisibilityReport & { 
  competitors?: Competitor[];
}): Promise<void> {
  console.log('\n💾 Storing report to database...');

  const supabase = getSupabase();

  try {
    // 1. Insert main report record
    const { error: reportError } = await supabase
      .from('ai_visibility_reports')
      .insert({
        id: report.id,
        organization_id: report.organization_id,
        report_month: report.report_month,
        status: report.status,
        overall_score: report.overall_score,
        is_initial_report: report.is_initial_report,
        generated_at: report.generated_at,
        processing_started_at: report.processing_started_at,
        processing_completed_at: report.processing_completed_at,
        error_message: report.error_message,
        created_at: report.created_at,
        updated_at: report.updated_at
      })
      .select()
      .single();

    if (reportError) {
      console.error('❌ Error storing report:', reportError);
      throw reportError;
    }

    console.log(`✅ Report stored: ${report.id}`);

    // 2. Store platform scores
    if (report.platform_scores && report.platform_scores.length > 0) {
      const { error: scoresError } = await supabase
        .from('ai_visibility_platform_scores')
        .insert(
          report.platform_scores.map(score => ({
            id: score.id,
            report_id: report.id,
            platform: score.platform,
            score: score.score,
            mention_count: score.mention_count,
            ranking_position: score.ranking_position,
            sentiment_score: score.sentiment_score,
            raw_responses: score.raw_responses,
            created_at: score.created_at
          }))
        );

      if (scoresError) {
        console.error('❌ Error storing platform scores:', scoresError);
        throw scoresError;
      }

      console.log(`✅ Stored ${report.platform_scores.length} platform scores`);
    }

    // 3. Store competitors (with upsert to avoid duplicates)
    if (report.competitors && report.competitors.length > 0) {
      for (const competitor of report.competitors) {
        const { error: competitorError } = await supabase
          .from('ai_visibility_competitors')
          .upsert({
            id: competitor.id,
            organization_id: report.organization_id,
            competitor_name: competitor.competitor_name,
            competitor_website: competitor.competitor_website,
            first_detected_at: competitor.first_detected_at,
            detected_in_platforms: competitor.detected_in_platforms,
            detection_count: competitor.detection_count,
            is_user_disabled: competitor.is_user_disabled,
            disabled_at: competitor.disabled_at,
            last_seen_report_id: report.id,
            last_seen_at: competitor.last_seen_at,
            created_at: competitor.created_at,
            updated_at: competitor.updated_at
          }, {
            onConflict: 'competitor_name,organization_id'
          });

        if (competitorError) {
          console.error(`❌ Error storing competitor ${competitor.competitor_name}:`, competitorError);
          // Continue with other competitors
        }
      }

      console.log(`✅ Stored ${report.competitors.length} competitors`);
    }

    // 4. Store achievements
    if (report.achievements && report.achievements.length > 0) {
      const { error: achievementsError } = await supabase
        .from('ai_visibility_achievements')
        .insert(
          report.achievements.map(achievement => ({
            id: achievement.id,
            report_id: report.id,
            organization_id: report.organization_id,
            achievement_text: achievement.achievement_text,
            category: achievement.category,
            impact_level: achievement.impact_level,
            previous_value: achievement.previous_value,
            current_value: achievement.current_value,
            improvement_percentage: achievement.improvement_percentage,
            created_at: achievement.created_at
          }))
        );

      if (achievementsError) {
        console.error('❌ Error storing achievements:', achievementsError);
        throw achievementsError;
      }

      console.log(`✅ Stored ${report.achievements.length} achievements`);
    }

    // 5. Store priority actions
    if (report.priority_actions && report.priority_actions.length > 0) {
      const { error: actionsError } = await supabase
        .from('ai_visibility_priority_actions')
        .insert(
          report.priority_actions.map(action => ({
            id: action.id,
            report_id: report.id,
            organization_id: report.organization_id,
            action_title: action.action_title,
            action_description: action.action_description,
            priority: action.priority,
            category: action.category,
            fix_instructions: action.fix_instructions,
            estimated_impact: action.estimated_impact,
            estimated_effort: action.estimated_effort,
            status: action.status,
            completed_at: action.completed_at,
            dismissed_at: action.dismissed_at,
            created_at: action.created_at,
            updated_at: action.updated_at
          }))
        );

      if (actionsError) {
        console.error('❌ Error storing priority actions:', actionsError);
        throw actionsError;
      }

      console.log(`✅ Stored ${report.priority_actions.length} priority actions`);
    }

    // 6. Store content gaps
    if (report.content_gaps && report.content_gaps.length > 0) {
      const { error: gapsError } = await supabase
        .from('ai_visibility_content_gaps')
        .insert(
          report.content_gaps.map(gap => ({
            id: gap.id,
            report_id: report.id,
            organization_id: report.organization_id,
            gap_type: gap.gap_type,
            gap_title: gap.gap_title,
            gap_description: gap.gap_description,
            severity: gap.severity,
            competitors_have_this: gap.competitors_have_this,
            recommended_action: gap.recommended_action,
            content_type: gap.content_type,
            created_at: gap.created_at
          }))
        );

      if (gapsError) {
        console.error('❌ Error storing content gaps:', gapsError);
        throw gapsError;
      }

      console.log(`✅ Stored ${report.content_gaps.length} content gaps`);
    }

    console.log('✅ Complete report stored successfully!\n');
  } catch (error: any) {
    console.error('❌ Failed to store report:', error);
    throw error;
  }
}

/**
 * Get latest report for an organization
 */
export async function getLatestReport(
  organization_id: string
): Promise<AIVisibilityReport | null> {
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase
      .from('ai_visibility_reports')
      .select('*')
      .eq('organization_id', organization_id)
      .order('report_month', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      console.error('Error fetching latest report:', error);
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error in getLatestReport:', error);
    throw error;
  }
}

/**
 * Get report by ID with all related data
 */
export async function getReportById(
  report_id: string
): Promise<AIVisibilityReport | null> {
  const supabase = getSupabase();
  try {
    // Get main report
    const { data: report, error: reportError } = await supabase
      .from('ai_visibility_reports')
      .select('*')
      .eq('id', report_id)
      .single();

    if (reportError) {
      if (reportError.code === 'PGRST116') {
        return null;
      }
      throw reportError;
    }

    // Get platform scores
    const { data: platform_scores } = await supabase
      .from('ai_visibility_platform_scores')
      .select('*')
      .eq('report_id', report_id);

    // Get achievements
    const { data: achievements } = await supabase
      .from('ai_visibility_achievements')
      .select('*')
      .eq('report_id', report_id);

    // Get priority actions
    const { data: priority_actions } = await supabase
      .from('ai_visibility_priority_actions')
      .select('*')
      .eq('report_id', report_id);

    // Get content gaps
    const { data: content_gaps } = await supabase
      .from('ai_visibility_content_gaps')
      .select('*')
      .eq('report_id', report_id);

    return {
      ...report,
      platform_scores: platform_scores || [],
      achievements: achievements || [],
      priority_actions: priority_actions || [],
      content_gaps: content_gaps || []
    };
  } catch (error: any) {
    console.error('Error in getReportById:', error);
    throw error;
  }
}

/**
 * Get organization reports with pagination
 */
export async function getOrganizationReports(
  organization_id: string,
  limit: number = 12
): Promise<AIVisibilityReport[]> {
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase
      .from('ai_visibility_reports')
      .select('*')
      .eq('organization_id', organization_id)
      .order('report_month', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching organization reports:', error);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getOrganizationReports:', error);
    throw error;
  }
}

/**
 * Update action status
 */
export async function updateActionStatus(
  action_id: string,
  status: ActionStatus,
  completed_at?: string,
  dismissed_at?: string
): Promise<void> {
  const supabase = getSupabase();
  try {
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (completed_at) {
      updates.completed_at = completed_at;
    }

    if (dismissed_at) {
      updates.dismissed_at = dismissed_at;
    }

    const { error } = await supabase
      .from('ai_visibility_priority_actions')
      .update(updates)
      .eq('id', action_id);

    if (error) {
      console.error('Error updating action status:', error);
      throw error;
    }

    console.log(`✅ Action ${action_id} status updated to ${status}`);
  } catch (error: any) {
    console.error('Error in updateActionStatus:', error);
    throw error;
  }
}

/**
 * Get score history for trending
 */
export async function getScoreHistory(
  organization_id: string,
  months: number = 6
): Promise<Array<{ date: string; score: number }>> {
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase
      .from('ai_visibility_reports')
      .select('report_month, overall_score')
      .eq('organization_id', organization_id)
      .not('overall_score', 'is', null)
      .order('report_month', { ascending: false })
      .limit(months);

    if (error) {
      console.error('Error fetching score history:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      date: item.report_month,
      score: item.overall_score!
    }));
  } catch (error: any) {
    console.error('Error in getScoreHistory:', error);
    throw error;
  }
}

/**
 * Get all competitors for organization
 */
export async function getCompetitors(
  organization_id: string,
  include_disabled: boolean = false
): Promise<Competitor[]> {
  const supabase = getSupabase();
  try {
    let query = supabase
      .from('ai_visibility_competitors')
      .select('*')
      .eq('organization_id', organization_id)
      .order('detection_count', { ascending: false });

    if (!include_disabled) {
      query = query.eq('is_user_disabled', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching competitors:', error);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getCompetitors:', error);
    throw error;
  }
}

/**
 * Disable/enable a competitor
 */
export async function toggleCompetitor(
  competitor_id: string,
  is_disabled: boolean
): Promise<void> {
  const supabase = getSupabase();
  try {
    const { error } = await supabase
      .from('ai_visibility_competitors')
      .update({
        is_user_disabled: is_disabled,
        disabled_at: is_disabled ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', competitor_id);

    if (error) {
      console.error('Error toggling competitor:', error);
      throw error;
    }

    console.log(`✅ Competitor ${competitor_id} ${is_disabled ? 'disabled' : 'enabled'}`);
  } catch (error: any) {
    console.error('Error in toggleCompetitor:', error);
    throw error;
  }
}

/**
 * Get active queries for organization
 */
export async function getActiveQueries(
  organization_id: string
): Promise<AIQuery[]> {
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase
      .from('ai_visibility_queries')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching queries:', error);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getActiveQueries:', error);
    throw error;
  }
}

/**
 * Store query results
 */
export async function storeQueryResults(
  report_id: string,
  query_id: string,
  results: QueryResult[]
): Promise<void> {
  const supabase = getSupabase();
  try {
    const { error } = await supabase
      .from('ai_visibility_query_results')
      .insert(
        results.map(result => ({
          id: result.id,
          report_id,
          query_id,
          platform: result.platform,
          raw_response: result.raw_response,
          business_mentioned: result.business_mentioned,
          business_ranking: result.business_ranking,
          competitors_mentioned: result.competitors_mentioned,
          content_gaps: result.content_gaps,
          strengths: result.strengths,
          recommendations: result.recommendations,
          query_executed_at: result.query_executed_at,
          response_time_ms: result.response_time_ms,
          api_cost: result.api_cost,
          created_at: result.created_at
        }))
      );

    if (error) {
      console.error('Error storing query results:', error);
      throw error;
    }

    console.log(`✅ Stored ${results.length} query results`);
  } catch (error: any) {
    console.error('Error in storeQueryResults:', error);
    throw error;
  }
}

/**
 * Get platform scores for multiple reports (for trending)
 */
export async function getPlatformScoreHistory(
  organization_id: string,
  months: number = 6
): Promise<Array<{
  report_month: string;
  chatgpt_score: number;
  claude_score: number;
  gemini_score: number;
  perplexity_score: number;
}>> {
  const supabase = getSupabase();
  try {
    // Get recent reports
    const { data: reports, error: reportsError } = await supabase
      .from('ai_visibility_reports')
      .select('id, report_month')
      .eq('organization_id', organization_id)
      .order('report_month', { ascending: false })
      .limit(months);

    if (reportsError) throw reportsError;
    if (!reports || reports.length === 0) return [];

    // Get platform scores for these reports
    const reportIds = reports.map((r: any) => r.id);
    const { data: scores, error: scoresError } = await supabase
      .from('ai_visibility_platform_scores')
      .select('report_id, platform, score')
      .in('report_id', reportIds);

    if (scoresError) throw scoresError;

    // Organize by report
    const result = reports.map((report: any) => {
      const reportScores = (scores || []).filter((s: any) => s.report_id === report.id);
      
      return {
        report_month: report.report_month,
        chatgpt_score: reportScores.find((s: any) => s.platform === 'chatgpt')?.score || 0,
        claude_score: reportScores.find((s: any) => s.platform === 'claude')?.score || 0,
        gemini_score: reportScores.find((s: any) => s.platform === 'gemini')?.score || 0,
        perplexity_score: reportScores.find((s: any) => s.platform === 'perplexity')?.score || 0
      };
    });

    return result;
  } catch (error: any) {
    console.error('Error in getPlatformScoreHistory:', error);
    throw error;
  }
}

/**
 * Delete old reports (cleanup utility)
 */
export async function deleteOldReports(
  organization_id: string,
  keep_months: number = 12
): Promise<number> {
  const supabase = getSupabase();
  try {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - keep_months);
    const cutoffString = cutoffDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('ai_visibility_reports')
      .delete()
      .eq('organization_id', organization_id)
      .lt('report_month', cutoffString)
      .select();

    if (error) {
      console.error('Error deleting old reports:', error);
      throw error;
    }

    const deletedCount = data?.length || 0;
    console.log(`✅ Deleted ${deletedCount} old reports`);
    
    return deletedCount;
  } catch (error: any) {
    console.error('Error in deleteOldReports:', error);
    throw error;
  }
}