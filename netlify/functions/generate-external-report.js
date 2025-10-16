// netlify/functions/generate-external-report.js
// Enhanced with comprehensive competitive analysis

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
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

  console.log('🚀 Starting enhanced competitive analysis:', {
    report_id,
    target_website,
    business_type,
    business_location
  });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Update status to generating
    await supabase
      .from('ai_visibility_external_reports')
      .update({
        status: 'generating',
        generation_started_at: new Date().toISOString()
      })
      .eq('id', report_id);

    console.log('✅ Status updated to generating');

    const startTime = Date.now();
    
    // Generate enhanced AI visibility report with competitive analysis
    const aiResults = await generateEnhancedAIReport({
      business_name: business_name || target_website,
      business_type: business_type || 'business',
      location: business_location || 'Unknown',
      website: target_website,
      competitors: competitor_websites || []
    });

    const duration = Date.now() - startTime;

    console.log('✅ Enhanced analysis completed');
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Overall Score: ${aiResults.overall_score}/100`);
    console.log(`   Competitors Found: ${aiResults.competitors_found?.length || 0}`);

    // Structure the report data
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

    // Structure enhanced content gap analysis
    const contentGapAnalysis = {
      primary_brand: target_website,
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
      current_landscape: aiResults.landscape_analysis,
      recommendations: aiResults.priority_actions,
      competitors_analyzed: aiResults.competitors_found
    };

    const aiPlatformScores = {};
    aiResults.platform_scores.forEach(score => {
      aiPlatformScores[score.platform] = score.score;
    });

    const apiCost = aiResults.total_cost || 0.36;
    const queryCount = aiResults.query_count || 10;

    console.log('💰 API Cost:', apiCost);

    // Update report with complete results
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
      throw new Error('Failed to update report: ' + updateError.message);
    }

    console.log('✅ Enhanced report saved to database');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        report_id,
        message: 'Enhanced report generated successfully',
        overall_score: aiResults.overall_score,
        competitors_found: aiResults.competitors_found?.length || 0,
        processing_time_ms: duration,
        api_cost_usd: apiCost
      })
    };

  } catch (error) {
    console.error('❌ Function error:', error);

    await supabase
      .from('ai_visibility_external_reports')
      .update({
        status: 'error',
        error_message: error.message,
        generation_completed_at: new Date().toISOString()
      })
      .eq('id', report_id);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      })
    };
  }
};

/**
 * Generate enhanced AI visibility report with competitive analysis
 */
async function generateEnhancedAIReport(params) {
  const { business_name, business_type, location, website, competitors } = params;
  
  console.log('🤖 Generating enhanced AI visibility analysis...');
  
  // Phase 1: Discovery - Find who appears in AI results
  console.log('📊 Phase 1: Competitor Discovery');
  const discoveryResults = await performCompetitorDiscovery(
    business_name,
    business_type,
    location
  );
  
  // Phase 2: Analysis - Why do competitors succeed?
  console.log('🔍 Phase 2: Competitive Analysis');
  const competitorAnalysis = await analyzeCompetitorSuccess(
    discoveryResults.competitors,
    business_type,
    location,
    discoveryResults.apiKeys
  );
  
  // Phase 3: Comparison - What's the target business missing?
  console.log('⚖️  Phase 3: Gap Analysis');
  const content_gaps = generateRichContentGaps(
    business_name,
    website,
    discoveryResults.targetMentions,
    competitorAnalysis
  );
  
  // Phase 4: Recommendations - What should they do?
  console.log('💡 Phase 4: Recommendations');
  const priority_actions = generateCompetitorInformedRecommendations(
    content_gaps,
    competitorAnalysis,
    discoveryResults.overall_score
  );
  
  // Phase 5: Landscape - Overall competitive picture
  console.log('🗺️  Phase 5: Landscape Analysis');
  const landscape_analysis = generateEnhancedLandscape(
    business_name,
    website,
    discoveryResults,
    competitorAnalysis
  );
  
  return {
    overall_score: discoveryResults.overall_score,
    platform_scores: discoveryResults.platform_scores,
    content_gaps,
    priority_actions,
    landscape_analysis,
    competitors_found: discoveryResults.competitors,
    recommendations: priority_actions,
    query_count: discoveryResults.query_count,
    total_cost: discoveryResults.total_cost
  };
}

/**
 * PHASE 1: Competitor Discovery
 * Query AI platforms to find who appears in results
 */
async function performCompetitorDiscovery(business_name, business_type, location) {
  const apiKeys = {
    chatgpt: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    claude: process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
    gemini: process.env.VITE_GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY,
    perplexity: process.env.VITE_PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY
  };
  
  // Generate discovery queries
  const queries = [
    `best ${business_type} in ${location}`,
    `top rated ${business_type} services ${location}`,
    `recommended ${business_type} companies ${location}`,
    `find ${business_type} near me ${location}`
  ];
  
  console.log(`   Running ${queries.length} discovery queries across platforms...`);
  
  const platforms = ['chatgpt', 'claude', 'gemini', 'perplexity'];
  const allResponses = [];
  const platformScores = [];
  let totalCost = 0;
  let targetMentions = 0;
  let totalQueries = 0;
  
  // Query each platform with discovery queries
  for (const platform of platforms) {
    if (!apiKeys[platform]) {
      console.warn(`   ⚠️  Skipping ${platform} - no API key`);
      platformScores.push({
        platform,
        score: 0,
        mention_count: 0,
        cost: 0
      });
      continue;
    }
    
    console.log(`   Querying ${platform}...`);
    const platformResponses = [];
    let platformMentions = 0;
    
    // Run 2 queries per platform to balance cost/coverage
    for (const query of queries.slice(0, 2)) {
      try {
        const response = await executePlatformQuery(
          platform,
          query,
          apiKeys[platform],
          { business_name, business_type, location }
        );
        
        platformResponses.push(response);
        allResponses.push({ platform, query, ...response });
        totalCost += response.cost || 0;
        totalQueries++;
        
        // Check if target business is mentioned
        if (response.text && 
            response.text.toLowerCase().includes(business_name.toLowerCase())) {
          platformMentions++;
          targetMentions++;
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`   ❌ Error querying ${platform}:`, error.message);
      }
    }
    
    // Calculate platform score
    const mentionRate = queries.slice(0, 2).length > 0 
      ? platformMentions / queries.slice(0, 2).length 
      : 0;
    platformScores.push({
      platform,
      score: Math.round(mentionRate * 100),
      mention_count: platformMentions,
      cost: platformResponses.reduce((sum, r) => sum + (r.cost || 0), 0)
    });
  }
  
  // Extract competitors from all responses
  console.log('   Extracting competitor names from responses...');
  const competitors = extractCompetitorsFromResponses(allResponses, business_name);
  console.log(`   Found ${competitors.length} potential competitors`);
  
  // Calculate overall score
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
 * Extract competitor business names from AI responses
 */
function extractCompetitorsFromResponses(responses, targetBusinessName) {
  const competitorCounts = {};
  const targetLower = targetBusinessName.toLowerCase();
  
  // Patterns that indicate business names
  const patterns = [
    /(?:recommend|suggests?|try|check out|visit)\s+([A-Z][A-Za-z\s&'-]{2,40}(?:LLC|Inc|Co\.|Company)?)/g,
    /(?:top|best|leading|popular)\s+(?:choices?|options?|picks?)(?:\s+include)?:?\s*\n?\s*(?:\d+\.?\s*)?([A-Z][A-Za-z\s&'-]{2,40})/g,
    /\*\*([A-Z][A-Za-z\s&'-]{2,40})\*\*/g,
    /(?:^|\n)\s*\d+\.\s+([A-Z][A-Za-z\s&'-]{2,40})/gm,
    /(?:rated|reviewed|established)\s+([A-Z][A-Za-z\s&'-]{2,40})/g
  ];
  
  responses.forEach(response => {
    if (!response.text) return;
    
    patterns.forEach(pattern => {
      const matches = [...response.text.matchAll(pattern)];
      matches.forEach(match => {
        const businessName = match[1].trim();
        
        // Filter out generic terms and target business
        if (isLikelyBusinessName(businessName) && 
            businessName.toLowerCase() !== targetLower) {
          competitorCounts[businessName] = (competitorCounts[businessName] || 0) + 1;
        }
      });
    });
  });
  
  // Sort by mention frequency and take top 5
  const sortedCompetitors = Object.entries(competitorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, mention_count: count }));
  
  return sortedCompetitors;
}

/**
 * Check if extracted text is likely a business name
 */
function isLikelyBusinessName(text) {
  // Filter out common false positives
  const excludePatterns = [
    /^(The|A|An|In|On|At|To|For|Of|And|Or|But|Best|Top|Most|More|Less|Very|Really|Google|Yelp|Facebook)$/i,
    /^(Business|Company|Service|Services|Location|Area|City|State|Review|Reviews?)$/i,
    /^(Here|There|These|Those|Some|Many|Several|Few|All|None)$/i,
    /^.{0,2}$/,  // Too short
    /^.{50,}$/,  // Too long
    /\d{5,}/,    // Contains long numbers
    /https?:/,   // Contains URL
    /@/          // Contains email
  ];
  
  return !excludePatterns.some(pattern => pattern.test(text));
}

/**
 * PHASE 2: Analyze why competitors succeed
 */
async function analyzeCompetitorSuccess(competitors, business_type, location, apiKeys) {
  if (competitors.length === 0) {
    return { analyses: [], total_cost: 0 };
  }
  
  console.log(`   Analyzing ${competitors.length} competitors...`);
  
  const analyses = [];
  let totalCost = 0;
  
  // Analyze top 3 competitors to stay within budget
  const topCompetitors = competitors.slice(0, 3);
  
  for (const competitor of topCompetitors) {
    try {
      // Use Claude for analysis (good at analytical tasks)
      if (!apiKeys.claude) continue;
      
      const query = `Analyze why "${competitor.name}" appears in AI results for "${business_type} in ${location}". 
      
