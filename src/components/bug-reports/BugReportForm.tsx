// src/components/bug-reports/BugReportForm.tsx
// Modal form for submitting bug reports

import { AlertCircle, Loader, Plus, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import BugReportService, { type BugPriority, type BugReportStep } from '../../lib/bugReportService';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';

interface BugReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PAGE_FEATURES = [
  'Dashboard',
  'Locations',
  'Reviews',
  'Posts',
  'Media',
  'GBP Simulator',
  'Automations',
  'Reports',
  'Settings - General',
  'Settings - Users',
  'Settings - Customers',
  'Settings - Products',
  'Settings - Bug Reports',
  'Command Center',
  'Other'
];

export const BugReportForm: React.FC<BugReportFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  // Form state
  const [title, setTitle] = useState<string>('');
  const [priority, setPriority] = useState<BugPriority>('medium');
  const [pageFeature, setPageFeature] = useState<string>('');
  const [currentBehavior, setCurrentBehavior] = useState<string>('');
  const [expectedBehavior, setExpectedBehavior] = useState<string>('');
  const [steps, setSteps] = useState<BugReportStep[]>([
    { step: 1, description: '' }
  ]);
  const [consoleErrors, setConsoleErrors] = useState<string>('');
  const [railwayLogs, setRailwayLogs] = useState<string>('');
  const [userAccountTested, setUserAccountTested] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');

  // Auto-capture browser info and current page on mount
  useEffect(() => {
    if (isOpen) {
      const detectedPage = BugReportService.getCurrentPageFeature();
      if (detectedPage !== 'Unknown Page') {
        setPageFeature(detectedPage);
      }
    }
  }, [isOpen]);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  const handleAddStep = () => {
    const newStep = {
      step: steps.length + 1,
      description: ''
    };
    setSteps([...steps, newStep]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== index);
      // Renumber remaining steps
      const renumbered = newSteps.map((step, i) => ({
        ...step,
        step: i + 1
      }));
      setSteps(renumbered);
    }
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index].description = value;
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Bug title is required');
      return;
    }

    if (!pageFeature) {
      setError('Page/Feature is required');
      return;
    }

    if (!currentBehavior.trim()) {
      setError('Current behavior description is required');
      return;
    }

    if (!expectedBehavior.trim()) {
      setError('Expected behavior description is required');
      return;
    }

    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);

    try {
      // Filter out empty steps
      const validSteps = steps.filter(s => s.description.trim() !== '');

      const bugReport = await BugReportService.createBugReport({
        title: title.trim(),
        priority,
        page_feature: pageFeature,
        current_behavior: currentBehavior.trim(),
        expected_behavior: expectedBehavior.trim(),
        steps_to_reproduce: validSteps,
        console_errors: consoleErrors.trim() || undefined,
        railway_logs: railwayLogs.trim() || undefined,
        browser_info: BugReportService.captureBrowserInfo(),
        user_account_tested: userAccountTested.trim() || undefined,
        notes: notes.trim() || undefined,
        reported_by: userId
      });

      if (bugReport) {
        console.log('✅ Bug report submitted:', bugReport.id);
        
        // Reset form
        handleReset();
        
        // Close modal
        onClose();
        
        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError('Failed to submit bug report. Please try again.');
      }
    } catch (err: any) {
      console.error('Error submitting bug report:', err);
      setError(err.message || 'An error occurred while submitting the bug report');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setPriority('medium');
    setPageFeature('');
    setCurrentBehavior('');
    setExpectedBehavior('');
    setSteps([{ step: 1, description: '' }]);
    setConsoleErrors('');
    setRailwayLogs('');
    setUserAccountTested('');
    setNotes('');
    setError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                🐛 Report a Bug
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Error Alert */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle size={20} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 dark:text-red-200">
                      {error}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Bug Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bug Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of the issue"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* Priority and Page/Feature */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as BugPriority)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="critical">🔴 Critical - System Broken</option>
                    <option value="high">🟠 High - Major Feature Broken</option>
                    <option value="medium">🟡 Medium - Has Workaround</option>
                    <option value="low">🟢 Low - Minor Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Page/Feature <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={pageFeature}
                    onChange={(e) => setPageFeature(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select page/feature...</option>
                    {PAGE_FEATURES.map(feature => (
                      <option key={feature} value={feature}>{feature}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Current Behavior */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What's Happening (Current Behavior) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={currentBehavior}
                  onChange={(e) => setCurrentBehavior(e.target.value)}
                  placeholder="Describe what's actually happening..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  required
                />
              </div>

              {/* Expected Behavior */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What Should Happen (Expected Behavior) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  placeholder="Describe what should happen instead..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  required
                />
              </div>

              {/* Steps to Reproduce */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Steps to Reproduce
                </label>
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="flex-shrink-0 w-8 h-10 flex items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400">
                        {step.step}.
                      </span>
                      <input
                        type="text"
                        value={step.description}
                        onChange={(e) => handleStepChange(index, e.target.value)}
                        placeholder={`Step ${step.step}`}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      {steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(index)}
                          className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#f45a4e] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Plus size={16} />
                    Add Step
                  </button>
                </div>
              </div>

              {/* Console Errors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Console Errors (optional)
                </label>
                <textarea
                  value={consoleErrors}
                  onChange={(e) => setConsoleErrors(e.target.value)}
                  placeholder="Paste any red errors from browser console (F12)..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-none"
                />
              </div>

              {/* Railway Logs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Railway Logs (optional)
                </label>
                <textarea
                  value={railwayLogs}
                  onChange={(e) => setRailwayLogs(e.target.value)}
                  placeholder="Paste any relevant Railway error logs..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-none"
                />
              </div>

              {/* User Account Tested */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User Account Tested (optional)
                </label>
                <input
                  type="text"
                  value={userAccountTested}
                  onChange={(e) => setUserAccountTested(e.target.value)}
                  placeholder="e.g., sarah@downtowncoffee.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any other relevant information..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>

              {/* Auto-captured Info Note */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  ℹ️ Browser information will be automatically captured when you submit this report.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader size={16} className="mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Bug Report'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default BugReportForm;