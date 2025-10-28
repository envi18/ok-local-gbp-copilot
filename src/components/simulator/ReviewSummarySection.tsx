// src/components/simulator/ReviewSummarySection.tsx
// Google-style review summary with highlighted quotes

import { Info, Star } from 'lucide-react';
import React from 'react';

interface ReviewSummary {
  quote: string;
  author: string;
  avatarUrl?: string;
}

interface ReviewSummarySectionProps {
  summaries: ReviewSummary[];
}

export const ReviewSummarySection: React.FC<ReviewSummarySectionProps> = ({ summaries }) => {
  if (summaries.length === 0) return null;

  return (
    <div className="bg-white rounded-lg p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-medium text-gray-900">Review summary</h3>
        <Info size={16} className="text-gray-400" />
      </div>

      <div className="space-y-4">
        {summaries.map((summary, index) => (
          <div key={index} className="flex items-start gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
              {summary.avatarUrl ? (
                <img
                  src={summary.avatarUrl}
                  alt={summary.author}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                summary.author.charAt(0).toUpperCase()
              )}
            </div>

            {/* Quote */}
            <div className="flex-1">
              <p className="text-sm text-gray-700 leading-relaxed">
                {summary.quote}
              </p>
              
              {/* Star rating */}
              <div className="flex items-center mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    className="fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View more reviews link */}
      <button className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium">
        <span>→</span>
        <span>More Google reviews</span>
      </button>
    </div>
  );
};