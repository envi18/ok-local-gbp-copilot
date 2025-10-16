// netlify/functions/generate-external-report.js
// Fixed version with proper error handling and environment variable access

// CRITICAL: Ensure @supabase/supabase-js is in package.json dependencies
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Enable longer timeout for background functions
  context.callbackWaitsForEmptyEventLoop = false;

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    console.error('JSON parse error:', error.message);
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }

  const {
    report_id,
    target_website,
    business_name,
    business_type,
    business_location,
    competitor_websites
  } = body;

  console.log('[START] Report generation:', {
    report_id,
    target_website,
    business_type,
    business_location
  });

  // Validate required fields
  if (!report_id || !target_website || !business_type || !business_location) {
    console.error('[ERROR] Missing required fields');
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required fields' })
    };
  }

  // Environment variables - try both VITE_ prefixed and non-prefixed
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[ERROR] Missing Supabase environment variables');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server configuration error - missing database credentials' })
    };
  }

  let supabase;
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[SUCCESS] Supabase client created');
  } catch (error) {
    console.error('[ERROR] Failed to create Supabase client:', error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Database connection failed' })
    };
  }

  try {
    // Update status to generating
    await supabase
      .from('ai_visibility_external_reports')
      .update({
        status: 'generating',
        generation_started_at: new Date().toISOString()
      })
      .eq('id', report_id);

    console.log('[SUCCESS] Status updated to generating');

    const startTime = Date.now();
    
    // Generate report
    const aiResults = await generateCompetitorStyleReport({
      business_name: business_name || target_website,
      business_type: business_type || 'business',
      location: business_location || 'Unknown',
      website: target_website,
      competitors: competitor_websites || []
    });

    const duration = Date.now() - startTime;

    console.log('[SUCCESS] Report completed:', {
      duration_ms: duration,
      overall_score: aiResults.overall_score,
      competitors_found: aiResults.top_competitors?.length || 0,
      total_cost: aiResults.total_cost?.toFixed(4)
    });

    // Structure report data
    const reportData = {
      id: report_id,
      organization_id: report_id,
      report_month: new Date().toISOString().slice(0, 7),
      status: 'completed',
      overall_score: aiResults.overall_score,
      platform_scores: aiResults.platform_scores,
      content_gaps: aiResults.content_gaps,
      priority_actions: aiResults.priority_actions,
      generated_at: new Date().toISOString()
    };

    // Enhanced content gap analysis
    const contentGapAnalysis = {
      primary_brand: {
        name: business_name,
        website: target_website,
        strengths: aiResults.brand_strengths,
        weaknesses: aiResults.brand_weaknesses,
        ai_visibility_score: aiResults.overall_score
      },
      top_competitors: aiResults.top_competitors || [],
      structural_gaps: aiResults.content_gaps.filter(g => g.gap_type === 'structural'),
      thematic_gaps: aiResults.content_gaps.filter(g => g.gap_type === 'thematic'),
      critical_topic_gaps: aiResults.content_gaps.filter(g => g.gap_type === 'critical_topic'),
      significant_topic_gaps: aiResults.content_gaps.filter(g => g.gap_type === 'significant_topic'),
      total_gaps: aiResults.content_gaps.length,
      severity_breakdown: {
        critical: aiResults.content_gaps.filter(g => g.severity === 'critical').length,
        significant: aiResults.content_gaps.filter(g => g.severity === 'significant').length,
        moderate: aiResults.content_gaps.filter(g => g.severity === 'moderate').length
      },
      implementation_timeline: aiResults.implementation_timeline,
      citation_opportunities: aiResults.citation_opportunities,
      ai_knowledge_scores: aiResults.ai_knowledge_scores
    };

    const aiPlatformScores = {};
    aiResults.platform_scores.forEach(score => {
      aiPlatformScores[score.platform] = score.score;
    });

    const apiCost = aiResults.total_cost || 0.50;
    const queryCount = aiResults.query_count || 20;

    // Save report to database
    const { error: updateError } = await supabase
      .from('ai_visibility_external_reports')
      .update({
        status: 'completed',
        report_data: reportData,
        content_gap_analysis: contentGapAnalysis,
        ai_platform_scores: aiPlatformScores,
        recommendations: aiResults.priority_actions,
        generation_completed_at: new Date().toISOString(),
        processing_duration_ms: duration,
        api_cost_usd: apiCost,
        query_count: queryCount
      })
      .eq('id', report_id);

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log('[SUCCESS] Report saved to database');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        report_id,
        message: 'Report generated successfully',
        overall_score: aiResults.overall_score,
        competitors_found: aiResults.top_competitors?.length || 0,
        processing_time_ms: duration,
        api_cost_usd: apiCost
      })
    };

  } catch (error) {
    console.error('[ERROR] Function error:', error.message);
    console.error('[ERROR] Stack:', error.stack);

    // Try to update error status
    try {
      await supabase
        .from('ai_visibility_external_reports')
        .update({
          status: 'error',
          error_message: error.message,
          generation_completed_at: new Date().toISOString()
        })
        .eq('id', report_id);
    } catch (dbError) {
      console.error('[ERROR] Failed to update error status:', dbError.message);
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};

/**
 * Generate report matching competitor format
 */
async function generateCompetitorStyleReport(params) {
  const { business_name, business_type, location, website } = params;
  
  console.log('[PHASE] Generating competitor-style report');
  
  try {
    // Phase 1: Discover competitors
    console.log('[PHASE 1] Competitor Discovery');
    const discoveryResults = await competitorDiscovery(
      business_name,
      business_type,
      location
    );
    
    // Select only TOP 2 competitors
    const top2Competitors = discoveryResults.competitors.slice(0, 2);
    console.log('[INFO] Selected top 2 competitors for analysis');
    
    // Phase 2: Deep analysis of top 2
    console.log('[PHASE 2] Analyzing Top 2 Competitors');
    const competitorAnalysis = await analyzeTop2Competitors(
      top2Competitors,
      business_type,
      location,
      discoveryResults.apiKeys
    );
    
    // Phase 3: Analyze target business
    console.log('[PHASE 3] Analyzing Target Business');
    const brandAnalysis = analyzeBrand(
      business_name,
      website,
      discoveryResults.targetMentions,
      discoveryResults.overall_score
    );
    
    // Phase 4: Generate gaps
    console.log('[PHASE 4] Gap Analysis');
    const content_gaps = generateDetailedGaps(
      brandAnalysis,
      competitorAnalysis
    );
    
    // Phase 5: Recommendations
    console.log('[PHASE 5] Recommendations');
    const priority_actions = generatePriorityActions(
      content_gaps,
      discoveryResults.overall_score
    );
    
    // Phase 6: Additional sections
    console.log('[PHASE 6] Implementation Timeline');
    const implementation_timeline = generateImplementationTimeline(priority_actions);
    
    console.log('[PHASE 7] Citation Opportunities');
    const citation_opportunities = generateCitationOpportunities(business_type, location);
    
    console.log('[PHASE 8] AI Knowledge Scores');
    const ai_knowledge_scores = generateAIKnowledgeScores(discoveryResults.platform_scores);
    
    return {
      overall_score: discoveryResults.overall_score,
      platform_scores: discoveryResults.platform_scores,
      brand_strengths: brandAnalysis.strengths,
      brand_weaknesses: brandAnalysis.weaknesses,
      top_competitors: competitorAnalysis.top_competitors_formatted || [],
      content_gaps,
      priority_actions,
      implementation_timeline,
      citation_opportunities,
      ai_knowledge_scores,
      query_count: discoveryResults.query_count,
      total_cost: discoveryResults.total_cost + (competitorAnalysis.total_cost || 0)
    };
  } catch (error) {
    console.error('[ERROR] Report generation failed:', error.message);
    throw error;
  }
}

/**
 * Competitor discovery phase
 */
async function competitorDiscovery(business_name, business_type, location) {
  const apiKeys = {
    chatgpt: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    claude: process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
    gemini: process.env.VITE_GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY,
    perplexity: process.env.VITE_PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY
  };
  
  // Reduced query count to avoid timeout (5 instead of 8)
  const queries = [
    `List the top 5 ${business_type} businesses in ${location} with their names`,
    `What are the best ${business_type} companies in ${location}? Give me specific names`,
    `Recommend ${business_type} services in ${location} by name`,
    `Compare the leading ${business_type} providers in ${location}`,
    `Tell me about ${business_name} and compare to other ${business_type} in ${location}`
  ];
  
  const platforms = ['chatgpt', 'claude', 'gemini', 'perplexity'];
  const allResponses = [];
  const platformScores = [];
  let totalCost = 0;
  let targetMentions = 0;
  let totalQueries = 0;
  
  for (const platform of platforms) {
    if (!apiKeys[platform]) {
      console.warn(`[WARN] Skipping ${platform} - no API key`);
      platformScores.push({ platform, score: 0, mention_count: 0, cost: 0 });
      continue;
    }
    
    console.log(`[INFO] Querying ${platform}`);
    let platformMentions = 0;
    let platformCost = 0;
    
    for (const query of queries) {
      try {
        const response = await executeQuery(
          platform,
          query,
          apiKeys[platform],
          { business_name, business_type, location }
        );
        
        allResponses.push({ platform, query, ...response });
        platformCost += response.cost || 0;
        totalCost += response.cost || 0;
        totalQueries++;
        
        if (response.text && response.text.toLowerCase().includes(business_name.toLowerCase())) {
          platformMentions++;
          targetMentions++;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`[ERROR] Query failed for ${platform}:`, error.message);
      }
    }
    
    const mentionRate = queries.length > 0 ? platformMentions / queries.length : 0;
    platformScores.push({
      platform,
      score: Math.round(mentionRate * 100),
      mention_count: platformMentions,
      cost: platformCost
    });
  }
  
  const competitors = extractCompetitorsAggressive(allResponses, business_name);
  
  const validScores = platformScores.filter(s => s.score > 0);
  const overall_score = validScores.length > 0
    ? Math.round(validScores.reduce((sum, s) => sum + s.score, 0) / validScores.length)
    : 0;
  
  return {
    platform_scores: platformScores,
    overall_score,
    competitors,
    targetMentions,
    allResponses,
    apiKeys,
    query_count: totalQueries,
    total_cost: totalCost
  };
}

/**
 * Analyze top 2 competitors
 */
async function analyzeTop2Competitors(top2Competitors, business_type, location, apiKeys) {
  if (top2Competitors.length === 0) {
    return { top_competitors_formatted: [], total_cost: 0 };
  }
  
  const analyses = [];
  let totalCost = 0;
  
  for (const competitor of top2Competitors) {
    try {
      if (!apiKeys.claude) continue;
      
      const analysisQuery = `Analyze why "${competitor.name}" (a ${business_type} in ${location}) appears in AI search results.

Focus on these key strengths only:
1. Online presence & website quality
2. Review volume and ratings
3. Content strategy
4. Local SEO factors
5. Authority signals

Provide 3-5 specific strengths as bullet points. Be concise and actionable.`;

      const response = await queryClaude(analysisQuery, '', apiKeys.claude);
      
      analyses.push({
        competitor: competitor.name,
        mention_count: competitor.mention_count,
        analysis: response.text,
        strengths: extractCompetitorStrengths(response.text)
      });
      
      totalCost += response.cost || 0;
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`[ERROR] Analyzing ${competitor.name}:`, error.message);
    }
  }
  
  const top_competitors_formatted = analyses.map(a => ({
    name: a.competitor,
    strengths: a.strengths,
    mention_frequency: a.mention_count
  }));
  
  return { top_competitors_formatted, analyses, total_cost: totalCost };
}

