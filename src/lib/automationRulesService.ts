// src/lib/automationRulesService.ts
// Database service for managing automation rules per organization

import { supabase } from './supabase';

export interface AutomationRulesConfig {
  organization_id: string;
  one_star: 'ai-suggest' | 'ai-automated' | 'manual';
  two_star: 'ai-suggest' | 'ai-automated' | 'manual';
  three_star: 'ai-suggest' | 'ai-automated' | 'manual';
  four_star: 'ai-suggest' | 'ai-automated' | 'manual';
  five_star: 'ai-suggest' | 'ai-automated' | 'manual';
  updated_at?: string;
  updated_by?: string;
}

export class AutomationRulesService {
  /**
   * Get automation rules for an organization
   * Returns default rules if none exist
   */
  static async getRules(organizationId: string): Promise<AutomationRulesConfig> {
    try {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('[AutomationRules] Error fetching rules:', error);
        throw error;
      }

      // Return data if exists, otherwise return defaults
      return data || {
        organization_id: organizationId,
        one_star: 'manual',
        two_star: 'ai-suggest',
        three_star: 'ai-suggest',
        four_star: 'ai-automated',
        five_star: 'ai-automated'
      };
    } catch (error) {
      console.error('[AutomationRules] Failed to get rules:', error);
      // Return defaults on error
      return {
        organization_id: organizationId,
        one_star: 'manual',
        two_star: 'ai-suggest',
        three_star: 'ai-suggest',
        four_star: 'ai-automated',
        five_star: 'ai-automated'
      };
    }
  }

  /**
   * Save automation rules for an organization
   * Uses upsert to insert or update
   */
  static async saveRules(
    rules: AutomationRulesConfig,
    userId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('automation_rules')
        .upsert({
          organization_id: rules.organization_id,
          one_star: rules.one_star,
          two_star: rules.two_star,
          three_star: rules.three_star,
          four_star: rules.four_star,
          five_star: rules.five_star,
          updated_at: new Date().toISOString(),
          updated_by: userId
        }, {
          onConflict: 'organization_id'
        });

      if (error) {
        console.error('[AutomationRules] Error saving rules:', error);
        throw error;
      }

      console.log('[AutomationRules] ✅ Rules saved successfully');
      return true;
    } catch (error) {
      console.error('[AutomationRules] Failed to save rules:', error);
      return false;
    }
  }

  /**
   * Get automation action for a specific star rating
   */
  static getActionForRating(
    rules: AutomationRulesConfig,
    rating: number
  ): 'ai-suggest' | 'ai-automated' | 'manual' {
    switch (rating) {
      case 1:
        return rules.one_star;
      case 2:
        return rules.two_star;
      case 3:
        return rules.three_star;
      case 4:
        return rules.four_star;
      case 5:
        return rules.five_star;
      default:
        return 'manual';
    }
  }

  /**
   * Check if a review should be auto-responded
   */
  static shouldAutoRespond(rules: AutomationRulesConfig, rating: number): boolean {
    const action = this.getActionForRating(rules, rating);
    return action === 'ai-automated';
  }

  /**
   * Check if a review needs approval
   */
  static needsApproval(rules: AutomationRulesConfig, rating: number): boolean {
    const action = this.getActionForRating(rules, rating);
    return action === 'ai-suggest' || action === 'manual';
  }
}