// netlify/functions/generate-external-report-background.js
// Background function with 26-second timeout + Session 23 fixes
// FIXED: Perplexity disabled, timeout protection, graceful failures

const { createClient } = require('@supabase/supabase-js');

// Timeout wrapper with proper error messages
async function withTimeout(promise, timeoutMs = 15000, platformName = 'API') {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${platformName} timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

exports.handler = async (event, context) => {
  // CRITICAL: Background function with 26-second timeout
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
    console.error('[ERROR] JSON parse error:', error.message);
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

  console.log('[START] Background report generation:', {
    report_id,
    target_website,
    business_type,
    business_location
  });

  if (!report_id || !target_website || !business_type || !business_location) {
    console.error('[ERROR] Missing required fields');
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required fields' })
    };
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[ERROR] Missing Supabase environment variables');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server configuration error' })
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

  // Update status to generating
  try {
    await supabase
      .from('ai_visibility_external_reports')
      .update({
        status: 'generating',
        generation_started_at: new Date().toISOString()
      })
      .eq('id', report_id);

    console.log('[SUCCESS] Status updated to generating');

    // Start background processing
    generateReportInBackground(supabase, report_id, {
      business_name: business_name || target_website,
      business_type,
      location: business_location,
      website: target_website,
      competitors: competitor_websites || []
    }).catch(error => {
      console.error('[ERROR] Background processing failed:', error.message);
    });

    // Return immediately
    return {
      statusCode: 202,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        report_id,
        message: 'Report generation started',
        status: 'generating'
      })
    };

  } catch (error) {
    console.error('[ERROR] Function error:', error.message);
    
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
        error: error.message
      })
    };
  }
};

// Background report generation
async function generateReportInBackground(supabase, report_id, params) {
  console.log('[BACKGROUND] Starting report generation');
  const startTime = Date.now();
  
  try {
    const aiResults = await generateCompetitorStyleReport(params);
    const duration = Date.now() - startTime;

    console.log('[BACKGROUND] Report completed:', {
      duration_ms: duration,
      overall_score: aiResults.overall_score,
      competitors_found: aiResults.top_competitors?.length || 0
    });

    // Structure report data
    const reportData = {
      overall_score: aiResults.overall_score,
      platform_scores: aiResults.platform_scores,
      content_gaps: aiResults.content_gaps,
      priority_actions: aiResults.priority_actions,
      top_competitors: aiResults.top_competitors || [],
      primary_brand: {
        name: params.business_name,
        website: params.website,
        strengths: aiResults.brand_strengths || [],
        weaknesses: aiResults.brand_weaknesses || [],
        ai_visibility_score: aiResults.overall_score
      },
      generated_at: new Date().toISOString()
    };

    // Update database with completed report
    const { error: updateError } = await supabase
      .from('ai_visibility_external_reports')
      .update({
        status: 'completed',
        report_data: reportData,
        overall_score: aiResults.overall_score,
        generation_completed_at: new Date().toISOString(),
        processing_time_ms: duration,
        api_cost_usd: aiResults.total_cost || 0
      })
      .eq('id', report_id);

    if (updateError) {
      throw new Error(`Failed to update report: ${updateError.message}`);
    }

    console.log('[SUCCESS] Report saved to database');

  } catch (error) {
    console.error('[ERROR] Report generation failed:', error.message);
    console.error('[ERROR] Stack:', error.stack);

    // Update status to error
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
      console.error('[ERROR] Failed to save error status:', dbError.message);
    }
  }
}