/**
 * Extract competitor strengths from analysis
 */
function extractCompetitorStrengths(analysisText) {
  const strengths = [];
  const lines = analysisText.split('\n');
  
  for (const line of lines) {
    if (/^[\d\-\*\u2022]/.test(line.trim()) && line.length > 20 && line.length < 200) {
      const cleaned = line.replace(/^[\d\-\*\u2022\)\.:\s]+/, '').trim();
      if (cleaned) {
        strengths.push(cleaned);
      }
    }
  }
  
  return strengths.slice(0, 5);
}

/**
 * Analyze target brand
 */
function analyzeBrand(business_name, website, targetMentions, overall_score) {
  const strengths = [];
  const weaknesses = [];
  
  if (targetMentions > 0) {
    strengths.push(`Has some AI visibility (${targetMentions} mentions across platforms)`);
  }
  
  if (overall_score >= 50) {
    strengths.push('Established online presence');
  }
  
  if (website) {
    strengths.push('Active website maintained');
  }
  
  if (targetMentions === 0) {
    weaknesses.push('Zero AI platform visibility');
    weaknesses.push('Not appearing in AI-powered search results');
  }
  
  if (overall_score < 50) {
    weaknesses.push('Weak online authority signals');
    weaknesses.push('Limited content depth compared to competitors');
  }
  
  if (overall_score < 30) {
    weaknesses.push('Insufficient review volume');
    weaknesses.push('Missing critical schema markup');
  }
  
  return { strengths, weaknesses };
}

