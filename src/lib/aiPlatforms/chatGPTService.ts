// src/lib/aiPlatforms/chatGPTService.ts
// ChatGPT/OpenAI API integration for AI Visibility

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
 * ChatGPT-specific configuration
 */
interface ChatGPTConfig extends AIPlatformConfig {
  model: string; // e.g., 'gpt-4-turbo-preview', 'gpt-3.5-turbo'
  maxTokens: number;
  temperature: number;
}

/**
 * ChatGPT API Response Structure
 */
interface ChatGPTAPIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * ChatGPT Service Implementation
 */
export class ChatGPTService extends AIBasePlatformService {
  private rateLimiter: RateLimiter;
  private readonly COST_PER_1K_TOKENS = 0.01; // Approximate cost for GPT-4

  constructor(config: Partial<ChatGPTConfig> = {}) {
    const defaultConfig: ChatGPTConfig = {
      apiKey: config.apiKey || getEnv('VITE_OPENAI_API_KEY') || '',
      baseUrl: 'https://api.openai.com/v1',
      model: config.model || 'gpt-4-turbo-preview',
      maxTokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7,
      timeout: config.timeout || 30000,
    };

    super({ ...defaultConfig, ...config }, 'chatgpt');
    this.rateLimiter = new RateLimiter(60, 1); // 60 requests per minute
  }

  /**
   * Execute a query using ChatGPT API
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
        throw new AuthenticationError('chatgpt');
      }

      // Build the prompt with context
      const systemPrompt = this.buildSystemPrompt(context);
      
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
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
        }),
        signal: AbortSignal.timeout(this.config.timeout || 30000),
      });

      const responseTimeMs = Date.now() - startTime;

      // Handle errors
      if (!response.ok) {
        if (response.status === 429) {
          throw new RateLimitError('chatgpt');
        }
        if (response.status === 401) {
          throw new AuthenticationError('chatgpt');
        }
        throw new AIPlatformError(
          `ChatGPT API error: ${response.statusText}`,
          'chatgpt',
          response.status,
          response.status >= 500 // Server errors are retryable
        );
      }

      const data: ChatGPTAPIResponse = await response.json();

      // Extract response
      const content = data.choices[0]?.message?.content || '';
      const tokensUsed = data.usage.total_tokens;
      const cost = this.calculateCost(tokensUsed, this.COST_PER_1K_TOKENS);

      return {
        platform: 'chatgpt',
        query,
        response: content,
        responseTimeMs,
        tokensUsed,
        cost,
        metadata: {
          model: data.model,
          finishReason: data.choices[0]?.finish_reason,
        },
      };

    } catch (error: any) {
      console.error('ChatGPT query failed:', error);

      return {
        platform: 'chatgpt',
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
   * Parse ChatGPT response into structured analysis
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
        // Check if this sentence contains positive keywords
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
        // Check if this sentence contains negative/constructive keywords
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
      console.error('ChatGPT connection test failed:', error);
      return false;
    }
  }
}

/**
 * Singleton instance (optional - can be instantiated multiple times)
 */
let chatGPTServiceInstance: ChatGPTService | null = null;

export function getChatGPTService(config?: Partial<ChatGPTConfig>): ChatGPTService {
  if (!chatGPTServiceInstance) {
    chatGPTServiceInstance = new ChatGPTService(config);
  }
  return chatGPTServiceInstance;
}

export function resetChatGPTService(): void {
  chatGPTServiceInstance = null;
}