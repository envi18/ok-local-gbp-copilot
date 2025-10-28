// src/components/simulator/ReviewCard.tsx
// Google-style individual review card with sync status

import { CheckCircle, Clock, Star } from 'lucide-react';
import React from 'react';

interface ReviewReply {
  comment: string;
  updateTime: string;
}

interface Reviewer {
  displayName: string;
  profilePhotoUrl?: string;
}

export interface Review {
  reviewId: string;
  reviewer: Reviewer;
  starRating: number;
  comment?: string;
  createTime: string;
  reviewReply?: ReviewReply;
}

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  return (
    <div className="border-b border-gray-200 last:border-b-0 py-4">
      {/* Reviewer info */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
          {review.reviewer.profilePhotoUrl ? (
            <img
              src={review.reviewer.profilePhotoUrl}
              alt={review.reviewer.displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            review.reviewer.displayName.charAt(0).toUpperCase()
          )}
        </div>

        {/* Reviewer details */}
        <div className="flex-1">
          <div className="font-medium text-gray-900 text-sm">
            {review.reviewer.displayName}
          </div>
          
          {/* Rating and date */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  className={`${
                    star <= review.starRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-gray-200 text-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              {formatDate(review.createTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Review text */}
      {review.comment && (
        <div className="text-sm text-gray-700 leading-relaxed mb-3 ml-[52px]">
          {review.comment}
        </div>
      )}

      {/* Owner response or pending status */}
      <div className="ml-[52px]">
        {review.reviewReply ? (
          <div className="mt-3 pl-4 border-l-2 border-green-500 bg-green-50 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={14} className="text-green-600" />
              <span className="font-medium text-xs text-gray-900">
                Response from the owner
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(review.reviewReply.updateTime)}
              </span>
            </div>
            <p className="text-sm text-gray-700">{review.reviewReply.comment}</p>
          </div>
        ) : (
          <div className="mt-3 pl-4 border-l-2 border-yellow-500 bg-yellow-50 rounded p-3">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-yellow-600" />
              <span className="font-medium text-xs text-gray-900">
                Awaiting automated response...
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              This review will be processed during the next background sync
            </p>
          </div>
        )}
      </div>
    </div>
  );
};