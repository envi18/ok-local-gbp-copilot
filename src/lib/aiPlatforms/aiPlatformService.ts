// src/lib/aiPlatforms/aiPlatformService.ts
// Base architecture for AI platform integrations

import type { AIPlatform } from '../../types/aiVisibility';

/**
 * Configuration for AI Platform API
 */
export interface AIPlatformConfig {
  apiKey: string;
  baseUrl: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

/**
 * Response from AI Platform Query
 */
export interface AIQueryResponse {
  platform: AIPlatform;
  query: string;
  response: string;
  responseTimeMs: number;
  tokensUsed?: number;
  cost?: number;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Parsed Analysis from AI Response
 */
export interface AIAnalysis {
  businessMentioned: boolean;
  businessRanking: number | null;
  competitorsMentioned: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  strengths: string[];
  weaknesses: string[];
  contentGaps: string[];
  recommendations: string[];
  rawResponse: string;
}

/**
 * Base class for AI Platform integrations
 */
export abstract class AIBasePlatformService {
  protected config: AIPlatformConfig;
  protected platform: AIPlatform;

  constructor(config: AIPlatformConfig, platform: AIPlatform) {
    this.config = config;
    this.platform = platform;
  }

  /**
   * Execute a query on the AI platform
   */
  abstract executeQuery(query: string, context?: Record<string, any>): Promise<AIQueryResponse>;

  /**
   * Parse the AI response into structured analysis
   */
  abstract parseResponse(response: string, businessName: string): AIAnalysis;

  /**
   * Check if the platform is available and configured
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testQuery = "Hello, are you available?";
      const response = await this.executeQuery(testQuery);
      return !response.error;
    } catch (error) {
      console.error(`${this.platform} health check failed:`, error);
      return false;
    }
  }

  /**
   * Calculate approximate cost based on tokens used
   */
  protected calculateCost(tokensUsed: number, costPerToken: number): number {
    return (tokensUsed * costPerToken) / 1000; // Cost per 1K tokens
  }

  /**
   * Extract competitors from AI response
   */
  protected extractCompetitors(response: string, businessName: string): string[] {
    const competitors: string[] = [];
    
    // Look for patterns like:
    // "Top competitors include: X, Y, Z"
    // "Similar businesses: A, B, C"
    // "Other options: D, E, F"
    
    const patterns = [
      /(?:competitors?|alternatives?|similar (?:businesses?|companies?|services?)|other options?)(?:\s+(?:include|are|like|such as))?\s*:?\s*([^.!?\n]+)/gi,
      /(?:compared to|versus|vs\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    ];

    for (const pattern of patterns) {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        const segment = match[1];
        // Split by common delimiters
        const names = segment.split(/,|\sand\s|\sor\s/).map(s => s.trim());
        
        for (const name of names) {
          // Clean up the name and validate
          const cleaned = name.replace(/[^a-zA-Z\s]/g, '').trim();
          
          // Exclude the business itself and common words
          if (
            cleaned &&
            cleaned.length > 2 &&
            !cleaned.toLowerCase().includes(businessName.toLowerCase()) &&
            !['the', 'and', 'or', 'other', 'more', 'such', 'like'].includes(cleaned.toLowerCase())
          ) {
            competitors.push(cleaned);
          }
        }
      }
    }

    // Remove duplicates and return
    return Array.from(new Set(competitors)).slice(0, 10); // Limit to 10 competitors
  }

  /**
   * Determine if business was mentioned in response
   */
  protected isBusinessMentioned(response: string, businessName: string): boolean {
    const lowerResponse = response.toLowerCase();
    const lowerBusiness = businessName.toLowerCase();
    
    // Check for direct mention
    if (lowerResponse.includes(lowerBusiness)) {
      return true;
    }

    // Check for variations (e.g., "Joe's Coffee" vs "Joe Coffee")
    const businessWords = lowerBusiness.split(/\s+/);
    return businessWords.every(word => 
      word.length > 2 && lowerResponse.includes(word)
    );
  }

