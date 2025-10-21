// railway-backend/routes/generate-report.js
// Main report generation endpoint with AI-powered universal business analysis

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
    const { website_url, business_name, business_type, location } = req.body;
    
    if (!website_url) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'website_url is required'
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

    // Generate unique report ID and share token
    const reportId = crypto.randomUUID();
    const shareToken = crypto.randomBytes(16).toString('hex');
    const shareUrl = `${process.env.FRONTEND_URL || 'https://ok-local-gbp.netlify.app'}/share/report/${shareToken}`;

    // Create initial report record
    const { error: insertError } = await supabase
      .from('ai_visibility_external_reports')
      .insert({
        id: reportId,
        website_url: validatedUrl.href,
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
        message: 'Failed to initialize report'
      });
    }

    // Return immediately with report ID (processing continues in background)
    res.status(202).json({
      report_id: reportId,
      status: 'processing',
      message: 'Report generation started',
      share_url: shareUrl
    });

    // Continue processing in background
    processReportGeneration(reportId, validatedUrl.href, {
      business_name,
      business_type,
      location
    }).catch(error => {
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
 */
async function processReportGeneration(reportId, websiteUrl, userProvidedData) {
  let totalCost = 0;
  const processingLog = [];

  try {
    // PHASE 1: Extract website content
    console.log('\n📥 PHASE 1: Extracting website content...');
    processingLog.push('Extracting website content...');
    
    const websiteContent = await extractWebsiteContent(websiteUrl);
    totalCost += 0.01; // ScrapingBee cost
    
    console.log(`✅ Extracted: ${websiteContent.title || 'Unknown'}`);
    processingLog.push(`Website analyzed: ${websiteContent.title || websiteUrl}`);

    // PHASE 2: AI-powered business analysis
    console.log('\n🤖 PHASE 2: AI analyzing business...');
    processingLog.push('AI analyzing business type and services...');
    
    const businessAnalysis = await analyzeBusinessWithAI(websiteContent);
    totalCost += 0.05; // AI analysis cost
    
    // Use AI-detected values or fallback to user-provided
    const finalBusinessName = businessAnalysis.business_name || userProvidedData.business_name || websiteUrl;
    const finalBusinessType = businessAnalysis.business_type || userProvidedData.business_type || 'business';
    const finalLocation = businessAnalysis.location || userProvidedData.location || 'United States';
    
    console.log(`✅ Detected: ${finalBusinessName} | ${finalBusinessType} | ${finalLocation}`);
    processingLog.push(`Business identified: ${finalBusinessName} (${finalBusinessType})`);
    processingLog.push(`Location: ${finalLocation}`);

    // PHASE 3: Find competitors with AI
    console.log('\n🔍 PHASE 3: Finding competitors...');
    processingLog.push('Searching for competitors...');
    
    const competitors = await findCompetitorsWithAI(businessAnalysis, finalLocation);
    totalCost += 0.02; // Search API cost
    
    console.log(`✅ Found ${competitors.length} competitors`);
    processingLog.push(`Found ${competitors.length} relevant competitors`);

    if (competitors.length === 0) {
      throw new Error('No competitors found. Please verify business information.');
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

    // Update report with complete data
    const { error: updateError } = await supabase
      .from('ai_visibility_external_reports')
      .update({
        status: 'completed',
        business_name: finalBusinessName,
        business_type: finalBusinessType,
        location: finalLocation,
        overall_score: overallScore,
        platform_scores: competitiveAnalysis.platform_scores || {},
        top_competitors: competitors.slice(0, 5).map(c => c.name),
        content_gaps: competitiveAnalysis.content_gaps || [],
        priority_actions: competitiveAnalysis.priority_actions || [],
        implementation_timeline: competitiveAnalysis.implementation_timeline || '',
        citation_opportunities: competitiveAnalysis.citation_opportunities || [],
        ai_knowledge_scores: competitiveAnalysis.ai_knowledge_scores || {},
        processing_time: Math.round((Date.now() - Date.now()) / 1000),
        total_cost: totalCost,
        completed_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (updateError) {
      console.error('❌ Failed to update report:', updateError);
      throw updateError;
    }

    console.log(`\n✅ Report ${reportId} completed successfully!`);
    console.log(`💰 Total cost: $${totalCost.toFixed(2)}`);

  } catch (error) {
    console.error(`❌ Report generation failed:`, error);
    
    // Update report with error status
    await supabase
      .from('ai_visibility_external_reports')
      .update({
        status: 'failed',
        error_message: error.message,
        processing_log: processingLog
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
  
  if (analysis.brand_strengths && analysis.brand_strengths.length > 0) {
    score += analysis.brand_strengths.length * 2;
  }
  
  if (analysis.content_gaps && analysis.content_gaps.length > 0) {
    score -= analysis.content_gaps.length * 3;
  }
  
  // Clamp between 0-100
  return Math.max(0, Math.min(100, score));
}

export { router as generateReportRoute };