/**
 * Generate detailed content gaps
 */
function generateDetailedGaps(brandAnalysis, competitorAnalysis) {
  const gaps = [];
  const timestamp = Date.now();
  let gapId = 1;
  
  const allStrengths = (competitorAnalysis.analyses || [])
    .flatMap(a => (a.strengths || []).map(s => s.toLowerCase()));
  
  const hasReviewStrength = allStrengths.some(s => 
    s.includes('review') || s.includes('rating') || s.includes('testimonial'));
  const hasContentStrength = allStrengths.some(s => 
    s.includes('content') || s.includes('blog') || s.includes('article'));
  const hasTechnicalStrength = allStrengths.some(s => 
    s.includes('schema') || s.includes('seo') || s.includes('technical'));
  const hasLocalStrength = allStrengths.some(s => 
    s.includes('local') || s.includes('directory') || s.includes('citation'));
  
  // STRUCTURAL GAPS
  if (hasTechnicalStrength) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'structural',
      gap_title: 'Schema Markup & Technical SEO',
      gap_description: 'Competitors have implemented structured data (schema markup) that helps AI platforms understand and parse business information. This includes LocalBusiness schema, Review schemas, and proper meta tags.',
      severity: 'critical',
      recommended_action: 'Implement comprehensive JSON-LD schema markup including LocalBusiness, AggregateRating, and Service schemas. Optimize Core Web Vitals and ensure mobile-first design.'
    });
  }
  
  gaps.push({
    id: `gap-${timestamp}-${gapId++}`,
    gap_type: 'structural',
    gap_title: 'Website Performance & Mobile Optimization',
    gap_description: 'Fast-loading, mobile-optimized websites rank better in AI results. Page speed, mobile responsiveness, and Core Web Vitals are key ranking factors.',
    severity: 'significant',
    recommended_action: 'Optimize images, implement lazy loading, minify CSS/JS, use CDN, and ensure perfect mobile responsiveness. Target green scores in Google PageSpeed Insights.'
  });
  
  // THEMATIC GAPS
  if (hasContentStrength) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'thematic',
      gap_title: 'Content Depth & Expertise Demonstration',
      gap_description: 'Competitors maintain comprehensive content including service guides, FAQs, and educational resources. This content demonstrates expertise and provides AI platforms with rich information to reference.',
      severity: 'critical',
      recommended_action: 'Create in-depth service pages (1500+ words each), comprehensive FAQ section, how-to guides, and case studies. Publish monthly blog content addressing customer questions.'
    });
  }
  
  if (hasLocalStrength) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'thematic',
      gap_title: 'Local Content & Geographic Relevance',
      gap_description: 'Competitors create location-specific content, mention local landmarks, and demonstrate community involvement. This strengthens local SEO signals for AI platforms.',
      severity: 'significant',
      recommended_action: 'Develop service area pages for each location, mention local landmarks, create neighborhood guides, and highlight community involvement.'
    });
  }
  
  // CRITICAL TOPIC GAPS
  if (hasReviewStrength) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'critical_topic',
      gap_title: 'Review Volume & Social Proof',
      gap_description: 'AI platforms heavily weight review signals. Competitors have 50-200+ reviews with high ratings. Your business needs stronger social proof signals to compete.',
      severity: 'critical',
      recommended_action: 'Launch systematic review generation: send automated post-service requests, make review process easy with direct links, respond to all reviews within 24 hours. Target 50+ reviews in 90 days.'
    });
  }
  
  if (brandAnalysis.weaknesses.includes('Zero AI platform visibility')) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'critical_topic',
      gap_title: 'AI Platform Invisibility',
      gap_description: 'Your business does not currently appear in any AI platform results while competitors are consistently recommended. This represents a critical visibility gap.',
      severity: 'critical',
      recommended_action: 'Emergency visibility campaign: optimize Google Business Profile completely, generate 30 reviews in 30 days, build 10-15 quality directory listings, implement schema markup, create comprehensive service content.'
    });
  }
  
  // SIGNIFICANT TOPIC GAPS
  gaps.push({
    id: `gap-${timestamp}-${gapId++}`,
    gap_type: 'significant_topic',
    gap_title: 'Directory Presence & NAP Consistency',
    gap_description: 'Competitors maintain consistent business information (Name, Address, Phone) across 50+ directories. This citation network builds authority and trust with AI platforms.',
    severity: 'moderate',
    recommended_action: 'Audit all online citations, ensure NAP consistency across directories, add business to major platforms (Yelp, Bing, Apple Maps, industry directories), monitor for citation opportunities monthly.'
  });
  
  gaps.push({
    id: `gap-${timestamp}-${gapId++}`,
    gap_type: 'significant_topic',
    gap_title: 'Social Media Engagement',
    gap_description: 'Active social media presence with regular posts and customer engagement strengthens brand visibility signals for AI platforms.',
    severity: 'moderate',
    recommended_action: 'Establish consistent posting schedule (3-4 times weekly), share customer testimonials and project photos, engage with comments within 2 hours, use local hashtags.'
  });
  
  return gaps;
}

