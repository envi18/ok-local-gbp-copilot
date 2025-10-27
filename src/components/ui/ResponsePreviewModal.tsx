// src/components/ui/ResponsePreviewModal.tsx
// Modal for previewing and approving AI-drafted review responses

import { AlertCircle, Check, Edit2, RefreshCw, X } from 'lucide-react';
import React, { useState } from 'react';

interface ResponsePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (finalResponse: string) => void;
  reviewText: string;
  reviewerName: string;
  starRating: number;
  draftedResponse: string;
  seoKeywords?: string[];
}

export const ResponsePreviewModal: React.FC<ResponsePreviewModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  reviewText,
  reviewerName,
  starRating,
  draftedResponse,
  seoKeywords = []
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedResponse, setEditedResponse] = useState<string>(draftedResponse);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleApprove = () => {
    onApprove(isEditing ? editedResponse : draftedResponse);
    setIsEditing(false);
    setEditedResponse(draftedResponse);
    onClose();
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    // In production, this would call the AI service again
    // For now, just simulate delay
    setTimeout(() => {
      setEditedResponse(draftedResponse + ' (Regenerated)');
      setIsRegenerating(false);
    }, 2000);
  };

  const highlightKeywords = (text: string) => {
    if (seoKeywords.length === 0) return text;
    
    let highlighted = text;
    seoKeywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900/40">$1</mark>');
    });
    
    return highlighted;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Review Response Draft
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              AI-generated response for {starRating}-star review
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
            <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">Draft Response Generated</p>
              <p>
                This response was automatically drafted using AI and includes SEO-optimized keywords. 
                Review, edit if needed, and approve to publish.
              </p>
            </div>
          </div>

          {/* Original Review */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Original {starRating}-star Review by {reviewerName}:
            </p>
            <p className="text-gray-900 dark:text-white italic">
              "{reviewText}"
            </p>
          </div>

          {/* Drafted Response */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                AI-Generated Response
                {seoKeywords.length > 0 && (
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                    (SEO keywords highlighted)
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Edit2 size={14} />
                  {isEditing ? 'Preview' : 'Edit'}
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isRegenerating ? 'animate-spin' : ''} />
                  Regenerate
                </button>
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={editedResponse}
                onChange={(e) => setEditedResponse(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            ) : (
              <div 
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                dangerouslySetInnerHTML={{ 
                  __html: highlightKeywords(isEditing ? editedResponse : draftedResponse) 
                }}
              />
            )}

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{(isEditing ? editedResponse : draftedResponse).length} characters</span>
              {seoKeywords.length > 0 && (
                <span>{seoKeywords.length} SEO keywords included</span>
              )}
            </div>
          </div>

          {/* SEO Keywords List */}
          {seoKeywords.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SEO Keywords Included:
              </p>
              <div className="flex flex-wrap gap-2">
                {seoKeywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs rounded"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
            >
              <Check size={18} />
              Approve & Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};