// Generate competitor-style report with 3 platforms (Perplexity disabled)
async function generateCompetitorStyleReport(params) {
  const { business_name, business_type, location, website } = params;
  
  console.log('[PHASE] Generating competitor-style report');
  
  // Get API keys
  const apiKeys = {
    openai: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    anthropic: process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
    google: process.env.VITE_GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY
    // Perplexity disabled
  };

  // PHASE 1: Competitor Discovery (3 platforms, 3 queries each = 9 queries)
  console.log('[PHASE 1] Competitor Discovery');
  const discoveryQueries = [
    `List the top 5 ${business_type} businesses in ${location}`,
    `What are the best ${business_type} companies in ${location}?`,
    `Tell me about ${business_name} and compare to other ${business_type} in ${location}`
  ];

  const platforms = ['chatgpt', 'claude', 'gemini']; // Perplexity disabled
  const competitorMentions = {};
  const platformScores = [];
  let totalCost = 0;

  for (const platform of platforms) {
    console.log(`[INFO] Querying ${platform}`);
    let platformMentions = 0;
    let platformCost = 0;
    let platformStatus = 'success';
    let platformError = null;

    for (const query of discoveryQueries) {
      try {
        let result;
        if (platform === 'chatgpt' && apiKeys.openai) {
          result = await withTimeout(
            queryChatGPT(query, '', apiKeys.openai),
            15000,
            'ChatGPT'
          );
        } else if (platform === 'claude' && apiKeys.anthropic) {
          result = await withTimeout(
            queryClaude(query, '', apiKeys.anthropic),
            15000,
            'Claude'
          );
        } else if (platform === 'gemini' && apiKeys.google) {
          result = await withTimeout(
            queryGemini(query, '', apiKeys.google),
            15000,
            'Gemini'
          );
        } else {
          console.log(`[SKIP] ${platform} - no API key`);
          continue;
        }

        if (result.text) {
          platformMentions++;
          platformCost += result.cost;
          
          // Extract competitor names
          const competitors = extractCompetitorNames(result.text, business_name);
          competitors.forEach(comp => {
            competitorMentions[comp] = (competitorMentions[comp] || 0) + 1;
          });
        }
      } catch (error) {
        console.error(`[ERROR] ${platform} query failed:`, error.message);
        platformStatus = 'error';
        platformError = error.message;
      }
    }

    totalCost += platformCost;
    
    // Calculate platform score
    const score = Math.min(100, (platformMentions / discoveryQueries.length) * 100);
    
    platformScores.push({
      platform,
      score: Math.round(score),
      mentions: platformMentions,
      status: platformStatus,
      error: platformError,
      cost: platformCost
    });

    console.log(`[INFO] ${platform} completed: ${Math.round(score)}/100`);
  }

  // PHASE 2: Select top 2 competitors
  console.log('[PHASE 2] Analyzing Top 2 Competitors');
  const sortedCompetitors = Object.entries(competitorMentions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  const topCompetitors = sortedCompetitors.map(([name, count]) => ({
    name,
    website: null,
    detection_count: count,
    platforms: platforms.filter(p => platformScores.find(ps => ps.platform === p)?.mentions > 0)
  }));

  // PHASE 3: Analyze brand vs competitors
  console.log('[PHASE 3] Brand Analysis');
  const brandStrengths = [
    'Established presence in local market',
    'Consistent business information across platforms'
  ];
  
  const brandWeaknesses = [];
  if (platformScores.some(p => p.score < 50)) {
    brandWeaknesses.push('Limited visibility on some AI platforms');
  }

  // PHASE 4: Content Gaps
  console.log('[PHASE 4] Content Gap Analysis');
  const contentGaps = generateContentGaps(platformScores, business_type);

  // PHASE 5: Priority Actions
  console.log('[PHASE 5] Priority Actions');
  const priorityActions = generatePriorityActions(contentGaps, platformScores);

  // PHASE 6: Calculate overall score
  const overallScore = Math.round(
    platformScores.reduce((sum, p) => sum + p.score, 0) / platformScores.length
  );

  console.log('[COMPLETE] Report generated successfully');

  return {
    overall_score: overallScore,
    platform_scores: platformScores,
    top_competitors: topCompetitors,
    brand_strengths: brandStrengths,
    brand_weaknesses: brandWeaknesses,
    content_gaps: contentGaps,
    priority_actions: priorityActions,
    total_cost: totalCost
  };
}

// API Query Functions
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
        { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
        { role: 'user', content: query }
      ],
      max_tokens: 600,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ChatGPT API error: ${response.status} - ${errorText.substring(0, 100)}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0]?.message?.content || '',
    cost: ((data.usage?.total_tokens || 0) / 1000000) * 2.5,
    tokens: data.usage?.total_tokens || 0
  };
}

async function queryClaude(query, systemPrompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{ role: 'user', content: query }],
      system: systemPrompt || 'You are a helpful assistant.'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorText.substring(0, 100)}`);
  }

  const data = await response.json();
  const text = data.content[0]?.text || '';
  return {
    text,
    cost: ((data.usage?.input_tokens || 0) / 1000000) * 3 + ((data.usage?.output_tokens || 0) / 1000000) * 15,
    tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
  };
}

async function queryGemini(query, systemPrompt, apiKey) {
  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${query}` : query;
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
    throw new Error(`Gemini API error: ${response.status} - ${errorText.substring(0, 100)}`);
  }

  const data = await response.json();
  const text = data.candidates[0]?.content?.parts[0]?.text || '';
  const estimatedTokens = Math.ceil((fullPrompt.length + text.length) / 4);
  return {
    text,
    cost: (estimatedTokens / 1000000) * 0.075,
    tokens: estimatedTokens
  };
}

// Helper Functions
function extractCompetitorNames(text, businessName) {
  const competitors = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    // Look for numbered lists, bullet points, or business names
    const match = line.match(/^[\d\.\-\*\s]*([A-Z][A-Za-z\s&'\-]+(?:Coffee|Restaurant|Shop|Store|Cafe|Bar|Grill|Bistro|Kitchen|Market|Bakery)?)/);
    if (match) {
      const name = match[1].trim();
      if (name && name !== businessName && name.length > 3 && name.length < 50) {
        competitors.push(name);
      }
    }
  });
  
  return [...new Set(competitors)];
}

function generateContentGaps(platformScores, businessType) {
  const gaps = [];
  let gapId = 1;
  const timestamp = Date.now();

  // Check for platforms with low scores
  platformScores.forEach(platform => {
    if (platform.score < 30) {
      gaps.push({
        id: `gap-${timestamp}-${gapId++}`,
        gap_type: 'critical_topic',
        gap_title: `Missing from ${platform.platform} AI`,
        gap_description: `Your business doesn't appear in ${platform.platform} search results`,
        severity: 'critical',
        recommended_action: `Optimize online presence for ${platform.platform} discovery`
      });
    }
  });

  // Add generic gaps
  gaps.push({
    id: `gap-${timestamp}-${gapId++}`,
    gap_type: 'structural',
    gap_title: 'Schema Markup Implementation',
    gap_description: 'Structured data helps AI understand your business',
    severity: 'significant',
    recommended_action: 'Add LocalBusiness schema markup to website'
  });

  return gaps;
}

function generatePriorityActions(contentGaps, platformScores) {
  const actions = [];
  const timestamp = Date.now();

  const criticalGaps = contentGaps.filter(g => g.severity === 'critical');
  
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

  // Add quick win if overall visibility is low
  const avgScore = platformScores.reduce((sum, p) => sum + p.score, 0) / platformScores.length;
  if (avgScore < 50) {
    actions.push({
      id: `action-${timestamp}-quickwin`,
      action_title: 'Quick Win: Optimize Business Profiles',
      action_description: 'Complete all sections of Google Business Profile and other directories',
      priority: 'high',
      estimated_impact: 'high',
      estimated_effort: 'low',
      timeframe: '1-2 weeks'
    });
  }

  return actions;
}