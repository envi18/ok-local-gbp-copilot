// src/components/simulator/AllPostsModal.tsx
// Modal to display all posts when "See all posts" is clicked

import { X } from 'lucide-react';
import React from 'react';
import type { Post } from '../../types/posts';
import { PostCardSimulator } from './PostCardSimulator';

interface AllPostsModalProps {
  posts: Post[];
  isOpen: boolean;
  onClose: () => void;
}

export const AllPostsModal: React.FC<AllPostsModalProps> = ({ posts, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="flex items-center justify-center min-h-screen px-4 py-6">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                All Posts ({posts.length})
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Posts list - scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No posts yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map(post => (
                    <PostCardSimulator key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};