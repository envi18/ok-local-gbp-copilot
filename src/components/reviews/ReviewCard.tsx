// src/components/reviews/ReviewCard.tsx
// Individual review card for the main reviews list

import { MoreVertical, Reply } from 'lucide-react';
import React from 'react';
import type { DatabaseReview } from '../../types/database';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { formatTimeAgo, generateAvatar, StarRating } from './ReviewHelpers';

interface ReviewCardProps {
  review: DatabaseReview;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <Card hover={true} className="group">
      <div className="flex items-start gap-4 p-4">
        {generateAvatar(review.customer_name || 'Anonymous')}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
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
            
            <div className="flex items-center gap-2">
              {/* Platform Badge */}
              {review.source === 'google' && <Badge variant="info" size="sm">Google</Badge>}
              {review.source === 'facebook' && <Badge variant="gradient" size="sm">Facebook</Badge>}
              {review.source === 'yelp' && <Badge variant="warning" size="sm">Yelp</Badge>}
              {!review.source && <Badge variant="info" size="sm">Google</Badge>}
              
              <Button variant="ghost" size="sm">
                <MoreVertical size={16} />
              </Button>
            </div>
          </div>

          {review.review_text && (
            <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
              {review.review_text}
            </p>
          )}

          <div className="flex items-center gap-3 mb-3">
            {/* Sentiment Badge */}
            {review.sentiment === 'positive' && <Badge variant="success" size="sm">😊 Positive</Badge>}
            {review.sentiment === 'neutral' && <Badge variant="info" size="sm">😐 Neutral</Badge>}
            {review.sentiment === 'negative' && <Badge variant="error" size="sm">😔 Negative</Badge>}
            
            {/* Response Status Badge */}
            {review.response_text ? (
              <Badge variant="success" size="sm">✅ Responded</Badge>
            ) : review.requires_approval ? (
              <Badge variant="warning" size="sm">⏳ Pending</Badge>
            ) : (
              <Badge variant="info" size="sm">🔔 New</Badge>
            )}
          </div>

          {/* Published Response */}
          {review.response_text && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded-r-lg">
              <div className="flex items-center gap-2 mb-2">
                <Reply size={14} className="text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-900 dark:text-blue-100">
                  Your Response
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                  {review.response_date ? formatTimeAgo(review.response_date) : ''}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {review.response_text}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};