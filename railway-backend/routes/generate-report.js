// railway-backend/routes/generate-report.js
// Main report generation endpoint with AI-powered universal business analysis
// FIXED: All column names + user context requirement

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
        status: 'processing',
        share_token: shareToken,
        share_url: shareUrl,
        share_enabled: true,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('❌ Failed to create report record:', insertError);
      return res.status(500).json({
        error: 'Database error',
        message: 'Failed to initialize report',
        details: insertError.message
      });
    }

    console.log(`✅ Report ${reportId} created, starting background processing...`);

    // Return immediately with report ID (processing continues in background)
    res.status(202).json({
      report_id: reportId,
      status: 'processing',
      message: 'Report generation started',
      share_url: shareUrl
    });

    // Start background processing (don't await)
    processReportBackground(reportId, validatedUrl.href, business_name, business_type, location);

  } catch (error) {
    console.error('❌ Error in generate-report endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Background processing function
 * Runs asynchronously after immediate response to client
 */
async function processReportBackground(reportId, websiteUrl, providedName, providedType, providedLocation) {
  const startTime = Date.now();
  let totalCost = 0;
  const processingLog = [];

  try {
    console.log(`\n🔄 Background processing started for report ${reportId}`);
    processingLog.push('Starting analysis...');

    // PHASE 1: Extract website content
    console.log('\n📄 PHASE 1: Extracting website content...');
    processingLog.push('Extracting website content...');
    
    const websiteContent = await extractWebsiteContent(websiteUrl);
    totalCost += 0.01; // ScrapingBee cost
    
    if (!websiteContent.success) {
      throw new Error(`Failed to extract website content: ${websiteContent.error}`);
    }
    
    console.log('✅ Website content extracted');
    processingLog.push('Website content extracted');

    // PHASE 2: AI-powered business analysis
    console.log('\n🤖 PHASE 2: Analyzing business with AI...');
    processingLog.push('Analyzing business type and details...');
    
    const businessAnalysis = await analyzeBusinessWithAI(
      websiteUrl,
      websiteContent.content,
      websiteContent.metadata
    );
    totalCost += 0.05; // OpenAI API cost
    
    console.log('✅ Business analysis complete');
    processingLog.push('Business analysis complete');

    // Use AI-detected values or fall back to provided values
    const finalBusinessName = businessAnalysis.name || providedName || 'Unknown Business';
    const finalBusinessType = businessAnalysis.type || providedType || 'Unknown';
    const finalLocation = businessAnalysis.location || providedLocation || 'Unknown';

    console.log(`📊 Detected: ${finalBusinessName} (${finalBusinessType}) in ${finalLocation}`);

    // Update report with detected business info - FIXED: correct column name
    await supabase
      .from('ai_visibility_external_reports')
      .update({
        business_name: finalBusinessName,
        business_type: finalBusinessType,
        business_location: finalLocation  // FIXED: was location
      })
      .eq('id', reportId);

    // PHASE 3: Find competitors with AI
    console.log('\n🔍 PHASE 3: Finding competitors with AI...');
    processingLog.push('Discovering competitors...');
    
    const competitors = await findCompetitorsWithAI(
      finalBusinessName,
      finalBusinessType,
      finalLocation
    );
    totalCost += 0.03; // Google Search + AI filtering cost
    
    console.log(`✅ Found ${competitors.length} competitors`);
    processingLog.push(`Found ${competitors.length} competitors`);

    // Validate we found real competitors
    if (competitors.length === 0) {
      console.warn('⚠️ No competitors found. Please verify business information.');
    }

    // PHASE 4: Competitive analysis
    console.log('\n📊 PHASE 4: Generating competitive analysis...');
    processingLog.push('Analyzing competitive landscape...');
    
    const competitiveAnalysis = await generateCompetitiveAnalysis(
      businessAnalysis,
      competitors,
      websiteContent
    );
    totalCost += 0.10; // Comprehensive AI analysis cost
    
    console.log('✅ Competitive analysis complete');
    processingLog.push('Competitive analysis complete');

    // Calculate overall score
    const overallScore = calculateOverallScore(competitiveAnalysis);

    // Get competitor websites for database storage
    const competitorWebsites = competitors
      .filter(c => c.website)
      .map(c => c.website)
      .slice(0, 10); // Store top 10

    // Update report with complete data - ALL COLUMNS CORRECT
    const processingTimeSeconds = Math.round((Date.now() - startTime) / 1000);
    
    const { error: updateError } = await supabase
      .from('ai_visibility_external_reports')
      .update({
        status: 'completed',
        business_name: finalBusinessName,
        business_type: finalBusinessType,
        business_location: finalLocation,        // FIXED: correct column name
        competitor_websites: competitorWebsites,
        overall_score: overallScore,
        report_data: {
          platform_scores: competitiveAnalysis.platform_scores || {},
          competitors: competitors.slice(0, 5).map(c => ({
            name: c.name,
            website: c.website,
            relevance_score: c.relevance_score
          }))
        },
        content_gap_analysis: {
          primary_brand: competitiveAnalysis.primary_brand || {},
          top_competitors: competitiveAnalysis.top_competitors || [],
          structural_gaps: competitiveAnalysis.structural_gaps || [],
          thematic_gaps: competitiveAnalysis.thematic_gaps || [],
          critical_topic_gaps: competitiveAnalysis.critical_topic_gaps || [],
          significant_topic_gaps: competitiveAnalysis.significant_topic_gaps || [],
          total_gaps: competitiveAnalysis.total_gaps || 0,
          severity_breakdown: competitiveAnalysis.severity_breakdown || {}
        },
        recommendations: competitiveAnalysis.priority_actions || [],
        processing_duration_ms: Date.now() - startTime,
        api_cost_usd: totalCost,
        generation_completed_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (updateError) {
      console.error('❌ Failed to update report:', updateError);
      throw updateError;
    }

    console.log(`\n✅ Report ${reportId} completed successfully!`);
    console.log(`⏱️  Processing time: ${processingTimeSeconds}s`);
    console.log(`💰 Total cost: $${totalCost.toFixed(2)}`);

  } catch (error) {
    console.error(`❌ Report generation failed:`, error);
    
    // Update report with error status
    await supabase
      .from('ai_visibility_external_reports')
      .update({
        status: 'error',
        error_message: error.message,
        processing_duration_ms: Date.now() - startTime,
        generation_completed_at: new Date().toISOString()
      })
      .eq('id', reportId);
  }
}

/**
 * Calculate overall score from competitive analysis
 */
function calculateOverallScore(analysis) {
  // Simple scoring algorithm - can be enhanced
  let score = 70; // Base score
  
  // Add points for brand strengths
  if (analysis.brand_strengths && analysis.brand_strengths.length > 0) {
    score += Math.min(analysis.brand_strengths.length * 2, 20);
  }
  
  // Subtract points for content gaps
  if (analysis.content_gaps && analysis.content_gaps.length > 0) {
    score -= Math.min(analysis.content_gaps.length * 3, 30);
  }
  
  // Add points for competitive advantages
  if (analysis.competitive_advantages && analysis.competitive_advantages.length > 0) {
    score += Math.min(analysis.competitive_advantages.length * 3, 15);
  }
  
  // Clamp between 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

export { router as generateReportRoute };
