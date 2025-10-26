// src/components/pages/AIReportHistory.tsx
// Page for viewing all generated external reports
// PHASE 3: Fixed Preview, Export PDF, and Copy JSON functionality
// FIXED: All stats field names corrected to match ExternalReportStats interface

import { CheckCircle, Clock, DollarSign, FileText, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ExternalReportService } from '../../lib/externalReportService';
import { supabase } from '../../lib/supabase';
import type { ExternalReportFilters, ExternalReportStats, ExternalReportSummary } from '../../types/externalReport';
import { ReportHistoryTable } from '../ui/ReportHistoryTable';

export const AIReportHistory: React.FC = () => {
  const [reports, setReports] = useState<ExternalReportSummary[]>([]);
  const [stats, setStats] = useState<ExternalReportStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo] = useState<string>('');

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadReports();
      loadStats();
    }
  }, [userId, searchQuery, statusFilter, dateFrom, dateTo]);

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      setUserId(data.user.id);
    }
  };

  const loadReports = async () => {
    setLoading(true);

    const filters: ExternalReportFilters = {};

    if (searchQuery) {
      filters.search = searchQuery;
    }

    if (statusFilter && statusFilter !== 'all') {
      filters.status = statusFilter as any;
    }

    if (dateFrom) {
      filters.date_from = dateFrom;
    }

    if (dateTo) {
      filters.date_to = dateTo;
    }

    const { data, error } = await ExternalReportService.getAllReports(filters);

    if (error) {
      console.error('Error loading reports:', error);
    } else {
      setReports(data || []);
    }

    setLoading(false);
  };

  const loadStats = async () => {
    const { data } = await ExternalReportService.getReportStats();
    setStats(data);
  };

  // PHASE 3 FIX #1: Preview Report - Open the share URL
  const handlePreview = (reportId: string) => {
    // Find the report to get its share URL
    const report = reports.find(r => r.id === reportId);
    
    if (report && report.share_url) {
      // Open the working share URL in a new tab
      window.open(report.share_url, '_blank');
    } else {
      // Fallback: construct the share URL from share_token
      const shareToken = report?.share_token;
      if (shareToken) {
        window.open(`/share/${shareToken}`, '_blank');
      } else {
        showNotification('Report share link not available', 'error');
      }
    }
  };

  // PHASE 3 FIX #2: Export PDF - Generate PDF from report
  const handleExportPDF = async (reportId: string) => {
    try {
      showNotification('Preparing PDF export...', 'info');
      
      // Get the full report data
      const { data: reportData, error } = await ExternalReportService.getReportById(reportId);
      
      if (error || !reportData) {
        showNotification('Failed to load report data', 'error');
        return;
      }

      // Use html2pdf for client-side PDF generation
      // First, check if html2pdf is available
      if (typeof window !== 'undefined' && (window as any).html2pdf) {
        const html2pdf = (window as any).html2pdf;
        
        // Open the share URL in a hidden iframe to get the rendered content
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = reportData.share_url || `/share/${reportData.share_token}`;
        document.body.appendChild(iframe);
        
        // Wait for iframe to load
        iframe.onload = () => {
          setTimeout(() => {
            const content = iframe.contentDocument?.body;
            if (content) {
              const opt = {
                margin: 0.5,
                filename: `AI-Visibility-Report-${reportData.business_name || reportData.target_website}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
              };
              
              html2pdf().set(opt).from(content).save().then(() => {
                showNotification('PDF exported successfully!', 'success');
                document.body.removeChild(iframe);
              });
            } else {
              showNotification('Failed to generate PDF', 'error');
              document.body.removeChild(iframe);
            }
          }, 2000); // Wait 2 seconds for content to fully load
        };
      } else {
        // Fallback: Open print dialog
        const report = reports.find(r => r.id === reportId);
        if (report && report.share_url) {
          window.open(report.share_url + '?print=true', '_blank');
          showNotification('Opening report for printing...', 'info');
        }
      }
    } catch (err) {
      console.error('PDF export error:', err);
      showNotification('PDF export failed', 'error');
    }
  };

  // PHASE 3: Enhanced notification system (better than alerts)
  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    // Create a toast notification element
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
    
    toast.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.add('animate-fade-out');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  const handleCopyShareLink = (shareUrl: string) => {
    navigator.clipboard.writeText(shareUrl);
    showNotification('Share link copied to clipboard!', 'success');
  };

  // PHASE 3 FIX #3: Copy JSON - Ensure complete report data is copied
  const handleCopyJSON = async (reportId: string) => {
    try {
      const { data, error } = await ExternalReportService.getReportById(reportId);
      
      if (error) {
        showNotification('Failed to load report data', 'error');
        return;
      }
      
      if (data) {
        // Create a comprehensive JSON export with all report data
        const completeReportData = {
          // Basic Info
          id: data.id,
          target_website: data.target_website,
          business_name: data.business_name,
          business_type: data.business_type,
          business_location: data.business_location,
          
          // Scores and Status
          overall_score: data.overall_score,
          status: data.status,
          
          // Complete Report Data
          report_data: data.report_data,
          
          // AI Platform Scores (Full detail)
          ai_platform_scores: data.ai_platform_scores,
          
          // Competitor Analysis
          competitor_analysis: data.competitor_analysis,
          
          // Content Gap Analysis
          content_gap_analysis: data.content_gap_analysis,
          
          // Recommendations
          recommendations: data.recommendations,
          
          // Metadata
          share_url: data.share_url,
          share_token: data.share_token,
          generated_at: data.generated_at,
          generated_by: data.generated_by,
          processing_time_ms: data.processing_time_ms,
          estimated_cost_usd: data.estimated_cost_usd
        };
        
        const json = JSON.stringify(completeReportData, null, 2);
        await navigator.clipboard.writeText(json);
        showNotification('Complete report data copied as JSON!', 'success');
      } else {
        showNotification('No report data available', 'error');
      }
    } catch (err) {
      console.error('Copy JSON error:', err);
      showNotification('Failed to copy JSON data', 'error');
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    const { error } = await ExternalReportService.deleteReport(reportId, userId);

    if (error) {
      showNotification('Error deleting report: ' + error.message, 'error');
    } else {
      showNotification('Report deleted successfully', 'success');
      loadReports();
      loadStats();
    }
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          📊 Report History
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          All AI Visibility reports generated by your team
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Reports</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.completed}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock size={20} className="text-yellow-600 dark:text-yellow-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.pending}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <DollarSign size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Cost</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(stats.total_cost_usd || 0)}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by website or business name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="generating">Generating</option>
              <option value="pending">Pending</option>
              <option value="error">Error</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">Loading reports...</p>
        </div>
      ) : (
        <ReportHistoryTable
          reports={reports}
          onPreview={handlePreview}
          onExportPDF={handleExportPDF}
          onCopyShareLink={handleCopyShareLink}
          onCopyJSON={handleCopyJSON}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};