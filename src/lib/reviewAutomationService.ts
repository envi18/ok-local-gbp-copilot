// reviewAutomationService.ts - Enhanced with Background Sync System
import type { BusinessReview } from '../lib/mockGoogleBusinessData';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AutomationRule {
  condition: (starRating: number) => boolean;
  action: 'auto_respond' | 'draft_response' | 'manual_only';
  description: string;
  responseDelay?: number;
}

export interface SEOKeywords {
  primary: string[];
  secondary: string[];
  service: string[];
}

export interface SyncLog {
  id: string;
  timestamp: string;
  type: 'sync' | 'review' | 'automation' | 'error' | 'info';
  message: string;
  details?: any;
}

export interface SyncStatus {
  lastSync: string | null;
  nextSync: string | null;
  isRunning: boolean;
  interval: number; // in milliseconds
  pendingReviews: number;
  totalSyncs: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Production sync interval: 2 hours = 7,200,000 ms
export const SYNC_INTERVAL_PRODUCTION = 2 * 60 * 60 * 1000; // 2 hours
export const SYNC_INTERVAL_DEMO = 30 * 1000; // 30 seconds for quick demos

export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    condition: (rating) => rating === 5,
    action: 'auto_respond',
    description: '5-star reviews: Auto-respond with AI-generated reply',
    responseDelay: 2000
  },
  {
    condition: (rating) => rating === 4,
    action: 'draft_response',
    description: '4-star reviews: Generate draft for approval',
    responseDelay: 1500
  },
  {
    condition: (rating) => rating <= 3 && rating >= 1,
    action: 'manual_only',
    description: '1-3 star reviews: Flag for manual response',
    responseDelay: 0
  }
];

export const DEFAULT_SEO_KEYWORDS: SEOKeywords = {
  primary: ['best coffee shop in Oklahoma City', 'local coffee house'],
  secondary: ['Oklahoma City', 'downtown OKC', 'organic coffee'],
  service: ['espresso', 'latte', 'cold brew', 'free WiFi']
};

// ============================================================================
// SYNC LOG MANAGER
// ============================================================================

class SyncLogManager {
  private logs: SyncLog[] = [];
  private maxLogs = 50;

  addLog(type: SyncLog['type'], message: string, details?: any): SyncLog {
    const log: SyncLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      details
    };

    this.logs.unshift(log); // Add to beginning
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs); // Keep only recent logs
    }

    return log;
  }

  getLogs(limit?: number): SyncLog[] {
    return limit ? this.logs.slice(0, limit) : this.logs;
  }

  getLogsByType(type: SyncLog['type'], limit?: number): SyncLog[] {
    const filtered = this.logs.filter(log => log.type === type);
    return limit ? filtered.slice(0, limit) : filtered;
  }

  clearLogs(): void {
    this.logs = [];
  }

  getLastSync(): SyncLog | null {
    return this.logs.find(log => log.type === 'sync') || null;
  }
}

export const syncLogManager = new SyncLogManager();

// ============================================================================
// AUTOMATION FUNCTIONS
// ============================================================================

export function getAutomationAction(starRating: number): AutomationRule | null {
  return DEFAULT_AUTOMATION_RULES.find(rule => rule.condition(starRating)) || null;
}

export async function generateAIReviewResponse(
  reviewText: string,
  starRating: number,
  reviewerName: string,
  keywords: SEOKeywords
): Promise<string> {
  // Check if OpenAI API key exists
  const hasOpenAI = import.meta.env.VITE_OPENAI_API_KEY;

  if (!hasOpenAI) {
    return generateTemplateResponse(reviewText, starRating, reviewerName, keywords);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a professional business owner responding to a Google Business Profile review. 
Write a warm, professional response that:
- Thanks the customer by name
- Acknowledges their specific feedback
- Naturally includes 1-2 of these SEO keywords: ${[...keywords.primary, ...keywords.secondary].join(', ')}
- Keeps response under 150 words
- Maintains a friendly, professional tone
- Ends with an invitation to return`
          },
          {
            role: 'user',
            content: `Write a response to this ${starRating}-star review from ${reviewerName}: "${reviewText}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || generateTemplateResponse(reviewText, starRating, reviewerName, keywords);
  } catch (error) {
    console.error('AI response generation failed, using template:', error);
    return generateTemplateResponse(reviewText, starRating, reviewerName, keywords);
  }
}