/**
 * Generate priority actions from gaps
 */
function generatePriorityActions(content_gaps, overall_score) {
  const actions = [];
  const timestamp = Date.now();
  
  const criticalGaps = content_gaps.filter(g => g.severity === 'critical');
  
  criticalGaps.forEach((gap, index) => {
    actions.push({
      id: `action-${timestamp}-${index + 1}`,
      action_title: gap.gap_title,
      action_description: gap.recommended_action,
      priority: 'high',
      estimated_impact: 'high',
      estimated_effort: 'moderate',
      timeframe: '30-60 days'
    });
  });
  
  if (overall_score < 30) {
    actions.push({
      id: `action-${timestamp}-quickwin`,
      action_title: '30-Day Quick Win: Review Generation + GBP Optimization',
      action_description: 'Immediate dual-track campaign: Generate 30 Google reviews in 30 days while completing all Google Business Profile sections with photos, posts, and Q&A content.',
      priority: 'high',
      estimated_impact: 'high',
      estimated_effort: 'quick',
      timeframe: '30 days'
    });
  }
  
  return actions;
}

/**
 * Generate implementation timeline
 */
function generateImplementationTimeline(priority_actions) {
  const timeline = {
    immediate: [],
    short_term: [],
    long_term: []
  };
  
  priority_actions.forEach(action => {
    if (action.estimated_effort === 'quick' || action.timeframe === '30 days') {
      timeline.immediate.push({
        title: action.action_title,
        duration: '30 days',
        priority: action.priority
      });
    } else if (action.timeframe === '30-60 days') {
      timeline.short_term.push({
        title: action.action_title,
        duration: '30-60 days',
        priority: action.priority
      });
    } else {
      timeline.long_term.push({
        title: action.action_title,
        duration: '60-90 days',
        priority: action.priority
      });
    }
  });
  
  return timeline;
}

