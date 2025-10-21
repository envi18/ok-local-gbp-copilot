// src/components/pages/AIReportGenerator.tsx
// FIXED: Now passes authenticated user context to Railway backend

import { AlertCircle, ArrowLeft, Briefcase, CheckCircle, FileDown, Globe, Loader, MapPin, Share2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { ExternalReport, GenerateExternalReportRequest } from '../../types/externalReport';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EnhancedAIReportDisplay } from '../ui/EnhancedAIReportDisplay';

// Railway backend URL
const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL || 'https://ok-local-gbp-copilot-production.up.railway.app';

// Platform progress status type
type PlatformStatus = 'pending' | 'analyzing' | 'complete';

interface PlatformProgress {
  name: string;
  status: PlatformStatus;
}

export const AIReportGenerator: React.FC = () => {
  const [showForm, setShowForm] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [report, setReport] = useState<ExternalReport | null>(null);
  const [error, setError] = useState<string>('');
  const [currentPhase, setCurrentPhase] = useState<string>('initializing');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<GenerateExternalReportRequest>({
    target_website: '',
    business_name: '',
    business_type: '',
    business_location: '',
    competitor_websites: []
  });

  const [platformProgress, setPlatformProgress] = useState<PlatformProgress[]>([
    { name: 'ChatGPT', status: 'pending' },
    { name: 'Claude', status: 'pending' },
    { name: 'Gemini', status: 'pending' },
    { name: 'Perplexity', status: 'pending' }
  ]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleInputChange = (field: keyof GenerateExternalReportRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.target_website.trim()) {
      setError('Please enter a website URL');
      return false;
    }

    // Validate URL format
    try {
      new URL(formData.target_website.startsWith('http') 
        ? formData.target_website 
        : `https://${formData.target_website}`);
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return false;
    }

    return true;
  };

  const handleGenerateReport = async () => {
    if (!validateForm()) return;

    setIsGenerating(true);
    setError('');
    setCurrentPhase('initializing');
    setShowForm(false);

    try {
      // Get authenticated user - CRITICAL FOR RAILWAY BACKEND
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to generate reports');
      }

      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      const userName = profile 
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User'
        : 'Unknown User';

      console.log('👤 Authenticated user:', userName, user.email);

      // Ensure URL has protocol
      const websiteUrl = formData.target_website.startsWith('http')
        ? formData.target_website
        : `https://${formData.target_website}`;

      setCurrentPhase('connecting');

      // Call Railway backend with user context - FIXED: Now includes user info
      const payload = {
        website_url: websiteUrl,
        user_id: user.id,                    // CRITICAL: Required by database
        user_name: userName,                 // CRITICAL: Required by database
        user_email: user.email || null,      // CRITICAL: Required by database
        business_name: formData.business_name || undefined,
        business_type: formData.business_type || undefined,
        location: formData.business_location || undefined
      };

      console.log('🚀 Calling Railway backend with payload:', payload);

      const response = await fetch(`${RAILWAY_API_URL}/api/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to start report generation');
      }

      console.log('✅ Railway backend response:', result);

      const reportId = result.report_id;
      setCurrentPhase('processing');

      // Start polling for report completion
      const interval = setInterval(async () => {
        try {
          const { data: reportData, error: fetchError } = await supabase
            .from('ai_visibility_external_reports')
            .select('*')
            .eq('id', reportId)
            .single();

          if (fetchError) {
            console.error('Error fetching report:', fetchError);
            return;
          }

          console.log('📊 Report status:', reportData?.status);

          // Update platform progress based on status
          if (reportData?.status === 'processing') {
            setPlatformProgress(prev => prev.map((p, i) => ({
              ...p,
              status: i < 2 ? 'complete' : i === 2 ? 'analyzing' : 'pending'
            })));
          }

          if (reportData?.status === 'completed') {
            clearInterval(interval);
            setPollingInterval(null);
            setReport(reportData);
            setIsGenerating(false);
            setCurrentPhase('completed');
            
            // Mark all platforms as complete
            setPlatformProgress(prev => prev.map(p => ({
              ...p,
              status: 'complete'
            })));
          }

          if (reportData?.status === 'error') {
            clearInterval(interval);
            setPollingInterval(null);
            setError(reportData.error_message || 'Report generation failed');
            setIsGenerating(false);
            setShowForm(true);
          }
        } catch (pollError) {
          console.error('Polling error:', pollError);
        }
      }, 5000); // Poll every 5 seconds

      setPollingInterval(interval);

    } catch (err) {
      console.error('❌ Error generating report:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      setIsGenerating(false);
      setShowForm(true);
    }
  };

  const handleBack = () => {
    setShowForm(true);
    setReport(null);
    setError('');
    setIsGenerating(false);
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const handleDownloadReport = () => {
    if (!report) return;
    
    const reportText = `
AI Visibility Report
Generated: ${new Date(report.created_at).toLocaleDateString()}

Business: ${report.business_name || 'Unknown'}
Type: ${report.business_type}
Location: ${report.business_location}
Website: ${report.target_website}

Overall Score: ${report.overall_score || 'N/A'}/100

Share Link: ${report.share_url || 'N/A'}
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-visibility-report-${report.business_name?.replace(/\s+/g, '-').toLowerCase() || 'report'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyShareLink = () => {
    if (report?.share_url) {
      navigator.clipboard.writeText(report.share_url);
      alert('Share link copied to clipboard!');
    }
  };

  // Show form or loading state
  if (showForm || isGenerating) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Visibility Report Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generate comprehensive AI visibility analysis for any business
          </p>
        </div>

        {/* Main Content */}
        <Card hover={false} className="p-8">
          {!isGenerating ? (
            // Form
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* Website URL - Required */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website URL <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="url"
                    value={formData.target_website}
                    onChange={(e) => handleInputChange('target_website', e.target.value)}
                    placeholder="https://example.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  AI will automatically detect business name, type, and location
                </p>
              </div>

              {/* Optional Fields */}
              <div className="border-t dark:border-gray-700 pt-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Optional: Provide additional details (or let AI detect them)
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Business Name
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        value={formData.business_name}
                        onChange={(e) => handleInputChange('business_name', e.target.value)}
                        placeholder="Auto-detected"
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Business Type
                    </label>
                    <input
                      type="text"
                      value={formData.business_type}
                      onChange={(e) => handleInputChange('business_type', e.target.value)}
                      placeholder="Auto-detected"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        value={formData.business_location}
                        onChange={(e) => handleInputChange('business_location', e.target.value)}
                        placeholder="Auto-detected"
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end pt-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleGenerateReport}
                  disabled={!formData.target_website.trim()}
                >
                  Generate AI Report
                </Button>
              </div>
            </div>
          ) : (
            // Loading State
            <div className="text-center py-12">
              <div className="mb-6">
                <Loader className="w-16 h-16 mx-auto text-blue-500 animate-spin" />
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Generating AI Visibility Report
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {currentPhase === 'initializing' && 'Initializing analysis...'}
                {currentPhase === 'connecting' && 'Connecting to AI backend...'}
                {currentPhase === 'processing' && 'Analyzing with AI platforms...'}
              </p>

              {/* Platform Progress */}
              <div className="max-w-md mx-auto space-y-3">
                {platformProgress.map((platform) => (
                  <div key={platform.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {platform.name}
                    </span>
                    {platform.status === 'complete' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {platform.status === 'analyzing' && (
                      <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                    )}
                    {platform.status === 'pending' && (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                    )}
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
                This typically takes 60-120 seconds
              </p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Show completed report
  if (report) {
    return (
      <div className="max-w-6xl mx-auto">
        {/* Header with Actions */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
          >
            <ArrowLeft size={16} className="mr-2" />
            Generate Another Report
          </Button>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadReport}
            >
              <FileDown size={16} className="mr-2" />
              Download
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCopyShareLink}
            >
              <Share2 size={16} className="mr-2" />
              Copy Share Link
            </Button>
          </div>
        </div>

        {/* Report Display */}
        <EnhancedAIReportDisplay report={report} />
      </div>
    );
  }

  return null;
};