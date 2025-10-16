// src/components/pages/AIReportGenerator.tsx
// Main page for generating external AI visibility reports

import { Copy, Download, FileText, Mail, Share2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ExternalReportService } from '../../lib/externalReportService';
import { supabase } from '../../lib/supabase';
import type { ExternalReport, GenerateExternalReportRequest } from '../../types/externalReport';
import { AIReportDisplay } from '../ui/AIReportDisplay';
import { ReportGenerationForm } from '../ui/ReportGenerationForm';
import { ReportProgressIndicator } from '../ui/ReportProgressIndicator';

export const AIReportGenerator: React.FC = () => {
  const [userId, setUserId] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentReportId, setCurrentReportId] = useState<string>('');
  const [report, setReport] = useState<ExternalReport | null>(null);
  const [error, setError] = useState<string>('');
  
  // Progress tracking
  const [platformProgress, setPlatformProgress] = useState<Array<{
    platform: 'chatgpt' | 'claude' | 'gemini' | 'perplexity';
    status: 'pending' | 'analyzing' | 'complete' | 'error';
  }>>([
    { platform: 'chatgpt', status: 'pending' },
    { platform: 'claude', status: 'pending' },
    { platform: 'gemini', status: 'pending' },
    { platform: 'perplexity', status: 'pending' }
  ]);
  const [currentPhase, setCurrentPhase] = useState<'initializing' | 'querying' | 'analyzing' | 'complete' | 'error'>('initializing');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      setUserId(data.user.id);
    }
  };

  // Poll for report completion
  useEffect(() => {
    if (!currentReportId || !isGenerating) return;

    const pollInterval = setInterval(async () => {
      const { data } = await ExternalReportService.getReportById(currentReportId);
      
      if (data) {
        if (data.status === 'completed') {
          setReport(data);
          setIsGenerating(false);
          setCurrentPhase('complete');
          setPlatformProgress(prev => prev.map(p => ({ ...p, status: 'complete' })));
          clearInterval(pollInterval);
        } else if (data.status === 'error') {
          setError(data.error_message || 'Report generation failed');
          setIsGenerating(false);
          setCurrentPhase('error');
          clearInterval(pollInterval);
        }
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [currentReportId, isGenerating]);

  const handleSubmit = async (request: GenerateExternalReportRequest) => {
    setIsGenerating(true);
    setError('');
    setShowForm(false);
    setCurrentPhase('initializing');

    try {
      // Step 1: Create report record
      const { report_id, error: createError } = await ExternalReportService.createReport(
        request,
        userId
      );

      if (createError) {
        throw new Error(createError);
      }

      setCurrentReportId(report_id);
      setCurrentPhase('querying');

      // Step 2: Trigger Netlify function for async generation
      const response = await fetch('/.netlify/functions/generate-external-report-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id,
          ...request
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start report generation');
      }

      // Simulate progress for UI (actual progress tracked by polling)
      simulateProgress();

    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.message || 'Failed to generate report');
      setCurrentPhase('error');
      setIsGenerating(false);
    }
  };

  const simulateProgress = () => {
    // Simulate platform analysis progress for better UX
    setTimeout(() => setPlatformProgress(prev => 
      prev.map((p, i) => i === 0 ? { ...p, status: 'analyzing' } : p)
    ), 2000);

    setTimeout(() => setPlatformProgress(prev => 
      prev.map((p, i) => i === 0 ? { ...p, status: 'complete' } : i === 1 ? { ...p, status: 'analyzing' } : p)
    ), 15000);

    setTimeout(() => setPlatformProgress(prev => 
      prev.map((p, i) => i < 2 ? { ...p, status: 'complete' } : i === 2 ? { ...p, status: 'analyzing' } : p)
    ), 30000);

    setTimeout(() => setPlatformProgress(prev => 
      prev.map((p, i) => i < 3 ? { ...p, status: 'complete' } : { ...p, status: 'analyzing' })
    ), 45000);

    setTimeout(() => {
      setCurrentPhase('analyzing');
    }, 60000);
  };

  const handleCancel = () => {
    setShowForm(true);
    setIsGenerating(false);
    setReport(null);
    setError('');
    setCurrentPhase('initializing');
  };

  const handleExportPDF = async () => {
    if (!report) return;
    alert('PDF export functionality will be implemented with jsPDF/react-pdf library');
    // TODO: Implement PDF export
  };

  const handleCopyShareLink = () => {
    if (!report?.share_url) return;
    navigator.clipboard.writeText(report.share_url);
    alert('Share link copied to clipboard!');
  };

  const handleCopyJSON = () => {
    if (!report) return;
    const json = JSON.stringify(report.report_data, null, 2);
    navigator.clipboard.writeText(json);
    alert('JSON copied to clipboard!');
  };

  const handleGenerateEmailTemplate = () => {
    if (!report) return;
    const template = generateEmailTemplate(report);
    navigator.clipboard.writeText(template);
    alert('Email template copied to clipboard!');
  };

  const generateEmailTemplate = (report: ExternalReport): string => {
    const score = report.report_data?.overall_score || 0;
    const businessName = report.business_name || 'the business';

    return `Hi [Name],

I ran an AI visibility analysis for ${businessName} and wanted to share the results with you.

Your AI Visibility Score: ${score}/100

Key Findings:
• AI platforms are increasingly important for local business discovery
• ${score >= 70 ? 'Good visibility across major AI platforms' : 'Significant opportunities to improve visibility'}
• ${report.content_gap_analysis ? 'Content gaps identified that competitors are leveraging' : 'Analysis complete'}

I've prepared a detailed report showing exactly how to improve your visibility across ChatGPT, Google's AI, and other AI platforms.

View Full Report: ${report.share_url}

Let me know if you'd like to discuss strategies to improve your AI visibility!

Best,
[Your Name]`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          🎯 AI Report Generator
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Generate AI Visibility reports for any business - prospects, competitors, or clients
        </p>
      </div>

      {/* Main Content */}
      {showForm && !isGenerating ? (
        <div className="max-w-2xl">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <ReportGenerationForm
              onSubmit={handleSubmit}
              onCancel={() => {}}
              isGenerating={isGenerating}
            />
          </div>
        </div>
      ) : isGenerating ? (
        <div className="max-w-2xl">
          <ReportProgressIndicator
            platforms={platformProgress}
            currentPhase={currentPhase}
            errorMessage={error}
          />
          {currentPhase === 'error' && (
            <div className="mt-4">
              <button
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <FileText size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Report Complete!
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {report.business_name || 'Business'} - Generated {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download size={16} />
                  Export PDF
                </button>
                <button
                  onClick={handleCopyShareLink}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Share2 size={16} />
                  Share Link
                </button>
                <button
                  onClick={handleCopyJSON}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Copy size={16} />
                  Copy JSON
                </button>
                <button
                  onClick={handleGenerateEmailTemplate}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Mail size={16} />
                  Email Template
                </button>
              </div>
            </div>
          </div>

          {/* Report Display */}
          {report.report_data && (
            <AIReportDisplay report={report.report_data} />
          )}

          {/* Generate Another */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                setShowForm(true);
                setReport(null);
              }}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              Generate Another Report
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};