What factors make them successful? Consider:
1. Online presence strength (website quality, SEO, schema markup)
2. Review signals (volume, ratings, recency)
3. Content quality (depth, expertise, relevance)
4. Authority markers (backlinks, citations, mentions)
5. Local SEO factors (NAP consistency, local content)

Provide a brief analysis (3-4 key points).`;

      const response = await queryClaude(query, '', apiKeys.claude);
      
      analyses.push({
        competitor: competitor.name,
        mention_count: competitor.mention_count,
        analysis: response.text,
        success_factors: extractSuccessFactors(response.text)
      });
      
      totalCost += response.cost || 0;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`   ❌ Error analyzing ${competitor.name}:`, error.message);
    }
  }
  
  return { analyses, total_cost: totalCost };
}

/**
 * Extract success factors from competitor analysis
 */
function extractSuccessFactors(analysisText) {
  const factors = [];
  
  const factorPatterns = {
    'strong_reviews': /review|rating|testimonial|feedback/i,
    'quality_content': /content|blog|article|information|expertise/i,
    'technical_seo': /schema|markup|seo|structured data|optimization/i,
    'local_presence': /local|location|map|directory|citation/i,
    'authority': /backlink|authority|trust|reputation|mention/i,
    'website_quality': /website|design|user experience|professional/i
  };
  
  for (const [factor, pattern] of Object.entries(factorPatterns)) {
    if (pattern.test(analysisText)) {
      factors.push(factor);
    }
  }
  
  return factors;
}

/**
 * PHASE 3: Generate rich content gaps based on competitive analysis
 */
function generateRichContentGaps(businessName, website, targetMentions, competitorAnalysis) {
  const gaps = [];
  const timestamp = Date.now();
  let gapId = 1;
  
  // Aggregate competitor success factors
  const allSuccessFactors = competitorAnalysis.analyses
    .flatMap(a => a.success_factors);
  const factorCounts = {};
  allSuccessFactors.forEach(factor => {
    factorCounts[factor] = (factorCounts[factor] || 0) + 1;
  });
  
  // STRUCTURAL GAPS (Technical/Schema/Website)
  if (factorCounts.technical_seo >= 2) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'structural',
      gap_title: 'Missing Structured Data Implementation',
      gap_description: 'Competitors appearing in AI results have implemented schema markup (LocalBusiness, Organization, Review schemas) that help AI platforms understand and feature their business information. Without structured data, AI systems cannot easily parse and present your business details.',
      severity: 'critical',
      recommended_action: 'Implement JSON-LD structured data for LocalBusiness schema including name, address, phone, hours, and services. Add Review and AggregateRating schemas to showcase customer feedback.'
    });
  }
  
  if (factorCounts.website_quality >= 2) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'structural',
      gap_title: 'Website Quality and User Experience Gaps',
      gap_description: 'Leading competitors have professional, fast-loading websites with clear service descriptions and strong calls-to-action. AI platforms favor websites that demonstrate professionalism and provide good user experiences.',
      severity: 'significant',
      recommended_action: 'Audit website performance (Core Web Vitals), improve mobile responsiveness, enhance service page content depth, and ensure clear navigation structure.'
    });
  }
  
  // THEMATIC GAPS (Content Focus)
  if (factorCounts.quality_content >= 2) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'thematic',
      gap_title: 'Content Depth and Expertise Signals',
      gap_description: 'Successful competitors maintain blogs, guides, or FAQ sections that demonstrate expertise and help AI systems understand their topical authority. Your website may lack the content depth that signals expertise to AI platforms.',
      severity: 'significant',
      recommended_action: 'Create comprehensive service guides, answer common customer questions with detailed FAQ content, and publish regular blog posts addressing customer pain points in your industry.'
    });
  }
  
  if (factorCounts.local_presence >= 2) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'thematic',
      gap_title: 'Local Content and Geographic Relevance',
      gap_description: 'Competitors are creating location-specific content that helps AI platforms understand their geographic service area and local relevance. Content should emphasize local connections and community involvement.',
      severity: 'moderate',
      recommended_action: 'Add location-specific pages for each service area, mention local landmarks and neighborhoods, create content about serving the local community, and ensure consistent NAP (Name, Address, Phone) across all pages.'
    });
  }
  
  // CRITICAL TOPIC GAPS (Must-have content)
  if (factorCounts.strong_reviews >= 2) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'critical_topic',
      gap_title: 'Review Volume and Quality Signals',
      gap_description: 'AI platforms heavily weight businesses with substantial review volumes and high ratings. Competitors appearing in AI results have strong review profiles across multiple platforms (Google, Yelp, Facebook). Your business needs more review signals.',
      severity: 'critical',
      recommended_action: 'Implement systematic review generation campaign: send post-service review requests, make leaving reviews easy with direct links, respond to all reviews promptly, and aim for 50+ reviews across platforms within 3 months.'
    });
  }
  
  // Add visibility gap if target business has low mentions
  if (targetMentions === 0) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'critical_topic',
      gap_title: 'Zero AI Platform Visibility',
      gap_description: 'Your business does not currently appear in any AI platform responses for relevant industry queries, while competitors are being recommended. This indicates a fundamental gap in online authority and discoverability signals that AI systems rely on.',
      severity: 'critical',
      recommended_action: 'Prioritize building foundational online presence: claim and optimize all directory listings, ensure consistent NAP citations, build quality backlinks from industry sources, and create authoritative content that establishes expertise.'
    });
  }
  
  // SIGNIFICANT TOPIC GAPS (Nice-to-have)
  if (factorCounts.authority >= 1) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'significant_topic',
      gap_title: 'Authority and Backlink Profile',
      gap_description: 'Competitors have built authority through backlinks from local news, industry associations, and business directories. These authority signals help AI platforms trust and recommend their business.',
      severity: 'moderate',
      recommended_action: 'Build backlink profile through: local chamber of commerce membership, industry association listings, local news mentions (press releases for newsworthy events), partnerships with complementary businesses, and guest posts on industry blogs.'
    });
  }
  
  // Ensure we always have at least a few gaps
  if (gaps.length < 3) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'structural',
      gap_title: 'Google Business Profile Optimization',
      gap_description: 'A complete and actively managed Google Business Profile is essential for AI visibility. Competitors with strong AI presence maintain comprehensive profiles with photos, posts, Q&A, and prompt review responses.',
      severity: 'critical',
      recommended_action: 'Complete all GBP sections (services, attributes, hours, photos), post weekly updates, respond to reviews within 24 hours, add Q&A content, and upload high-quality photos regularly.'
    });
  }
  
  return gaps;
}

/**
 * PHASE 4: Generate competitor-informed recommendations
 */
function generateCompetitorInformedRecommendations(content_gaps, competitorAnalysis, overall_score) {
  const actions = [];
  const timestamp = Date.now();
  
  // Convert gaps to prioritized actions
  const criticalGaps = content_gaps.filter(g => g.severity === 'critical');
  const significantGaps = content_gaps.filter(g => g.severity === 'significant');
  
  // High priority actions from critical gaps
  criticalGaps.forEach((gap, index) => {
    actions.push({
      id: `action-${timestamp}-${index + 1}`,
      action_title: gap.gap_title.replace('Missing', 'Implement').replace('Zero', 'Build'),
      action_description: gap.recommended_action,
      priority: 'high',
      estimated_impact: 'high',
      estimated_effort: gap.gap_type === 'structural' ? 'moderate' : 'significant',
      gap_addressed: gap.id
    });
  });
  
  // Medium priority actions from significant gaps
  significantGaps.slice(0, 2).forEach((gap, index) => {
    actions.push({
      id: `action-${timestamp}-critical-${index + 1}`,
      action_title: gap.gap_title,
      action_description: gap.recommended_action,
      priority: 'medium',
      estimated_impact: 'medium',
      estimated_effort: 'moderate',
      gap_addressed: gap.id
    });
  });
  
  // Add competitor-specific recommendation if we have analysis
  if (competitorAnalysis.analyses && competitorAnalysis.analyses.length > 0) {
    const topCompetitor = competitorAnalysis.analyses[0];
    actions.push({
      id: `action-${timestamp}-competitive`,
      action_title: 'Competitive Benchmarking Strategy',
      action_description: `Study and learn from ${topCompetitor.competitor}'s approach: ${topCompetitor.analysis.slice(0, 200)}... Use their success as a blueprint for your own AI visibility strategy.`,
      priority: 'medium',
      estimated_impact: 'high',
      estimated_effort: 'quick',
      gap_addressed: 'competitive-intelligence'
    });
  }
  
  // Add quick win if score is very low
  if (overall_score < 20) {
    actions.push({
      id: `action-${timestamp}-quickwin`,
      action_title: 'Quick Win: Review Generation Sprint',
      action_description: 'Launch a 30-day focused review generation campaign. Contact your 20 most satisfied recent customers and request Google reviews. This single action can dramatically improve AI visibility within weeks.',
      priority: 'high',
      estimated_impact: 'high',
      estimated_effort: 'quick',
      gap_addressed: 'immediate-impact'
    });
  }
  
  return actions;
}