/**
 * Generate citation opportunities
 */
function generateCitationOpportunities(business_type, location) {
  return [
    {
      platform: 'Google Business Profile',
      priority: 'critical',
      status: 'required',
      description: 'Primary local business listing - must be complete and active'
    },
    {
      platform: 'Yelp',
      priority: 'high',
      status: 'recommended',
      description: 'Major review platform - claim and optimize listing'
    },
    {
      platform: 'Bing Places',
      priority: 'high',
      status: 'recommended',
      description: 'Microsoft\'s local search - increasing AI integration'
    },
    {
      platform: 'Apple Maps',
      priority: 'medium',
      status: 'recommended',
      description: 'Growing importance for iOS users and Apple ecosystem'
    },
    {
      platform: 'Facebook Business',
      priority: 'medium',
      status: 'recommended',
      description: 'Social proof and community engagement platform'
    },
    {
      platform: `Industry-specific directories for ${business_type}`,
      priority: 'medium',
      status: 'opportunity',
      description: 'Specialized directories build niche authority'
    },
    {
      platform: `${location} Chamber of Commerce`,
      priority: 'low',
      status: 'opportunity',
      description: 'Local business authority and networking'
    },
    {
      platform: 'Better Business Bureau',
      priority: 'low',
      status: 'opportunity',
      description: 'Trust and credibility signal'
    }
  ];
}

/**
 * Generate AI knowledge scores
 */
function generateAIKnowledgeScores(platform_scores) {
  const platforms = platform_scores.map(p => ({
    platform: p.platform,
    score: p.score,
    knowledge_level: p.score >= 70 ? 'High' : p.score >= 40 ? 'Moderate' : 'Low',
    recommendation: p.score >= 70 
      ? 'Maintain and optimize existing presence'
      : p.score >= 40
      ? 'Strengthen content and review signals'
      : 'Build foundational visibility from scratch'
  }));

  const overallKnowledge = platform_scores.length > 0
    ? platform_scores.reduce((sum, p) => sum + p.score, 0) / platform_scores.length
    : 0;

  const bestPlatform = platform_scores.reduce((best, current) => 
    current.score > best.score ? current : best, platform_scores[0] || { platform: 'none', score: 0 });

  return {
    platforms,
    overall_knowledge: overallKnowledge,
    best_platform: {
      platform: bestPlatform.platform,
      score: bestPlatform.score,
      knowledge_level: bestPlatform.score >= 70 ? 'High' : bestPlatform.score >= 40 ? 'Moderate' : 'Low',
      recommendation: ''
    },
    needs_improvement: platforms.filter(p => p.score < 50)
  };
}

