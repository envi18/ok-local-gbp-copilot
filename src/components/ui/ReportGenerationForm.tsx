// src/components/ui/ReportGenerationForm.tsx
// Form for generating external AI visibility reports

import { AlertCircle, Plus, X } from 'lucide-react';
import React, { useState } from 'react';
import type { GenerateExternalReportRequest } from '../../types/externalReport';

interface ReportGenerationFormProps {
  onSubmit: (request: GenerateExternalReportRequest) => Promise<void>;
  onCancel: () => void;
  isGenerating: boolean;
}

export const ReportGenerationForm: React.FC<ReportGenerationFormProps> = ({
  onSubmit,
  onCancel,
  isGenerating
}) => {
  const [targetWebsite, setTargetWebsite] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [businessType, setBusinessType] = useState<string>('');
  const [businessLocation, setBusinessLocation] = useState<string>('');
  const [competitorWebsites, setCompetitorWebsites] = useState<string[]>(['']);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Only website URL is required
    if (!targetWebsite.trim()) {
      newErrors.targetWebsite = 'Target website is required';
    } else if (!isValidUrl(targetWebsite)) {
      newErrors.targetWebsite = 'Please enter a valid URL (e.g., example.com)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    // Basic URL validation - accepts with or without protocol
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    return urlPattern.test(url);
  };

  const normalizeUrl = (url: string): string => {
    // Remove protocol and www
    return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Filter out empty competitor URLs
    const validCompetitors = competitorWebsites
      .filter(url => url.trim())
      .map(url => normalizeUrl(url));

    const request: GenerateExternalReportRequest = {
      target_website: normalizeUrl(targetWebsite),
      business_name: businessName.trim() || undefined,
      business_type: businessType.trim() || 'business', // Default fallback
      business_location: businessLocation.trim() || 'Unknown', // Default fallback
      competitor_websites: validCompetitors.length > 0 ? validCompetitors : undefined
    };

    await onSubmit(request);
  };

  const addCompetitorField = () => {
    if (competitorWebsites.length < 5) {
      setCompetitorWebsites([...competitorWebsites, '']);
    }
  };

  const removeCompetitorField = (index: number) => {
    const updated = competitorWebsites.filter((_, i) => i !== index);
    setCompetitorWebsites(updated.length > 0 ? updated : ['']);
  };

  const updateCompetitorField = (index: number, value: string) => {
    const updated = [...competitorWebsites];
    updated[index] = value;
    setCompetitorWebsites(updated);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Target Website */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Target Website URL *
        </label>
        <input
          type="text"
          value={targetWebsite}
          onChange={(e) => setTargetWebsite(e.target.value)}
          placeholder="example.com or https://example.com"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
            errors.targetWebsite ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={isGenerating}
        />
        {errors.targetWebsite && (
          <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
            <AlertCircle size={14} />
            <span>{errors.targetWebsite}</span>
          </div>
        )}
      </div>

      {/* Business Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Business Name
        </label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Optional - will auto-detect if not provided"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          disabled={isGenerating}
        />
      </div>

      {/* Business Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Business Type / Industry
        </label>
        <input
          type="text"
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          placeholder="e.g., restaurant, coffee shop, plumber, landscaping (optional)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          disabled={isGenerating}
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Location (City, State)
        </label>
        <input
          type="text"
          value={businessLocation}
          onChange={(e) => setBusinessLocation(e.target.value)}
          placeholder="e.g., Seattle, WA (optional)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          disabled={isGenerating}
        />
      </div>

      {/* Competitor Websites */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Competitor Websites (optional, up to 5)
          </label>
          {competitorWebsites.length < 5 && (
            <button
              type="button"
              onClick={addCompetitorField}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              disabled={isGenerating}
            >
              <Plus size={16} />
              Add Competitor
            </button>
          )}
        </div>
        <div className="space-y-2">
          {competitorWebsites.map((url, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => updateCompetitorField(index, e.target.value)}
                placeholder="competitor.com"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={isGenerating}
              />
              {competitorWebsites.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCompetitorField(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  disabled={isGenerating}
                >
                  <X size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          disabled={isGenerating}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
    </form>
  );
};