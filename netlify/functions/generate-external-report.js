// netlify/functions/generate-external-report.js
// Real AI API calls using the platform services

const { createClient } = require('@supabase/supabase-js');

// Note: In a real Netlify function, you need to bundle the dependencies
// This means your AI platform services need to be compiled and accessible
// For now, this shows the structure - you may need to use webpack or esbuild bundling

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

  console.log('🚀 Starting external report generation:', {
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
    
    // Generate the actual AI visibility report
    const aiResults = await generateRealAIReport({
      business_name: business_name || target_website,
      business_type: business_type || 'business',
      location: business_location || 'Unknown',
      website: target_website,
      competitors: competitor_websites || []
    });

    const duration = Date.now() - startTime;

    console.log('✅ AI analysis completed');
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Overall Score: ${aiResults.overall_score}/100`);

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

    // Structure content gap analysis
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
      recommendations: aiResults.recommendations
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

    console.log('✅ Report saved to database');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        report_id,
        message: 'Report generated successfully',
        overall_score: aiResults.overall_score,
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
 * Generate real AI visibility report using actual API calls
 */
async function generateRealAIReport(params) {
  const { business_name, business_type, location, website, competitors } = params;
  
  console.log('🤖 Generating AI visibility analysis with real APIs...');
  
  // Generate queries
  const queries = generateQueries(business_name, business_type, location);
  console.log(`📝 Generated ${queries.length} queries`);
  
  // Query all platforms with real APIs
  const platformResults = await queryAllPlatformsReal(queries, business_name, business_type, location);
  
  // Calculate scores
  const overall_score = calculateOverallScore(platformResults);
  
  // Analyze content gaps
  const content_gaps = analyzeContentGaps(platformResults, business_name, competitors);
  
  // Generate recommendations
  const priority_actions = generateRecommendations(platformResults, content_gaps, overall_score);
  
  // Landscape analysis
  const landscape_analysis = analyzeLandscape(platformResults, business_name, competitors);
  
  return {
    overall_score,
    platform_scores: platformResults.scores,
    content_gaps,
    priority_actions,
    landscape_analysis,
    recommendations: priority_actions,
    query_count: queries.length,
    total_cost: platformResults.total_cost
  };
}

/**
 * Generate search queries
 */
function generateQueries(business_name, business_type, location) {
  return [
    `best ${business_type} in ${location}`,
    `top rated ${business_type} ${location}`,
    `${business_type} near me ${location}`,
    `find ${business_type} services ${location}`,
    `${business_name} reviews`,
    `${business_type} recommendations ${location}`,
    `local ${business_type} ${location}`,
    `${business_type} companies ${location}`,
    `professional ${business_type} ${location}`,
    `${business_type} specialists ${location}`
  ];
}

/**
 * Query all platforms using REAL API calls
 */
async function queryAllPlatformsReal(queries, business_name, business_type, location) {
  const platforms = ['chatgpt', 'claude', 'gemini', 'perplexity'];
  const results = {
    scores: [],
    total_cost: 0,
    raw_responses: []
  };
  
  for (const platform of platforms) {
    console.log(`   Querying ${platform}...`);
    
    try {
      const platformResult = await queryPlatformReal(
        platform,
        queries,
        business_name,
        business_type,
        location
      );
      
      results.scores.push(platformResult);
      results.total_cost += platformResult.cost || 0;
      results.raw_responses.push({
        platform,
        responses: platformResult.responses
      });
      
    } catch (error) {
      console.error(`   ❌ Error querying ${platform}:`, error.message);
      results.scores.push({
        platform,
        score: 0,
        mention_count: 0,
        error: error.message,
        cost: 0
      });
    }
  }
  
  return results;
}

/**
 * Query a specific platform with REAL API calls
 */
async function queryPlatformReal(platform, queries, business_name, business_type, location) {
  const apiKeys = {
    chatgpt: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    claude: process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
    gemini: process.env.VITE_GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY,
    perplexity: process.env.VITE_PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY
  };
  
  if (!apiKeys[platform]) {
    console.warn(`⚠️  No API key found for ${platform}`);
    return {
      platform,
      score: 0,
      mention_count: 0,
      cost: 0,
      responses: []
    };
  }
  
  let mentions = 0;
  let totalCost = 0;
  const responses = [];
  
  // Execute a sample of queries (2-3 queries per platform to save costs)
  const sampleQueries = queries.slice(0, 3);
  
  for (const query of sampleQueries) {
    try {
      const response = await executePlatformQuery(
        platform,
        query,
        apiKeys[platform],
        { business_name, business_type, location }
      );
      
      responses.push(response);
      
      // Check if business is mentioned
      if (response.text && response.text.toLowerCase().includes(business_name.toLowerCase())) {
        mentions++;
      }
      
      totalCost += response.cost || 0;
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`Error with ${platform} query "${query}":`, error.message);
    }
  }
  
  // Calculate score based on mention rate
  const mentionRate = mentions / sampleQueries.length;
  const score = Math.round(mentionRate * 100);
  
  return {
    platform,
    score,
    mention_count: mentions,
    cost: totalCost,
    responses
  };
}

/**
 * Execute a single query on a platform using its API
 */
async function executePlatformQuery(platform, query, apiKey, context) {
  const systemPrompt = `You are analyzing AI visibility for local businesses. 
Business: ${context.business_name}
Type: ${context.business_type}
Location: ${context.location}

Provide a natural response as if you were recommending businesses to someone searching for "${query}".`;

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
    throw new Error(`ChatGPT API error: ${response.statusText}`);
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
    throw new Error(`Claude API error: ${response.statusText}`);
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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
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
    throw new Error(`Gemini API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const text = data.candidates[0]?.content?.parts[0]?.text || '';
  const estimatedTokens = Math.ceil((fullPrompt.length + text.length) / 4);
  const cost = (estimatedTokens / 1000) * 0.000375; // Gemini 2.5 Pro pricing
  
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
    throw new Error(`Perplexity API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const text = data.choices[0]?.message?.content || '';
  const tokens = data.usage?.total_tokens || 0;
  const cost = (tokens / 1000000) * 1.0; // Sonar Pro pricing
  
  return { text, cost, tokens };
}

/**
 * Calculate overall score
 */
function calculateOverallScore(platformResults) {
  const validScores = platformResults.scores.filter(s => s.score > 0);
  if (validScores.length === 0) return 0;
  
  const total = validScores.reduce((sum, s) => sum + s.score, 0);
  return Math.round(total / validScores.length);
}

/**
 * Analyze content gaps
 */
function analyzeContentGaps(platformResults, business_name, competitors) {
  const gaps = [];
  const timestamp = Date.now();
  
  // Low visibility check
  const lowVisibilityPlatforms = platformResults.scores.filter(s => s.mention_count === 0);
  if (lowVisibilityPlatforms.length > 0) {
    gaps.push({
      id: `gap-${timestamp}-1`,
      gap_type: 'structural',
      gap_title: 'Limited AI Platform Visibility',
      gap_description: `Business not appearing on ${lowVisibilityPlatforms.map(p => p.platform).join(', ')}. Improving online presence with structured data and authoritative content can help.`,
      severity: 'critical',
      recommended_action: 'Optimize website with schema markup, build quality backlinks, and maintain consistent NAP citations across directories'
    });
  }
  
  // Low score check
  const lowScorePlatforms = platformResults.scores.filter(s => s.score > 0 && s.score < 70);
  if (lowScorePlatforms.length > 0) {
    gaps.push({
      id: `gap-${timestamp}-2`,
      gap_type: 'thematic',
      gap_title: 'Suboptimal Content Positioning',
      gap_description: `Business mentioned but not prominently featured on ${lowScorePlatforms.map(p => p.platform).join(', ')}. Competitors may have stronger content signals.`,
      severity: 'significant',
      recommended_action: 'Increase review volume and quality, enhance content depth on website, and build topical authority through consistent content creation'
    });
  }
  
  return gaps;
}

/**
 * Generate recommendations
 */
function generateRecommendations(platformResults, content_gaps, overall_score) {
  const actions = [];
  const timestamp = Date.now();
  
  content_gaps.forEach((gap, index) => {
    actions.push({
      id: `action-${timestamp}-${index + 1}`,
      action_title: gap.gap_title.replace('Limited', 'Improve').replace('Suboptimal', 'Optimize'),
      action_description: gap.recommended_action,
      priority: gap.severity === 'critical' ? 'high' : 'medium',
      estimated_impact: gap.severity === 'critical' ? 'high' : 'medium',
      estimated_effort: 'moderate'
    });
  });
  
  if (overall_score < 80) {
    actions.push({
      id: `action-${timestamp}-general`,
      action_title: 'Enhance Google Business Profile',
      action_description: 'Complete all profile sections, add high-quality photos, respond to reviews, and post regularly to improve overall AI visibility',
      priority: 'high',
      estimated_impact: 'high',
      estimated_effort: 'quick'
    });
  }
  
  return actions;
}

/**
 * Analyze competitive landscape
 */
function analyzeLandscape(platformResults, business_name, competitors) {
  return {
    primary_brand_overview: {
      strengths: ['Active online presence', 'Business information available across platforms'],
      weaknesses: platformResults.scores.filter(s => s.score < 70).map(s => 
        `Limited visibility on ${s.platform}`
      )
    },
    competitor_overview: competitors.length > 0 ? {
      total_competitors: competitors.length,
      competitive_advantages: ['Potentially more established online presence'],
      competitive_challenges: ['Need to differentiate and build stronger content signals']
    } : null
  };
}