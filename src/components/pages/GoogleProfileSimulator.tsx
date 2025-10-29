// src/components/pages/GoogleProfileSimulator.tsx
// DATABASE-INTEGRATED VERSION - COMPLETE REPLACEMENT - PART 1 OF 2

import {
  Bell,
  Bookmark,
  CheckCircle,
  Clock,
  Globe,
  Loader,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Share2,
  Star,
  ThumbsUp
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import {
  mockLocations,
  mockPhotos,
  mockPosts,
  mockQA,
  type BusinessLocation,
  type BusinessPhoto,
  type BusinessPost,
  type BusinessQA,
  type BusinessReview
} from '../../lib/mockGoogleBusinessData';

import {
  BackgroundSyncManager,
  DEFAULT_SEO_KEYWORDS,
  SYNC_INTERVAL_PRODUCTION,
  type SyncLog,
  type SyncStatus
} from '../../lib/reviewAutomationService';

import { GBPSimulatorDatabaseService } from '../../lib/gbpSimulatorDatabaseService';
import { databaseReviewToSimulatorReview, SARAH_THOMPSON_ACCOUNT, simulatorReviewToDatabaseReview } from '../../types/database';

import { DebugLogPanel } from '../ui/DebugLogPanel';
import { NotificationDropdown, type AppNotification } from '../ui/NotificationDropdown';
import { ResponsePreviewModal } from '../ui/ResponsePreviewModal';
import { QuestionSubmissionModal, ReviewSubmissionModal } from '../ui/ReviewAndQuestionModals';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface GoogleProfileSimulatorProps {
  locationId?: string;
}

export const GoogleProfileSimulator: React.FC<GoogleProfileSimulatorProps> = ({ 
  locationId = SARAH_THOMPSON_ACCOUNT.locationId 
}) => {
  const [currentSyncId, setCurrentSyncId] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'about' | 'photos' | 'qa'>('overview');
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState<string>('ALL');
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState<boolean>(false);
  const [isResponsePreviewOpen, setIsResponsePreviewOpen] = useState<boolean>(false);
  
  const [reviews, setReviews] = useState<BusinessReview[]>([]);
  const [questions, setQuestions] = useState<BusinessQA[]>(mockQA?.filter(qa => qa.locationId === 'location-001') || []);
  
  const [pendingReviewResponse, setPendingReviewResponse] = useState<{
    review: BusinessReview;
    draftedResponse: string;
  } | null>(null);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>([]);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState<boolean>(false);
  
  const [syncManager] = useState(() => new BackgroundSyncManager(SYNC_INTERVAL_PRODUCTION));
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    nextSync: null,
    isRunning: false,
    interval: SYNC_INTERVAL_PRODUCTION,
    pendingReviews: 0,
    totalSyncs: 0
  });
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  
  const location: BusinessLocation = mockLocations[0];
  
  const locationPhotos: BusinessPhoto[] = mockPhotos?.filter(
    photo => photo.locationId === 'location-001'
  ) || [];
  
  const locationPosts: BusinessPost[] = mockPosts?.filter(
    post => post.locationId === 'location-001'
  ) || [];

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.starRating || 0), 0) / reviews.length
    : 0;

  const unreadReviews = reviews.filter(r => !r.reviewReply).length;

  // Load reviews from database
  useEffect(() => {
    loadReviewsFromDatabase();
  }, [locationId]);

  const loadReviewsFromDatabase = async () => {
    try {
      console.log('[Simulator] Loading reviews from database...');
      const dbReviews = await GBPSimulatorDatabaseService.getReviewsByLocation(locationId);
      const simulatorReviews = dbReviews.map(databaseReviewToSimulatorReview);
      setReviews(simulatorReviews);
      console.log(`[Simulator] ✅ Loaded ${simulatorReviews.length} reviews from database`);
      
      const lastSync = await GBPSimulatorDatabaseService.getLastSync(locationId);
      if (lastSync && lastSync.started_at) {
        setLastSyncTime(new Date(lastSync.started_at));
      }
    } catch (error) {
      console.error('[Simulator] Error loading reviews:', error);
      setReviews([]);
    }
  };

  // Initialize background sync
  useEffect(() => {
    syncManager.onSync((processedReviews: BusinessReview[]) => {
      setReviews(prev => {
        return prev.map(review => {
          const processed = processedReviews.find(pr => pr.reviewId === review.reviewId);
          if (processed && processed.reviewReply) {
            addAppNotification({
              type: 'automation',
              title: 'Auto-responded to Review',
              message: `Automatically responded to ${processed.reviewer?.displayName}'s ${processed.starRating}-star review`
            });
            return processed;
          }
          return review;
        });
      });
    });

    syncManager.onLog((log: SyncLog) => {
      setSyncLogs(prev => [log, ...prev].slice(0, 50));
      setSyncStatus(syncManager.getStatus());
    });

    syncManager.start();
    setSyncStatus(syncManager.getStatus());

    return () => {
      syncManager.stop();
    };
  }, [syncManager]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(0, -1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const addNotification = (type: Notification['type'], message: string) => {
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      type,
      message
    };
    setNotifications(prev => [notification, ...prev]);
  };

  const addAppNotification = (params: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const notification: AppNotification = {
      id: `app-notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false,
      ...params
    };
    setAppNotifications(prev => [notification, ...prev]);
  };

  const handleReviewSubmit = async (reviewData: {
    starRating: number;
    reviewText: string;
    reviewerName: string;
    reviewerAvatar?: string;
  }) => {
    try {
      const dbReview = simulatorReviewToDatabaseReview(
        {
          customerName: reviewData.reviewerName,
          rating: reviewData.starRating,
          reviewText: reviewData.reviewText,
          customerPhoto: reviewData.reviewerAvatar
        },
        locationId
      );
      
      const insertedReview = await GBPSimulatorDatabaseService.insertReview(dbReview);
      
      if (!insertedReview) {
        throw new Error('Failed to insert review');
      }

      console.log('[Simulator] ✅ Review saved to database:', insertedReview.id);
      
      const simulatorReview = databaseReviewToSimulatorReview(insertedReview);
      setReviews(prev => [simulatorReview, ...prev]);
      
      syncManager.addPendingReview(simulatorReview);
      setSyncStatus(syncManager.getStatus());
      
      await GBPSimulatorDatabaseService.notifyNewReview(
        SARAH_THOMPSON_ACCOUNT.organizationId,
        locationId,
        insertedReview.id,
        {
          customerName: reviewData.reviewerName,
          rating: reviewData.starRating,
          requiresApproval: insertedReview.requires_approval || false
        }
      );
      
      addNotification('success', 'Review posted! Queued for automation.');
      addAppNotification({
        type: 'review',
        title: 'New Review Submitted',
        message: `${reviewData.reviewerName} left a ${reviewData.starRating}-star review`
      });
      
      setIsReviewModalOpen(false);
    } catch (error) {
      console.error('[Simulator] Error submitting review:', error);
      addNotification('error', 'Failed to submit review. Please try again.');
    }
  };

  const handleQuestionSubmit = async (question: {
    questionText: string;
    authorName: string;
  }) => {
    const newQuestion: BusinessQA = {
      id: `qa-${Date.now()}`,
      name: `locations/location-001/questions/${Date.now()}`,
      locationId: 'location-001',
      author: {
        displayName: question.authorName,
        profilePhotoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(question.authorName)}`,
        type: 'USER'
      },
      text: question.questionText,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      upvoteCount: 0
    };

    setQuestions(prev => [newQuestion, ...prev]);
    setIsQuestionModalOpen(false);
    addNotification('success', 'Question posted successfully!');
    
    addAppNotification({
      type: 'question',
      title: 'New Question Asked',
      message: `${question.authorName} asked: "${question.questionText}"`
    });
  };

  const handleResponseApproval = async () => {
    if (!pendingReviewResponse) return;
    
    setReviews(prev => prev.map(r => 
      r.reviewId === pendingReviewResponse.review.reviewId
        ? {
            ...r,
            reviewReply: {
              comment: pendingReviewResponse.draftedResponse,
              updateTime: new Date().toISOString()
            }
          }
        : r
    ));
    
    setIsResponsePreviewOpen(false);
    setPendingReviewResponse(null);
    addNotification('success', 'Response published successfully!');
  };

  const handleForceSyncNow = async () => {
    try {
      const syncHistory = await GBPSimulatorDatabaseService.createSyncHistory({
        location_id: locationId,
        sync_type: 'force',
        status: 'in_progress',
        started_at: new Date().toISOString(),
        completed_at: null,
        duration_ms: null,
        error_message: null,
        reviews_processed: 0,
        reviews_responded: 0,
        reviews_flagged: 0,
        log_entries: [],
        created_by: null
      });
      
      if (syncHistory) {
        setCurrentSyncId(syncHistory.id);
      }
      
      syncManager.forceSyncNow();
      addNotification('info', 'Force sync triggered!');
    } catch (error) {
      console.error('[Simulator] Error in force sync:', error);
    }
  };

  const handleChangeInterval = (intervalMs: number) => {
    syncManager.setInterval(intervalMs);
    setSyncStatus(syncManager.getStatus());
    
    const intervalLabel = intervalMs === 30 * 1000 ? '30 seconds' 
      : intervalMs === 2 * 60 * 1000 ? '2 minutes'
      : '2 hours';
    
    addNotification('info', `Sync interval changed to ${intervalLabel}`);
  };

  const handleClearLogs = () => {
    setSyncLogs([]);
    addNotification('success', 'Debug logs cleared');
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setAppNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setAppNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const handleClearAllNotifications = () => {
    setAppNotifications([]);
    setIsNotificationDropdownOpen(false);
  };

  const photosByCategory = locationPhotos.reduce((acc, photo) => {
    const category = photo.category || 'ADDITIONAL';
    if (!acc[category]) acc[category] = [];
    acc[category].push(photo);
    return acc;
  }, {} as Record<string, BusinessPhoto[]>);

  const filteredPhotos = selectedPhotoCategory === 'ALL'
    ? locationPhotos
    : photosByCategory[selectedPhotoCategory] || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-[#f45a4e] mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading Google Business Profile...</p>
        </div>
      </div>
    );
  }

  const unreadNotificationCount = appNotifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`px-4 py-3 rounded-lg shadow-lg border animate-slide-in-right max-w-md ${
              notif.type === 'success' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200' :
              notif.type === 'error' ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200' :
              notif.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200' :
              'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
            }`}
          >
            <p className="text-sm font-medium">{notif.message}</p>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={locationPhotos.find(p => p.category === 'LOGO')?.url || 'https://via.placeholder.com/80'}
                  alt={location.locationName}
                  className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-700"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{location.locationName}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-yellow-500 font-semibold">{avgRating.toFixed(1)}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={star <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">({reviews.length} reviews)</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{location.primaryCategory?.displayName}</p>
                </div>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
                  className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Bell size={24} className="text-gray-600 dark:text-gray-400" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                      {unreadNotificationCount}
                    </span>
                  )}
                </button>
                
                <NotificationDropdown
                  notifications={appNotifications}
                  isOpen={isNotificationDropdownOpen}
                  onClose={() => setIsNotificationDropdownOpen(false)}
                  onMarkAsRead={handleMarkNotificationAsRead}
                  onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                  onClearAll={handleClearAllNotifications}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <MapPin size={16} />
                <span>{location.address?.addressLines?.join(', ') || 'Address not available'}</span>
              </div>
              {location.primaryPhone && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone size={16} />
                  <span>{location.primaryPhone}</span>
                </div>
              )}
              {location.websiteUri && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Globe size={16} />
                  <a href={location.websiteUri} target="_blank" rel="noopener noreferrer" className="hover:text-[#f45a4e]">
                    Website
                  </a>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Star size={16} />
                Write a review
              </button>
              <button
                onClick={() => setIsQuestionModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <MessageCircle size={16} />
                Ask a question
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
                <Share2 size={16} />
                Share
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
                <Bookmark size={16} />
                Save
              </button>
            </div>
          </div>

          <div className="flex gap-8 px-6 border-t border-gray-200 dark:border-gray-700">
            {[
              { id: 'overview', label: 'Overview', badge: null },
              { id: 'reviews', label: 'Reviews', badge: unreadReviews > 0 ? unreadReviews : null },
              { id: 'about', label: 'About', badge: null },
              { id: 'photos', label: 'Photos', badge: locationPhotos.length },
              { id: 'qa', label: 'Q&A', badge: questions.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#f45a4e] border-b-2 border-[#f45a4e]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
                {tab.badge !== null && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock size={20} />
                  Popular times
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>Popular times data coming soon...</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <MapPin size={20} />
                  Location & Hours
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-700 dark:text-gray-300">{location.address?.addressLines?.join(', ') || 'Address not available'}</p>
                    <button className="text-[#f45a4e] text-sm mt-2 hover:underline flex items-center gap-1">
                      <Navigation size={14} />
                      Get directions
                    </button>
                  </div>
                  {location.regularHours && location.regularHours.periods && (
                    <div className="space-y-1">
                      {location.regularHours.periods.map((period, idx) => {
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const dayName = typeof period.openDay === 'number' ? dayNames[period.openDay] : 'Unknown';
                        return (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{dayName}</span>
                            <span className="text-gray-900 dark:text-white">
                              {period.openTime} - {period.closeTime}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {locationPosts.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent posts</h3>
                  <div className="space-y-4">
                    {locationPosts.slice(0, 3).map((post) => (
                      <div key={post.id} className="border-l-4 border-[#f45a4e] pl-4">
                        <p className="text-gray-700 dark:text-gray-300">{post.summary}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(post.createTime).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
                  <Star size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No reviews yet. Be the first to review!</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.reviewId} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-4">
                      <img
                        src={review.reviewer?.profilePhotoUrl || 'https://via.placeholder.com/48'}
                        alt={review.reviewer?.displayName || 'Reviewer'}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {review.reviewer?.displayName || 'Anonymous'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={14}
                                    className={star <= (review.starRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(review.createTime).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="mt-3 text-gray-700 dark:text-gray-300">{review.comment}</p>

                        {review.reviewReply ? (
                          <div className="mt-4 ml-4 pl-4 border-l-2 border-green-500 bg-green-50 dark:bg-green-900/20 rounded p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                              <span className="font-semibold text-sm text-gray-900 dark:text-white">Response from the owner</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(review.reviewReply.updateTime).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{review.reviewReply.comment}</p>
                          </div>
                        ) : (
                          <div className="mt-4 ml-4 pl-4 border-l-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 rounded p-3">
                            <div className="flex items-center gap-2">
                              <Clock size={16} className="text-yellow-600 dark:text-yellow-400" />
                              <span className="font-semibold text-sm text-gray-900 dark:text-white">Awaiting automated response...</span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              This review will be processed during the next background sync
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    {location.profile?.description || 'No description available.'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Services</h4>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_SEO_KEYWORDS.service.map((service, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {['ALL', ...Object.keys(photosByCategory)].map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedPhotoCategory(category)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                      selectedPhotoCategory === category
                        ? 'bg-[#f45a4e] text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {category.replace(/_/g, ' ')}
                    {category !== 'ALL' && ` (${photosByCategory[category]?.length || 0})`}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPhotos.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No photos in this category</p>
                  </div>
                ) : (
                  filteredPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 hover:scale-105 transition-transform cursor-pointer"
                    >
                      <img
                        src={photo.url}
                        alt={photo.description || 'Business photo'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'qa' && (
            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
                  <MessageCircle size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No questions yet. Be the first to ask!</p>
                </div>
              ) : (
                questions.map((qa) => (
                  <div key={qa.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-4">
                      <img
                        src={qa.author.profilePhotoUrl}
                        alt={qa.author.displayName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white">{qa.author.displayName}</p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(qa.createTime).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-2 text-gray-700 dark:text-gray-300">{qa.text}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-[#f45a4e]">
                            <ThumbsUp size={14} />
                            <span>{qa.upvoteCount}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {qa.answers && qa.answers.length > 0 && (
                      <div className="ml-14 mt-4 space-y-4">
                        {qa.answers.map((answer, idx) => (
                          <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <img
                                src={answer.author.profilePhotoUrl}
                                alt={answer.author.displayName}
                                className="w-8 h-8 rounded-full"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                    {answer.author.displayName}
                                  </p>
                                  {answer.author.type === 'MERCHANT' && (
                                    <span className="text-xs bg-[#f45a4e] text-white px-2 py-0.5 rounded">Owner</span>
                                  )}
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(answer.createTime).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{answer.text}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <DebugLogPanel
          syncStatus={syncStatus}
          logs={syncLogs}
          onForceSyncNow={handleForceSyncNow}
          onChangeInterval={handleChangeInterval}
          onClearLogs={handleClearLogs}
        />
      </div>

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
          seoKeywords={DEFAULT_SEO_KEYWORDS.primary.slice(0, 3)}
        />
      )}
    </div>
  );
};