/**
 * Extract competitors from AI responses
 */
function extractCompetitorsAggressive(responses, targetBusinessName) {
  const competitorCounts = {};
  const targetLower = targetBusinessName.toLowerCase();
  
  responses.forEach(response => {
    if (!response.text) return;
    
    const text = response.text;
    
    const patterns = [
      /(?:^|\n)\s*[\d]+[\.)]\s*\*?\*?([A-Z][A-Za-z0-9\s&''\-\.]+)\*?\*?/gm,
      /\*\*([A-Z][A-Za-z0-9\s&''\-\.]+)\*\*/g,
      /(?:recommend|suggests?)\s+([A-Z][A-Za-z\s&''\-]{3,40}?)(?:\s|,|\.)/gi
    ];
    
    patterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const name = match[1].trim().replace(/[*"]/g, '');
        if (isValidBusinessName(name, targetLower)) {
          competitorCounts[name] = (competitorCounts[name] || 0) + 1;
        }
      });
    });
  });
  
  return Object.entries(competitorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, mention_count: count }));
}

function isValidBusinessName(text, targetLower) {
  if (!text || text.length < 3 || text.length > 60) return false;
  if (text.toLowerCase() === targetLower) return false;
  if (!/^[A-Z]/.test(text)) return false;
  
  const exclude = ['google', 'yelp', 'best', 'top', 'business', 'company', 'the', 'and'];
  if (exclude.includes(text.toLowerCase())) return false;
  
  return true;
}

/**
 * Execute AI platform query
 */
async function executeQuery(platform, query, apiKey, context) {
  const systemPrompt = `You are helping someone find ${context.business_type} businesses in ${context.location}.

IMPORTANT: List SPECIFIC BUSINESS NAMES. Provide 3-5 real business names.

Format them clearly (numbered list or bold).`;

  switch (platform) {
    case 'chatgpt': return await queryChatGPT(query, systemPrompt, apiKey);
    case 'claude': return await queryClaude(query, systemPrompt, apiKey);
    case 'gemini': return await queryGemini(query, systemPrompt, apiKey);
    case 'perplexity': return await queryPerplexity(query, systemPrompt, apiKey);
    default: throw new Error(`Unknown platform: ${platform}`);
  }
}

/**
 * Query ChatGPT API
 */
async function queryChatGPT(query, systemPrompt, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      max_tokens: 600,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ChatGPT API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  const text = data.choices[0]?.message?.content || '';
  const tokens = data.usage?.total_tokens || 0;
  const cost = (tokens / 1000) * 0.0025;
  
  return { text, cost, tokens };
}

/**
 * Query Claude API
 */
async function queryClaude(query, systemPrompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: query }]
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  const text = data.content[0]?.text || '';
  const inputTokens = data.usage?.input_tokens || 0;
  const outputTokens = data.usage?.output_tokens || 0;
  const cost = (inputTokens / 1000) * 0.003 + (outputTokens / 1000) * 0.015;
  
  return { text, cost, tokens: inputTokens + outputTokens };
}

/**
 * Query Gemini API
 */
async function queryGemini(query, systemPrompt, apiKey) {
  const fullPrompt = `${systemPrompt}\n\n${query}`;
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { maxOutputTokens: 600, temperature: 0.7 }
      })
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  const text = data.candidates[0]?.content?.parts[0]?.text || '';
  const estimatedTokens = Math.ceil((fullPrompt.length + text.length) / 4);
  const cost = (estimatedTokens / 1000000) * 0.075;
  
  return { text, cost, tokens: estimatedTokens };
}

/**
 * Query Perplexity API
 */
async function queryPerplexity(query, systemPrompt, apiKey) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      max_tokens: 600,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  const text = data.choices[0]?.message?.content || '';
  const tokens = data.usage?.total_tokens || 0;
  const cost = (tokens / 1000000) * 1.0;
  
  return { text, cost, tokens };
}