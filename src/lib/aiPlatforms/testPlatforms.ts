// src/lib/aiPlatforms/testPlatforms.ts
// Utility to test all AI platform connections

import type { AIPlatform } from '../../types/aiVisibility';
import {
  checkAllPlatformsHealth,
  executeQueryOnAllPlatforms,
  parseAllPlatformResponses
} from './index';

/**
 * Test result for a platform
 */
export interface PlatformTestResult {
  platform: AIPlatform;
  configured: boolean;
  connected: boolean;
  responseTime?: number;
  queryWorks: boolean;
  sampleResponse?: string;
  error?: string;
  analysis?: {
    businessMentioned: boolean;
    competitors: number;
    ranking?: number;
  };
}

/**
 * Run comprehensive tests on all platforms
 */
export async function testAllPlatforms(): Promise<Map<AIPlatform, PlatformTestResult>> {
  console.log('🧪 Testing all AI platforms...\n');
  
  const results = new Map<AIPlatform, PlatformTestResult>();
  
  // Step 1: Health checks
  console.log('Step 1: Checking platform health...');
  const healthResults = await checkAllPlatformsHealth();
  
  for (const [platform, health] of healthResults) {
    console.log(`  ${platform}: ${health.available ? '✅' : '❌'} (${health.responseTime}ms)`);
    if (health.error) {
      console.log(`    Error: ${health.error}`);
    }
    
    results.set(platform, {
      platform,
      configured: health.configured,
      connected: health.available,
      responseTime: health.responseTime,
      queryWorks: false,
      error: health.error,
    });
  }
  
  console.log('\nStep 2: Testing sample query...');
  
  // Step 2: Test actual query
  const testQuery = "What are the best coffee shops in Seattle?";
  const testContext = {
    businessName: "Espresso Elegance",
    businessType: "coffee shop",
    location: "Seattle, WA"
  };
  
  console.log(`  Query: "${testQuery}"`);
  console.log(`  Business: ${testContext.businessName}`);
  console.log(`  Location: ${testContext.location}\n`);
  
  try {
    // Only test platforms that passed health check
    const availablePlatforms = Array.from(healthResults.entries())
      .filter(([_, health]) => health.available)
      .map(([platform, _]) => platform);
    
    if (availablePlatforms.length === 0) {
      console.log('  ⚠️  No platforms available for testing');
      return results;
    }
    
    // Execute query on all available platforms
    const queryResults = await executeQueryOnAllPlatforms(
      testQuery,
      testContext,
      availablePlatforms
    );
    
    // Parse responses
    const parsedResults = parseAllPlatformResponses(queryResults, testContext.businessName);
    
    // Update results
    for (const [platform, response] of parsedResults) {
      const existing = results.get(platform)!;
      
      if (response.error) {
        console.log(`  ${platform}: ❌ Query failed - ${response.error}`);
        results.set(platform, {
          ...existing,
          queryWorks: false,
          error: response.error,
        });
      } else {
        const analysis = response.analysis;
        const preview = response.response?.substring(0, 100) + '...';
        
        console.log(`  ${platform}: ✅ Query successful`);
        console.log(`    Response preview: "${preview}"`);
        console.log(`    Business mentioned: ${analysis.businessMentioned ? 'Yes' : 'No'}`);
        console.log(`    Competitors found: ${analysis.competitorsMentioned.length}`);
        console.log(`    Ranking: ${analysis.businessRanking || 'Not ranked'}`);
        console.log(`    Tokens: ${response.tokensUsed}, Cost: $${response.cost?.toFixed(4)}\n`);
        
        results.set(platform, {
          ...existing,
          queryWorks: true,
          sampleResponse: preview,
          analysis: {
            businessMentioned: analysis.businessMentioned,
            competitors: analysis.competitorsMentioned.length,
            ranking: analysis.businessRanking || undefined,
          },
        });
      }
    }
    
  } catch (error: any) {
    console.error('  ❌ Query test failed:', error.message);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  let configuredCount = 0;
  let connectedCount = 0;
  let workingCount = 0;
  
  for (const [platform, result] of results) {
    if (result.configured) configuredCount++;
    if (result.connected) connectedCount++;
    if (result.queryWorks) workingCount++;
  }
  
  console.log(`Total platforms: 4`);
  console.log(`Configured: ${configuredCount}/4 (${Math.round(configuredCount/4*100)}%)`);
  console.log(`Connected: ${connectedCount}/4 (${Math.round(connectedCount/4*100)}%)`);
  console.log(`Working: ${workingCount}/4 (${Math.round(workingCount/4*100)}%)`);
  console.log('='.repeat(60) + '\n');
  
  return results;
}

/**
 * Test a single platform
 */
export async function testSinglePlatform(platform: AIPlatform): Promise<PlatformTestResult> {
  console.log(`\n🧪 Testing ${platform}...`);
  
  const allResults = await testAllPlatforms();
  const result = allResults.get(platform);
  
  if (!result) {
    return {
      platform,
      configured: false,
      connected: false,
      queryWorks: false,
      error: 'Platform not found',
    };
  }
  
  return result;
}

/**
 * Quick connection test (just checks if API keys work)
 */
export async function quickConnectionTest(): Promise<void> {
  console.log('⚡ Running quick connection test...\n');
  
  const healthResults = await checkAllPlatformsHealth();
  
  const platforms: AIPlatform[] = ['chatgpt', 'claude', 'gemini', 'perplexity'];
  
  for (const platform of platforms) {
    const health = healthResults.get(platform);
    
    const status = health?.available ? '✅ Connected' : '❌ Failed';
    const time = health?.responseTime ? `(${health.responseTime}ms)` : '';
    const error = health?.error ? ` - ${health.error}` : '';
    
    console.log(`${platform.padEnd(12)} ${status} ${time}${error}`);
  }
  
  console.log('');
}

/**
 * Export test functions
 */
export default {
  testAllPlatforms,
  testSinglePlatform,
  quickConnectionTest,
};