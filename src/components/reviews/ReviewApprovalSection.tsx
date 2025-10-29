// src/components/reviews/ReviewApprovalSection.tsx
// Section for approving AI-generated responses (2-3 star reviews)

import {
  CheckCircle,
  Edit3,
  Loader,
  Save,
  Sparkles,
  ThumbsDown
} from 'lucide-react';
import React, { useState } from 'react';
import type { DatabaseReview } from '../../types/database';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { formatTimeAgo, generateAvatar, StarRating } from './ReviewHelpers';

interface ReviewApprovalSectionProps {
  reviews: DatabaseReview[];
  onApprove: (review: DatabaseReview, editedText?: string) => Promise<void>;
  onReject: (review: DatabaseReview) => Promise<void>;
  savingReviewId: string | null;
}

export const ReviewApprovalSection: React.FC<ReviewApprovalSectionProps> = ({
  reviews,
  onApprove,
  onReject,
  savingReviewId
}) => {
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>('');

  if (reviews.length === 0) return null;

  return (
    <Card className="border-2 border-yellow-500 dark:border-yellow-600">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 border-b border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-yellow-500 rounded-lg">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              AI Responses Ready for Review
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {reviews.length} review{reviews.length !== 1 ? 's' : ''} with AI-generated responses waiting for your approval
            </p>
          </div>
        </div>
      </div>

      {/* Review Cards */}
      <div className="p-6 space-y-6">
        {reviews.map((review) => {
          const isEditing = editingReviewId === review.id;
          const isSaving = savingReviewId === review.id;
          const displayText = isEditing ? editedText : review.ai_generated_response;

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
                    <Badge variant="warning" size="sm">
                      {review.rating} ⭐
                    </Badge>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {review.review_text}
                  </p>
                </div>
              </div>

              {/* AI Generated Response */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    AI-Generated Response
                  </span>
                  {!isEditing && (
                    <button
                      onClick={() => {
                        setEditingReviewId(review.id);
                        setEditedText(review.ai_generated_response || '');
                      }}
                      className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Edit3 size={14} />
                      Edit before approving
                    </button>
                  )}
                </div>
                
                {isEditing ? (
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full p-3 border-2 border-blue-300 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Edit the AI response..."
                  />
                ) : (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {displayText}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => onApprove(review, editedText)}
                      disabled={isSaving || !editedText.trim()}
                    >
                      {isSaving ? (
                        <>
                          <Loader size={16} className="mr-2 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Save & Publish
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditingReviewId(null);
                        setEditedText('');
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => onApprove(review)}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader size={16} className="mr-2 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} className="mr-2" />
                          Approve & Publish
                        </>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => onReject(review)}
                      disabled={isSaving}
                    >
                      <ThumbsDown size={16} className="mr-2" />
                      Reject & Flag for Manual
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};