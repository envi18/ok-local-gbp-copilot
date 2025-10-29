// src/components/pages/SettingsBugReports.tsx
// Main page for bug tracking system - Admin only

import { Bug, Plus } from 'lucide-react';
import React, { useState } from 'react';
import BugReportForm from '../bug-reports/BugReportForm';
import BugReportList from '../bug-reports/BugReportList';
import { Button } from '../ui/Button';

export const SettingsBugReports: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleFormSuccess = () => {
    // Refresh the bug list
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent flex items-center gap-3">
            <Bug size={32} className="text-[#f45a4e]" />
            Bug Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and manage platform issues and feature requests
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsFormOpen(true)}
        >
          <Plus size={16} className="mr-2" />
          Report Bug
        </Button>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          📋 How to Report Bugs
        </h3>
        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <p>
            <strong>For QA Testing:</strong> As you test features, click "Report Bug" to document any issues you find.
            Be as detailed as possible - include what happened, what should happen, and steps to reproduce.
          </p>
          <p>
            <strong>For Production Issues:</strong> If customers report problems, create a bug report with their
            description and any error messages they shared.
          </p>
        </div>
      </div>

      {/* Bug List */}
      <BugReportList
        refreshTrigger={refreshTrigger}
      />

      {/* Bug Report Form Modal */}
      <BugReportForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default SettingsBugReports;