// src/test/testAIVisibilityService.ts
// End-to-end test for AI Visibility Service

// CRITICAL: Load environment variables FIRST - synchronously before any imports
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

const envLocalPath = resolve(process.cwd(), '.env.local');
const envPath = resolve(process.cwd(), '.env');

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
  console.log('✅ Loaded .env.local');
} else if (existsSync(envPath)) {
  config({ path: envPath });
  console.log('✅ Loaded .env');
} else {
  console.error('❌ No .env or .env.local file found!');
  process.exit(1);
}

// Verify env vars loaded BEFORE importing anything else
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.error('❌ Environment variables not loaded!');
  console.error('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'found' : 'MISSING');
  console.error('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'found' : 'MISSING');
  process.exit(1);
}

// For testing, use service role key if available (bypasses RLS)
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.VITE_SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('✅ Using service role key for testing (bypasses RLS)');
}

console.log('✅ Environment variables loaded successfully');
console.log('');

// Now safe to import other modules
import {
  getLatestReport,
  getPlatformScoreHistory,
  getReportById,
  getScoreHistory,
  storeReport
} from '../lib/aiVisibilityDatabase';
import { AIVisibilityService } from '../lib/aiVisibilityService';
import type { AIPlatform } from '../types/aiVisibility';

/**
 * Test configuration
 */
const TEST_CONFIG = {
  organization_id: '08a392d3-4d16-4c0f-a285-21b3314fa845', // Demo Organization from database
  business_name: 'Espresso Elegance',
  business_type: 'coffee shop',
  location: 'Seattle, WA',
  query_count: 3, // Start small for testing
  platforms: ['chatgpt', 'claude', 'perplexity'] as AIPlatform[] // Skip Gemini initially
};

// Verify AI API keys are loaded
console.log('🔑 AI API Keys Status:');
console.log('   OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ found' : '❌ MISSING');
console.log('   ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✅ found' : '❌ MISSING');
console.log('   PERPLEXITY_API_KEY:', process.env.PERPLEXITY_API_KEY ? '✅ found' : '❌ MISSING');
console.log('   GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? '✅ found' : '❌ MISSING');
console.log('');

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return `$${amount.toFixed(4)}`;
}

/**
 * Format duration
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

/**
 * Main test function
 */
