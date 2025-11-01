// src/components/posts/PostForm.tsx
// Create/Edit post modal form
// FIXED: Timezone handling for datetime-local input (including min attribute)

import { Calendar, FileText, Globe, Type, X } from 'lucide-react';
import React, { useState } from 'react';
import type { Post, PostPlatform, PostType } from '../../types/posts';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface PostFormProps {
  post?: Post;
  locationId: string;
  onSave: (data: PostFormData) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export interface PostFormData {
  title: string;
  content: string;
  post_type?: PostType;
  platform?: PostPlatform;
  scheduled_for?: string;
  status: 'draft' | 'scheduled' | 'published'; // Note: 'failed' excluded - not user-selectable
}

export const PostForm: React.FC<PostFormProps> = ({
  post,
  locationId,
  onSave,
  onCancel,
  saving = false
}) => {
  const isEditing = !!post;

  /**
   * TIMEZONE FIX: Convert ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
   * This preserves the user's selected local time without timezone conversion
   */
  const formatDateTimeLocal = (isoString: string | null | undefined): string => {
    if (!isoString) return '';
    
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  /**
   * TIMEZONE FIX: Get current local datetime for min attribute
   * Returns current time in datetime-local format
   */
  const getCurrentDateTimeLocal = (): string => {
    return formatDateTimeLocal(new Date().toISOString());
  };

  // Form state - convert 'failed' status to 'draft' for editing
  const [formData, setFormData] = useState<PostFormData>({
    title: post?.title || '',
    content: post?.content || '',
    post_type: post?.post_type,
    platform: post?.platform,
    scheduled_for: post?.scheduled_for,
    status: post?.status === 'failed' ? 'draft' : (post?.status || 'draft')
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length > 1500) {
      newErrors.content = 'Content must be 1500 characters or less';
    }

    if (formData.status === 'scheduled' && !formData.scheduled_for) {
      newErrors.scheduled_for = 'Schedule date/time is required for scheduled posts';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    await onSave(formData);
  };

  // Handle field changes
  const handleChange = (
    field: keyof PostFormData,
    value: string | undefined
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * TIMEZONE FIX: Handle datetime-local input changes
   * Converts local datetime to ISO string without timezone shift
   */
  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value; // Format: "YYYY-MM-DDTHH:mm" (local time)
    
    if (!value) {
      handleChange('scheduled_for', undefined);
      return;
    }
    
    // Convert local datetime to ISO string
    // The Date constructor interprets this as local time
    const date = new Date(value);
    const isoString = date.toISOString();
    
    // Debug logging (can be removed in production)
    console.log('🕐 User selected (local):', value);
    console.log('🕐 Converted to ISO:', isoString);
    console.log('🕐 ISO back to local:', formatDateTimeLocal(isoString));
    
    handleChange('scheduled_for', isoString);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Post' : 'Create New Post'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              disabled={saving}
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Type size={16} className="inline mr-2" />
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className={`w-full px-4 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border ${
                  errors.title ? 'border-red-500' : 'border-white/30 dark:border-white/20'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent`}
                placeholder="Enter post title..."
                disabled={saving}
                maxLength={100}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formData.title.length}/100 characters
              </p>
            </div>

            {/* Content */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText size={16} className="inline mr-2" />
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                rows={6}
                className={`w-full px-4 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border ${
                  errors.content ? 'border-red-500' : 'border-white/30 dark:border-white/20'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent resize-none`}
                placeholder="Write your post content..."
                disabled={saving}
                maxLength={1500}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.content}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formData.content.length}/1500 characters
              </p>
            </div>

            {/* Post Type & Platform */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Post Type
                </label>
                <select
                  value={formData.post_type || ''}
                  onChange={(e) => handleChange('post_type', e.target.value || undefined)}
                  className="w-full px-4 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
                  disabled={saving}
                >
                  <option value="">Select type...</option>
                  <option value="update">Update</option>
                  <option value="event">Event</option>
                  <option value="offer">Offer</option>
                  <option value="product">Product</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Globe size={16} className="inline mr-2" />
                  Platform
                </label>
                <select
                  value={formData.platform || ''}
                  onChange={(e) => handleChange('platform', e.target.value || undefined)}
                  className="w-full px-4 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
                  disabled={saving}
                >
                  <option value="">Select platform...</option>
                  <option value="google">Google</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="twitter">Twitter</option>
                </select>
              </div>
            </div>

            {/* Status & Scheduling */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Publishing
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/30 rounded-lg cursor-pointer hover:bg-white/70 dark:hover:bg-black/40 transition-colors">
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={formData.status === 'draft'}
                    onChange={(e) => handleChange('status', e.target.value as any)}
                    className="w-4 h-4 text-[#f45a4e]"
                    disabled={saving}
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Save as Draft</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Save without publishing</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/30 rounded-lg cursor-pointer hover:bg-white/70 dark:hover:bg-black/40 transition-colors">
                  <input
                    type="radio"
                    name="status"
                    value="scheduled"
                    checked={formData.status === 'scheduled'}
                    onChange={(e) => handleChange('status', e.target.value as any)}
                    className="w-4 h-4 text-[#f45a4e]"
                    disabled={saving}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Schedule for Later</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Choose a date and time</div>
                  </div>
                </label>

                {/* TIMEZONE FIX: Updated datetime-local input with proper conversion AND min attribute */}
                {formData.status === 'scheduled' && (
                  <div className="ml-7 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar size={16} className="inline mr-2" />
                      Schedule Date/Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduled_for ? formatDateTimeLocal(formData.scheduled_for) : ''}
                      onChange={handleDateTimeChange}
                      min={getCurrentDateTimeLocal()}
                      className={`w-full px-4 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border ${
                        errors.scheduled_for ? 'border-red-500' : 'border-white/30 dark:border-white/20'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent`}
                      disabled={saving}
                    />
                    {errors.scheduled_for && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.scheduled_for}</p>
                    )}
                  </div>
                )}

                {!isEditing && (
                  <label className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/30 rounded-lg cursor-pointer hover:bg-white/70 dark:hover:bg-black/40 transition-colors">
                    <input
                      type="radio"
                      name="status"
                      value="published"
                      checked={formData.status === 'published'}
                      onChange={(e) => handleChange('status', e.target.value as any)}
                      className="w-4 h-4 text-[#f45a4e]"
                      disabled={saving}
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Publish Immediately</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Post will go live now</div>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : isEditing ? 'Update Post' : 'Create Post'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};