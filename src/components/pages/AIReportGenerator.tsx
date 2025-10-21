// src/components/pages/AIReportGenerator.tsx
// FIXED TypeScript errors - Updated to use Railway backend

import { AlertCircle, ArrowLeft, Briefcase, CheckCircle, FileDown, Globe, Loader, MapPin, Share2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { ExternalReport, GenerateExternalReportRequest } from '../../types/externalReport';
import { Badge } from '../ui/Badge';
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
      setError('Website URL is required');
      return false;
    }

    // Validate URL format
    try {
      new URL(formData.target_website);
    } catch (e) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return false;
    }

    return true;
  };

  // Get report by ID from Supabase
  const getReportById = async (reportId: string): Promise<ExternalReport | null> => {
    const { data, error } = await supabase
      .from('ai_visibility_external_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) {
      console.error('Error fetching report:', error);
      return null;
    }

    return data as ExternalReport;
  };

  const startPolling = (reportId: string) => {
    console.log(`📊 Starting to poll for report: ${reportId}`);
    
    const interval = setInterval(async () => {
      try {
        const updatedReport = await getReportById(reportId);
        
        if (updatedReport) {
          console.log(`📊 Report status: ${updatedReport.status}`);
          
          if (updatedReport.status === 'completed') {
            console.log('✅ Report completed!');
            setReport(updatedReport);
            setIsGenerating(false);
            setShowForm(false);
            setCurrentPhase('complete');
            clearInterval(interval);
            setPollingInterval(null);
          } else if (updatedReport.status === 'error') {
            console.error('❌ Report generation failed');
            setError(updatedReport.error_message || 'Report generation failed');
            setIsGenerating(false);
            setCurrentPhase('error');
            clearInterval(interval);
            setPollingInterval(null);
          }
        }
      } catch (err) {
        console.error('Error polling for report:', err);
        // Continue polling even on error
      }
    }, 5000); // Poll every 5 seconds

    setPollingInterval(interval);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      setIsGenerating(true);
      setShowForm(false);
      setCurrentPhase('initializing');

      console.log('🚀 Starting AI-powered report generation...');
      console.log('📡 Using Railway backend:', RAILWAY_API_URL);

      setCurrentPhase('querying');

      // Call Railway backend directly - it will create the database record
      const requestPayload = {
        website_url: formData.target_website,
        business_name: formData.business_name || undefined,
        business_type: formData.business_type || undefined,
        location: formData.business_location || undefined
      };

      console.log('🚀 Calling Railway backend with payload:', requestPayload);

      const response = await fetch(`${RAILWAY_API_URL}/api/generate-report`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Backend returned ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Railway backend triggered:', result);

      // Start polling for completion
      if (result.report_id) {
        startPolling(result.report_id);
        simulateProgress();
      } else {
        throw new Error('No report ID returned from backend');
      }

    } catch (err: any) {
      console.error('❌ Error generating report:', err);
      setError(err.message || 'Failed to generate report. Please check your Railway backend is running.');
      setCurrentPhase('error');
      setIsGenerating(false);
    }
  };

  const simulateProgress = () => {
    // Simulate platform analysis progress for better UX
    setTimeout(() => setPlatformProgress(prev => 
      prev.map((p, i) => i === 0 ? { ...p, status: 'analyzing' as PlatformStatus } : p)
    ), 2000);

    setTimeout(() => setPlatformProgress(prev => 
      prev.map((p, i) => i === 0 ? { ...p, status: 'complete' as PlatformStatus } : i === 1 ? { ...p, status: 'analyzing' as PlatformStatus } : p)
    ), 20000);

    setTimeout(() => setPlatformProgress(prev => 
      prev.map((p, i) => i < 2 ? { ...p, status: 'complete' as PlatformStatus } : i === 2 ? { ...p, status: 'analyzing' as PlatformStatus } : p)
    ), 40000);

    setTimeout(() => setPlatformProgress(prev => 
      prev.map((p, i) => i < 3 ? { ...p, status: 'complete' as PlatformStatus } : { ...p, status: 'analyzing' as PlatformStatus })
    ), 60000);

    setTimeout(() => {
      setCurrentPhase('analyzing');
    }, 80000);
  };

  const handleCancel = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setShowForm(true);
    setIsGenerating(false);
    setReport(null);
    setError('');
    setCurrentPhase('initializing');
    setPlatformProgress([
      { name: 'ChatGPT', status: 'pending' },
      { name: 'Claude', status: 'pending' },
      { name: 'Gemini', status: 'pending' },
      { name: 'Perplexity', status: 'pending' }
    ]);
  };

  const handleExportPDF = async () => {
    if (!report) return;
    alert('PDF export functionality will be implemented with jsPDF/react-pdf library');
  };

  const handleCopyShareLink = () => {
    if (!report?.share_url) return;
    navigator.clipboard.writeText(report.share_url);
    alert('Share link copied to clipboard!');
  };

  const getPhaseDescription = (phase: string): string => {
    const descriptions: Record<string, string> = {
      initializing: 'Setting up analysis...',
      querying: 'AI analyzing business and finding competitors...',
      analyzing: 'Generating competitive analysis...',
      complete: 'Analysis complete!',
      error: 'An error occurred'
    };
    return descriptions[phase] || 'Processing...';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI Visibility Report Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Universal AI-powered competitive analysis for ANY business type
          </p>
        </div>
        {!showForm && !isGenerating && (
          <Button onClick={handleCancel} variant="secondary" size="sm">
            <ArrowLeft size={16} className="mr-2" />
            New Report
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Website URL - Required */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Website URL *
                </label>
                <div className="relative">
                  <Globe size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    value={formData.target_website}
                    onChange={(e) => handleInputChange('target_website', e.target.value)}
                    placeholder="https://example.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Required - AI will automatically detect business type and location
                </p>
              </div>

              {/* Optional Fields */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Optional - Leave blank for AI auto-detection
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Business Name */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Business Name
                    </label>
                    <div className="relative">
                      <Briefcase size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={formData.business_name}
                        onChange={(e) => handleInputChange('business_name', e.target.value)}
                        placeholder="Auto-detected"
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                  </div>

                  {/* Business Type */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
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

                  {/* Location */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              Generate AI Report
            </Button>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Powered by OpenAI GPT-4 • Estimated cost: $0.20-0.30 per report
            </p>
          </form>
        </Card>
      )}

      {/* Progress Display */}
      {isGenerating && (
        <Card>
          <div className="text-center py-12">
            <Loader className="animate-spin mx-auto mb-4 text-blue-500" size={48} />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {getPhaseDescription(currentPhase)}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              AI is analyzing your business and competitors. This may take 1-2 minutes.
            </p>

            {/* Platform Progress */}
            <div className="max-w-2xl mx-auto space-y-3">
              {platformProgress.map((platform) => (
                <div
                  key={platform.name}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {platform.name}
                  </span>
                  {platform.status === 'pending' && (
                    <Badge variant="info" size="sm">Queued</Badge>
                  )}
                  {platform.status === 'analyzing' && (
                    <div className="flex items-center gap-2">
                      <Loader className="animate-spin" size={16} />
                      <Badge variant="warning" size="sm">Analyzing</Badge>
                    </div>
                  )}
                  {platform.status === 'complete' && (
                    <Badge variant="success" size="sm">
                      <CheckCircle size={14} className="mr-1" />
                      Complete
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            <Button
              onClick={handleCancel}
              variant="secondary"
              size="sm"
              className="mt-6"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Report Display */}
      {report && !isGenerating && (
        <>
          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleCopyShareLink}
              variant="secondary"
              size="sm"
            >
              <Share2 size={16} className="mr-2" />
              Copy Share Link
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="secondary"
              size="sm"
            >
              <FileDown size={16} className="mr-2" />
              Export PDF
            </Button>
          </div>

          {/* Report Content */}
          <EnhancedAIReportDisplay report={report} />
        </>
      )}

      {/* Error State */}
      {currentPhase === 'error' && !isGenerating && (
        <Card>
          <div className="text-center py-12">
            <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Generation Failed
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || 'An error occurred while generating the report'}
            </p>
            <Button onClick={handleCancel} variant="primary" size="md">
              Try Again
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};