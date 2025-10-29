// src/components/simulator/GoogleProfileSimulator.tsx
// NEW Google-style simulator - Main container with component-based architecture
// DATABASE-INTEGRATED VERSION - FIXED - All TypeScript errors resolved

import { Bell } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import {
  mockLocations,
  mockPhotos,
  type BusinessLocation,
  type BusinessPhoto,
  type BusinessReview
} from '../../lib/mockGoogleBusinessData';

import {
  BackgroundSyncManager,
  DEFAULT_SEO_KEYWORDS,
  SYNC_INTERVAL_PRODUCTION,
  type SyncLog,
  type SyncStatus
} from '../../lib/reviewAutomationService';

// Database integration
import { GBPSimulatorDatabaseService } from '../../lib/gbpSimulatorDatabaseService';
import {
  databaseReviewToSimulatorReview,
  SARAH_THOMPSON_ACCOUNT,
  simulatorReviewToDatabaseReview
} from '../../types/database';

import { DebugLogPanel } from '../ui/DebugLogPanel';
import { NotificationDropdown, type AppNotification } from '../ui/NotificationDropdown';
import { ResponsePreviewModal } from '../ui/ResponsePreviewModal';
import { ReviewSubmissionModal } from '../ui/ReviewAndQuestionModals';

import { ActionButtons } from './ActionButtons';
import { BusinessHeader } from './BusinessHeader';
import { BusinessInfoSection } from './BusinessInfoSection';
import { BusinessTabs, type TabType } from './BusinessTabs';
import { PhotoGallery } from './PhotoGallery';
import { ReviewCard, type Review } from './ReviewCard';
import { ReviewSummarySection } from './ReviewSummarySection';

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
  // UI States
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Modal states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isResponsePreviewOpen, setIsResponsePreviewOpen] = useState<boolean>(false);
  
  // Dynamic data states - START WITH EMPTY, LOAD FROM DATABASE
  const [reviews, setReviews] = useState<BusinessReview[]>([]);
  
  // Processing states
  const [pendingReviewResponse, setPendingReviewResponse] = useState<{
    review: BusinessReview;
    draftedResponse: string;
  } | null>(null);
  
  // Notification states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>([]);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState<boolean>(false);
  
  // Background Sync System States
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
  const [currentSyncId, setCurrentSyncId] = useState<string | null>(null);
  
  // Use first mock location
  const location: BusinessLocation = mockLocations[0];
  
  const locationPhotos: BusinessPhoto[] = mockPhotos?.filter(
    photo => photo.locationId === 'location-001'
  ) || [];

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.starRating || 0), 0) / reviews.length
    : 0;

  // DATABASE: Load reviews from database on mount
  useEffect(() => {
    const loadReviewsFromDatabase = async () => {
      try {
        console.log('[GoogleProfileSimulator] Loading reviews from database for location:', locationId);
        const dbReviews = await GBPSimulatorDatabaseService.getReviewsByLocation(locationId);
        console.log('[GoogleProfileSimulator] Loaded reviews from database:', dbReviews.length);
        
        // Convert database reviews to simulator format
        const simulatorReviews = dbReviews.map(databaseReviewToSimulatorReview);
        setReviews(simulatorReviews);
      } catch (error) {
        console.error('[GoogleProfileSimulator] Failed to load reviews from database:', error);
        addNotification('error', 'Failed to load reviews from database');
      } finally {
        setLoading(false);
      }
    };

    loadReviewsFromDatabase();
  }, [locationId]);

  // Initialize background sync system
  useEffect(() => {
    // Set up sync callback
    syncManager.onSync(async (processedReviews) => {
      // DATABASE: Update reviews with generated responses AND save to database
      // Use functional update to get current reviews
      setReviews((currentReviews) => {
        // Process updates asynchronously but return immediately
        (async () => {
          for (const processed of processedReviews) {
            if (processed.reviewReply) {
              // Add notification for auto-responded review
              addAppNotification({
                type: 'automation',
                title: 'Auto-responded to Review',
                message: `Automatically responded to ${processed.reviewer?.displayName}'s ${processed.starRating}-star review`
              });

              // DATABASE: Update review response in database
              try {
                const dbReviews = await GBPSimulatorDatabaseService.getReviewsByLocation(locationId);
                const matchingDbReview = dbReviews.find(r => r.id === processed.reviewId);
                
                if (matchingDbReview) {
                  await GBPSimulatorDatabaseService.updateReviewResponse(
                    matchingDbReview.id,
                    processed.reviewReply.comment
                  );

                  await GBPSimulatorDatabaseService.logAutomationAction(
                    matchingDbReview.id,
                    locationId,
                    'auto_responded',
                    'high_rating_auto_response',
                    processed.reviewReply.comment
                  );
                }
              } catch (error) {
                console.error('[Sync] Failed to save response to database:', error);
              }
            }
          }
        })();

        // Return updated reviews synchronously
        return currentReviews.map(review => {
          const processed = processedReviews.find(pr => pr.reviewId === review.reviewId);
          return (processed && processed.reviewReply) ? processed : review;
        });
      });
    });

  // Set up log callback - DATABASE: Save sync history
syncManager.onLog(async (log) => {
  setSyncLogs(prev => [log, ...prev].slice(0, 50));
  setSyncStatus(syncManager.getStatus());

  // DATABASE: Create or update sync history based on log type
  try {
    // DETECT SYNC START - Create new sync record
    if (log.message.includes('Running sync') && !currentSyncId) {
      const syncRecord = await GBPSimulatorDatabaseService.createSyncHistory({
        location_id: locationId,
        sync_type: 'automatic',
        status: 'in_progress',
        reviews_processed: 0,
        reviews_responded: 0,
        reviews_flagged: 0,
        started_at: new Date().toISOString(),
        completed_at: null,
        duration_ms: null,
        error_message: null,
        log_entries: [],
        created_by: null
      });
      setCurrentSyncId(syncRecord?.id || null);
      console.log('[Sync] Created sync record:', syncRecord?.id);
    } 
    // DETECT SYNC COMPLETE - Update sync record
    else if (log.message.includes('Sync complete') && currentSyncId) {
      // Extract number of reviews processed from message
      const match = log.message.match(/Processed (\d+) review/);
      const reviewsProcessed = match ? parseInt(match[1]) : 0;
      
      await GBPSimulatorDatabaseService.updateSyncHistory(currentSyncId, {
        status: 'success',
        reviews_processed: reviewsProcessed,
        reviews_responded: reviewsProcessed, // For now, assume all processed were responded to
        reviews_flagged: 0,
        completed_at: new Date().toISOString(),
        duration_ms: null,
        log_entries: []
      });
      console.log('[Sync] Completed sync record:', currentSyncId);
      setCurrentSyncId(null); // Reset for next sync
    }
  // DETECT SYNC ERROR
else if (log.message.includes('Sync failed') && currentSyncId) {
  await GBPSimulatorDatabaseService.updateSyncHistory(currentSyncId, {
    status: 'failed',  // ✅ Changed from 'error' to 'failed'
    reviews_processed: 0,
    reviews_responded: 0,
    reviews_flagged: 0,
    completed_at: new Date().toISOString(),
    duration_ms: null,
    error_message: log.message,
    log_entries: []
  });
  console.log('[Sync] Failed sync record:', currentSyncId);
  setCurrentSyncId(null);
}
  } catch (error) {
    console.error('[Sync] Failed to save sync history:', error);
  }
});

    // Start background sync
    syncManager.start();
    setSyncStatus(syncManager.getStatus());

    // Cleanup on unmount
    return () => {
      syncManager.stop();
    };
  }, [syncManager, locationId]); // FIXED: Removed reviews and currentSyncId to prevent infinite loop

  // Auto-dismiss notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(0, -1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  // Helper: Add notification
  const addNotification = (type: Notification['type'], message: string) => {
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      type,
      message
    };
    setNotifications(prev => [notification, ...prev]);
  };

  // Helper: Add app notification (for dropdown)
  const addAppNotification = (params: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const notification: AppNotification = {
      id: `app-notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false,
      ...params
    };
    setAppNotifications(prev => [notification, ...prev]);
  };

  // DATABASE: Handle review submission with database persistence
  const handleReviewSubmit = async (reviewData: {
    starRating: number;
    reviewText: string;
    reviewerName: string;
    reviewerAvatar?: string;
  }) => {
    const newReview: BusinessReview = {
      name: `accounts/*/locations/${locationId}/reviews/review-${Date.now()}`,
      reviewId: `review-${Date.now()}`,
      reviewer: {
        displayName: reviewData.reviewerName,
        profilePhotoUrl: reviewData.reviewerAvatar || '',
        isAnonymous: false
      },
      starRating: reviewData.starRating,
      comment: reviewData.reviewText,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
      // No reviewReply - this makes it UNANSWERED
    };

    try {
      // DATABASE: Save review to database
      // FIXED: Use correct parameter format for simulatorReviewToDatabaseReview
      console.log('[GoogleProfileSimulator] Saving review to database:', newReview);
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

      console.log('[GoogleProfileSimulator] Review saved to database with ID:', insertedReview.id);

      // FIXED: Update the reviewId to match database ID so sync can find it
      newReview.reviewId = insertedReview.id;
      newReview.name = `reviews/${insertedReview.id}`;

      // Add to reviews UNANSWERED in local state for immediate display
      setReviews(prev => [newReview, ...prev]);
      setIsReviewModalOpen(false);
      
      // Add to pending reviews for background sync to process
      (syncManager as any).pendingReviews.push(newReview);
      
      addNotification('success', `Review submitted by ${reviewData.reviewerName}`);
      
      // DATABASE: Create notification
      // FIXED: Use correct signature with customerName, rating, requiresApproval
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

      addAppNotification({
        type: 'review',
        title: 'New Review Received',
        message: `${reviewData.reviewerName} left a ${reviewData.starRating}-star review`
      });
    } catch (error) {
      console.error('[GoogleProfileSimulator] Failed to save review to database:', error);
      addNotification('error', 'Failed to save review. Please try again.');
    }
  };

  // Handle response approval
  const handleResponseApproval = async () => {
    if (!pendingReviewResponse) return;
    
    // Update review with approved response
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

  // Debug Log Panel handlers
  const handleForceSyncNow = () => {
    syncManager.forceSyncNow();
    addNotification('info', 'Force sync triggered! Processing all pending reviews...');
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

  // Notification Dropdown handlers
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

  // Close handler
  const handleClose = () => {
    window.close();
  };

  // Review summaries for Overview tab
  const reviewSummaries = reviews.slice(0, 3).map(r => ({
    quote: r.comment || '',
    author: r.reviewer.displayName,
    avatarUrl: r.reviewer.profilePhotoUrl
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading reviews from database...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Floating notification button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
          className="relative p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <Bell size={20} className="text-gray-700 dark:text-gray-300" />
          {appNotifications.filter(n => !n.isRead).length > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
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

      {/* Toast notifications */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-4 py-3 rounded-lg shadow-lg ${
              notification.type === 'success'
                ? 'bg-green-500 text-white'
                : notification.type === 'error'
                ? 'bg-red-500 text-white'
                : notification.type === 'warning'
                ? 'bg-yellow-500 text-white'
                : 'bg-blue-500 text-white'
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      {/* Main content container - Google style with right panel appearance */}
      <div className="max-w-2xl mx-auto bg-white shadow-lg min-h-screen">
        {/* Business Header */}
        <BusinessHeader
          name={location.locationName || 'Business Name'}
          rating={avgRating}
          totalReviews={reviews.length}
          priceRange="$10-20"
          category={location.primaryCategory?.displayName || 'Coffee shop'}
          onClose={handleClose}
        />

        {/* Photo Gallery */}
        <PhotoGallery
          photos={locationPhotos.map(p => ({
            mediaItemId: p.id,
            googleUrl: p.url,
            category: p.category
          }))}
          totalPhotos={locationPhotos.length || 92}
        />

        {/* Action Buttons */}
        <ActionButtons
          phone={location.primaryPhone}
          website={location.websiteUri}
        />

        {/* Business Tabs */}
        <BusinessTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              <div className="bg-white">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {location.profile?.description || 'Family-run spot for panini, sandwiches and other breakfast eats, plus coffee, some baked goods and a deli vibe.'}
                </p>
              </div>

              {/* Review Summary */}
              <ReviewSummarySection summaries={reviewSummaries} />

              {/* Business Info */}
              <BusinessInfoSection
                businessInfo={{
                  address: location.address?.addressLines?.[0],
                  phone: location.primaryPhone,
                  website: location.websiteUri,
                  hours: {
                    status: 'open',
                    closeTime: '5 PM'
                  }
                }}
              />

              {/* Write a review button */}
              <div className="pt-4">
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                >
                  ✏️ Write a review
                </button>
              </div>
            </div>
          )}

          {/* Menu Tab */}
          {activeTab === 'menu' && (
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Menu</h3>
              <p className="text-sm text-gray-600">Menu information coming soon...</p>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="bg-white rounded-lg">
              {/* Reviews header */}
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Reviews</h3>
                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                  >
                    ✏️ Write a review
                  </button>
                </div>
              </div>

              {/* Reviews list */}
              <div className="px-6">
                {reviews.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-gray-500">No reviews yet. Be the first to write one!</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <ReviewCard key={review.reviewId} review={review as Review} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Debug Log Panel - ALWAYS AT BOTTOM */}
        <DebugLogPanel
          syncStatus={syncStatus}
          logs={syncLogs}
          onForceSyncNow={handleForceSyncNow}
          onChangeInterval={handleChangeInterval}
          onClearLogs={handleClearLogs}
        />
      </div>

      {/* Modals */}
      <ReviewSubmissionModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleReviewSubmit}
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