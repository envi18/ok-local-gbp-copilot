// src/components/simulator/BusinessHeader.tsx
// Google-style business header with name, rating, and close button

import { Star, X } from 'lucide-react';
import React from 'react';

interface BusinessHeaderProps {
  name: string;
  rating: number;
  totalReviews: number;
  priceRange?: string;
  category?: string;
  onClose: () => void;
}

export const BusinessHeader: React.FC<BusinessHeaderProps> = ({
  name,
  rating,
  totalReviews,
  priceRange = '$10-20',
  category = 'Coffee shop',
  onClose
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-normal text-gray-900 mb-2">{name}</h1>
          
          <div className="flex items-center gap-2 text-sm text-gray-700">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <span className="font-medium">{rating.toFixed(1)}</span>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={`${
                      star <= Math.round(rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-blue-600">({totalReviews})</span>
            </div>

            {/* Separator */}
            <span className="text-gray-400">·</span>

            {/* Price Range */}
            <span>{priceRange}</span>

            {/* Separator */}
            <span className="text-gray-400">·</span>

            {/* Category */}
            <span>{category}</span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <X size={24} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
};