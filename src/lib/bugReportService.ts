// src/lib/bugReportService.ts
// Service for managing bug reports and internal ticketing system

import { supabase } from './supabase';

export type BugPriority = 'critical' | 'high' | 'medium' | 'low';
export type BugStatus = 'new' | 'in_progress' | 'fixed' | 'verified' | 'wont_fix';

export interface BugReportStep {
  step: number;
  description: string;
}

export interface BugReport {
  id: string;
  
  // Basic Info
  title: string;
  priority: BugPriority;
  page_feature: string;
  status: BugStatus;
  
  // Description
  current_behavior: string;
  expected_behavior: string;
  steps_to_reproduce: BugReportStep[];
  
  // Technical Details
  console_errors?: string | null;
  railway_logs?: string | null;
  browser_info?: string | null;
  user_account_tested?: string | null;
  
  // Media
  screenshot_url?: string | null;
  
  // Tracking
  reported_by: string;
  reported_at: string;
  assigned_to?: string | null;
  fixed_at?: string | null;
  fixed_by?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  
  // Additional
  notes?: string | null;
  organization_id?: string | null;
  
  // Metadata
  created_at: string;
  updated_at: string;
  
  // Joined data (from queries)
  reporter?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  assignee?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

export interface CreateBugReportInput {
  title: string;
  priority: BugPriority;
  page_feature: string;
  current_behavior: string;
  expected_behavior: string;
  steps_to_reproduce: BugReportStep[];
  console_errors?: string;
  railway_logs?: string;
  browser_info?: string;
  user_account_tested?: string;
  screenshot_url?: string;
  notes?: string;
  reported_by: string;
  organization_id?: string;
}

export interface UpdateBugReportInput {
  title?: string;
  priority?: BugPriority;
  page_feature?: string;
  status?: BugStatus;
  current_behavior?: string;
  expected_behavior?: string;
  steps_to_reproduce?: BugReportStep[];
  console_errors?: string;
  railway_logs?: string;
  notes?: string;
  assigned_to?: string;
  fixed_by?: string;
  verified_by?: string;
}

export interface BugReportFilters {
  status?: BugStatus[];
  priority?: BugPriority[];
  page_feature?: string[];
  reported_by?: string;
  assigned_to?: string;
  search?: string;
}

export class BugReportService {
  /**
   * Get all bug reports with optional filters
   */
  static async getBugReports(filters?: BugReportFilters): Promise<BugReport[]> {
    try {
      let query = supabase
        .from('bug_reports')
        .select(`
          *,
          reporter:profiles!bug_reports_reported_by_fkey(first_name, last_name, email),
          assignee:profiles!bug_reports_assigned_to_fkey(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          query = query.in('status', filters.status);
        }
        
        if (filters.priority && filters.priority.length > 0) {
          query = query.in('priority', filters.priority);
        }
        
        if (filters.page_feature && filters.page_feature.length > 0) {
          query = query.in('page_feature', filters.page_feature);
        }
        
        if (filters.reported_by) {
          query = query.eq('reported_by', filters.reported_by);
        }
        
        if (filters.assigned_to) {
          query = query.eq('assigned_to', filters.assigned_to);
        }
        
        if (filters.search) {
          query = query.or(`title.ilike.%${filters.search}%,current_behavior.ilike.%${filters.search}%,expected_behavior.ilike.%${filters.search}%`);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('[BugReportService] Error fetching bug reports:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[BugReportService] Failed to get bug reports:', error);
      return [];
    }
  }

  /**
   * Get a single bug report by ID
   */
  static async getBugReportById(id: string): Promise<BugReport | null> {
    try {
      const { data, error } = await supabase
        .from('bug_reports')
        .select(`
          *,
          reporter:profiles!bug_reports_reported_by_fkey(first_name, last_name, email),
          assignee:profiles!bug_reports_assigned_to_fkey(first_name, last_name, email)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('[BugReportService] Error fetching bug report:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[BugReportService] Failed to get bug report:', error);
      return null;
    }
  }

  /**
   * Create a new bug report
   */
  static async createBugReport(input: CreateBugReportInput): Promise<BugReport | null> {
    try {
      const { data, error } = await supabase
        .from('bug_reports')
        .insert({
          title: input.title,
          priority: input.priority,
          page_feature: input.page_feature,
          status: 'new',
          current_behavior: input.current_behavior,
          expected_behavior: input.expected_behavior,
          steps_to_reproduce: input.steps_to_reproduce,
          console_errors: input.console_errors || null,
          railway_logs: input.railway_logs || null,
          browser_info: input.browser_info || null,
          user_account_tested: input.user_account_tested || null,
          screenshot_url: input.screenshot_url || null,
          notes: input.notes || null,
          reported_by: input.reported_by,
          organization_id: input.organization_id || null
          // ✅ REMOVED: reported_at, created_at, updated_at - let database defaults handle these
        })
        .select(`
          *,
          reporter:profiles!bug_reports_reported_by_fkey(first_name, last_name, email)
        `)
        .single();

      if (error) {
        console.error('[BugReportService] Error creating bug report:', error);
        throw error;
      }

      console.log('[BugReportService] ✅ Bug report created:', data.id);
      return data;
    } catch (error) {
      console.error('[BugReportService] Failed to create bug report:', error);
      return null;
    }
  }

  /**
   * Update a bug report
   */
  static async updateBugReport(
    id: string,
    input: UpdateBugReportInput,
    userId: string
  ): Promise<BugReport | null> {
    try {
      const updateData: any = {
        ...input
        // ✅ REMOVED: updated_at - let database default handle this
      };

      // Set timestamps for status changes
      if (input.status === 'fixed' && !updateData.fixed_at) {
        updateData.fixed_at = new Date().toISOString();
        updateData.fixed_by = userId;
      }
      
      if (input.status === 'verified' && !updateData.verified_at) {
        updateData.verified_at = new Date().toISOString();
        updateData.verified_by = userId;
      }

      const { data, error } = await supabase
        .from('bug_reports')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          reporter:profiles!bug_reports_reported_by_fkey(first_name, last_name, email),
          assignee:profiles!bug_reports_assigned_to_fkey(first_name, last_name, email)
        `)
        .single();

      if (error) {
        console.error('[BugReportService] Error updating bug report:', error);
        throw error;
      }

      console.log('[BugReportService] ✅ Bug report updated:', id);
      return data;
    } catch (error) {
      console.error('[BugReportService] Failed to update bug report:', error);
      return null;
    }
  }

  /**
   * Delete a bug report
   */
  static async deleteBugReport(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('bug_reports')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[BugReportService] Error deleting bug report:', error);
        throw error;
      }

      console.log('[BugReportService] ✅ Bug report deleted:', id);
      return true;
    } catch (error) {
      console.error('[BugReportService] Failed to delete bug report:', error);
      return false;
    }
  }

  /**
   * Get bug report statistics
   */
  static async getBugStatistics(): Promise<{
    total: number;
    new: number;
    in_progress: number;
    fixed: number;
    verified: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('bug_reports')
        .select('status, priority');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        new: data?.filter(b => b.status === 'new').length || 0,
        in_progress: data?.filter(b => b.status === 'in_progress').length || 0,
        fixed: data?.filter(b => b.status === 'fixed').length || 0,
        verified: data?.filter(b => b.status === 'verified').length || 0,
        critical: data?.filter(b => b.priority === 'critical').length || 0,
        high: data?.filter(b => b.priority === 'high').length || 0,
        medium: data?.filter(b => b.priority === 'medium').length || 0,
        low: data?.filter(b => b.priority === 'low').length || 0
      };

      return stats;
    } catch (error) {
      console.error('[BugReportService] Failed to get statistics:', error);
      return {
        total: 0,
        new: 0,
        in_progress: 0,
        fixed: 0,
        verified: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      };
    }
  }

  /**
   * Get unique page/feature names for filtering
   */
  static async getPageFeatures(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('bug_reports')
        .select('page_feature')
        .order('page_feature');

      if (error) throw error;

      // Get unique values
      const features = [...new Set(data?.map(b => b.page_feature) || [])];
      return features;
    } catch (error) {
      console.error('[BugReportService] Failed to get page features:', error);
      return [];
    }
  }

  /**
   * Format bug report for copying to Claude
   * Returns markdown-formatted text ready to paste
   */
  static formatForClaude(bug: BugReport): string {
    const priorityEmoji = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢'
    };

    const reporterName = bug.reporter 
      ? `${bug.reporter.first_name || ''} ${bug.reporter.last_name || ''}`.trim() || bug.reporter.email
      : 'Unknown';

    const reportedAt = new Date(bug.reported_at).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    let formatted = `## Bug #${bug.id.slice(0, 8)}: ${bug.title}\n\n`;
    formatted += `**Priority:** ${priorityEmoji[bug.priority]} ${bug.priority.toUpperCase()}\n`;
    formatted += `**Page/Feature:** ${bug.page_feature}\n`;
    formatted += `**Status:** ${bug.status}\n`;
    formatted += `**Reported By:** ${reporterName}\n`;
    formatted += `**Reported At:** ${reportedAt}\n\n`;

    formatted += `### What's Happening (Current Behavior)\n`;
    formatted += `${bug.current_behavior}\n\n`;

    formatted += `### What Should Happen (Expected Behavior)\n`;
    formatted += `${bug.expected_behavior}\n\n`;

    if (bug.steps_to_reproduce && bug.steps_to_reproduce.length > 0) {
      formatted += `### Steps to Reproduce\n`;
      bug.steps_to_reproduce.forEach((step) => {
        formatted += `${step.step}. ${step.description}\n`;
      });
      formatted += `\n`;
    }

    if (bug.console_errors) {
      formatted += `### Browser Console Errors\n\`\`\`\n${bug.console_errors}\n\`\`\`\n\n`;
    }

    if (bug.railway_logs) {
      formatted += `### Railway Logs\n\`\`\`\n${bug.railway_logs}\n\`\`\`\n\n`;
    }

    if (bug.browser_info || bug.user_account_tested || bug.notes) {
      formatted += `### Additional Context\n`;
      if (bug.browser_info) {
        formatted += `- Browser: ${bug.browser_info}\n`;
      }
      if (bug.user_account_tested) {
        formatted += `- Account tested: ${bug.user_account_tested}\n`;
      }
      if (bug.notes) {
        formatted += `- Notes: ${bug.notes}\n`;
      }
      if (bug.screenshot_url) {
        formatted += `- Screenshot: ${bug.screenshot_url}\n`;
      }
    }

    return formatted;
  }

  /**
   * Auto-capture browser information
   */
  static captureBrowserInfo(): string {
    const browser = navigator.userAgent;
    const screen = `${window.screen.width}x${window.screen.height}`;
    const viewport = `${window.innerWidth}x${window.innerHeight}`;
    
    return `${browser}\nScreen: ${screen}\nViewport: ${viewport}`;
  }

  /**
   * Get current page/feature name from URL
   */
  static getCurrentPageFeature(): string {
    const path = window.location.pathname;
    
    // Map paths to readable names
    const pathMap: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/locations': 'Locations',
      '/reviews': 'Reviews',
      '/simulator': 'GBP Simulator',
      '/automations': 'Automations',
      '/settings': 'Settings',
      '/settings/general': 'Settings - General',
      '/settings/users': 'Settings - Users',
      '/settings/customers': 'Settings - Customers',
      '/settings/products': 'Settings - Products',
      '/settings/bug-reports': 'Settings - Bug Reports'
    };

    return pathMap[path] || 'Unknown Page';
  }
}

export default BugReportService;