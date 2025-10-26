// src/components/pages/PublicReportShare.tsx
// FIXED: Added print-specific CSS for perfect PDF generation

import { AlertCircle, Loader } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ExternalReportService } from '../../lib/externalReportService';
import type { ExternalReport } from '../../types/externalReport';
import { EnhancedAIReportDisplay } from '../ui/EnhancedAIReportDisplay';

interface PublicReportShareProps {
  token?: string;
}

export const PublicReportShare: React.FC<PublicReportShareProps> = ({ token: propToken }) => {
  const [report, setReport] = useState<ExternalReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const getTokenFromUrl = (): string | null => {
    const path = window.location.pathname;
    const match = path.match(/\/share\/report\/([^/]+)/);
    return match ? match[1] : null;
  };

  const token = propToken || getTokenFromUrl();

  // Force light theme for both screen and print
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    loadReport();
  }, [token]);

  const loadReport = async () => {
    if (!token) {
      setError('Invalid share link - no token provided');
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await ExternalReportService.getReportByToken(token);

    if (fetchError || !data) {
      setError('Report not found or access denied');
    } else if (data.status !== 'completed') {
      setError('This report is still being generated');
    } else {
      setReport(data);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader size={48} className="text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-4">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h2>
          <p className="text-gray-600">{error || 'This report could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print-Specific CSS */}
      <style>{`
        /* Force light theme for print/PDF */
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Remove all margins and padding from html/body */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* Force light backgrounds */
          body, .bg-gray-50, .bg-gray-100, .bg-gray-800, .bg-gray-900,
          .dark\\:bg-gray-800, .dark\\:bg-gray-900 {
            background: white !important;
            background-color: white !important;
          }

          /* Force light text colors */
          .text-white, .dark\\:text-white, .dark\\:text-gray-100, 
          .dark\\:text-gray-200, .dark\\:text-gray-300 {
            color: #1f2937 !important;
          }

          /* Fix dark mode cards and sections */
          .bg-gray-800, .dark\\:bg-gray-800 {
            background: white !important;
            border: 1px solid #e5e7eb !important;
          }

          .bg-gray-900, .dark\\:bg-gray-900 {
            background: #f9fafb !important;
            border: 1px solid #e5e7eb !important;
          }

          /* Preserve colored backgrounds (badges, scores, etc) */
          .bg-blue-100, .bg-blue-500, .bg-blue-600,
          .bg-green-100, .bg-green-500, .bg-green-600,
          .bg-red-100, .bg-red-500, .bg-red-600,
          .bg-yellow-100, .bg-yellow-500, .bg-yellow-600,
          .bg-purple-100, .bg-purple-500, .bg-purple-600 {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Page break control - prevent breaking inside these elements */
          .report-section,
          .card,
          .bg-white,
          .rounded-lg,
          .border {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Allow breaking between major sections */
          .report-section + .report-section {
            page-break-before: auto !important;
          }

          /* Ensure proper margins for PDF */
          @page {
            margin: 0.5in;
            size: letter;
          }

          /* Main container adjustments */
          .min-h-screen {
            min-height: auto !important;
          }

          /* Remove top padding from container */
          body > div:first-child {
            padding-top: 0 !important;
            margin-top: 0 !important;
          }

          /* Hide loading and error states in print */
          .animate-spin {
            display: none !important;
          }
        }

        /* Screen-specific: ensure light theme is used */
        html.light, html:not(.dark) {
          background: white;
        }

        html.light body, html:not(.dark) body {
          background: #f9fafb;
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <EnhancedAIReportDisplay report={report} />
        </div>
      </div>
    </>
  );
};