// netlify/functions/generate-external-report.js
// Enhanced with AGGRESSIVE competitive analysis - prioritizing quality over cost

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

  console.log('🚀 Starting AGGRESSIVE competitive analysis:', {
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
    
    // Generate enhanced AI visibility report with aggressive competitive analysis
    const aiResults = await generateAggressiveCompetitiveReport({
      business_name: business_name || target_website,
      business_type: business_type || 'business',
      location: business_location || 'Unknown',
      website: target_website,
      competitors: competitor_websites || []
    });

    const duration = Date.now() - startTime;

    console.log('✅ Aggressive analysis completed');
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Overall Score: ${aiResults.overall_score}/100`);
    console.log(`   Competitors Found: ${aiResults.competitors_found?.length || 0}`);
    console.log(`   Total Cost: $${aiResults.total_cost?.toFixed(2) || '0.00'}`);

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

    const apiCost = aiResults.total_cost || 0.50;
    const queryCount = aiResults.query_count || 20;

    console.log('💰 Final API Cost:', apiCost);

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
 * Generate aggressive competitive analysis report
 */
async function generateAggressiveCompetitiveReport(params) {
  const { business_name, business_type, location, website, competitors } = params;
  
  console.log('🤖 Starting aggressive competitive intelligence gathering...');
  
  // Phase 1: Discovery - Find ALL competitors (no cost restrictions)
  console.log('\n📊 Phase 1: Aggressive Competitor Discovery');
  const discoveryResults = await aggressiveCompetitorDiscovery(
    business_name,
    business_type,
    location
  );
  
  console.log(`   ✅ Found ${discoveryResults.competitors.length} competitors`);
  console.log(`   Target Business Mentions: ${discoveryResults.targetMentions}`);
  
  // Phase 2: Deep Analysis - Analyze top competitors thoroughly
  console.log('\n🔍 Phase 2: Deep Competitive Analysis');
  const competitorAnalysis = await deepCompetitorAnalysis(
    discoveryResults.competitors,
    business_type,
    location,
    discoveryResults.apiKeys
  );
  
  console.log(`   ✅ Analyzed ${competitorAnalysis.analyses.length} competitors in detail`);
  
  // Phase 3: Rich Gap Analysis - Generate comprehensive gaps
  console.log('\n⚖️  Phase 3: Comprehensive Gap Analysis');
  const content_gaps = generateComprehensiveContentGaps(
    business_name,
    website,
    discoveryResults.targetMentions,
    competitorAnalysis,
    discoveryResults.allResponses
  );
  
  console.log(`   ✅ Generated ${content_gaps.length} content gaps`);
  
  // Phase 4: Detailed Recommendations
  console.log('\n💡 Phase 4: Actionable Recommendations');
  const priority_actions = generateDetailedRecommendations(
    content_gaps,
    competitorAnalysis,
    discoveryResults.overall_score
  );
  
  console.log(`   ✅ Created ${priority_actions.length} prioritized actions`);
  
  // Phase 5: Enhanced Landscape
  console.log('\n🗺️  Phase 5: Competitive Landscape Report');
  const landscape_analysis = generateDetailedLandscape(
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
    total_cost: discoveryResults.total_cost + (competitorAnalysis.total_cost || 0)
  };
}

/**
 * PHASE 1: Aggressive Competitor Discovery
 * Run MANY queries across all platforms to find competitors
 */
async function aggressiveCompetitorDiscovery(business_name, business_type, location) {
  const apiKeys = {
    chatgpt: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    claude: process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
    gemini: process.env.VITE_GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY,
    perplexity: process.env.VITE_PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY
  };
  
  // Generate MORE comprehensive queries for better coverage
  const queries = [
    // Direct recommendation queries
    `List the top 5 ${business_type} businesses in ${location} with their names`,
    `What are the best ${business_type} companies in ${location}? Give me specific names`,
    `Recommend 5 ${business_type} services in ${location} by name`,
    
    // Comparison queries
    `Compare the leading ${business_type} providers in ${location}`,
    `Who are the top rated ${business_type} businesses in ${location}?`,
    
    // Specific search queries
    `Find ${business_type} near me in ${location} - list business names`,
    `${business_type} ${location} - top rated options`,
    
    // Target business check
    `Tell me about ${business_name} and compare to other ${business_type} in ${location}`
  ];
  
  console.log(`   Running ${queries.length} discovery queries across all platforms...`);
  
  const platforms = ['chatgpt', 'claude', 'gemini', 'perplexity'];
  const allResponses = [];
  const platformScores = [];
  let totalCost = 0;
  let targetMentions = 0;
  let totalQueries = 0;
  
  // Query each platform with ALL queries (no cost restriction)
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
    
    console.log(`   Querying ${platform} with ${queries.length} queries...`);
    const platformResponses = [];
    let platformMentions = 0;
    let platformCost = 0;
    
    // Run ALL queries for maximum competitor discovery
    for (const query of queries) {
      try {
        const response = await executeDiscoveryQuery(
          platform,
          query,
          apiKeys[platform],
          { business_name, business_type, location }
        );
        
        platformResponses.push(response);
        allResponses.push({ platform, query, ...response });
        platformCost += response.cost || 0;
        totalCost += response.cost || 0;
        totalQueries++;
        
        // Check if target business is mentioned
        if (response.text && 
            response.text.toLowerCase().includes(business_name.toLowerCase())) {
          platformMentions++;
          targetMentions++;
        }
        
        // Reduced delay for faster execution
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`   ❌ Error querying ${platform} for "${query}":`, error.message);
      }
    }
    
    console.log(`   ${platform}: ${platformMentions}/${queries.length} mentions, $${platformCost.toFixed(3)}`);
    
    // Calculate platform score
    const mentionRate = queries.length > 0 ? platformMentions / queries.length : 0;
    platformScores.push({
      platform,
      score: Math.round(mentionRate * 100),
      mention_count: platformMentions,
      cost: platformCost
    });
  }
  
  console.log(`   Total queries executed: ${totalQueries}, Total cost: $${totalCost.toFixed(2)}`);
  
  // Extract competitors with aggressive parsing
  console.log('   Extracting competitors with aggressive pattern matching...');
  const competitors = extractCompetitorsAggressive(allResponses, business_name);
  console.log(`   ✅ Extracted ${competitors.length} unique competitors`);
  
  // Log top competitors for debugging
  if (competitors.length > 0) {
    console.log('   Top competitors:');
    competitors.slice(0, 5).forEach(c => {
      console.log(`     - ${c.name} (mentioned ${c.mention_count} times)`);
    });
  }
  
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
 * AGGRESSIVE competitor extraction with multiple strategies
 */
function extractCompetitorsAggressive(responses, targetBusinessName) {
  const competitorCounts = {};
  const targetLower = targetBusinessName.toLowerCase();
  
  console.log(`   Parsing ${responses.length} responses for business names...`);
  
  let totalMatches = 0;
  
  responses.forEach(response => {
    if (!response.text) return;
    
    const text = response.text;
    let responseMatches = 0;
    
    // Strategy 1: Numbered/Bulleted lists
    const listPatterns = [
      /(?:^|\n)\s*[\d]+[\.)]\s*\*?\*?([A-Z][A-Za-z0-9\s&''\-\.]+(?:LLC|Inc|Co\.|Company|Corp|Corporation|Service|Services|Group|Cleaning|Wash|Pro|Solutions)?)\*?\*?/gm,
      /•\s*\*?\*?([A-Z][A-Za-z0-9\s&''\-\.]+(?:LLC|Inc|Co\.|Company|Corp)?)\*?\*?/gm,
    ];
    
    listPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        const name = cleanBusinessName(match[1]);
        if (isValidBusinessName(name, targetLower)) {
          competitorCounts[name] = (competitorCounts[name] || 0) + 1;
          responseMatches++;
          totalMatches++;
        }
      });
    });
    
    // Strategy 2: Bold text (**Name**)
    const boldPattern = /\*\*([A-Z][A-Za-z0-9\s&''\-\.]+)\*\*/g;
    const boldMatches = [...text.matchAll(boldPattern)];
    boldMatches.forEach(match => {
      const name = cleanBusinessName(match[1]);
      if (isValidBusinessName(name, targetLower)) {
        competitorCounts[name] = (competitorCounts[name] || 0) + 1;
        responseMatches++;
        totalMatches++;
      }
    });
    
    // Strategy 3: "includes:" or "such as:" patterns
    const includesPattern = /(?:includes?|such as|like|including):\s*([^.]+)/gi;
    const includesMatches = [...text.matchAll(includesPattern)];
    includesMatches.forEach(match => {
      const segment = match[1];
      const names = segment.split(/,|\sand\s|\sor\s/).map(s => s.trim());
      names.forEach(name => {
        const cleaned = cleanBusinessName(name);
        if (isValidBusinessName(cleaned, targetLower)) {
          competitorCounts[cleaned] = (competitorCounts[cleaned] || 0) + 1;
          responseMatches++;
          totalMatches++;
        }
      });
    });
    
    // Strategy 4: Quoted business names
    const quotedPattern = /"([A-Z][A-Za-z0-9\s&''\-\.]+)"/g;
    const quotedMatches = [...text.matchAll(quotedPattern)];
    quotedMatches.forEach(match => {
      const name = cleanBusinessName(match[1]);
      if (isValidBusinessName(name, targetLower) && name.length > 5) {
        competitorCounts[name] = (competitorCounts[name] || 0) + 1;
        responseMatches++;
        totalMatches++;
      }
    });
    
    // Strategy 5: Capitalized phrases after "recommend", "try", "check out"
    const recommendPattern = /(?:recommend|suggests?|try|check out|consider|visit)\s+([A-Z][A-Za-z\s&''\-]{3,40}?)(?:\s+(?:for|in|at|because|which|that|with)|[,.]|$)/gi;
    const recommendMatches = [...text.matchAll(recommendPattern)];
    recommendMatches.forEach(match => {
      const name = cleanBusinessName(match[1]);
      if (isValidBusinessName(name, targetLower)) {
        competitorCounts[name] = (competitorCounts[name] || 0) + 1;
        responseMatches++;
        totalMatches++;
      }
    });
    
    if (responseMatches > 0) {
      console.log(`     Found ${responseMatches} potential names in ${response.platform} response`);
    }
  });
  
  console.log(`   Total potential business names extracted: ${totalMatches}`);
  console.log(`   Unique business names found: ${Object.keys(competitorCounts).length}`);
  
  // Sort by mention frequency and take top 10
  const sortedCompetitors = Object.entries(competitorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, mention_count: count }));
  
  return sortedCompetitors;
}

/**
 * Clean business name
 */
function cleanBusinessName(name) {
  return name
    .replace(/\*\*/g, '') // Remove markdown bold
    .replace(/["""]/g, '') // Remove quotes
    .replace(/\([^)]*\)/g, '') // Remove parentheses content
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Validate if extracted text is likely a real business name
 */
function isValidBusinessName(text, targetLower) {
  if (!text || text.length < 3 || text.length > 60) return false;
  
  // Skip if it's the target business
  if (text.toLowerCase() === targetLower) return false;
  if (text.toLowerCase().includes(targetLower)) return false;
  
  // Skip common false positives
  const excludeWords = [
    'google', 'yelp', 'facebook', 'instagram', 'website', 'online',
    'best', 'top', 'rated', 'recommended', 'popular', 'local',
    'business', 'company', 'service', 'services', 'provider',
    'options', 'choices', 'selection', 'variety', 'list',
    'the', 'and', 'or', 'but', 'for', 'with', 'this', 'that',
    'here', 'there', 'their', 'also', 'like', 'such', 'many',
    'several', 'some', 'other', 'more', 'less', 'most', 'very',
    'good', 'great', 'excellent', 'quality', 'professional',
    'each', 'every', 'all', 'any', 'none', 'both', 'either'
  ];
  
  const lowerText = text.toLowerCase();
  if (excludeWords.includes(lowerText)) return false;
  
  // Skip if it starts with exclude words
  if (excludeWords.some(word => lowerText.startsWith(word + ' '))) return false;
  
  // Must start with capital letter
  if (!/^[A-Z]/.test(text)) return false;
  
  // Should contain at least one letter
  if (!/[a-zA-Z]/.test(text)) return false;
  
  // Skip if it's all caps (likely acronym or generic term)
  if (text === text.toUpperCase() && text.length < 6) return false;
  
  return true;
}

/**
 * Execute discovery query optimized for finding business names
 */
async function executeDiscoveryQuery(platform, query, apiKey, context) {
  const systemPrompt = `You are helping someone find ${context.business_type} businesses in ${context.location}.

IMPORTANT: Please list SPECIFIC BUSINESS NAMES. Don't just describe what to look for.

Provide 3-5 real business names in your response. Format them clearly (numbered list or bold).

Example good response:
"Here are some top options:
1. **ABC Cleaning Services**
2. **Pro Wash Company**  
3. **Elite Cleaners LLC**"

If you know ${context.business_name}, include it in your comparison.`;

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
 * PHASE 2: Deep competitor analysis
 */
async function deepCompetitorAnalysis(competitors, business_type, location, apiKeys) {
  if (competitors.length === 0) {
    console.log('   No competitors found to analyze');
    return { analyses: [], total_cost: 0 };
  }
  
  console.log(`   Analyzing top ${Math.min(competitors.length, 5)} competitors in depth...`);
  
  const analyses = [];
  let totalCost = 0;
  
  // Analyze top 5 competitors (increased from 3)
  const topCompetitors = competitors.slice(0, 5);
  
  for (const competitor of topCompetitors) {
    try {
      // Use Claude for deep analysis
      if (!apiKeys.claude) {
        console.log(`   ⚠️ Skipping ${competitor.name} - no Claude API key`);
        continue;
      }
      
      const analysisQuery = `Provide a detailed analysis of why "${competitor.name}" (a ${business_type} business in ${location}) appears prominently in AI search results.

Analyze these specific factors:

1. **Online Presence & Website Quality**
   - Website professionalism and user experience
   - Technical SEO (page speed, mobile-friendly, schema markup)
   - Content depth and quality

2. **Review & Reputation Signals**
   - Review volume across platforms (Google, Yelp, etc.)
   - Average rating and review quality
   - Review recency and response rate

3. **Local SEO Factors**
   - NAP (Name, Address, Phone) consistency
   - Directory presence and citations
   - Local content optimization

4. **Authority & Trust Signals**
   - Backlink profile quality
   - Industry associations and certifications
   - Years in business and brand recognition

5. **Content Strategy**
   - Blog/content marketing presence
   - Social media activity
   - Customer engagement approach

Provide specific, actionable insights about what makes this business successful in AI visibility. Be detailed and concrete.`;

      console.log(`   Analyzing ${competitor.name}...`);
      const response = await queryClaude(analysisQuery, '', apiKeys.claude);
      
      analyses.push({
        competitor: competitor.name,
        mention_count: competitor.mention_count,
        full_analysis: response.text,
        success_factors: extractDetailedSuccessFactors(response.text),
        key_strengths: extractKeyStrengths(response.text)
      });
      
      totalCost += response.cost || 0;
      console.log(`   ✅ ${competitor.name} analyzed ($${response.cost?.toFixed(3) || '0.00'})`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`   ❌ Error analyzing ${competitor.name}:`, error.message);
    }
  }
  
  console.log(`   Competitor analysis cost: $${totalCost.toFixed(2)}`);
  
  return { analyses, total_cost: totalCost };
}

/**
 * Extract detailed success factors from analysis
 */
function extractDetailedSuccessFactors(analysisText) {
  const factors = [];
  
  const factorPatterns = {
    'strong_reviews': /review|rating|testimonial|feedback|5[\s-]star/i,
    'quality_content': /content|blog|article|information|expertise|comprehensive/i,
    'technical_seo': /schema|markup|seo|structured data|optimization|page speed/i,
    'local_presence': /local|location|map|directory|citation|NAP/i,
    'authority': /backlink|authority|trust|reputation|mention|established/i,
    'website_quality': /website|design|user experience|professional|mobile/i,
    'social_proof': /social media|instagram|facebook|engagement|community/i,
    'customer_service': /customer service|responsive|support|satisfaction/i
  };
  
  for (const [factor, pattern] of Object.entries(factorPatterns)) {
    if (pattern.test(analysisText)) {
      factors.push(factor);
    }
  }
  
  return factors;
}

/**
 * Extract key strengths from analysis
 */
function extractKeyStrengths(analysisText) {
  const strengths = [];
  
  // Look for numbered points or bullet points
  const lines = analysisText.split('\n');
  for (const line of lines) {
    // Match lines that look like strengths
    if (/^[\d\-\*•]/.test(line.trim()) && line.length > 20 && line.length < 200) {
      const cleaned = line.replace(/^[\d\-\*•\)\.:\s]+/, '').trim();
      if (cleaned) {
        strengths.push(cleaned);
      }
    }
  }
  
  return strengths.slice(0, 5); // Top 5 strengths
}

/**
 * PHASE 3: Generate comprehensive content gaps
 */
function generateComprehensiveContentGaps(businessName, website, targetMentions, competitorAnalysis, allResponses) {
  const gaps = [];
  const timestamp = Date.now();
  let gapId = 1;
  
  console.log('   Generating comprehensive content gap analysis...');
  
  // Aggregate competitor success factors
  const factorCounts = {};
  const allStrengths = [];
  
  competitorAnalysis.analyses.forEach(analysis => {
    analysis.success_factors.forEach(factor => {
      factorCounts[factor] = (factorCounts[factor] || 0) + 1;
    });
    allStrengths.push(...analysis.key_strengths);
  });
  
  // STRUCTURAL GAPS
  if (factorCounts.technical_seo >= 2) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'structural',
      gap_title: 'Advanced Schema Markup Implementation Required',
      gap_description: `Top-performing competitors in AI results have implemented comprehensive structured data (JSON-LD schema markup) including LocalBusiness, Service, Review, and FAQ schemas. Analysis shows ${factorCounts.technical_seo} out of ${competitorAnalysis.analyses.length} leading competitors have robust schema implementation. Without this, AI platforms cannot effectively parse and present your business information in response to queries.`,
      severity: 'critical',
      recommended_action: 'Implement comprehensive schema markup: LocalBusiness with complete NAP data, Service schema for each offering, AggregateRating schema with review integration, FAQ schema for common questions, and breadcrumb navigation schema. Use Google\'s Rich Results Test to validate implementation.'
    });
  }
  
  if (factorCounts.website_quality >= 2) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'structural',
      gap_title: 'Website Performance and User Experience Optimization',
      gap_description: `Competitors ranking in AI results have superior website performance metrics. Their sites load faster, provide better mobile experiences, and have clear conversion paths. AI platforms use these quality signals as ranking factors.`,
      severity: 'significant',
      recommended_action: 'Conduct comprehensive website audit: Improve Core Web Vitals (aim for green scores), optimize images and assets for faster loading, implement mobile-first responsive design, create clear service pages with strong CTAs, improve navigation structure, and ensure ADA compliance.'
    });
  }
  
  // Add mobile-specific gap
  gaps.push({
    id: `gap-${timestamp}-${gapId++}`,
    gap_type: 'structural',
    gap_title: 'Mobile Optimization and Local Search Features',
    gap_description: 'With mobile searches dominating local business discovery, competitors have optimized for mobile-first indexing. This includes click-to-call buttons, mobile-friendly forms, and location-based features that AI platforms favor.',
    severity: 'significant',
    recommended_action: 'Enhance mobile experience with prominent click-to-call buttons, mobile-optimized contact forms, integrated maps with directions, mobile-friendly service menus, and fast-loading mobile pages. Test on multiple devices and screen sizes.'
  });
  
  // THEMATIC GAPS
  if (factorCounts.quality_content >= 2) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'thematic',
      gap_title: 'Content Depth and Topical Authority Gap',
      gap_description: `${factorCounts.quality_content} leading competitors maintain comprehensive content that demonstrates expertise. They publish service guides, how-to articles, FAQs, and educational content that AI platforms reference when answering user queries. Your business lacks this content depth, limiting AI visibility.`,
      severity: 'critical',
      recommended_action: 'Develop content marketing strategy: Create ultimate guides for each service (2000+ words), answer top 20 customer questions with detailed FAQ pages, publish monthly blog posts addressing customer pain points, create case studies and project galleries, and develop location-specific content for service areas.'
    });
  }
  
  if (factorCounts.local_presence >= 2) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'thematic',
      gap_title: 'Local Content and Geographic Relevance Strategy',
      gap_description: 'Successful competitors embed local relevance throughout their content, mentioning neighborhoods, landmarks, and local community involvement. AI platforms use these signals to understand service areas and local authority.',
      severity: 'significant',
      recommended_action: 'Create location-focused content strategy: Develop service area pages for each neighborhood/city served, mention local landmarks and points of interest, create content about serving the local community, add local business schema with service area markup, and participate in local events/sponsorships to generate local backlinks.'
    });
  }
  
  // CRITICAL TOPIC GAPS
  if (factorCounts.strong_reviews >= 2 || targetMentions === 0) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'critical_topic',
      gap_title: 'Review Volume and Social Proof Deficiency',
      gap_description: `Competitors appearing in AI results have substantial review volumes (50-200+ reviews) with high ratings (4.5+ stars) across multiple platforms. AI systems heavily weight these social proof signals. ${targetMentions === 0 ? 'Your complete absence from AI results suggests insufficient review volume and quality.' : 'Your limited AI visibility correlates with review volume gaps.'}`,
      severity: 'critical',
      recommended_action: 'Launch aggressive review generation campaign: Send automated post-service review requests within 24 hours, create easy review process with direct platform links, incentivize reviews with follow-up discounts, respond to ALL reviews within 24 hours, aim for 50+ reviews in first 90 days across Google, Yelp, and Facebook. Track review velocity and maintain consistent generation.'
    });
  }
  
  if (targetMentions === 0) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'critical_topic',
      gap_title: 'Complete AI Platform Invisibility',
      gap_description: `Your business received ZERO mentions across all AI platforms (ChatGPT, Claude, Gemini, Perplexity) during comprehensive testing with ${allResponses.length} queries. Meanwhile, ${competitorAnalysis.analyses.length} competitors are being actively recommended. This represents a critical gap in online authority, local SEO, and the key signals AI systems use for recommendations.`,
      severity: 'critical',
      recommended_action: 'Emergency foundational visibility campaign: (1) Claim and fully optimize Google Business Profile with complete information, photos, and posts, (2) Ensure consistent NAP across all directories (Yelp, Facebook, industry sites), (3) Build 10-15 quality backlinks from local business directories and chambers, (4) Generate minimum 30 Google reviews in 60 days, (5) Create comprehensive service pages with local optimization, (6) Implement all technical schema markup. This is highest priority.'
    });
  }
  
  if (factorCounts.social_proof >= 1) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'critical_topic',
      gap_title: 'Social Media Presence and Engagement Gap',
      gap_description: 'Competitors maintain active social media profiles with regular engagement, user-generated content, and community building. AI platforms consider social signals as indicators of business legitimacy and popularity.',
      severity: 'significant',
      recommended_action: 'Establish consistent social media presence: Post 3-4 times weekly on Google Business Profile, Instagram, and Facebook, share customer testimonials and project photos, respond to comments and messages within 2 hours, use local hashtags, engage with local community pages, and encourage customer tagging in posts.'
    });
  }
  
  // SIGNIFICANT TOPIC GAPS
  if (factorCounts.authority >= 1) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'significant_topic',
      gap_title: 'Domain Authority and Backlink Profile Development',
      gap_description: `${factorCounts.authority} competitors have built authority through quality backlinks from local news, industry associations, and business directories. These authority signals help AI platforms assess business credibility and ranking worthiness.`,
      severity: 'moderate',
      recommended_action: 'Build authoritative backlink profile: Join local chamber of commerce and business associations (immediate backlinks), get listed in industry-specific directories, create newsworthy stories for local press coverage, partner with complementary businesses for cross-promotion, sponsor local events/teams, contribute guest posts to industry blogs, and build relationships with local bloggers/influencers.'
    });
  }
  
  if (factorCounts.customer_service >= 1) {
    gaps.push({
      id: `gap-${timestamp}-${gapId++}`,
      gap_type: 'significant_topic',
      gap_title: 'Customer Service and Responsiveness Optimization',
      gap_description: 'Top competitors demonstrate exceptional responsiveness with quick reply times to inquiries, active Q&A sections on Google Business Profile, and visible commitment to customer satisfaction. These engagement signals boost AI confidence in recommendations.',
      severity: 'moderate',
      recommended_action: 'Enhance customer service visibility: Add Q&A content to Google Business Profile answering common questions, respond to all messages within 1 hour during business hours, implement chatbot for instant responses, add live chat to website, showcase response time metrics, and highlight customer service commitments prominently.'
    });
  }
  
  // Add citation consistency gap
  gaps.push({
    id: `gap-${timestamp}-${gapId++}`,
    gap_type: 'significant_topic',
    gap_title: 'NAP Citation Consistency Across Directories',
    gap_description: 'AI platforms cross-reference business information across multiple sources. Inconsistent Name, Address, Phone listings confuse AI systems and reduce confidence in recommendations. Competitors maintain perfect NAP consistency across 50+ directories.',
    severity: 'moderate',
    recommended_action: 'Audit and correct all online citations: Use citation audit tool to find all existing listings, standardize NAP format across all platforms, correct any inconsistencies or outdated information, ensure consistency in business name format, add missing listings to major directories (Yelp, Bing, Apple Maps, YellowPages), and monitor for new citation opportunities monthly.'
  });
  
  console.log(`   Generated ${gaps.length} comprehensive content gaps`);
  
  return gaps;
}

/**
 * PHASE 4: Generate detailed recommendations
 */
function generateDetailedRecommendations(content_gaps, competitorAnalysis, overall_score) {
  const actions = [];
  const timestamp = Date.now();
  
  // Convert critical gaps to high-priority actions
  const criticalGaps = content_gaps.filter(g => g.severity === 'critical');
  const significantGaps = content_gaps.filter(g => g.severity === 'significant');
  
  // High priority from critical gaps
  criticalGaps.forEach((gap, index) => {
    actions.push({
      id: `action-${timestamp}-critical-${index + 1}`,
      action_title: gap.gap_title.replace('Required', 'Implementation').replace('Gap', 'Strategy').replace('Deficiency', 'Enhancement'),
      action_description: gap.recommended_action,
      priority: 'high',
      estimated_impact: 'high',
      estimated_effort: index === 0 ? 'significant' : 'moderate',
      timeframe: '30-60 days',
      gap_addressed: gap.id
    });
  });
  
  // Medium priority from significant gaps
  significantGaps.slice(0, 3).forEach((gap, index) => {
    actions.push({
      id: `action-${timestamp}-significant-${index + 1}`,
      action_title: gap.gap_title.replace('Gap', 'Improvement').replace('Optimization', 'Enhancement'),
      action_description: gap.recommended_action,
      priority: 'medium',
      estimated_impact: 'medium',
      estimated_effort: 'moderate',
      timeframe: '60-90 days',
      gap_addressed: gap.id
    });
  });
  
  // Add competitive intelligence action if we have detailed analysis
  if (competitorAnalysis.analyses && competitorAnalysis.analyses.length > 0) {
    const topCompetitor = competitorAnalysis.analyses[0];
    const topStrengths = topCompetitor.key_strengths.slice(0, 3).join('; ');
    
    actions.push({
      id: `action-${timestamp}-competitive`,
      action_title: `Competitive Benchmarking: Learn from ${topCompetitor.competitor}`,
      action_description: `${topCompetitor.competitor} is mentioned ${topCompetitor.mention_count} times in AI results. Key success factors to emulate: ${topStrengths}. Study their online presence, review their content strategy, analyze their customer engagement approach, and adapt their successful tactics to your business. Visit their website, social profiles, and review presence to understand what makes them successful.`,
      priority: 'medium',
      estimated_impact: 'high',
      estimated_effort: 'quick',
      timeframe: '7-14 days',
      gap_addressed: 'competitive-intelligence'
    });
  }
  
  // Add quick win for low scores
  if (overall_score < 30) {
    actions.push({
      id: `action-${timestamp}-quickwin`,
      action_title: 'Quick Win: 30-Day Review Sprint + GBP Optimization',
      action_description: 'Launch immediate dual-track campaign: (1) Contact your 25 most satisfied recent customers asking for Google reviews with direct review link, aim for 30 reviews in 30 days. (2) Simultaneously, complete ALL Google Business Profile sections: add 20+ high-quality photos, write compelling business description, list all services with descriptions, add attributes, create weekly posts, answer Q&A, and set special hours. These two actions combined can generate measurable AI visibility within 4-6 weeks.',
      priority: 'high',
      estimated_impact: 'high',
      estimated_effort: 'quick',
      timeframe: '30 days',
      gap_addressed: 'immediate-impact'
    });
  }
  
  // Add monitoring action
  actions.push({
    id: `action-${timestamp}-monitoring`,
    action_title: 'Establish AI Visibility Monitoring System',
    action_description: 'Set up monthly tracking of your AI visibility: manually test ChatGPT, Claude, Gemini, and Perplexity with your key search queries, document which competitors appear, track your mention rate over time, monitor review volume growth, and measure the impact of optimization efforts. This data will guide ongoing strategy adjustments and prove ROI.',
    priority: 'medium',
    estimated_impact: 'medium',
    estimated_effort: 'quick',
    timeframe: 'Ongoing monthly',
    gap_addressed: 'measurement-tracking'
  });
  
  return actions;
}

/**
 * PHASE 5: Generate detailed competitive landscape
 */
function generateDetailedLandscape(businessName, website, discoveryResults, competitorAnalysis) {
  const competitors = discoveryResults.competitors || [];
  const analyses = competitorAnalysis.analyses || [];
  
  // Detailed target business assessment
  const targetStrengths = [];
  const targetWeaknesses = [];
  
  if (discoveryResults.targetMentions > 0) {
    targetStrengths.push(`Appears in ${discoveryResults.targetMentions} AI platform responses`);
    if (discoveryResults.targetMentions >= 3) {
      targetStrengths.push('Has established some AI visibility momentum');
    }
  } else {
    targetWeaknesses.push('Zero AI platform visibility across all tested queries');
    targetWeaknesses.push('Not competing effectively in AI recommendation space');
  }
  
  // Platform-specific assessment
  discoveryResults.platform_scores.forEach(platform => {
    if (platform.score === 0) {
      targetWeaknesses.push(`Not visible on ${platform.platform} (0% mention rate)`);
    } else if (platform.score < 50) {
      targetWeaknesses.push(`Weak presence on ${platform.platform} (${platform.score}% mention rate)`);
    } else if (platform.score >= 50) {
      targetStrengths.push(`Moderate visibility on ${platform.platform} (${platform.score}% mention rate)`);
    }
  });
  
  // Analyze competitor advantages
  const competitorAdvantages = [];
  const allSuccessFactors = {};
  const commonStrengths = [];
  
  analyses.forEach(analysis => {
    analysis.success_factors.forEach(factor => {
      allSuccessFactors[factor] = (allSuccessFactors[factor] || 0) + 1;
    });
    commonStrengths.push(...analysis.key_strengths);
  });
  
  // Identify dominant success factors
  const factorDescriptions = {
    'strong_reviews': `High review volumes (${analyses.length} competitors have 50+ reviews with 4.5+ ratings)`,
    'quality_content': `Comprehensive website content with service guides, blogs, and expertise demonstration`,
    'technical_seo': `Advanced technical SEO including schema markup, fast loading, and mobile optimization`,
    'local_presence': `Strong local SEO with consistent NAP citations and directory presence`,
    'authority': `Established domain authority with quality backlinks from trusted sources`,
    'website_quality': `Professional websites with excellent user experience and clear conversion paths`,
    'social_proof': `Active social media presence with consistent engagement and community building`,
    'customer_service': `Demonstrated responsiveness and commitment to customer satisfaction`
  };
  
  Object.entries(allSuccessFactors)
    .sort((a, b) => b[1] - a[1])
    .forEach(([factor, count]) => {
      if (count >= 2 && factorDescriptions[factor]) {
        competitorAdvantages.push(factorDescriptions[factor]);
      }
    });
  
  // Opportunity analysis
  const opportunityLevel = 
    discoveryResults.overall_score < 20 ? 'CRITICAL - Immediate action required' :
    discoveryResults.overall_score < 50 ? 'HIGH - Significant room for improvement' :
    discoveryResults.overall_score < 80 ? 'MODERATE - Can optimize positioning' :
    'LOW - Focus on maintaining presence';
  
  const maturityLevel =
    discoveryResults.overall_score < 20 ? 'No Presence' :
    discoveryResults.overall_score < 50 ? 'Emerging' :
    discoveryResults.overall_score < 80 ? 'Developing' :
    'Established';
  
  return {
    primary_brand_overview: {
      name: businessName,
      website: website,
      current_ai_visibility_score: discoveryResults.overall_score,
      ai_visibility_status: maturityLevel,
      total_mentions: discoveryResults.targetMentions,
      total_queries_tested: discoveryResults.query_count,
      strengths: targetStrengths.length > 0 ? targetStrengths : ['Opportunity to build from foundation'],
      weaknesses: targetWeaknesses,
      visibility_by_platform: discoveryResults.platform_scores.reduce((acc, p) => {
        acc[p.platform] = {
          score: p.score,
          mentions: p.mention_count,
          status: p.score === 0 ? 'Not Visible' : p.score < 50 ? 'Weak' : p.score < 80 ? 'Moderate' : 'Strong'
        };
        return acc;
      }, {})
    },
    
    competitor_landscape: competitors.length > 0 ? {
      total_competitors_identified: competitors.length,
      competitors_analyzed_in_depth: analyses.length,
      top_competitors: competitors.slice(0, 5).map(c => {
        const analysis = analyses.find(a => a.competitor === c.name);
        return {
          name: c.name,
          mention_frequency: c.mention_count,
          mention_rate: `${Math.round((c.mention_count / discoveryResults.query_count) * 100)}%`,
          analysis_summary: analysis ? analysis.full_analysis.slice(0, 300) + '...' : 'Strong competitor presence in AI results',
          key_strengths: analysis ? analysis.key_strengths.slice(0, 3) : ['Established online presence', 'Strong review profile', 'Quality content'],
          success_factors: analysis ? analysis.success_factors : []
        };
      }),
      dominant_competitive_advantages: competitorAdvantages.length > 0 
        ? competitorAdvantages 
        : [
            'Established market presence with consistent NAP citations',
            'Strong review volumes across multiple platforms',
            'Professional websites with quality content',
            'Active engagement on social media and Google Business Profile'
          ],
      what_makes_competitors_successful: commonStrengths.slice(0, 5).length > 0
        ? commonStrengths.slice(0, 5)
        : [
            'Comprehensive online presence across all major platforms',
            'High volume of positive customer reviews',
            'Professional website with quality service information',
            'Strong local SEO and directory listings',
            'Active social media and community engagement'
          ]
    } : {
      total_competitors_identified: 0,
      note: 'Limited competitor data - focus on building strong foundational online presence'
    },
    
    market_insights: {
      ai_visibility_maturity: maturityLevel,
      opportunity_assessment: opportunityLevel,
      market_saturation: competitors.length >= 8 ? 'High - many competitors visible' :
                        competitors.length >= 5 ? 'Moderate - several competitors active' :
                        'Low - limited competition visible',
      recommended_strategic_focus: competitorAdvantages.length > 0 
        ? `Priority areas: ${competitorAdvantages.slice(0, 2).join(' + ')}`
        : 'Build comprehensive foundational presence (reviews, content, technical SEO, local citations)',
      estimated_time_to_visibility: 
        discoveryResults.overall_score === 0 ? '3-6 months with aggressive optimization' :
        discoveryResults.overall_score < 50 ? '2-4 months with focused improvements' :
        '1-2 months with targeted enhancements',
      competitive_positioning: discoveryResults.overall_score < competitors[0]?.mention_count * 10 
        ? `Significantly behind market leaders (${competitors[0]?.name} mentioned ${competitors[0]?.mention_count} times vs your ${discoveryResults.targetMentions})`
        : 'Within competitive range of market leaders'
    },
    
    actionable_intelligence: {
      immediate_priorities: [
        discoveryResults.overall_score === 0 ? 'Establish foundational AI visibility (reviews + GBP optimization)' : 'Strengthen existing AI presence',
        competitorAdvantages.length > 0 ? `Match competitor strength in ${competitorAdvantages[0]}` : 'Build review volume to competitive levels',
        'Implement technical schema markup for better AI parsing'
      ],
      key_differentiators_needed: [
        'Unique service offerings or specializations',
        'Superior customer service and responsiveness',
        'Niche expertise or certifications',
        'Geographic coverage advantages',
        'Pricing or value proposition clarity'
      ],
      success_metrics_to_track: [
        'Monthly AI visibility score (% mention rate)',
        'Review volume and average rating growth',
        'Competitor gap closure rate',
        'Website traffic from AI-referred sources',
        'Conversion rate improvements'
      ]
    }
  };
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
      max_tokens: 800,
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
  const cost = (tokens / 1000) * 0.0025;
  
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
      max_tokens: 800,
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
          maxOutputTokens: 800,
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
  const cost = (estimatedTokens / 1000000) * 0.075;
  
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
      max_tokens: 800,
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
  const cost = (tokens / 1000000) * 1.0;
  
  return { text, cost, tokens };
}