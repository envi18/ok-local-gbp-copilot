// src/components/reviews/ManualResponseSection.tsx
// Section for writing manual responses (1-star or rejected reviews)

import {
  AlertTriangle,
  CheckCircle,
  Edit3,
  Loader,
  Sparkles
} from 'lucide-react';
import React, { useState } from 'react';
import type { DatabaseReview } from '../../types/database';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { formatTimeAgo, generateAvatar, StarRating } from './ReviewHelpers';

interface ManualResponseSectionProps {
  reviews: DatabaseReview[];
  onPublish: (review: DatabaseReview, responseText: string) => Promise<void>;
  savingReviewId: string | null;
}

export const ManualResponseSection: React.FC<ManualResponseSectionProps> = ({
  reviews,
  onPublish,
  savingReviewId
}) => {
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<string>('');

  if (reviews.length === 0) return null;

  return (
    <Card className="border-2 border-red-500 dark:border-red-600">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-6 border-b border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-500 rounded-lg">
            <AlertTriangle size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Manual Response Required
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {reviews.length} review{reviews.length !== 1 ? 's' : ''} requiring personalized attention
            </p>
          </div>
        </div>
      </div>

      {/* Review Cards */}
      <div className="p-6 space-y-6">
        {reviews.map((review) => {
          const isEditing = editingReviewId === review.id;
          const isSaving = savingReviewId === review.id;

          return (
            <div
              key={review.id}
              className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6 space-y-4"
            >
              {/* Original Review */}
              <div className="flex items-start gap-4">
                {generateAvatar(review.customer_name || 'Anonymous')}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {review.customer_name || 'Anonymous'}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={review.rating} />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatTimeAgo(review.review_date)}
                        </span>
                      </div>
                    </div>
                    <Badge variant="error" size="sm">
                      {review.rating} ⭐
                    </Badge>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {review.review_text}
                  </p>
                  
                  {/* Sentiment Badge */}
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="error" size="sm">
                      {review.sentiment === 'negative' ? '😔 Negative' : '😐 Neutral'}
                    </Badge>
                    {review.approval_status === 'rejected' && (
                      <Badge variant="warning" size="sm">
                        AI Response Rejected
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Manual Response Editor */}
              <div className="bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Edit3 size={16} className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Write Your Response
                  </span>
                </div>
                
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      className="w-full p-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                      placeholder="Write a thoughtful, personalized response to address their concerns..."
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {responseText.length} characters
                      </span>
                      {review.ai_generated_response && (
                        <button
                          onClick={() => setResponseText(review.ai_generated_response || '')}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <Sparkles size={12} />
                          Use AI suggestion as starting point
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingReviewId(review.id);
                      setResponseText('');
                    }}
                    className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Edit3 size={20} className="mx-auto mb-2" />
                    <p className="text-sm font-medium">Click to write a manual response</p>
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    variant="primary"
                    onClick={() => onPublish(review, responseText)}
                    disabled={isSaving || !responseText.trim()}
                  >
                    {isSaving ? (
                      <>
                        <Loader size={16} className="mr-2 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} className="mr-2" />
                        Publish Response
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingReviewId(null);
                      setResponseText('');
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};