function generateTemplateResponse(
  reviewText: string,
  starRating: number,
  reviewerName: string,
  keywords: SEOKeywords
): string {
  const templates = {
    5: [
      `Thank you so much for the wonderful 5-star review, ${reviewerName}! We're thrilled to hear you enjoyed your experience at our ${keywords.primary[0]}. Your support means the world to us, and we can't wait to welcome you back soon!`,
      `${reviewerName}, we're so grateful for your amazing feedback! It's customers like you that make us proud to be a ${keywords.primary[1]} in ${keywords.secondary[0]}. Thanks for choosing us, and we hope to see you again soon!`,
      `Wow, thank you ${reviewerName}! Your 5-star review made our day! We work hard to provide the best ${keywords.service[0]} and ${keywords.service[1]} experience in ${keywords.secondary[1]}, and we're so glad it shows. Come back soon!`
    ],
    4: [
      `Thank you for the 4-star review, ${reviewerName}! We appreciate your feedback and are always looking for ways to improve. We'd love to hear more about your experience and how we can make it 5 stars next time. Hope to see you again at our ${keywords.primary[1]}!`,
      `${reviewerName}, we really appreciate you taking the time to leave a review! We're glad you enjoyed your visit to our ${keywords.primary[0]}. We'd love to know what we could do better - your feedback helps us improve. Thanks for your support!`
    ],
    3: [
      `Thank you for your feedback, ${reviewerName}. We're sorry we didn't fully meet your expectations. We'd love to hear more about your experience so we can make things right. Please reach out to us directly - your satisfaction is important to us at ${keywords.primary[1]}.`,
      `${reviewerName}, thank you for sharing your thoughts. We take all feedback seriously and would appreciate the opportunity to discuss your visit further. Please contact us so we can address your concerns and improve your experience at our ${keywords.secondary[0]} location.`
    ],
    2: [
      `We're truly sorry to hear about your experience, ${reviewerName}. This is not the level of service we strive for at ${keywords.primary[1]}. We'd like to make this right - please contact us directly so we can discuss what happened and ensure it doesn't happen again.`,
      `${reviewerName}, we sincerely apologize for not meeting your expectations. Your feedback is valuable, and we'd like to understand what went wrong. Please reach out to us so we can address your concerns properly. Thank you for giving us the opportunity to improve.`
    ],
    1: [
      `${reviewerName}, we're deeply sorry for your disappointing experience. This is absolutely not acceptable, and we take full responsibility. Please contact us immediately at [contact info] so we can make this right. Your feedback will help us prevent this from happening again.`,
      `We're extremely sorry for your experience, ${reviewerName}. This falls far short of our standards at ${keywords.primary[1]}. We would like to speak with you directly to understand what happened and make it right. Please contact us as soon as possible.`
    ]
  };

  const ratingKey = starRating as keyof typeof templates;
  const options = templates[ratingKey] || templates[3];
  return options[Math.floor(Math.random() * options.length)];
}

export function simulateProcessingDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// BACKGROUND SYNC SYSTEM
// ============================================================================

export class BackgroundSyncManager {
  private syncInterval: number;
  private syncTimer: number | null = null;
  private isRunning = false;
  private lastSyncTime: string | null = null;
  private nextSyncTime: string | null = null;
  private pendingReviews: BusinessReview[] = [];
  private totalSyncs = 0;
  private onSyncCallback: ((reviews: BusinessReview[]) => void) | null = null;
  private onLogCallback: ((log: SyncLog) => void) | null = null;

  constructor(intervalMs: number = SYNC_INTERVAL_PRODUCTION) {
    this.syncInterval = intervalMs;
    this.calculateNextSync();
  }

  private calculateNextSync(): void {
    if (this.lastSyncTime) {
      const lastSync = new Date(this.lastSyncTime);
      const nextSync = new Date(lastSync.getTime() + this.syncInterval);
      this.nextSyncTime = nextSync.toISOString();
    } else {
      const nextSync = new Date(Date.now() + this.syncInterval);
      this.nextSyncTime = nextSync.toISOString();
    }
  }

  private addLog(type: SyncLog['type'], message: string, details?: any): void {
    const log = syncLogManager.addLog(type, message, details);
    if (this.onLogCallback) {
      this.onLogCallback(log);
    }
  }

