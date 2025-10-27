// src/components/pages/GoogleProfileSimulator.tsx
// COMPLETE VERSION WITH ALL FEATURES - 4 PARTS TOTAL
// Part 1 of 4: Imports, Types, and Initial Setup

import {
  AlertCircle,
  Bookmark,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  ExternalLink,
  Globe,
  Loader,
  MapPin,
  Menu,
  MessageCircle,
  Navigation,
  Phone,
  Plus,
  Share2,
  Star,
  Tag,
  ThumbsUp
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import {
  mockLocations,
  mockPhotos,
  mockPosts,
  mockQA,
  mockReviews,
  type BusinessLocation,
  type BusinessPhoto,
  type BusinessPost,
  type BusinessQA,
  type BusinessReview
} from '../../lib/mockGoogleBusinessData';

import {
  DEFAULT_SEO_KEYWORDS,
  generateAIReviewResponse,
  getAutomationAction,
  simulateProcessingDelay
} from '../../lib/reviewAutomationService';

import { ResponsePreviewModal } from '../../components/ui/ResponsePreviewModal';
import { QuestionSubmissionModal, ReviewSubmissionModal } from '../../components/ui/ReviewAndQuestionModals';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

export const GoogleProfileSimulator: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'about' | 'photos' | 'qa'>('overview');
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState<string>('ALL');
  
  // Modal states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState<boolean>(false);
  const [isResponsePreviewOpen, setIsResponsePreviewOpen] = useState<boolean>(false);
  
  // Dynamic data states
  const [reviews, setReviews] = useState<BusinessReview[]>(mockReviews.filter(r => r.name.includes('location-001')));
  const [questions, setQuestions] = useState<BusinessQA[]>(mockQA?.filter(qa => qa.locationId === 'location-001') || []);
  
  // Processing states
  const [pendingReviewResponse, setPendingReviewResponse] = useState<{
    review: BusinessReview;
    draftedResponse: string;
  } | null>(null);
  
  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Use first mock location
  const location: BusinessLocation = mockLocations[0];
  
  const locationPhotos: BusinessPhoto[] = mockPhotos?.filter(
    photo => photo.locationId === 'location-001'
  ) || [];
  
  const locationPosts: BusinessPost[] = mockPosts?.filter(
    post => post.locationId === 'location-001'
  ) || [];

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.starRating || 0), 0) / reviews.length
    : 0;

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Show notification
  const showNotification = (type: Notification['type'], message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Handle review submission
  const handleReviewSubmit = async (reviewData: {
    reviewerName: string;
    starRating: number;
    reviewText: string;
  }) => {
    showNotification('info', 'Processing new review...');

    try {
      const newReview: BusinessReview = {
        name: `locations/location-001/reviews/review-${Date.now()}`,
        reviewId: `review-${Date.now()}`,
        reviewer: {
          profilePhotoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(reviewData.reviewerName)}&background=random`,
          displayName: reviewData.reviewerName,
          isAnonymous: false
        },
        starRating: reviewData.starRating,
        comment: reviewData.reviewText,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        reviewReply: undefined
      };

      const automationRule = getAutomationAction(reviewData.starRating);
      
      if (!automationRule) {
        throw new Error('No automation rule found for this rating');
      }

      showNotification('info', `Automation rule: ${automationRule.action.replace('_', ' ')}...`);
      await simulateProcessingDelay(automationRule.responseDelay || 1000);

      if (automationRule.action === 'manual_only') {
        setReviews(prev => [newReview, ...prev]);
        showNotification('warning', `Review added. Manual response required for ${reviewData.starRating}-star reviews.`);
        
      } else if (automationRule.action === 'draft_response') {
        showNotification('info', 'Generating AI response...');
        
        const draftedResponse = await generateAIReviewResponse(
          reviewData.reviewText,
          reviewData.starRating,
          reviewData.reviewerName,
          DEFAULT_SEO_KEYWORDS
        );

        setPendingReviewResponse({
          review: newReview,
          draftedResponse
        });
        setIsResponsePreviewOpen(true);
        
      } else if (automationRule.action === 'auto_respond') {
        showNotification('info', 'Generating AI response...');
        
        const autoResponse = await generateAIReviewResponse(
          reviewData.reviewText,
          reviewData.starRating,
          reviewData.reviewerName,
          DEFAULT_SEO_KEYWORDS
        );

        const reviewWithResponse: BusinessReview = {
          ...newReview,
          reviewReply: {
            comment: autoResponse,
            updateTime: new Date().toISOString()
          }
        };

        setReviews(prev => [reviewWithResponse, ...prev]);
        showNotification('success', '✅ Review received and auto-responded with AI-generated reply!');
        setActiveTab('reviews');
      }

    } catch (error) {
      console.error('Error processing review:', error);
      showNotification('error', 'Failed to process review. Please try again.');
    }
  };

  // Handle response approval
  const handleResponseApproval = (finalResponse: string) => {
    if (!pendingReviewResponse) return;

    const reviewWithResponse: BusinessReview = {
      ...pendingReviewResponse.review,
      reviewReply: {
        comment: finalResponse,
        updateTime: new Date().toISOString()
      }
    };

    setReviews(prev => [reviewWithResponse, ...prev]);
    showNotification('success', '✅ Response approved and published!');
    setPendingReviewResponse(null);
    setActiveTab('reviews');
  };

  // Handle question submission
  const handleQuestionSubmit = (questionData: {
    authorName: string;
    questionText: string;
  }) => {
    const newQuestion: BusinessQA = {
      id: `qa-${Date.now()}`,
      name: `locations/location-001/questions/qa-${Date.now()}`,
      locationId: 'location-001',
      author: {
        displayName: questionData.authorName,
        profilePhotoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(questionData.authorName)}&background=random`,
        type: 'USER'
      },
      text: questionData.questionText,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      upvoteCount: 0,
      answers: []
    };

    setQuestions(prev => [newQuestion, ...prev]);
    showNotification('success', '✅ Question added! Awaiting response.');
    setActiveTab('qa');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={16}
            className={i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  const getHoursDisplay = () => {
    if (!location.regularHours?.periods) return [];
    return location.regularHours.periods.slice(0, 3);
  };

  const isOpenNow = location.openInfo?.status === 'OPEN';
  const photoCategories = ['ALL', 'EXTERIOR', 'INTERIOR', 'FOOD_AND_DRINK', 'TEAM'];
  const filteredPhotos = selectedPhotoCategory === 'ALL' 
    ? locationPhotos 
    : locationPhotos.filter(p => p.category === selectedPhotoCategory);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start gap-3 p-4 rounded-lg shadow-lg border animate-slide-in ${
              notification.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
                : notification.type === 'error'
                ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
                : notification.type === 'warning'
                ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800'
                : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
            }`}
          >
            {notification.type === 'success' && <CheckCircle size={20} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />}
            {notification.type === 'error' && <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />}
            {notification.type === 'warning' && <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />}
            {notification.type === 'info' && <Loader size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />}
            <p className={`text-sm font-medium ${
              notification.type === 'success'
                ? 'text-green-800 dark:text-green-300'
                : notification.type === 'error'
                ? 'text-red-800 dark:text-red-300'
                : notification.type === 'warning'
                ? 'text-yellow-800 dark:text-yellow-300'
                : 'text-blue-800 dark:text-blue-300'
            }`}>
              {notification.message}
            </p>
          </div>
        ))}
      </div>

      {/* Modals */}
      <ReviewSubmissionModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleReviewSubmit}
      />

      <QuestionSubmissionModal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        onSubmit={handleQuestionSubmit}
      />

      {pendingReviewResponse && (
        <ResponsePreviewModal
          isOpen={isResponsePreviewOpen}
          onClose={() => {
            setIsResponsePreviewOpen(false);
            setPendingReviewResponse(null);
          }}
          onApprove={handleResponseApproval}
          reviewText={pendingReviewResponse.review.comment || ''}
          reviewerName={pendingReviewResponse.review.reviewer.displayName}
          starRating={pendingReviewResponse.review.starRating || 0}
          draftedResponse={pendingReviewResponse.draftedResponse}
          seoKeywords={DEFAULT_SEO_KEYWORDS.primaryKeywords.slice(0, 3)}
        />
      )}

      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-blue-600">Google</span>
              <span className="text-gray-600 dark:text-gray-300">| Business Profile Simulator</span>
            </div>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Menu size={24} className="text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Header */}
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold text-gray-900 dark:text-white">
                {location.locationName}
              </h1>
              
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  {renderStars(Math.round(avgRating))}
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {avgRating.toFixed(1)} ({reviews.length} reviews)
                  </span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {location.primaryCategory?.displayName}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isOpenNow
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {isOpenNow ? 'Open' : 'Closed'}
                </span>
                {location.regularHours?.periods && location.regularHours.periods.length > 0 && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    • Closes {location.regularHours.periods[0].closeTime}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Navigation size={18} />
                <span className="font-medium">Directions</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Globe size={18} className="text-gray-700 dark:text-gray-300" />
                <span className="font-medium text-gray-700 dark:text-gray-300">Website</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"></button>
              <Phone size={18} className="text-gray-700 dark:text-gray-300" />
                <span className="font-medium text-gray-700 dark:text-gray-300">Call</span>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Share2 size={18} className="text-gray-700 dark:text-gray-300" />
                <span className="font-medium text-gray-700 dark:text-gray-300">Share</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Bookmark size={18} className="text-gray-700 dark:text-gray-300" />
                <span className="font-medium text-gray-700 dark:text-gray-300">Save</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-8">
                {['overview', 'reviews', 'about', 'photos', 'qa'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`pb-4 font-medium transition-colors capitalize ${
                      activeTab === tab
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    {tab === 'qa' ? 'Q&A' : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <>
                  {/* Posts */}
                  {locationPosts.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Updates from this business
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {locationPosts.map((post) => (
                          <div
                            key={post.id}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                          >
                            {post.media && post.media[0] && (
                              <img
                                src={post.media[0].sourceUrl}
                                alt="Post"
                                className="w-full h-48 object-cover"
                              />
                            )}
                            <div className="p-4 space-y-3">
                              <div className="flex items-center gap-2">
                                {post.topicType === 'EVENT' && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-medium rounded">
                                    <Calendar size={12} className="inline mr-1" />
                                    Event
                                  </span>
                                )}
                                {post.topicType === 'OFFER' && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium rounded">
                                    <Tag size={12} className="inline mr-1" />
                                    Offer
                                  </span>
                                )}
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(post.createTime).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                                {post.summary}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {location.profile?.description && (
                    <div className="space-y-2">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">About</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {location.profile.description}
                      </p>
                    </div>
                  )}

                  {/* Amenities */}
                  {location.labels && location.labels.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Amenities</h2>
                      <div className="flex flex-wrap gap-2">
                        {location.labels.map((label, index) => (
                          <span key={index} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Reviews Preview */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent reviews</h2>
                      <button onClick={() => setActiveTab('reviews')} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        See all reviews
                      </button>
                    </div>
                    <div className="space-y-4">
                      {reviews.slice(0, 2).map((review) => (
                        <div key={review.reviewId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <img src={review.reviewer.profilePhotoUrl || ''} alt={review.reviewer.displayName} className="w-10 h-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{review.reviewer.displayName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {renderStars(review.starRating || 0)}
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(review.createTime || '').toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 text-sm">{review.comment}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* REVIEWS TAB */}
              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        All reviews ({reviews.length})
                      </h2>
                      <div className="flex items-center gap-2 mt-2">
                        {renderStars(Math.round(avgRating))}
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {avgRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsReviewModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Plus size={18} />
                      Write a Review
                    </button>
                  </div>

                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.reviewId} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                        <div className="flex items-start gap-4">
                          <img src={review.reviewer.profilePhotoUrl || ''} alt={review.reviewer.displayName} className="w-12 h-12 rounded-full flex-shrink-0" />
                          <div className="flex-1 space-y-3">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-lg">{review.reviewer.displayName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {renderStars(review.starRating || 0)}
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(review.createTime || '').toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{review.comment}</p>

                            {review.reviewReply && (
                              <div className="ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-2">
                                <p className="font-medium text-sm text-gray-900 dark:text-white">Response from the owner</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{review.reviewReply.comment}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(review.reviewReply.updateTime || '').toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ABOUT TAB */}
              {activeTab === 'about' && (
                <div className="space-y-6">
                  {location.profile?.description && (
                    <div className="space-y-2">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Description</h2>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{location.profile.description}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Categories</h2>
                    <div className="flex flex-wrap gap-2">
                      {location.primaryCategory && (
                        <span className="px-3 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium">
                          {location.primaryCategory.displayName} (Primary)
                        </span>
                      )}
                      {location.additionalCategories?.map((category, index) => (
                        <span key={index} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                          {category.displayName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* PHOTOS TAB */}
              {activeTab === 'photos' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Photos ({locationPhotos.length})
                    </h2>
                    
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                      {photoCategories.map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedPhotoCategory(category)}
                          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                            selectedPhotoCategory === category
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {category.replace('_', ' ')}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {filteredPhotos.map((photo) => (
                        <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity cursor-pointer group">
                          <img src={photo.url} alt={photo.description || 'Business photo'} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Q&A TAB */}
              {activeTab === 'qa' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Questions & Answers ({questions.length})
                    </h2>
                    <button 
                      onClick={() => setIsQuestionModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium transition-colors"
                    >
                      <Plus size={18} />
                      Ask a question
                    </button>
                  </div>

                  <div className="space-y-6">
                    {questions.map((qa) => (
                      <div key={qa.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
                        <div className="flex gap-3">
                          <img src={qa.author.profilePhotoUrl} alt={qa.author.displayName} className="w-10 h-10 rounded-full flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{qa.author.displayName}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(qa.createTime).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="text-gray-800 dark:text-gray-200 font-medium">
                              <MessageCircle size={16} className="inline mr-2 text-gray-400" />
                              {qa.text}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600">
                                <ThumbsUp size={16} />
                                <span>{qa.upvoteCount}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {qa.answers && qa.answers.length > 0 && (
                          <div className="ml-12 pl-4 border-l-2 border-blue-600 space-y-3">
                            {qa.answers.map((answer, idx) => (
                              <div key={idx} className="flex gap-3">
                                <img src={answer.author.profilePhotoUrl} alt={answer.author.displayName} className="w-8 h-8 rounded-full flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">{answer.author.displayName}</p>
                                    {answer.author.type === 'MERCHANT' && (
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-medium rounded">
                                        Owner
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{answer.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Business Info */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Business information</h3>

              {location.address && (
                <div className="flex gap-3">
                  <MapPin size={20} className="text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Address</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {location.address.addressLines?.join(', ')}
                      <br />
                      {location.address.locality}, {location.address.administrativeArea} {location.address.postalCode}
                    </p>
                  </div>
                </div>
              )}

              {location.primaryPhone && (
                <div className="flex gap-3">
                  <Phone size={20} className="text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Phone</p>
                    <p className="text-sm text-blue-600 hover:underline cursor-pointer mt-1">{location.primaryPhone}</p>
                  </div>
                </div>
              )}

              {location.regularHours && (
                <div className="flex gap-3">
                  <Clock size={20} className="text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 dark:text-white">Hours</p>
                      <ChevronDown size={16} className="text-gray-500" />
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {getHoursDisplay().map((period, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400 capitalize">{period.openDay?.toLowerCase()}</span>
                          <span className="text-gray-900 dark:text-white">{period.openTime} - {period.closeTime}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {location.websiteUri && (
                <div className="flex gap-3">
                  <Globe size={20} className="text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Website</p>
                    <a href={location.websiteUri} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 flex items-center gap-1">
                      {location.websiteUri.replace('https://', '')}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};