  /**
   * Extract business ranking from response
   */
  protected extractRanking(response: string, businessName: string): number | null {
    // Look for patterns like:
    // "1. Business Name"
    // "#1: Business Name"
    // "Top choice: Business Name"
    
    const lines = response.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if business is mentioned in this line
      if (this.isBusinessMentioned(line, businessName)) {
        // Look for ranking indicators
        const rankMatch = line.match(/^(?:#?(\d+)[.:\)]|\*\*(\d+)\.\*\*)/);
        if (rankMatch) {
          return parseInt(rankMatch[1] || rankMatch[2]);
        }
        
        // If it's in the first few lines without explicit numbering, assume it's highly ranked
        if (i < 3) {
          return i + 1;
        }
      }
    }

    return null;
  }

  /**
   * Analyze sentiment of the mention
   */
  protected analyzeSentiment(response: string, businessName: string): 'positive' | 'neutral' | 'negative' | null {
    const lowerResponse = response.toLowerCase();
    
    // Find the section mentioning the business
    const businessIndex = lowerResponse.indexOf(businessName.toLowerCase());
    if (businessIndex === -1) return null;

    // Get a window of text around the mention (200 chars before and after)
    const start = Math.max(0, businessIndex - 200);
    const end = Math.min(lowerResponse.length, businessIndex + businessName.length + 200);
    const context = lowerResponse.substring(start, end);

    // Positive indicators
    const positiveWords = [
      'excellent', 'outstanding', 'best', 'top', 'great', 'amazing',
      'highly recommended', 'quality', 'superior', 'exceptional',
      'popular', 'favorite', 'award', 'praised', 'renowned'
    ];

    // Negative indicators
    const negativeWords = [
      'poor', 'worst', 'bad', 'disappointing', 'mediocre',
      'avoid', 'lacking', 'limited', 'inferior', 'subpar',
      'complaints', 'issues', 'problems', 'unreliable'
    ];

    const positiveCount = positiveWords.filter(word => context.includes(word)).length;
    const negativeCount = negativeWords.filter(word => context.includes(word)).length;

    if (positiveCount > negativeCount && positiveCount > 0) return 'positive';
    if (negativeCount > positiveCount && negativeCount > 0) return 'negative';
    return 'neutral';
  }

  /**
   * Extract content gaps from response
   */
  protected extractContentGaps(response: string): string[] {
    const gaps: string[] = [];
    
    // Look for patterns indicating missing content
    const gapPatterns = [
      /(?:could improve|should add|missing|lacks?|doesn't have|would benefit from|consider adding)\s+([^.!?\n]+)/gi,
      /(?:competitors have|others offer|also provides?)\s+([^.!?\n]+)/gi,
    ];

    for (const pattern of gapPatterns) {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        const gap = match[1].trim();
        if (gap && gap.length > 10 && gap.length < 200) {
          gaps.push(gap);
        }
      }
    }

    return Array.from(new Set(gaps)).slice(0, 5);
  }

  /**
   * Extract recommendations from response
   */
  protected extractRecommendations(response: string): string[] {
    const recommendations: string[] = [];
    
    // Look for recommendation patterns
    const recPatterns = [
      /(?:recommend|suggest|should|could|try|consider)\s+([^.!?\n]+)/gi,
      /(?:tip|advice|best practice):\s*([^.!?\n]+)/gi,
    ];

    for (const pattern of recPatterns) {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        const rec = match[1].trim();
        if (rec && rec.length > 15 && rec.length < 200) {
          recommendations.push(rec);
        }
      }
    }

    return Array.from(new Set(recommendations)).slice(0, 5);
  }
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindowMs: number;

  constructor(maxRequests: number = 60, timeWindowMinutes: number = 1) {
    this.maxRequests = maxRequests;
    this.timeWindowMs = timeWindowMinutes * 60 * 1000;
  }

  async checkLimit(): Promise<boolean> {
    const now = Date.now();
    
    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindowMs);
    
    // Check if we're at the limit
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindowMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        console.warn(`Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.checkLimit(); // Retry after waiting
      }
    }
    
    // Add this request
    this.requests.push(now);
    return true;
  }

  reset(): void {
    this.requests = [];
  }
}

/**
 * Error types for AI platform operations
 */
export class AIPlatformError extends Error {
  constructor(
    message: string,
    public platform: AIPlatform,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIPlatformError';
  }
}

export class RateLimitError extends AIPlatformError {
  constructor(platform: AIPlatform) {
    super(`Rate limit exceeded for ${platform}`, platform, 429, true);
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends AIPlatformError {
  constructor(platform: AIPlatform) {
    super(`Authentication failed for ${platform}`, platform, 401, false);
    this.name = 'AuthenticationError';
  }
}