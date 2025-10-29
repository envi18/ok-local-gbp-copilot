// src/components/pages/Reviews.tsx
// Main Reviews page - modular architecture

import {
  AlertCircle,
  AlertTriangle,
  Loader,
  MessageSquare,
  Reply,
  Search,
  ThumbsUp
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { GBPSimulatorDatabaseService } from '../../lib/gbpSimulatorDatabaseService';
import type { DatabaseReview } from '../../types/database';
import { SARAH_THOMPSON_ACCOUNT } from '../../types/database';
import { ManualResponseSection } from '../reviews/ManualResponseSection';
import { ReviewApprovalSection } from '../reviews/ReviewApprovalSection';
import { ReviewCard } from '../reviews/ReviewCard';
import { getResponseStatus } from '../reviews/ReviewHelpers';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const Reviews: React.FC = () => {
  // State
  const [reviews, setReviews] = useState<DatabaseReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'responded' | 'pending' | 'flagged'>('all');
  const [selectedRating, setSelectedRating] = useState<number | 'all'>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'google' | 'facebook' | 'yelp'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Action states
  const [savingReviewId, setSavingReviewId] = useState<string | null>(null);
  
  // Notification state
  const [notifications, setNotifications] = useState<Array<{
    type: 'success' | 'error' | 'info';
    message: string;
  }>>([]);

  // Load reviews on mount
  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const locationId = SARAH_THOMPSON_ACCOUNT.locationId;
      const data = await GBPSimulatorDatabaseService.getReviewsByLocation(locationId);
      
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setError('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add notification
  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const newNotification = { type, message };
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== newNotification));
    }, 5000);
  };

  // APPROVAL HANDLER: Approve AI-generated response
  const handleApproveResponse = async (review: DatabaseReview, editedText?: string) => {
    try {
      setSavingReviewId(review.id);
      
      const responseText = editedText || review.ai_generated_response;
      
      if (!responseText) {
        addNotification('error', 'No response text available');
        return;
      }
      
      await GBPSimulatorDatabaseService.updateReviewResponse(
        review.id,
        responseText
      );
      
      // Update local state
      setReviews(prev => prev.map(r =>
        r.id === review.id
          ? {
              ...r,
              response_text: responseText,
              response_date: new Date().toISOString(),
              approval_status: 'approved'
            }
          : r
      ));
      
      addNotification('success', '✅ Response approved and published!');
    } catch (err) {
      console.error('Failed to approve response:', err);
      addNotification('error', 'Failed to approve response. Please try again.');
    } finally {
      setSavingReviewId(null);
    }
  };

  // REJECT HANDLER: Reject AI response and flag for manual
  const handleRejectResponse = async (review: DatabaseReview) => {
    try {
      setSavingReviewId(review.id);
      
      // Update database to mark as rejected
      await GBPSimulatorDatabaseService.updateReviewResponse(
        review.id,
        '',
        'rejected'
      );
      
      // Update local state
      setReviews(prev => prev.map(r =>
        r.id === review.id
          ? {
              ...r,
              approval_status: 'rejected',
              requires_approval: true
            }
          : r
      ));
      
      addNotification('info', 'Response rejected. Review flagged for manual response.');
    } catch (err) {
      console.error('Failed to reject response:', err);
      addNotification('error', 'Failed to reject response. Please try again.');
    } finally {
      setSavingReviewId(null);
    }
  };

  // MANUAL RESPONSE HANDLER: Publish manual response
  const handlePublishManualResponse = async (review: DatabaseReview, responseText: string) => {
    try {
      setSavingReviewId(review.id);
      
      if (!responseText.trim()) {
        addNotification('error', 'Response cannot be empty');
        return;
      }
      
      await GBPSimulatorDatabaseService.updateReviewResponse(
        review.id,
        responseText
      );
      
      // Update local state
      setReviews(prev => prev.map(r =>
        r.id === review.id
          ? {
              ...r,
              response_text: responseText,
              response_date: new Date().toISOString(),
              approval_status: 'approved'
            }
          : r
      ));
      
      addNotification('success', '✅ Manual response published successfully!');
    } catch (err) {
      console.error('Failed to publish manual response:', err);
      addNotification('error', 'Failed to publish response. Please try again.');
    } finally {
      setSavingReviewId(null);
    }
  };

  // Filter reviews into categories
  const reviewsNeedingApproval = reviews.filter(r =>
    r.requires_approval &&
    r.approval_status === 'pending' &&
    r.ai_generated_response &&
    !r.response_text &&
    r.rating >= 2 && r.rating <= 3
  );

  const reviewsNeedingManualResponse = reviews.filter(r =>
    r.requires_approval &&
    !r.response_text &&
    (r.rating === 1 || r.approval_status === 'rejected')
  );

  const filteredReviews = reviews.filter(review => {
    const responseStatus = getResponseStatus(review);
    const matchesFilter = selectedFilter === 'all' || responseStatus === selectedFilter;
    const matchesRating = selectedRating === 'all' || review.rating === selectedRating;
    const matchesPlatform = selectedPlatform === 'all' || review.source === selectedPlatform;
    const matchesSearch = searchTerm === '' ||
      (review.customer_name && review.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (review.review_text && review.review_text.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Exclude reviews shown in priority sections
    const notInPrioritySection = !reviewsNeedingApproval.some(r => r.id === review.id) &&
                                 !reviewsNeedingManualResponse.some(r => r.id === review.id);
    
    return matchesFilter && matchesRating && matchesPlatform && matchesSearch && notInPrioritySection;
  });

  // Calculate stats
  const stats = {
    totalReviews: reviews.length,
    averageRating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0',
    newToday: reviews.filter(r => {
      const reviewDate = new Date(r.created_at);
      const today = new Date();
      return reviewDate.toDateString() === today.toDateString();
    }).length,
    responseRate: reviews.length > 0 ? Math.round((reviews.filter(r => r.response_text).length / reviews.length) * 100) : 0,
    needsAttention: reviewsNeedingApproval.length + reviewsNeedingManualResponse.length,
    sentiment: {
      positive: reviews.filter(r => r.sentiment === 'positive').length,
      neutral: reviews.filter(r => r.sentiment === 'neutral').length,
      negative: reviews.filter(r => r.sentiment === 'negative').length
    }
  };

  // StatCard component
  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: any;
    gradient: string;
    subtitle?: string;
  }> = ({ title, value, icon: Icon, gradient, subtitle }) => (
    <Card hover={true}>
      <div className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${gradient}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin text-gray-400" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-12">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Failed to Load Reviews</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={loadReviews}>Try Again</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {notifications.map((notification, index) => (
            <Card
              key={index}
              className={`p-4 shadow-lg ${
                notification.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' :
                notification.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
              }`}
            >
              <p className="text-sm font-medium">{notification.message}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Review Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {stats.totalReviews} total reviews • {stats.averageRating} ⭐ average rating
          </p>
        </div>
        <div className="flex items-center gap-3">
          {stats.needsAttention > 0 && (
            <Badge variant="warning" size="lg" pulse={true}>
              {stats.needsAttention} need attention
            </Badge>
          )}
          <Button variant="secondary" onClick={loadReviews}>
            <Reply size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="New Today"
          value={stats.newToday}
          icon={MessageSquare}
          gradient="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
        />
        <StatCard
          title="Response Rate"
          value={`${stats.responseRate}%`}
          icon={Reply}
          gradient="bg-gradient-to-r from-[#11998e] to-[#38ef7d]"
        />
        <StatCard
          title="Needs Action"
          value={stats.needsAttention}
          icon={AlertTriangle}
          gradient="bg-gradient-to-r from-[#f093fb] to-[#f5576c]"
        />
        <StatCard
          title="Positive"
          value={stats.sentiment.positive}
          icon={ThumbsUp}
          gradient="bg-gradient-to-r from-[#11998e] to-[#38ef7d]"
          subtitle="sentiment"
        />
        <StatCard
          title="Negative"
          value={stats.sentiment.negative}
          icon={AlertTriangle}
          gradient="bg-gradient-to-r from-[#f45a4e] to-[#e53e3e]"
          subtitle="needs attention"
        />
      </div>

      {/* Priority Section 1: AI Approval */}
      <ReviewApprovalSection
        reviews={reviewsNeedingApproval}
        onApprove={handleApproveResponse}
        onReject={handleRejectResponse}
        savingReviewId={savingReviewId}
      />

      {/* Priority Section 2: Manual Response */}
      <ManualResponseSection
        reviews={reviewsNeedingManualResponse}
        onPublish={handlePublishManualResponse}
        savingReviewId={savingReviewId}
      />

      {/* Filters and Search */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full lg:w-64 pl-10 pr-4 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as any)}
              className="px-3 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="responded">Responded</option>
              <option value="flagged">Flagged</option>
            </select>

            {/* Rating Filter */}
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-3 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            {/* Platform Filter */}
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value as any)}
              className="px-3 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
            >
              <option value="all">All Platforms</option>
              <option value="google">Google</option>
              <option value="facebook">Facebook</option>
              <option value="yelp">Yelp</option>
            </select>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredReviews.length} of {reviews.length} reviews
          </div>
        </div>
      </Card>

      {/* All Other Reviews */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Reviews
          </h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredReviews.length === 0 ? (
          <Card className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="inline-flex p-6 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full mb-6">
                <MessageSquare size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                No Reviews Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || selectedFilter !== 'all' || selectedRating !== 'all' || selectedPlatform !== 'all'
                  ? 'No reviews match your current filters. Try adjusting your search criteria.'
                  : 'No reviews yet. New reviews will appear here.'}
              </p>
            </div>
          </Card>
        ) : (
          filteredReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))
        )}
      </div>
    </div>
  );
};