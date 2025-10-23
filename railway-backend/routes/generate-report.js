// railway-backend/routes/generate-report.js
// PHASE B: Integrated Real AI Platform Queries + Competitor Scraping
// FIXED V3: Adds competitor website scraping and deep competitive analysis

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import express from 'express';
import { buildKnowledgeComparison, queryAllPlatforms } from '../services/aiPlatformQuery.js';
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

router.post('/', async (req, res) => {
  console.log('\n🚀 Starting AI-powered report generation (Phase B)...');
  
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

    // Create initial report record
    const { error: insertError } = await supabase
      .from('ai_visibility_external_reports')
      .insert({
        id: reportId,
        generated_by_user_id: user_id,
        generated_by_name: user_name || 'Unknown',
        generated_by_email: user_email || null,
        target_website: validatedUrl.href,
        business_name: business_name || null,
        business_type: business_type || 'Unknown',
        business_location: location || 'Unknown',
        status: 'pending',
        share_token: shareToken,
        share_url: shareUrl,
        share_enabled: true,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      throw new Error(`Failed to create report: ${insertError.message}`);
    }

    // Return immediately with report ID
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
      console.error('Background processing failed:', error);
      // Update status to error
      supabase
        .from('ai_visibility_external_reports')
        .update({
          status: 'error',
          error_message: error.message
        })
        .eq('id', reportId)
        .then(() => console.log('Error status updated'));
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
 * Background report generation process
 */
async function processReportGeneration(reportId, websiteUrl, userInputs) {
  const startTime = Date.now();
  let totalCost = 0;
  let queryCount = 0;

  try {
    // Update status to generating
    await supabase
      .from('ai_visibility_external_reports')
      .update({ status: 'generating' })
      .eq('id', reportId);

    // =================================================================
    // PHASE 1: Extract Website Content
    // =================================================================
    console.log('\n📄 PHASE 1: Extracting website content...');
    const mainBusinessContent = await extractWebsiteContent(websiteUrl);
    totalCost += 0.02; // ScrapingBee cost
    queryCount += 1;

    // =================================================================
    // PHASE 2: AI-Powered Business Analysis
    // =================================================================
    console.log('\n🧠 PHASE 2: Analyzing business with AI...');
    const businessAnalysis = await analyzeBusinessWithAI(
      mainBusinessContent,
      userInputs.business_name,
      userInputs.business_type,
      userInputs.location
    );
    totalCost += 0.05; // OpenAI cost
    queryCount += 1;

    console.log(`   Business: ${businessAnalysis.business_name}`);
    console.log(`   Type: ${businessAnalysis.business_type}`);
    console.log(`   Location: ${businessAnalysis.location}`);

    // =================================================================
    // PHASE 3: Find Competitors
    // =================================================================
    console.log('\n🔍 PHASE 3: Finding real competitors...');
    const finalLocation = businessAnalysis.location || userInputs.location || 'Unknown';
    const competitors = await findCompetitorsWithAI(businessAnalysis, finalLocation);
    totalCost += 0.03; // Google Custom Search cost
    queryCount += 1;

    console.log(`   Found ${competitors.length} competitors`);

    // =================================================================
    // PHASE 3.5: Scrape Competitor Websites (NEW!)
    // =================================================================
    console.log('\n🌐 PHASE 3.5: Scraping competitor websites...');
    
    for (let i = 0; i < competitors.length; i++) {
      const competitor = competitors[i];
      
      try {
        console.log(`   → Scraping: ${competitor.name}`);
        
        // Scrape competitor website
        const competitorContent = await extractWebsiteContent(competitor.website);
        totalCost += 0.02; // ScrapingBee cost per site
        queryCount += 1;
        
        // Analyze competitor content with AI
        const competitorAnalysis = await analyzeBusinessWithAI(
          competitorContent,
          competitor.name,
          businessAnalysis.business_type,
          finalLocation
        );
        totalCost += 0.03; // OpenAI cost
        queryCount += 1;
        
        // Add analysis to competitor object
        competitor.content = competitorContent;
        competitor.analysis = competitorAnalysis;
        competitor.features = analyzeWebsiteFeatures(competitorContent);
        
        console.log(`   ✅ Analyzed: ${competitor.name}`);
        console.log(`      Services: ${competitorAnalysis.primary_services?.length || 0}`);
        console.log(`      Content depth: ${competitorContent.text?.length || 0} chars`);
        
        // Rate limit between scrapes
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`   ❌ Failed to scrape ${competitor.name}:`, error.message);
        // Continue with other competitors
        competitor.scrape_failed = true;
      }
    }

    // =================================================================
    // PHASE 4: Query AI Platforms for Main Business
    // =================================================================
    console.log('\n🤖 PHASE 4: Querying AI platforms for main business...');
    const mainBusinessAIResults = await queryAllPlatforms({
      name: businessAnalysis.business_name,
      type: businessAnalysis.business_type,
      location: finalLocation,
      website: websiteUrl
    });
    totalCost += 0.008; // AI platform queries
    queryCount += 4; // 4 platforms
    
    console.log(`   Mentioned on ${mainBusinessAIResults.total_platforms_mentioned} platforms`);
    console.log(`   Overall visibility: ${mainBusinessAIResults.overall_visibility_score}/100`);

    // =================================================================
    // PHASE 5: Query AI Platforms for Competitors
    // =================================================================
    console.log('\n🤖 PHASE 5: Querying AI platforms for competitors...');
    const competitorAIResults = [];
    
    for (let i = 0; i < competitors.length; i++) {
      const competitor = competitors[i];
      console.log(`   Analyzing competitor ${i + 1}/${competitors.length}: ${competitor.name}`);
      
      const results = await queryAllPlatforms({
        name: competitor.name,
        type: businessAnalysis.business_type,
        location: finalLocation,
        website: competitor.website
      });
      
      competitorAIResults.push(results);
      totalCost += 0.008; // AI platform queries
      queryCount += 4; // 4 platforms per competitor
      
      console.log(`   → Mentioned on ${results.total_platforms_mentioned} platforms`);
      
      // Rate limit between competitors
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // =================================================================
    // PHASE 6: Build AI Knowledge Comparison Table
    // =================================================================
    console.log('\n📊 PHASE 6: Building AI knowledge comparison...');
    
    // Build enriched competitor results with proper structure
    const enrichedCompetitorResults = competitors.map((comp, idx) => ({
      name: comp.name,
      aiResults: competitorAIResults[idx]
    }));

    // Build comparison with correct parameters
    const aiKnowledgeComparison = buildKnowledgeComparison(
      {
        ...mainBusinessAIResults,
        name: businessAnalysis.business_name
      },
      enrichedCompetitorResults
    );

    // =================================================================
    // PHASE 7: Generate Competitive Analysis
    // =================================================================
    console.log('\n📈 PHASE 7: Generating competitive analysis...');
    const competitiveAnalysis = await generateCompetitiveAnalysis(
      businessAnalysis,
      competitors,
      mainBusinessContent
    );
    totalCost += 0.15; // OpenAI cost
    queryCount += 1;

    console.log(`   Content gaps: ${competitiveAnalysis.total_gaps || 0}`);
    console.log(`   Recommendations: ${competitiveAnalysis.priority_actions?.length || 0}`);

    // =================================================================
    // PHASE 8: Format and Save Report
    // =================================================================
    console.log('\n💾 PHASE 8: Saving complete report...');

    // Calculate processing duration
    const processingDuration = Date.now() - startTime;

    // Format platform scores as ARRAY with REAL data
    const platformScoresArray = mainBusinessAIResults.platform_scores.map(ps => ({
      platform: ps.platform,
      score: ps.score,
      status: ps.status,
      mentioned: ps.mentioned,
      mention_count: ps.mention_count,
      knowledge_level: ps.knowledge_level,
      details: ps.details
    }));

    // Build report data
    const reportData = {
      business_info: {
        name: businessAnalysis.business_name,
        type: businessAnalysis.business_type,
        location: finalLocation,
        website: websiteUrl,
        services: businessAnalysis.primary_services || []
      },
      analysis_summary: {
        total_platforms_analyzed: 4,
        platforms_with_visibility: mainBusinessAIResults.total_platforms_mentioned,
        competitors_analyzed: competitors.length,
        content_gaps_found: competitiveAnalysis.total_gaps || 0,
        recommendations_generated: competitiveAnalysis.priority_actions?.length || 0
      },
      ai_visibility: {
        overall_score: mainBusinessAIResults.overall_visibility_score,
        platform_breakdown: mainBusinessAIResults.platform_scores,
        visibility_trend: 'baseline'
      }
    };

    // Format content gap analysis
    const formattedContentGapAnalysis = {
      structural_gaps: competitiveAnalysis.structural_gaps || [],
      thematic_gaps: competitiveAnalysis.thematic_gaps || [],
      critical_topic_gaps: competitiveAnalysis.critical_topic_gaps || [],
      significant_topic_gaps: competitiveAnalysis.significant_topic_gaps || [],
      under_mentioned_topics: competitiveAnalysis.under_mentioned_topics || [],
      total_gaps: competitiveAnalysis.total_gaps || 0,
      severity_breakdown: {
        critical: competitiveAnalysis.critical_topic_gaps?.length || 0,
        significant: competitiveAnalysis.significant_topic_gaps?.length || 0,
        moderate: competitiveAnalysis.under_mentioned_topics?.length || 0
      },
      ai_insights: competitiveAnalysis.ai_insights || [],
      competitive_differentiation: competitiveAnalysis.competitive_differentiation || ''
    };

    // Format competitor analysis with AI scores AND content insights
    const formattedCompetitorAnalysis = {
      competitors: competitors.map((comp, idx) => ({
        name: comp.name,
        website: comp.website,
        strengths: comp.analysis?.unique_value_proposition ? [comp.analysis.unique_value_proposition] : [],
        features: comp.features || {},
        services: comp.analysis?.primary_services || [],
        content_depth: comp.content?.text?.length || 0,
        ai_visibility: competitorAIResults[idx] || null
      })),
      total_competitors: competitors.length,
      competitive_advantages: competitiveAnalysis.brand_strengths || [],
      competitive_weaknesses: competitiveAnalysis.brand_weaknesses || []
    };

    // Format recommendations
    const recommendations = (competitiveAnalysis.priority_actions || []).map((action, idx) => ({
      priority: idx + 1,
      title: action.title || action.action_title,
      description: action.description || action.action_description,
      priority_level: action.priority_level || 'medium',
      category: action.category || 'general',
      impact: action.impact || action.estimated_impact || 'medium',
      effort: action.effort || action.estimated_effort || 'medium'
    }));

    // Save to database
    const { error: updateError } = await supabase
      .from('ai_visibility_external_reports')
      .update({
        status: 'completed',
        
        // Business info
        business_name: businessAnalysis.business_name,
        business_type: businessAnalysis.business_type,
        business_location: finalLocation,
        
        // Report data
        report_data: reportData,
        content_gap_analysis: formattedContentGapAnalysis,
        ai_platform_scores: platformScoresArray,
        recommendations: recommendations,
        
        // Competitor info
        competitor_websites: competitors.map(c => c.website),
        competitor_analysis: formattedCompetitorAnalysis,
        
        // AI Knowledge Comparison
        ai_knowledge_comparison: aiKnowledgeComparison,
        
        // Scores
        overall_score: mainBusinessAIResults.overall_visibility_score,
        
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

    console.log(`\n✅ Report generated successfully!`);
    console.log(`   Report ID: ${reportId}`);
    console.log(`   Processing time: ${(processingDuration / 1000).toFixed(1)}s`);
    console.log(`   Total cost: $${totalCost.toFixed(2)}`);
    console.log(`   AI Queries: ${queryCount}`);
    console.log(`   Platforms with visibility: ${mainBusinessAIResults.total_platforms_mentioned}/4`);
    console.log(`   Competitors scraped: ${competitors.filter(c => !c.scrape_failed).length}/${competitors.length}`);

  } catch (error) {
    console.error('❌ Report generation failed:', error);
    
    // Update status to error
    await supabase
      .from('ai_visibility_external_reports')
      .update({
        status: 'error',
        error_message: error.message
      })
      .eq('id', reportId);
  }
}

/**
 * Analyze website features for comparison
 */
function analyzeWebsiteFeatures(content) {
  const text = (content.text || '').toLowerCase();
  const html = (content.html || '').toLowerCase();
  
  return {
    hasFAQ: text.includes('faq') || text.includes('frequently asked'),
    hasReviews: text.includes('review') || text.includes('testimonial'),
    hasProcess: text.includes('how it works') || text.includes('our process'),
    hasTestimonials: text.includes('testimonial') || text.includes('what our clients'),
    hasBeforeAfter: text.includes('before and after') || text.includes('before & after'),
    hasBlog: text.includes('blog') || text.includes('articles'),
    hasContact: text.includes('contact us') || text.includes('get in touch'),
    hasSchema: html.includes('schema.org') || html.includes('application/ld+json'),
    serviceCount: (content.services || []).length,
    contentDepth: text.length,
    headingCount: (html.match(/<h[1-6]/g) || []).length
  };
}

export { router as generateReportRoute };