  start(): void {
    if (this.isRunning) {
      this.addLog('info', '⚠️ Sync already running');
      return;
    }

    this.isRunning = true;
    this.addLog('info', `🚀 Background sync started (interval: ${this.formatInterval()})`);
    
    // Schedule next sync
    this.scheduleNextSync();
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.syncTimer !== null) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    this.addLog('info', '⏸️ Background sync stopped');
  }

  private scheduleNextSync(): void {
    if (!this.isRunning) return;

    this.calculateNextSync();
    
    this.syncTimer = window.setTimeout(() => {
      this.runSync();
    }, this.syncInterval);
  }

  private async runSync(): Promise<void> {
    this.totalSyncs++;
    this.lastSyncTime = new Date().toISOString();
    
    this.addLog('sync', `🔄 Running sync #${this.totalSyncs}...`);

    try {
      // Check for pending reviews
      const reviewsToProcess = [...this.pendingReviews];
      this.pendingReviews = [];

      if (reviewsToProcess.length === 0) {
        this.addLog('info', '✅ Sync complete - No new reviews found');
      } else {
        this.addLog('review', `📥 Found ${reviewsToProcess.length} new review(s)`);

        // Process each review with automation
        for (const review of reviewsToProcess) {
          await this.processReview(review);
        }

        // Notify callback
        if (this.onSyncCallback) {
          this.onSyncCallback(reviewsToProcess);
        }

        this.addLog('sync', `✅ Sync complete - Processed ${reviewsToProcess.length} review(s)`);
      }

      // Update sync stats
      this.addLog('info', `📊 Total syncs: ${this.totalSyncs} | Next sync: ${this.formatTimeUntilNext()}`);

    } catch (error) {
      this.addLog('error', `❌ Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Schedule next sync
    this.scheduleNextSync();
  }

  private async processReview(review: BusinessReview): Promise<void> {
    const rule = getAutomationAction(review.starRating || 0);
    
    if (!rule) {
      this.addLog('error', `❌ No automation rule found for rating: ${review.starRating}`);
      return;
    }

    this.addLog('automation', `🤖 Processing review #${review.reviewId} (${review.starRating}⭐) - Action: ${rule.action}`);

    if (rule.action === 'manual_only') {
      this.addLog('automation', `⚠️ Review #${review.reviewId} flagged for manual response`);
      
    } else if (rule.action === 'draft_response') {
      this.addLog('automation', `⏳ Generating draft response for review #${review.reviewId}...`);
      
      await simulateProcessingDelay(1000);
      const draftResponse = await generateAIReviewResponse(
        review.comment || '',
        review.starRating || 0,
        review.reviewer?.displayName || 'Customer',
        DEFAULT_SEO_KEYWORDS
      );
      
      this.addLog('automation', `✅ Draft response generated (${draftResponse.length} chars) - Awaiting approval`);
      this.addLog('info', `📧 Notification sent to business owner`);
      
    } else if (rule.action === 'auto_respond') {
      this.addLog('automation', `⏳ Generating AI response for review #${review.reviewId}...`);
      
      await simulateProcessingDelay(1500);
      const autoResponse = await generateAIReviewResponse(
        review.comment || '',
        review.starRating || 0,
        review.reviewer?.displayName || 'Customer',
        DEFAULT_SEO_KEYWORDS
      );
      
      this.addLog('automation', `✅ AI response generated (${autoResponse.length} chars)`);
      
      await simulateProcessingDelay(500);
      this.addLog('automation', `📤 Publishing response to Google Business Profile...`);
      
      // Add response to review
      review.reviewReply = {
        comment: autoResponse,
        updateTime: new Date().toISOString()
      };
      
      this.addLog('automation', `✅ Response published successfully!`);
    }
  }

  addPendingReview(review: BusinessReview): void {
    this.pendingReviews.push(review);
    this.addLog('review', `📨 New review queued for next sync (${review.starRating}⭐ by ${review.reviewer?.displayName})`);
    this.addLog('info', `⏰ Will be processed in ${this.formatTimeUntilNext()}`);
  }

  forceSyncNow(): void {
    this.addLog('info', '⚡ Force sync triggered!');
    if (this.syncTimer !== null) {
      clearTimeout(this.syncTimer);
    }
    this.runSync();
  }

  setInterval(intervalMs: number): void {
    const oldInterval = this.syncInterval;
    this.syncInterval = intervalMs;
    this.addLog('info', `⚙️ Sync interval changed: ${this.formatDuration(oldInterval)} → ${this.formatDuration(intervalMs)}`);
    
    // Restart sync with new interval
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  getStatus(): SyncStatus {
    return {
      lastSync: this.lastSyncTime,
      nextSync: this.nextSyncTime,
      isRunning: this.isRunning,
      interval: this.syncInterval,
      pendingReviews: this.pendingReviews.length,
      totalSyncs: this.totalSyncs
    };
  }

  onSync(callback: (reviews: BusinessReview[]) => void): void {
    this.onSyncCallback = callback;
  }

  onLog(callback: (log: SyncLog) => void): void {
    this.onLogCallback = callback;
  }

  private formatInterval(): string {
    return this.formatDuration(this.syncInterval);
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
  }

  private formatTimeUntilNext(): string {
    if (!this.nextSyncTime) return 'Unknown';
    
    const now = Date.now();
    const next = new Date(this.nextSyncTime).getTime();
    const diff = next - now;
    
    if (diff < 0) return 'Now';
    
    return this.formatDuration(diff);
  }
}