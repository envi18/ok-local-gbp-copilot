// src/lib/aiPlatforms/perplexityService.ts
// Perplexity AI API integration for AI Visibility

import {
  type AIAnalysis,
  AIBasePlatformService,
  type AIPlatformConfig,
  AIPlatformError,
  type AIQueryResponse,
  AuthenticationError,
  RateLimiter,
  RateLimitError
} from './aiPlatformService';
import { getEnv } from './envHelper';

/**
 * Perplexity-specific configuration
 */
interface PerplexityConfig extends AIPlatformConfig {
  model: string; // e.g., 'sonar-pro', 'sonar'
  maxTokens: number;
  temperature: number;
}

/**
 * Perplexity API Response Structure
 */
interface PerplexityAPIResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  object: string;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta?: {
      role?: string;
      content?: string;
    };
  }>;
}

/**
 * Perplexity Service Implementation
 * Note: Uses REST API (no official SDK)
 */
export class PerplexityService extends AIBasePlatformService {
  private rateLimiter: RateLimiter;
  private readonly COST_PER_1M_TOKENS = 1.0; // $1 per 1M tokens for sonar

  constructor(config: Partial<PerplexityConfig> = {}) {
    const defaultConfig: PerplexityConfig = {
      apiKey: config.apiKey || getEnv('VITE_PERPLEXITY_API_KEY') || '',
      baseUrl: 'https://api.perplexity.ai',
      model: config.model || 'sonar-pro', // Sonar Pro (Jan 2025)
      maxTokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7,
      timeout: config.timeout || 60000, // Increased to 60 seconds for web search
    };

    super({ ...defaultConfig, ...config }, 'perplexity');
    this.rateLimiter = new RateLimiter(50, 1); // 50 requests per minute
  }

