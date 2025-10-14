// src/lib/aiPlatforms/claudeService.ts
// Anthropic Claude API integration for AI Visibility

import Anthropic from '@anthropic-ai/sdk';
import {
  type AIAnalysis,
  AIBasePlatformService,
  type AIPlatformConfig,
  type AIQueryResponse,
  AuthenticationError,
  RateLimiter,
  RateLimitError
} from './aiPlatformService';
import { getEnv } from './envHelper';

/**
 * Claude-specific configuration
 */
interface ClaudeConfig extends AIPlatformConfig {
  model: string; // e.g., 'claude-sonnet-4-5-20250929', 'claude-3-haiku-20240307'
  maxTokens: number;
  temperature: number;
}

/**
 * Claude Service Implementation
 */
export class ClaudeService extends AIBasePlatformService {
  private client: Anthropic;
  private rateLimiter: RateLimiter;
  private readonly COST_PER_1K_INPUT_TOKENS = 0.003; // Sonnet 4.5 pricing
  private readonly COST_PER_1K_OUTPUT_TOKENS = 0.015;

  constructor(config: Partial<ClaudeConfig> = {}) {
    const defaultConfig: ClaudeConfig = {
      apiKey: config.apiKey || getEnv('VITE_ANTHROPIC_API_KEY') || '',
      baseUrl: 'https://api.anthropic.com',
      model: config.model || 'claude-sonnet-4-5-20250929', // Claude Sonnet 4.5 (Sept 2025)
      maxTokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7,
      timeout: config.timeout || 30000,
    };

    super({ ...defaultConfig, ...config }, 'claude');

    // Initialize Anthropic client
    this.client = new Anthropic({
      apiKey: this.config.apiKey,
    });

    this.rateLimiter = new RateLimiter(50, 1); // 50 requests per minute for Tier 1
  }

  /**
   * Execute a query using Claude API
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
        throw new AuthenticationError('claude');
      }

      // Build the system prompt with context
      const systemPrompt = this.buildSystemPrompt(context);

      // Make API request using the SDK
      const message = await this.client.messages.create({
        model: this.config.model as string,
        max_tokens: this.config.maxTokens as number,
        temperature: this.config.temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: query
          }
        ],
      });

      const responseTimeMs = Date.now() - startTime;

      // Extract response text
      const content = message.content[0];
      const responseText = content.type === 'text' ? content.text : '';

      // Calculate cost based on usage
      const inputTokens = message.usage.input_tokens;
      const outputTokens = message.usage.output_tokens;
      const totalTokens = inputTokens + outputTokens;
      
      const inputCost = this.calculateCost(inputTokens, this.COST_PER_1K_INPUT_TOKENS);
      const outputCost = this.calculateCost(outputTokens, this.COST_PER_1K_OUTPUT_TOKENS);
      const totalCost = inputCost + outputCost;

      return {
        platform: 'claude',
        query,
        response: responseText,
        responseTimeMs,
        tokensUsed: totalTokens,
        cost: totalCost,
        metadata: {
          model: message.model,
          stopReason: message.stop_reason,
          inputTokens,
          outputTokens,
        },
      };

    } catch (error: any) {
      console.error('Claude query failed:', error);

      // Handle specific error types
      if (error instanceof Anthropic.APIError) {
        if (error.status === 429) {
          throw new RateLimitError('claude');
        }
        if (error.status === 401) {
          throw new AuthenticationError('claude');
        }
        
        return {
          platform: 'claude',
          query,
          response: '',
          responseTimeMs: Date.now() - startTime,
          error: error.message || 'Claude API error',
          metadata: {
            errorType: 'api_error',
            statusCode: error.status || undefined,
            retryable: (error.status || 0) >= 500,
          },
        };
      }

      return {
        platform: 'claude',
        query,
        response: '',
        responseTimeMs: Date.now() - startTime,
        error: error.message || 'Unknown error',
        metadata: {
          errorType: error.name,
          retryable: false,
        },
      };
    }
  }

  /**
   * Parse Claude response into structured analysis
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
   */
  private buildSystemPrompt(context?: Record<string, any>): string {
    const businessName = context?.businessName || 'the business';
    const businessType = context?.businessType || 'local business';
    const location = context?.location || 'the area';

    return `You are a local business expert analyzing visibility and reputation in the ${location} market. 
When asked about ${businessType} options, provide honest, comprehensive recommendations based on quality, 
reputation, and customer satisfaction. Include ${businessName} in your analysis if it's a legitimate 
competitive option in this market. Rank businesses by their overall quality and reputation.

Format your response clearly with:
1. Top recommendations (ranked)
2. What makes each business stand out
3. Any notable weaknesses or areas for improvement
4. Alternative options customers should consider

Be objective and helpful to consumers making a choice.`;
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
      'award', 'certified', 'experienced', 'specialized', 'expert'
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
      'expensive', 'slow', 'small', 'fewer', 'less'
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
      console.error('Claude connection test failed:', error);
      return false;
    }
  }
}

/**
 * Singleton instance (optional - can be instantiated multiple times)
 */
let claudeServiceInstance: ClaudeService | null = null;

export function getClaudeService(config?: Partial<ClaudeConfig>): ClaudeService {
  if (!claudeServiceInstance) {
    claudeServiceInstance = new ClaudeService(config);
  }
  return claudeServiceInstance;
}

export function resetClaudeService(): void {
  claudeServiceInstance = null;
}