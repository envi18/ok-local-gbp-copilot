// src/components/reviews/ReviewHelpers.tsx
// Reusable components and helpers for review management

import { Star } from 'lucide-react';
import React from 'react';

// Star Rating Component
export const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 16 }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={size}
        className={`${
          star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ))}
  </div>
);

// Avatar Generator
export const generateAvatar = (name: string): JSX.Element => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  const colors = [
    'bg-gradient-to-r from-blue-500 to-blue-600',
    'bg-gradient-to-r from-green-500 to-green-600',
    'bg-gradient-to-r from-purple-500 to-purple-600',
    'bg-gradient-to-r from-pink-500 to-pink-600',
    'bg-gradient-to-r from-indigo-500 to-indigo-600'
  ];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;
  
  return (
    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${colors[colorIndex]}`}>
      {initials}
    </div>
  );
};

// Format Time Ago
export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
};

// Get Response Status
export const getResponseStatus = (review: { response_text?: string | null; requires_approval?: boolean }): 'pending' | 'responded' | 'flagged' => {
  if (review.response_text) return 'responded';
  if (review.requires_approval) return 'flagged';
  return 'pending';
};