/**
 * PHASE 5: Generate enhanced landscape analysis
 */
function generateEnhancedLandscape(businessName, website, discoveryResults, competitorAnalysis) {
  const competitors = discoveryResults.competitors || [];
  const analyses = competitorAnalysis.analyses || [];
  
  // Analyze target business strengths/weaknesses
  const targetStrengths = [];
  const targetWeaknesses = [];
  
  if (discoveryResults.targetMentions > 0) {
    targetStrengths.push('Appears in some AI platform results');
    targetStrengths.push('Has established online presence');
  } else {
    targetWeaknesses.push('No current AI platform visibility');
    targetWeaknesses.push('Not competing effectively for AI recommendations');
  }
  
  discoveryResults.platform_scores.forEach(platform => {
    if (platform.score === 0) {
      targetWeaknesses.push(`Not visible on ${platform.platform}`);
    } else if (platform.score < 50) {
      targetWeaknesses.push(`Low visibility on ${platform.platform} (${platform.score}% mention rate)`);
    }
  });
  
  // Competitor competitive advantages
  const competitorAdvantages = [];
  const commonSuccessFactors = {};
  
  analyses.forEach(analysis => {
    analysis.success_factors.forEach(factor => {
      commonSuccessFactors[factor] = (commonSuccessFactors[factor] || 0) + 1;
    });
  });
  
  // Identify what makes competitors successful
  Object.entries(commonSuccessFactors)
    .sort((a, b) => b[1] - a[1])
    .forEach(([factor, count]) => {
      const factorDescriptions = {
        'strong_reviews': 'High volume of positive customer reviews',
        'quality_content': 'Comprehensive, authoritative content',
        'technical_seo': 'Strong technical SEO and structured data',
        'local_presence': 'Robust local SEO and directory presence',
        'authority': 'Established online authority and backlinks',
        'website_quality': 'Professional, user-friendly websites'
      };
      
      if (count >= 2) {
        competitorAdvantages.push(factorDescriptions[factor] || factor);
      }
    });
  
  return {
    primary_brand_overview: {
      name: businessName,
      website: website,
      current_ai_visibility: discoveryResults.overall_score,
      strengths: targetStrengths.length > 0 ? targetStrengths : ['Opportunity to build from clean slate'],
      weaknesses: targetWeaknesses,
      visibility_by_platform: discoveryResults.platform_scores.reduce((acc, p) => {
        acc[p.platform] = `${p.score}% (${p.mention_count} mentions)`;
        return acc;
      }, {})
    },
    competitor_overview: competitors.length > 0 ? {
      total_competitors_found: competitors.length,
      top_competitors: competitors.slice(0, 3).map(c => ({
        name: c.name,
        mention_frequency: c.mention_count,
        analysis: analyses.find(a => a.competitor === c.name)?.analysis || 'Not analyzed'
      })),
      competitive_advantages: competitorAdvantages.length > 0 
        ? competitorAdvantages 
        : ['Established market presence', 'Strong online visibility'],
      competitive_challenges: [
        'Need to match competitor content quality',
        'Build similar review volume and authority signals',
        'Implement technical optimizations competitors have'
      ]
    } : {
      total_competitors_found: 0,
      note: 'Limited competitor visibility data - focus on building strong foundational presence'
    },
    market_insights: {
      ai_visibility_maturity: discoveryResults.overall_score < 30 ? 'Early Stage' : 
                              discoveryResults.overall_score < 70 ? 'Developing' : 'Mature',
      opportunity_level: discoveryResults.overall_score < 30 ? 'High - significant room for growth' :
                         discoveryResults.overall_score < 70 ? 'Moderate - can improve positioning' :
                         'Low - maintain and optimize existing presence',
      recommended_focus: competitorAdvantages.length > 0 
        ? `Prioritize: ${competitorAdvantages.slice(0, 2).join(', ')}`
        : 'Build foundational online presence (reviews, content, technical SEO)'
    }
  };
}

