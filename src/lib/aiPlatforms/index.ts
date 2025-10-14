// src/lib/aiPlatforms/index.ts
// Central export and factory for all AI platform services

import type { AIPlatform } from '../../types/aiVisibility';
import { ChatGPTService, getChatGPTService, resetChatGPTService } from './chatGPTService';
import { ClaudeService, getClaudeService, resetClaudeService } from './claudeService';
import { GeminiService, getGeminiService, resetGeminiService } from './geminiService';
import { PerplexityService, getPerplexityService, resetPerplexityService } from './perplexityService';

/**
 * Platform service types
 */
type PlatformService = ChatGPTService | ClaudeService | GeminiService | PerplexityService;

/**
 * Platform configuration options
 */
export interface PlatformOptions {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

/**
 * Health check result for a platform
 */
export interface PlatformHealth {
  platform: AIPlatform;
  available: boolean;
  configured: boolean;
  responseTime?: number;
  error?: string;
}

/**
 * Get a specific platform service
 */
export function getPlatformService(
  platform: AIPlatform,
  options?: PlatformOptions
): PlatformService {
  switch (platform) {
    case 'chatgpt':
      return getChatGPTService(options);
    case 'claude':
      return getClaudeService(options);
    case 'gemini':
      return getGeminiService(options);
    case 'perplexity':
      return getPerplexityService(options);
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

/**
 * Get all available platform services
 */
export function getAllPlatformServices(options?: PlatformOptions): Map<AIPlatform, PlatformService> {
  const services = new Map<AIPlatform, PlatformService>();
  
  const platforms: AIPlatform[] = ['chatgpt', 'claude', 'gemini', 'perplexity'];
  
  for (const platform of platforms) {
    try {
      const service = getPlatformService(platform, options);
      services.set(platform, service);
    } catch (error) {
      console.warn(`Failed to initialize ${platform} service:`, error);
    }
  }
  
  return services;
}

/**
 * Check health of a specific platform
 */
export async function checkPlatformHealth(platform: AIPlatform): Promise<PlatformHealth> {
  const startTime = Date.now();
  
  try {
    const service = getPlatformService(platform);
    
    // Check if API key is configured
    const configured = !!service['config']?.apiKey;
    
    if (!configured) {
      return {
        platform,
        available: false,
        configured: false,
        error: 'API key not configured',
      };
    }
    
    // Test the connection
    const available = await service.testConnection();
    const responseTime = Date.now() - startTime;
    
    return {
      platform,
      available,
      configured: true,
      responseTime,
    };
    
  } catch (error: any) {
    return {
      platform,
      available: false,
      configured: false,
      responseTime: Date.now() - startTime,
      error: error.message,
    };
  }
}

/**
 * Check health of all platforms
 */
export async function checkAllPlatformsHealth(): Promise<Map<AIPlatform, PlatformHealth>> {
  const results = new Map<AIPlatform, PlatformHealth>();
  const platforms: AIPlatform[] = ['chatgpt', 'claude', 'gemini', 'perplexity'];
  
  // Check all platforms in parallel
  const healthChecks = platforms.map(platform => 
    checkPlatformHealth(platform).then(health => ({ platform, health }))
  );
  
  const healthResults = await Promise.all(healthChecks);
  
  for (const { platform, health } of healthResults) {
    results.set(platform, health);
  }
  
  return results;
}

/**
 * Get list of available (configured and working) platforms
 */
export async function getAvailablePlatforms(): Promise<AIPlatform[]> {
  const healthResults = await checkAllPlatformsHealth();
  const available: AIPlatform[] = [];
  
  for (const [platform, health] of healthResults) {
    if (health.available) {
      available.push(platform);
    }
  }
  
  return available;
}

/**
 * Reset all platform service singletons
 * Useful for testing or when changing configurations
 */
export function resetAllPlatformServices(): void {
  resetChatGPTService();
  resetClaudeService();
  resetGeminiService();
  resetPerplexityService();
}

/**
 * Execute a query across all available platforms
 */
export async function executeQueryOnAllPlatforms(
  query: string,
  context?: Record<string, any>,
  platformsToUse?: AIPlatform[]
): Promise<Map<AIPlatform, any>> {
  const results = new Map<AIPlatform, any>();
  
  // Determine which platforms to use
  const platforms = platformsToUse || await getAvailablePlatforms();
  
  if (platforms.length === 0) {
    console.warn('No platforms available for query execution');
    return results;
  }
  
  // Execute query on all platforms in parallel
  const queryPromises = platforms.map(async (platform) => {
    try {
      const service = getPlatformService(platform);
      const response = await service.executeQuery(query, context);
      return { platform, response };
    } catch (error: any) {
      console.error(`Query failed on ${platform}:`, error);
      return { 
        platform, 
        response: { 
          platform, 
          query, 
          response: '', 
          responseTimeMs: 0, 
          error: error.message 
        } 
      };
    }
  });
  
  const queryResults = await Promise.all(queryPromises);
  
  for (const { platform, response } of queryResults) {
    results.set(platform, response);
  }
  
  return results;
}

/**
 * Parse responses from all platforms
 */
export function parseAllPlatformResponses(
  responses: Map<AIPlatform, any>,
  businessName: string
): Map<AIPlatform, any> {
  const parsedResults = new Map<AIPlatform, any>();
  
  for (const [platform, response] of responses) {
    try {
      if (response.error) {
        parsedResults.set(platform, { error: response.error });
        continue;
      }
      
      const service = getPlatformService(platform);
      const analysis = service.parseResponse(response.response, businessName);
      
      parsedResults.set(platform, {
        ...response,
        analysis,
      });
    } catch (error: any) {
      console.error(`Failed to parse ${platform} response:`, error);
      parsedResults.set(platform, { error: error.message });
    }
  }
  
  return parsedResults;
}

/**
 * Export all services and utilities
 */
export {
  ChatGPTService,
  ClaudeService,
  GeminiService,
  PerplexityService,
  getChatGPTService,
  getClaudeService,
  getGeminiService,
  getPerplexityService
};

  export type { PlatformService };
