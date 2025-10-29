// src/components/pages/Automations.tsx
// Main automation settings page - modular architecture
// FIXED: Now properly handles Login As sessions

import { Calendar, Camera, CheckCircle, Loader, MessageSquare, RefreshCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AutomationRulesService } from '../../lib/automationRulesService';
import { LoginAsService } from '../../lib/loginAsService';
import { supabase } from '../../lib/supabase';
import { ReviewAutomationCard } from '../automations/ReviewAutomationCard';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

type ReviewAutomationSetting = 'ai-suggest' | 'ai-automated' | 'manual';

interface ReviewAutomationSettings {
  oneStar: ReviewAutomationSetting;
  twoStar: ReviewAutomationSetting;
  threeStar: ReviewAutomationSetting;
  fourStar: ReviewAutomationSetting;
  fiveStar: ReviewAutomationSetting;
}

export const Automations: React.FC = () => {
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [organizationId, setOrganizationId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  
  const [reviewSettings, setReviewSettings] = useState<ReviewAutomationSettings>({
    oneStar: 'manual',
    twoStar: 'ai-suggest',
    threeStar: 'ai-suggest',
    fourStar: 'ai-automated',
    fiveStar: 'ai-automated'
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Load automation rules on mount
  useEffect(() => {
    loadAutomationRules();
  }, []);

  const loadAutomationRules = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        return;
      }
      setUserId(user.id);
      
      // 🔥 CHECK FOR LOGIN AS SESSION - Use target user if impersonating
      const loginAsSession = LoginAsService.getActiveSession();
      const effectiveUserId = loginAsSession?.targetUserId || user.id;
      
      console.log('[Automations] Loading rules for user:', {
        authenticatedUser: user.id,
        effectiveUser: effectiveUserId,
        isLoginAs: !!loginAsSession,
        targetEmail: loginAsSession?.targetUserEmail
      });
      
      // Get user's profile to find organization_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', effectiveUserId)  // ✅ Use effective user ID (target if Login As)
        .single();
      
      if (!profile?.organization_id) {
        console.error('[Automations] No organization found for user');
        return;
      }
      
      const orgId = profile.organization_id;
      setOrganizationId(orgId);
      
      console.log('[Automations] Loading rules for organization:', orgId);
      
      // Load automation rules from database
      const rules = await AutomationRulesService.getRules(orgId);
      
      setReviewSettings({
        oneStar: rules.one_star,
        twoStar: rules.two_star,
        threeStar: rules.three_star,
        fourStar: rules.four_star,
        fiveStar: rules.five_star
      });
      
      console.log('[Automations] ✅ Loaded automation rules:', rules);
    } catch (error) {
      console.error('[Automations] Failed to load rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSettingChange = (
    starKey: keyof ReviewAutomationSettings,
    setting: ReviewAutomationSetting
  ) => {
    setReviewSettings(prev => ({
      ...prev,
      [starKey]: setting
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const success = await AutomationRulesService.saveRules({
        organization_id: organizationId,
        one_star: reviewSettings.oneStar,
        two_star: reviewSettings.twoStar,
        three_star: reviewSettings.threeStar,
        four_star: reviewSettings.fourStar,
        five_star: reviewSettings.fiveStar
      }, userId);
      
      if (success) {
        console.log('[Automations] ✅ Review automation rules saved!');
        setHasUnsavedChanges(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        console.error('[Automations] ❌ Failed to save rules');
        alert('Failed to save automation rules. Please try again.');
      }
    } catch (error) {
      console.error('[Automations] Error saving rules:', error);
      alert('Error saving automation rules. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setReviewSettings({
      oneStar: 'manual',
      twoStar: 'ai-suggest',
      threeStar: 'ai-suggest',
      fourStar: 'ai-automated',
      fiveStar: 'ai-automated'
    });
    setHasUnsavedChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin text-gray-400" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Success notification */}
      {saveSuccess && (
        <div className="fixed top-20 right-4 z-50">
          <Card>
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border-green-500">
              <CheckCircle size={20} className="text-green-600" />
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                ✅ Automation rules saved successfully!
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Automation Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configure how GBP Copilot automates your Google Business Profile management
        </p>
      </div>

      {/* Review Automation Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-xl">
              <MessageSquare size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Review Response Automation
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure how AI responds to reviews based on star rating
              </p>
            </div>
          </div>
          
          {hasUnsavedChanges && (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RefreshCw size={14} className="mr-2" />
                Reset
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader size={14} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <ReviewAutomationCard
            starCount={1}
            setting={reviewSettings.oneStar}
            onChange={(s) => handleReviewSettingChange('oneStar', s)}
          />
          <ReviewAutomationCard
            starCount={2}
            setting={reviewSettings.twoStar}
            onChange={(s) => handleReviewSettingChange('twoStar', s)}
          />
          <ReviewAutomationCard
            starCount={3}
            setting={reviewSettings.threeStar}
            onChange={(s) => handleReviewSettingChange('threeStar', s)}
          />
          <ReviewAutomationCard
            starCount={4}
            setting={reviewSettings.fourStar}
            onChange={(s) => handleReviewSettingChange('fourStar', s)}
          />
          <ReviewAutomationCard
            starCount={5}
            setting={reviewSettings.fiveStar}
            onChange={(s) => handleReviewSettingChange('fiveStar', s)}
          />
        </div>
      </div>

      {/* Post Scheduling Section (placeholder) */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-[#11998e] to-[#38ef7d] rounded-xl">
            <Calendar size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Post Scheduling
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Coming soon - Automate your Google Business Profile posts
            </p>
          </div>
        </div>
      </Card>

      {/* Photo Sync Section (placeholder) */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-[#f093fb] to-[#f5576c] rounded-xl">
            <Camera size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Photo Synchronization
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Coming soon - Automatically sync and optimize your photos
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};