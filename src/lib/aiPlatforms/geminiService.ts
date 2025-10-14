// src/lib/aiPlatforms/geminiService.ts
// Google Gemini API integration for AI Visibility

import { GoogleGenerativeAI } from '@google/generative-ai';
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
 * Gemini-specific configuration
 */
interface GeminiConfig extends AIPlatformConfig {
  model: string; // e.g., 'gemini-pro', 'gemini-1.5-pro'
  maxTokens: number;
  temperature: number;
}

/**
 * Gemini Service Implementation
 */
export class GeminiService extends AIBasePlatformService {
  private client: GoogleGenerativeAI;
  private rateLimiter: RateLimiter;
  private readonly COST_PER_1K_INPUT_TOKENS = 0.00025; // Gemini Pro pricing (paid tier)
  private readonly COST_PER_1K_OUTPUT_TOKENS = 0.0005;

  constructor(config: Partial<GeminiConfig> = {}) {
    const defaultConfig: GeminiConfig = {
      apiKey: config.apiKey || getEnv('VITE_GOOGLE_AI_API_KEY') || '',
      baseUrl: 'https://generativelanguage.googleapis.com',
model: config.model || 'gemini-2.5-pro', // Gemini 2.5 Pro (June 2025)
      maxTokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7,
      timeout: config.timeout || 30000,
    };

    super({ ...defaultConfig, ...config }, 'gemini');

    // Initialize Google Generative AI client
    this.client = new GoogleGenerativeAI(this.config.apiKey);

    this.rateLimiter = new RateLimiter(60, 1); // 60 requests per minute (free tier)
  }

  /**
   * Execute a query using Gemini API
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
        throw new AuthenticationError('gemini');
      }

      // Get the model
      const model = this.client.getGenerativeModel({ 
        model: this.config.model as string,
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens,
        },
      });

      // Build the prompt with context
      const systemPrompt = this.buildSystemPrompt(context);
      const fullPrompt = `${systemPrompt}\n\nUser Query: ${query}`;

      // Generate content
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const responseText = response.text();

      const responseTimeMs = Date.now() - startTime;

      // Estimate token usage (Gemini doesn't always provide exact counts)
      const estimatedInputTokens = Math.ceil(fullPrompt.length / 4);
      const estimatedOutputTokens = Math.ceil(responseText.length / 4);
      const totalTokens = estimatedInputTokens + estimatedOutputTokens;

      // Calculate cost (free tier = $0, but we estimate for paid)
      const inputCost = this.calculateCost(estimatedInputTokens, this.COST_PER_1K_INPUT_TOKENS);
      const outputCost = this.calculateCost(estimatedOutputTokens, this.COST_PER_1K_OUTPUT_TOKENS);
      const totalCost = inputCost + outputCost;

      return {
        platform: 'gemini',
        query,
        response: responseText,
        responseTimeMs,
        tokensUsed: totalTokens,
        cost: totalCost,
        metadata: {
          model: this.config.model,
          estimatedTokens: true, // Indicate these are estimates
          promptFeedback: response.promptFeedback,
        },
      };

    } catch (error: any) {
      console.error('Gemini query failed:', error);

      // Handle specific error types
      if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
        throw new RateLimitError('gemini');
      }
      if (error.message?.includes('API key') || error.message?.includes('authentication')) {
        throw new AuthenticationError('gemini');
      }

      return {
        platform: 'gemini',
        query,
        response: '',
        responseTimeMs: Date.now() - startTime,
        error: error.message || 'Gemini API error',
        metadata: {
          errorType: error.name || 'unknown',
          retryable: error.message?.includes('500') || error.message?.includes('503'),
        },
      };
    }
  }

  /**
   * Parse Gemini response into structured analysis
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
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }
}

/**
 * Singleton instance (optional - can be instantiated multiple times)
 */
let geminiServiceInstance: GeminiService | null = null;

export function getGeminiService(config?: Partial<GeminiConfig>): GeminiService {
  if (!geminiServiceInstance) {
    geminiServiceInstance = new GeminiService(config);
  }
  return geminiServiceInstance;
}

export function resetGeminiService(): void {
  geminiServiceInstance = null;
}