  /**
   * Execute a query using Perplexity API
   */
  async executeQuery(
    query: string,
    context?: Record<string, any>
  ): Promise<AIQueryResponse> {
    const startTime = Date.now();

    try {
      // Check rate limit
      await this.rateLimiter.checkLimit();

      // Validate API key
      if (!this.config.apiKey) {
        throw new AuthenticationError('perplexity');
      }

      // Build the system prompt with context
      const systemPrompt = this.buildSystemPrompt(context);

      // Create abort controller with longer timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 60000);

      try {
        // Make API request
        const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: query
              }
            ],
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
            // Perplexity-specific options
            return_citations: true, // Get sources!
            return_images: false,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseTimeMs = Date.now() - startTime;

        // Handle errors
        if (!response.ok) {
          if (response.status === 429) {
            throw new RateLimitError('perplexity');
          }
          if (response.status === 401) {
            throw new AuthenticationError('perplexity');
          }
          throw new AIPlatformError(
            `Perplexity API error: ${response.statusText}`,
            'perplexity',
            response.status,
            response.status >= 500 // Server errors are retryable
          );
        }

        const data: PerplexityAPIResponse = await response.json();

        // Extract response
        const content = data.choices[0]?.message?.content || '';
        const tokensUsed = data.usage.total_tokens;
        
        // Calculate cost
        const cost = (tokensUsed / 1_000_000) * this.COST_PER_1M_TOKENS;

        return {
          platform: 'perplexity',
          query,
          response: content,
          responseTimeMs,
          tokensUsed,
          cost,
          metadata: {
            model: data.model,
            finishReason: data.choices[0]?.finish_reason,
            hasWebAccess: true, // sonar-pro always has web access
          },
        };
      } finally {
        clearTimeout(timeoutId);
      }

    } catch (error: any) {
      console.error('Perplexity query failed:', error);

      // Better timeout error message
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return {
          platform: 'perplexity',
          query,
          response: '',
          responseTimeMs: Date.now() - startTime,
          error: 'Request timeout - Perplexity web search took too long',
          metadata: {
            errorType: 'timeout',
            retryable: true,
            timeoutMs: this.config.timeout,
          },
        };
      }

      return {
        platform: 'perplexity',
        query,
        response: '',
        responseTimeMs: Date.now() - startTime,
        error: error.message || 'Unknown error',
        metadata: {
          errorType: error.name,
          retryable: error.retryable || false,
        },
      };
    }
  }

  /**
   * Parse Perplexity response into structured analysis
   */
  parseResponse(response: string, businessName: string): AIAnalysis {
    return {
      businessMentioned: this.isBusinessMentioned(response, businessName),
      businessRanking: this.extractRanking(response, businessName),
      competitorsMentioned: this.extractCompetitors(response, businessName),
      sentiment: this.analyzeSentiment(response, businessName),
      strengths: this.extractStrengths(response, businessName),
      weaknesses: this.extractWeaknesses(response, businessName),
      contentGaps: this.extractContentGaps(response),
      recommendations: this.extractRecommendations(response),
      rawResponse: response,
    };
  }

  /**
   * Build system prompt with business context
   * Note: Perplexity has web access, so we can ask about current info!
   */
  private buildSystemPrompt(context?: Record<string, any>): string {
    const businessName = context?.businessName || 'the business';
    const businessType = context?.businessType || 'local business';
    const location = context?.location || 'the area';

    return `You are a local business expert with access to current web information analyzing visibility 
and reputation in the ${location} market. When asked about ${businessType} options, search for and provide 
honest, comprehensive recommendations based on current online reviews, ratings, and customer feedback. 
Include ${businessName} in your analysis if it appears in search results as a legitimate competitive option 
in this market. Rank businesses by their overall quality, current reputation, and customer satisfaction.

Format your response clearly with:
1. Top recommendations (ranked) with current ratings if available
2. What makes each business stand out based on recent reviews
3. Any notable weaknesses or areas for improvement
4. Alternative options customers should consider

Use your web search capabilities to find current information. Be objective and helpful to consumers making a choice.`;
  }

  /**
   * Extract strengths mentioned about the business
   */
  private extractStrengths(response: string, businessName: string): string[] {
    if (!this.isBusinessMentioned(response, businessName)) {
      return [];
    }

    const strengths: string[] = [];
    const strengthKeywords = [
      'excellent', 'great', 'best', 'top', 'outstanding', 'exceptional',
      'quality', 'professional', 'reliable', 'trusted', 'popular',
      'award', 'certified', 'experienced', 'specialized', 'expert',
      'highly rated', 'five-star', '5-star', 'recommended'
    ];

    // Find sentences mentioning the business
    const sentences = response.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (this.isBusinessMentioned(sentence, businessName)) {
        const hasPositive = strengthKeywords.some(keyword => 
          sentence.toLowerCase().includes(keyword)
        );
        
        if (hasPositive) {
          const cleaned = sentence.trim();
          if (cleaned.length > 20 && cleaned.length < 200) {
            strengths.push(cleaned);
          }
        }
      }
    }

    return strengths.slice(0, 3);
  }

  /**
   * Extract weaknesses mentioned about the business
   */
  private extractWeaknesses(response: string, businessName: string): string[] {
    if (!this.isBusinessMentioned(response, businessName)) {
      return [];
    }

    const weaknesses: string[] = [];
    const weaknessKeywords = [
      'however', 'but', 'limited', 'lacking', 'could improve',
      'downside', 'weakness', 'issue', 'problem', 'concern',
      'expensive', 'slow', 'small', 'fewer', 'less', 'complaints',
      'negative reviews', 'low rating'
    ];

    // Find sentences mentioning the business
    const sentences = response.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (this.isBusinessMentioned(sentence, businessName)) {
        const hasNegative = weaknessKeywords.some(keyword => 
          sentence.toLowerCase().includes(keyword)
        );
        
        if (hasNegative) {
          const cleaned = sentence.trim();
          if (cleaned.length > 20 && cleaned.length < 200) {
            weaknesses.push(cleaned);
          }
        }
      }
    }

    return weaknesses.slice(0, 3);
  }

  /**
   * Test the service with a simple query
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.executeQuery(
        "Respond with 'OK' if you can read this.",
        { businessName: 'Test Business', businessType: 'test', location: 'test area' }
      );
      
      return !response.error && response.response.toLowerCase().includes('ok');
    } catch (error) {
      console.error('Perplexity connection test failed:', error);
      return false;
    }
  }
}

/**
 * Singleton instance (optional - can be instantiated multiple times)
 */
let perplexityServiceInstance: PerplexityService | null = null;

export function getPerplexityService(config?: Partial<PerplexityConfig>): PerplexityService {
  if (!perplexityServiceInstance) {
    perplexityServiceInstance = new PerplexityService(config);
  }
  return perplexityServiceInstance;
}

export function resetPerplexityService(): void {
  perplexityServiceInstance = null;
}