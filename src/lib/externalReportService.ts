// src/lib/externalReportService.ts
// Service for managing external AI visibility reports
// FIXED: Consistent field mapping for UI compatibility

import type {
  ExternalReport,
  ExternalReportFilters,
  ExternalReportStats,
  ExternalReportSummary,
  GenerateExternalReportRequest
} from '../types/externalReport';
import { supabase } from './supabase';

export class ExternalReportService {
  /**
   * Helper: Map database ExternalReport to UI-friendly format
   * Adds computed fields for backwards compatibility
   */
  private static mapReportToUI(report: any): any {
    if (!report) return null;

    return {
      ...report,
      // Add UI-friendly aliases
      generated_at: report.created_at,
      generated_by: report.generated_by_name,
      processing_time_ms: report.processing_duration_ms,
      estimated_cost_usd: report.api_cost_usd,
    };
  }

  /**
   * Create a new external report (initial database record)
   * Returns immediately with report ID - actual generation happens async
   */
  static async createReport(
    request: GenerateExternalReportRequest,
    userId: string
  ): Promise<{ report_id: string; error: string | null }> {
    try {
      console.log('📝 Creating external report record...', request);

      // Get user details for caching
      const { data: userData } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', userId)
        .single();

      const userName = userData 
        ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim()
        : 'Unknown User';
      const userEmail = userData?.email || null;

      // Generate share token
      const shareToken = this.generateShareToken();
      const shareUrl = `${window.location.origin}/share/report/${shareToken}`;

      // Insert initial report record
      const { data, error } = await supabase
        .from('ai_visibility_external_reports')
        .insert({
          generated_by_user_id: userId,
          generated_by_name: userName,
          generated_by_email: userEmail,
          target_website: request.target_website,
          business_name: request.business_name || null,
          business_type: request.business_type,
          business_location: request.business_location,
          competitor_websites: request.competitor_websites || null,
          share_token: shareToken,
          share_url: shareUrl,
          status: 'pending'
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Error creating report:', error);
        return { report_id: '', error: error.message };
      }

      console.log('✅ Report record created:', data.id);
      return { report_id: data.id, error: null };
    } catch (error: any) {
      console.error('❌ Exception creating report:', error);
      return { report_id: '', error: error.message };
    }
  }

  /**
   * Get all reports with optional filtering
   */
  static async getAllReports(
    filters?: ExternalReportFilters
  ): Promise<{ data: ExternalReportSummary[] | null; error: any }> {
    try {
      let query = supabase
        .from('ai_visibility_external_reports')
        .select('id, business_name, target_website, status, generated_by_name, created_at, share_url, report_data, share_views')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.user_id) {
        query = query.eq('generated_by_user_id', filters.user_id);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters?.search) {
        query = query.or(
          `target_website.ilike.%${filters.search}%,business_name.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching reports:', error);
        return { data: null, error };
      }

      // Transform to summary format with UI-friendly field names
      const summaries: ExternalReportSummary[] = (data || []).map((report: any) => ({
        id: report.id,
        business_name: report.business_name || 'Unknown Business',
        target_website: report.target_website,
        overall_score: report.report_data?.overall_score || null,
        status: report.status,
        generated_by: report.generated_by_name || 'Unknown',
        generated_at: report.created_at,
        share_url: report.share_url
      }));

      return { data: summaries, error: null };
    } catch (error: any) {
      console.error('Exception fetching reports:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a single report by ID with full details
   * ✅ FIXED: Now applies UI field mapping
   */
  static async getReportById(
    reportId: string
  ): Promise<{ data: ExternalReport | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('ai_visibility_external_reports')
        .select('*')
        .eq('id', reportId)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.error('Error fetching report:', error);
        return { data: null, error };
      }

      // ✅ Apply UI mapping
      const mappedData = this.mapReportToUI(data);

      return { data: mappedData, error: null };
    } catch (error: any) {
      console.error('Exception fetching report:', error);
      return { data: null, error };
    }
  }

  /**
   * Get report by share token (public access, no auth required)
   * ✅ FIXED: Now applies UI field mapping
   */
  static async getReportByToken(
    token: string
  ): Promise<{ data: ExternalReport | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('ai_visibility_external_reports')
        .select('*')
        .eq('share_token', token)
        .eq('share_enabled', true)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.error('Error fetching report by token:', error);
        return { data: null, error };
      }

      // Increment view count
      if (data) {
        await this.incrementViewCount(data.id);
      }

      // ✅ Apply UI mapping
      const mappedData = this.mapReportToUI(data);

      return { data: mappedData, error: null };
    } catch (error: any) {
      console.error('Exception fetching report by token:', error);
      return { data: null, error };
    }
  }

  /**
   * Update report status
   */
  static async updateReportStatus(
    reportId: string,
    status: string,
    additionalData?: Partial<ExternalReport>
  ): Promise<{ error: any }> {
    try {
      const updates: any = {
        status,
        ...additionalData
      };

      if (status === 'generating' && !additionalData?.generation_started_at) {
        updates.generation_started_at = new Date().toISOString();
      }

      if (status === 'completed' && !additionalData?.generation_completed_at) {
        updates.generation_completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('ai_visibility_external_reports')
        .update(updates)
        .eq('id', reportId);

      if (error) {
        console.error('Error updating report status:', error);
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      console.error('Exception updating report status:', error);
      return { error };
    }
  }

  /**
   * Soft delete a report
   */
  static async deleteReport(
    reportId: string,
    userId: string
  ): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('ai_visibility_external_reports')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by_user_id: userId
        })
        .eq('id', reportId);

      if (error) {
        console.error('Error deleting report:', error);
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      console.error('Exception deleting report:', error);
      return { error };
    }
  }

  /**
   * Enable/disable sharing for a report
   */
  static async toggleSharing(
    reportId: string,
    enabled: boolean
  ): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('ai_visibility_external_reports')
        .update({ share_enabled: enabled })
        .eq('id', reportId);

      if (error) {
        console.error('Error toggling sharing:', error);
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      console.error('Exception toggling sharing:', error);
      return { error };
    }
  }

  /**
   * Get report statistics
   * ✅ FIXED: Returns correct field names matching ExternalReportStats interface
   */
  static async getReportStats(): Promise<{ data: ExternalReportStats | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('ai_visibility_external_reports')
        .select('status, api_cost_usd, processing_duration_ms, overall_score, share_views')
        .is('deleted_at', null);

      if (error) {
        console.error('Error fetching stats:', error);
        return { data: null, error };
      }

      // Calculate stats with correct field names
      const completedReports = data.filter((r: any) => r.status === 'completed');
      const totalScore = completedReports.reduce((sum: number, r: any) => sum + (r.overall_score || 0), 0);

      const stats: ExternalReportStats = {
        total: data.length,
        pending: data.filter((r: any) => r.status === 'pending').length,
        generating: data.filter((r: any) => r.status === 'generating').length,
        completed: completedReports.length,
        error: data.filter((r: any) => r.status === 'error').length,
        average_score: completedReports.length > 0 ? totalScore / completedReports.length : 0,
        total_views: data.reduce((sum: number, r: any) => sum + (r.share_views || 0), 0),
        avg_processing_time_ms: data.length > 0
          ? data.reduce((sum: number, r: any) => sum + (r.processing_duration_ms || 0), 0) / data.length
          : 0,
        total_cost_usd: data.reduce((sum: number, r: any) => sum + (r.api_cost_usd || 0), 0)
      };

      return { data: stats, error: null };
    } catch (error: any) {
      console.error('Exception fetching stats:', error);
      return { data: null, error };
    }
  }

  /**
   * Increment share view count
   */
  private static async incrementViewCount(reportId: string): Promise<void> {
    try {
      await supabase.rpc('increment_share_views', { report_id: reportId });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  }

  /**
   * Generate unique share token
   */
  private static generateShareToken(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
}