/**
 * Execute a single query on a platform using its API
 */
async function executePlatformQuery(platform, query, apiKey, context) {
  const systemPrompt = `You are helping analyze local business visibility in AI results. 
When asked about "${context.business_type} in ${context.location}", provide natural recommendations as if helping someone find services.
List 3-5 specific business names if you know them, otherwise describe what to look for.`;

  switch (platform) {
    case 'chatgpt':
      return await queryChatGPT(query, systemPrompt, apiKey);
    case 'claude':
      return await queryClaude(query, systemPrompt, apiKey);
    case 'gemini':
      return await queryGemini(query, systemPrompt, apiKey);
    case 'perplexity':
      return await queryPerplexity(query, systemPrompt, apiKey);
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

/**
 * Query ChatGPT (OpenAI)
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
      max_tokens: 500,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ChatGPT API error: ${response.statusText} - ${errorText}`);
  }
  
  const data = await response.json();
  const text = data.choices[0]?.message?.content || '';
  const tokens = data.usage?.total_tokens || 0;
  const cost = (tokens / 1000) * 0.0025; // GPT-4o pricing
  
  return { text, cost, tokens };
}

/**
 * Query Claude (Anthropic)
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
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        { role: 'user', content: query }
      ]
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.statusText} - ${errorText}`);
  }
  
  const data = await response.json();
  const text = data.content[0]?.text || '';
  const inputTokens = data.usage?.input_tokens || 0;
  const outputTokens = data.usage?.output_tokens || 0;
  const cost = (inputTokens / 1000) * 0.003 + (outputTokens / 1000) * 0.015;
  
  return { text, cost, tokens: inputTokens + outputTokens };
}

/**
 * Query Gemini (Google)
 */
async function queryGemini(query, systemPrompt, apiKey) {
  const fullPrompt = `${systemPrompt}\n\nUser Query: ${query}`;
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7
        }
      })
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`);
  }
  
  const data = await response.json();
  const text = data.candidates[0]?.content?.parts[0]?.text || '';
  const estimatedTokens = Math.ceil((fullPrompt.length + text.length) / 4);
  const cost = (estimatedTokens / 1000000) * 0.075; // Gemini 2.0 Flash pricing
  
  return { text, cost, tokens: estimatedTokens };
}

/**
 * Query Perplexity
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
      max_tokens: 500,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error: ${response.statusText} - ${errorText}`);
  }
  
  const data = await response.json();
  const text = data.choices[0]?.message?.content || '';
  const tokens = data.usage?.total_tokens || 0;
  const cost = (tokens / 1000000) * 1.0; // Sonar Pro pricing
  
  return { text, cost, tokens };
}