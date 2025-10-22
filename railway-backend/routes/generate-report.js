// railway-backend/routes/generate-report.js
// COMPLETE WORKING VERSION - Integrates all services for comprehensive report generation
// Fixes all 4 previous issues + integrates Steps 1 & 2

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import express from 'express';
import { analyzeBusinessWithAI } from '../services/businessAnalyzer.js';
import { generateCompetitiveAnalysis } from '../services/competitiveAnalyzer.js';
import { findCompetitorsWithAI } from '../services/competitorFinder.js';
import { extractWebsiteContent } from '../services/scrapingBee.js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/generate-report
 * Generate comprehensive AI-powered business analysis report
 * 
 * Request body:
 * {
 *   website_url: string (required) - Business website to analyze
 *   user_id: string (required) - Authenticated user ID
 *   user_name?: string (optional) - User's display name
 *   user_email?: string (optional) - User's email
 *   business_name?: string (optional) - Will be auto-detected if not provided
 *   business_type?: string (optional) - Will be auto-detected if not provided
 *   location?: string (optional) - Will be auto-detected if not provided
 * }
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();
  console.log('\n🚀 Starting AI-powered report generation...');
  
  try {
    // Validate request
    const { 
      website_url, 
      user_id,
      user_name,
      user_email,
      business_name, 
      business_type, 
      location 
    } = req.body;
    
    // Validate required fields
    if (!website_url) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'website_url is required'
      });
    }

    if (!user_id) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'user_id is required'
      });
    }

    // Validate URL format
    let validatedUrl;
    try {
      validatedUrl = new URL(website_url);
      if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'Please provide a valid HTTP/HTTPS URL'
      });
    }

    console.log(`📊 Analyzing: ${website_url}`);
    console.log(`👤 User: ${user_name || user_id}`);

    // Generate unique report ID and share token
    const reportId = crypto.randomUUID();
    const shareToken = crypto.randomBytes(16).toString('hex');
    const shareUrl = `${process.env.FRONTEND_URL || 'https://ok-local-gbp.netlify.app'}/share/report/${shareToken}`;

    // Create initial report record - ALL COLUMNS CORRECT
    const { error: insertError } = await supabase
      .from('ai_visibility_external_reports')
      .insert({
        id: reportId,
        generated_by_user_id: user_id,                // FIXED: Added user context
        generated_by_name: user_name || 'Unknown',    // FIXED: Added user name
        generated_by_email: user_email || null,       // FIXED: Added user email
        target_website: validatedUrl.href,            // FIXED: was website_url
        business_name: business_name || null,
        business_type: business_type || 'Unknown',
        business_location: location || 'Unknown',     // FIXED: was location
        status: 'generating',                         // FIXED: was 'processing'
        share_token: shareToken,
        share_url: shareUrl,
        share_enabled: true,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('❌ Failed to create report record:', insertError);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to initialize report'
      });
    }

    console.log(`✅ Report ${reportId} created, starting background processing...`);

    // Return immediately with report ID (processing continues in background)
    res.status(202).json({
      report_id: reportId,
      status: 'generating',  // FIXED: was 'processing'
      message: 'Report generation started',
      share_url: shareUrl
    });

    // Continue processing in background
    processReportBackground(
      reportId, 
      validatedUrl.href, 
      business_name,
      business_type,
      location
    ).catch(error => {
      console.error('❌ Background processing error:', error);
    });

  } catch (error) {
    console.error('❌ Request handling error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

/**
 * Background processing function for report generation
 * Runs after returning 202 response to user
 */
async function processReportBackground(
  reportId, 
  websiteUrl, 
  providedName,
  providedType,
  providedLocation
) {
  console.log(`\n🔄 Background processing started for report ${reportId}`);
  
  let totalCost = 0;
  let queryCount = 0;
  const processingLog = [];

  try {
    // =================================================================
    // PHASE 1: Extract Target Website Content
    // =================================================================
    console.log('\n📄 PHASE 1: Extracting website content...');
    processingLog.push('Extracting website content...');
    
    const websiteContent = await extractWebsiteContent(websiteUrl);
    totalCost += 0.01; // ScrapingBee cost
    
    console.log('✅ Website content extracted');
    console.log(`   Title: ${websiteContent.title}`);
    console.log(`   Text length: ${websiteContent.text_content?.length || 0} chars`);
    console.log(`   Services found: ${websiteContent.services?.length || 0}`);
    
    processingLog.push('Website content extracted');

    // =================================================================
    // PHASE 2: AI-Powered Business Analysis
    // =================================================================
    console.log('\n🤖 PHASE 2: Analyzing business with AI...');
    processingLog.push('Analyzing business type and details...');
    
    const businessAnalysis = await analyzeBusinessWithAI(websiteContent);
    totalCost += 0.05; // OpenAI API cost
    queryCount += 1;
    
    console.log('✅ Business analysis complete');
    processingLog.push('Business analysis complete');

    // Use AI-detected values or fall back to provided values
    const finalBusinessName = businessAnalysis.business_name || providedName || 'Unknown Business';
    const finalBusinessType = businessAnalysis.business_type || providedType || 'Unknown';
    const finalLocation = businessAnalysis.location_string || providedLocation || 'Unknown';

    console.log(`📊 Detected: ${finalBusinessName} (${finalBusinessType}) in ${finalLocation}`);
    
    // Update report with detected business info
    await supabase
      .from('ai_visibility_external_reports')
      .update({
        business_name: finalBusinessName,
        business_type: finalBusinessType,
        business_location: finalLocation
      })
      .eq('id', reportId);

    // =================================================================
    // PHASE 3: Find Competitors with AI
    // =================================================================
    console.log('\n🔍 PHASE 3: Finding competitors...');
    processingLog.push('Searching for competitors...');
    
    const competitors = await findCompetitorsWithAI(businessAnalysis, finalLocation);
    totalCost += 0.02; // Google Search API cost (free tier)
    queryCount += 3; // 3 search queries
    
    console.log(`✅ Found ${competitors.length} competitors`);
    processingLog.push(`Found ${competitors.length} relevant competitors`);

    // Store competitor websites for report
    const competitorWebsites = competitors.map(c => c.website);

    // =================================================================
    // PHASE 4: Generate Competitive Analysis
    // =================================================================
    console.log('\n📊 PHASE 4: Generating competitive analysis...');
    processingLog.push('Analyzing competitive landscape...');
    
    const competitiveAnalysis = await generateCompetitiveAnalysis(
      businessAnalysis,
      competitors,
      websiteContent
    );
    totalCost += 0.13; // ScrapingBee (3 sites) + GPT-4
    queryCount += 1; // GPT-4 query
    
    console.log('✅ Competitive analysis complete');
    console.log(`   Total gaps: ${competitiveAnalysis.total_gaps}`);
    console.log(`   Recommendations: ${competitiveAnalysis.priority_actions.length}`);
    console.log(`   Overall score: ${competitiveAnalysis.overall_score}/100`);
    
    processingLog.push('Competitive analysis complete');

    // =================================================================
    // PHASE 5: Assemble Final Report Data
    // =================================================================
    console.log('\n📦 PHASE 5: Assembling final report...');
    
    const processingDuration = Date.now() - Date.parse(
      (await supabase
        .from('ai_visibility_external_reports')
        .select('created_at')
        .eq('id', reportId)
        .single()).data.created_at
    );

    // Build complete report data
    const reportData = {
      // Business info
      business_name: finalBusinessName,
      business_type: finalBusinessType,
      business_location: finalLocation,
      target_website: websiteUrl,
      
      // Analysis results
      overall_score: competitiveAnalysis.overall_score,
      brand_strengths: competitiveAnalysis.brand_strengths,
      brand_weaknesses: competitiveAnalysis.brand_weaknesses,
      
      // Competitors
      top_competitors: competitiveAnalysis.top_competitors,
      competitor_count: competitiveAnalysis.competitor_count,
      
      // Generated timestamp
      generated_at: new Date().toISOString()
    };

    const contentGapAnalysis = {
      structural_gaps: competitiveAnalysis.structural_gaps,
      thematic_gaps: competitiveAnalysis.thematic_gaps,
      critical_topic_gaps: competitiveAnalysis.critical_topic_gaps,
      significant_topic_gaps: competitiveAnalysis.significant_topic_gaps,
      under_mentioned_topics: competitiveAnalysis.under_mentioned_topics,
      total_gaps: competitiveAnalysis.total_gaps,
      
      // AI insights
      ai_insights: competitiveAnalysis.ai_insights,
      competitive_differentiation: competitiveAnalysis.competitive_differentiation
    };

    const aiPlatformScores = competitiveAnalysis.platform_scores;

    const recommendations = competitiveAnalysis.priority_actions;

    // =================================================================
    // PHASE 6: Save Complete Report to Database
    // =================================================================
    console.log('\n💾 PHASE 6: Saving report to database...');
    
    const { error: updateError } = await supabase
      .from('ai_visibility_external_reports')
      .update({
        status: 'completed',
        
        // Report data (JSONB fields)
        report_data: reportData,
        content_gap_analysis: contentGapAnalysis,
        ai_platform_scores: aiPlatformScores,
        recommendations: recommendations,
        
        // Competitor info
        competitor_websites: competitorWebsites,
        competitor_analysis: {
          competitors: competitiveAnalysis.top_competitors,
          count: competitiveAnalysis.competitor_count
        },
        
        // Scores
        overall_score: competitiveAnalysis.overall_score,
        
        // Metadata
        generation_completed_at: new Date().toISOString(),
        processing_duration_ms: processingDuration,
        api_cost_usd: totalCost,
        query_count: queryCount
      })
      .eq('id', reportId);

    if (updateError) {
      throw new Error(`Failed to save report: ${updateError.message}`);
    }

    console.log('✅ Report saved successfully');
    console.log('\n🎉 REPORT GENERATION COMPLETE!');
    console.log(`   Report ID: ${reportId}`);
    console.log(`   Overall Score: ${competitiveAnalysis.overall_score}/100`);
    console.log(`   Processing Time: ${(processingDuration / 1000).toFixed(1)}s`);
    console.log(`   Total Cost: $${totalCost.toFixed(2)}`);
    console.log(`   Queries: ${queryCount}`);

  } catch (error) {
    console.error('\n❌ Report generation failed:', error);
    console.error('Error details:', error.message);
    
    // Update report status to error
    await supabase
      .from('ai_visibility_external_reports')
      .update({
        status: 'error',
        error_message: error.message,
        generation_completed_at: new Date().toISOString()
      })
      .eq('id', reportId);
  }
}

export { router as generateReportRoute };