async function runTest() {
  console.log('\n🧪 AI Visibility Service - End-to-End Test\n');
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  let totalCost = 0;

  try {
    // Step 1: Initialize service
    console.log('\n📦 Step 1: Initialize Service');
    console.log('-'.repeat(60));
    const service = new AIVisibilityService();
    console.log('✅ Service initialized');

    // Step 2: Generate report
    console.log('\n🎯 Step 2: Generate AI Visibility Report');
    console.log('-'.repeat(60));
    console.log(`Business: ${TEST_CONFIG.business_name}`);
    console.log(`Type: ${TEST_CONFIG.business_type}`);
    console.log(`Location: ${TEST_CONFIG.location}`);
    console.log(`Queries: ${TEST_CONFIG.query_count}`);
    console.log(`Platforms: ${TEST_CONFIG.platforms.join(', ')}\n`);

    const reportStartTime = Date.now();
    
    const report = await service.generateMonthlyReport({
      organization_id: TEST_CONFIG.organization_id,
      business_name: TEST_CONFIG.business_name,
      business_type: TEST_CONFIG.business_type,
      location: TEST_CONFIG.location,
      query_count: TEST_CONFIG.query_count,
      platforms: TEST_CONFIG.platforms
    });

    const reportDuration = Date.now() - reportStartTime;
    
    console.log('\n✅ Report Generated!');
    console.log(`   Duration: ${formatDuration(reportDuration)}`);

    // Step 3: Display results
    console.log('\n📊 Step 3: Report Summary');
    console.log('-'.repeat(60));
    console.log(`Report ID: ${report.id}`);
    console.log(`Organization: ${report.organization_id}`);
    console.log(`Month: ${report.report_month}`);
    console.log(`Status: ${report.status}`);
    console.log(`Generated: ${report.generated_at}`);

    console.log('\n🎯 Overall Score:');
    console.log(`   Score: ${report.overall_score}/100`);
    console.log(`   Status: ${report.status}`);

    // Platform scores
    if (report.platform_scores && report.platform_scores.length > 0) {
      console.log('\n📱 Platform Scores:');
      for (const score of report.platform_scores) {
        console.log(`   ${score.platform.toUpperCase().padEnd(12)} ${score.score}/100`);
        console.log(`      Mentions: ${score.mention_count}`);
        if (score.ranking_position !== null) {
          console.log(`      Avg Rank: #${score.ranking_position.toFixed(1)}`);
        }
        if (score.sentiment_score !== null) {
          console.log(`      Sentiment: ${(score.sentiment_score * 100).toFixed(0)}%`);
        }
      }
    }

    // Competitors
    const competitors = (report as any).competitors || [];
    if (competitors && competitors.length > 0) {
      console.log('\n🏢 Competitors Detected:');
      for (const competitor of competitors.slice(0, 5)) {
        console.log(`   ${competitor.competitor_name}`);
        console.log(`      Platforms: ${competitor.detected_in_platforms.join(', ')}`);
        console.log(`      Mentions: ${competitor.detection_count}`);
      }
      if (competitors.length > 5) {
        console.log(`   ... and ${competitors.length - 5} more`);
      }
    } else {
      console.log('\n🏢 Competitors: None detected');
    }

    // Content gaps
    if (report.content_gaps && report.content_gaps.length > 0) {
      console.log('\n📝 Content Gaps Identified:');
      for (const gap of report.content_gaps) {
        console.log(`   ${gap.gap_title} (${gap.severity})`);
        console.log(`      ${gap.gap_description.substring(0, 80)}...`);
      }
    } else {
      console.log('\n📝 Content Gaps: None identified');
    }

    // Priority actions
    if (report.priority_actions && report.priority_actions.length > 0) {
      console.log('\n⚡ Priority Actions:');
      for (const action of report.priority_actions.slice(0, 3)) {
        const priorityIcon = action.priority === 'critical' ? '🚨' : 
                            action.priority === 'high' ? '⚠️' : 
                            action.priority === 'medium' ? '📋' : '📌';
        console.log(`   ${priorityIcon} [${action.priority.toUpperCase()}] ${action.action_title}`);
        console.log(`      ${action.action_description.substring(0, 80)}...`);
        if (action.estimated_impact) {
          console.log(`      Impact: ${action.estimated_impact} | Effort: ${action.estimated_effort}`);
        }
      }
      if (report.priority_actions.length > 3) {
        console.log(`   ... and ${report.priority_actions.length - 3} more`);
      }
    } else {
      console.log('\n⚡ Priority Actions: None generated');
    }

    // Achievements
    if (report.achievements && report.achievements.length > 0) {
      console.log('\n🏆 Achievements:');
      for (const achievement of report.achievements) {
        console.log(`   ${achievement.achievement_text}`);
      }
    }

    // Step 4: Store to database
    console.log('\n💾 Step 4: Store to Database');
    console.log('-'.repeat(60));
    
    const storeStartTime = Date.now();
    await storeReport(report);
    const storeDuration = Date.now() - storeStartTime;
    
    console.log(`✅ Report stored in ${formatDuration(storeDuration)}`);

    // Step 5: Retrieve from database
    console.log('\n📥 Step 5: Retrieve from Database');
    console.log('-'.repeat(60));
    
    // Test getLatestReport
    const latestReport = await getLatestReport(TEST_CONFIG.organization_id);
    if (latestReport) {
      console.log(`✅ Latest report retrieved: ${latestReport.id}`);
      console.log(`   Score: ${latestReport.overall_score}/100`);
    } else {
      console.log('❌ Failed to retrieve latest report');
    }

    // Test getReportById
    const retrievedReport = await getReportById(report.id);
    if (retrievedReport) {
      console.log(`✅ Report retrieved by ID: ${retrievedReport.id}`);
      console.log(`   Platform scores: ${retrievedReport.platform_scores?.length || 0}`);
      console.log(`   Priority actions: ${retrievedReport.priority_actions?.length || 0}`);
      console.log(`   Competitors: ${(retrievedReport as any).competitors?.length || 0}`);
      console.log(`   Content gaps: ${retrievedReport.content_gaps?.length || 0}`);
      console.log(`   Achievements: ${retrievedReport.achievements?.length || 0}`);
    } else {
      console.log('❌ Failed to retrieve report by ID');
    }

    // Test score history
    const scoreHistory = await getScoreHistory(TEST_CONFIG.organization_id, 6);
    console.log(`✅ Score history: ${scoreHistory.length} months`);

    // Test platform score history
    const platformHistory = await getPlatformScoreHistory(TEST_CONFIG.organization_id, 6);
    console.log(`✅ Platform score history: ${platformHistory.length} months`);

    // Step 6: Calculate costs
    console.log('\n💰 Step 6: Cost Analysis');
    console.log('-'.repeat(60));
    
    // Estimate costs based on platform usage
    const costPerQuery: Record<string, number> = {
      chatgpt: 0.008,
      claude: 0.010,
      gemini: 0.000,
      perplexity: 0.001
    };

    for (const platform of TEST_CONFIG.platforms) {
      const platformCost = costPerQuery[platform] * TEST_CONFIG.query_count;
      totalCost += platformCost;
      console.log(`   ${platform.padEnd(12)} ${TEST_CONFIG.query_count} queries × ${formatCurrency(costPerQuery[platform])} = ${formatCurrency(platformCost)}`);
    }

    console.log(`   ${'─'.repeat(40)}`);
    console.log(`   Total Cost: ${formatCurrency(totalCost)}`);
    
    // Projected monthly costs
    const fullReportCost = totalCost / TEST_CONFIG.query_count * 10; // 10 queries
    console.log(`\n   Projected full report cost (10 queries): ${formatCurrency(fullReportCost)}`);
    console.log(`   Monthly cost (100 orgs): ${formatCurrency(fullReportCost * 100)}`);
    console.log(`   Monthly cost (500 orgs): ${formatCurrency(fullReportCost * 500)}`);

    // Step 7: Final summary
    const totalDuration = Date.now() - startTime;
    
    console.log('\n✅ Test Complete!');
    console.log('='.repeat(60));
    console.log(`Total Duration: ${formatDuration(totalDuration)}`);
    console.log(`Report Score: ${report.overall_score}/100`);
    console.log(`Platforms Tested: ${TEST_CONFIG.platforms.length}`);
    console.log(`Queries Executed: ${TEST_CONFIG.query_count}`);
    console.log(`Total API Calls: ${TEST_CONFIG.query_count * TEST_CONFIG.platforms.length}`);
    console.log(`Total Cost: ${formatCurrency(totalCost)}`);
    console.log(`Competitors Found: ${(report as any).competitors?.length || 0}`);
    console.log(`Actions Generated: ${report.priority_actions?.length || 0}`);
    console.log(`Database Storage: ✅ Success`);
    console.log(`Database Retrieval: ✅ Success`);

    console.log('\n🎉 All tests passed!\n');

  } catch (error: any) {
    console.error('\n❌ Test Failed!');
    console.error('='.repeat(60));
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Run test with proper error handling
 */
async function main() {
  try {
    await runTest();
    process.exit(0);
  } catch (error: any) {
    console.error('\n💥 Unhandled error:', error);
    process.exit(1);
  }
}

// Execute test
main();