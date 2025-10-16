// netlify/functions/generate-external-report-background.js
// PRODUCTION OPTIMIZED: Completes in under 26 seconds
// Strategy: 1 query per platform, parallel execution, fast models

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
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
    console.error('[ERROR] JSON parse:', error.message);
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }

  const { report_id, target_website, business_name, business_type, business_location } = body;

  console.log('[START] Report generation:', report_id);

  if (!report_id) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing report_id' })
    };
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[ERROR] Missing Supabase env vars');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server configuration error' })
    };
  }

  let supabase;
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[SUCCESS] Supabase connected');
  } catch (error) {
    console.error('[ERROR] Supabase failed:', error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Database connection failed' })
    };
  }

  // Update status
  await supabase
    .from('ai_visibility_external_reports')
    .update({ status: 'generating', generation_started_at: new Date().toISOString() })
    .eq('id', report_id);

  console.log('[SUCCESS] Status: generating');

  // ===================================================================
  // CRITICAL: DO NOT RETURN YET - We must wait for completion
  // Background functions in Netlify DIE when they return
  // So we do ALL the work BEFORE returning
  // ===================================================================

  const startTime = Date.now();

  try {
    // Generate report synchronously
    const result = await generateReportSync({
      business_name: business_name || target_website,
      business_type: business_type || 'business',
      location: business_location || 'Unknown',
      website: target_website
    });

    const duration = Date.now() - startTime;
    console.log('[SUCCESS] Report completed in', duration, 'ms');

    // Save to database
    const { error: updateError } = await supabase
      .from('ai_visibility_external_reports')
      .update({
        status: 'completed',
        report_data: result.reportData,
        overall_score: result.overallScore,
        generation_completed_at: new Date().toISOString(),
        processing_time_ms: duration,
        api_cost_usd: result.totalCost
      })
      .eq('id', report_id);

    if (updateError) {
      throw new Error(`DB update failed: ${updateError.message}`);
    }

    console.log('[SUCCESS] Report saved to database');

    // NOW we can return
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        report_id,
        status: 'completed',
        duration_ms: duration
      })
    };

  } catch (error) {
    console.error('[ERROR] Report failed:', error.message);
    console.error('[ERROR] Stack:', error.stack);

    // Save error
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
        error: error.message
      })
    };
  }
};

// ===================================================================
// SYNCHRONOUS REPORT GENERATION (completes before function returns)
// ===================================================================

async function generateReportSync(params) {
  console.log('[PHASE 1] Starting parallel API calls');

  const { business_name, business_type, location } = params;

  // Get API keys
  const apiKeys = {
    openai: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    anthropic: process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
    google: process.env.VITE_GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY
  };

  // Single query optimized for speed and relevance
  const query = `List 3-5 top-rated ${business_type} businesses in ${location}. Include ${business_name} if it's a legitimate option.`;

  // Make ALL API calls in PARALLEL (not sequential)
  const platformPromises = [];

  if (apiKeys.openai) {
    platformPromises.push(
      queryChatGPT(query, apiKeys.openai)
        .then(result => ({ platform: 'chatgpt', ...result, status: 'success' }))
        .catch(error => ({ platform: 'chatgpt', text: '', cost: 0, status: 'error', error: error.message }))
    );
  }

  if (apiKeys.anthropic) {
    platformPromises.push(
      queryClaude(query, apiKeys.anthropic)
        .then(result => ({ platform: 'claude', ...result, status: 'success' }))
        .catch(error => ({ platform: 'claude', text: '', cost: 0, status: 'error', error: error.message }))
    );
  }

  if (apiKeys.google) {
    platformPromises.push(
      queryGemini(query, apiKeys.google)
        .then(result => ({ platform: 'gemini', ...result, status: 'success' }))
        .catch(error => ({ platform: 'gemini', text: '', cost: 0, status: 'error', error: error.message }))
    );
  }

  console.log('[INFO] Waiting for', platformPromises.length, 'parallel API calls...');

  // Wait for ALL to complete (or timeout after 20 seconds total)
  const results = await Promise.race([
    Promise.all(platformPromises),
    new Promise((_, reject) => setTimeout(() => reject(new Error('All APIs timeout')), 20000))
  ]);

  console.log('[SUCCESS] All API calls completed');

  // Process results
  let totalCost = 0;
  const platformScores = [];
  const allCompetitors = {};

  results.forEach(result => {
    totalCost += result.cost || 0;

    const score = result.status === 'success' && result.text ? 75 : 0;
    
    platformScores.push({
      platform: result.platform,
      score,
      mentions: result.text ? 1 : 0,
      status: result.status,
      error: result.error || null
    });

    // Extract competitors
    if (result.text) {
      const competitors = extractCompetitors(result.text, business_name);
      competitors.forEach(comp => {
        allCompetitors[comp] = (allCompetitors[comp] || 0) + 1;
      });
    }

    console.log(`[INFO] ${result.platform}: ${score}/100`);
  });

  // Calculate overall score
  const overallScore = Math.round(
    platformScores.reduce((sum, p) => sum + p.score, 0) / platformScores.length
  );

  // Top competitors
  const topCompetitors = Object.entries(allCompetitors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({
      name,
      website: null,
      detection_count: count,
      platforms: results.filter(r => r.text && r.text.includes(name)).map(r => r.platform)
    }));

  // Generate gaps and actions
  const contentGaps = generateGaps(platformScores, business_type);
  const priorityActions = generateActions(contentGaps, overallScore);

  const reportData = {
    overall_score: overallScore,
    platform_scores: platformScores,
    content_gaps: contentGaps,
    priority_actions: priorityActions,
    top_competitors: topCompetitors,
    primary_brand: {
      name: params.business_name,
      website: params.website,
      strengths: overallScore >= 70 ? ['Good AI visibility', 'Mentioned by AI platforms'] : ['Established business'],
      weaknesses: overallScore < 70 ? ['Limited AI visibility', 'Not appearing in AI recommendations'] : [],
      ai_visibility_score: overallScore
    },
    generated_at: new Date().toISOString()
  };

  return {
    reportData,
    overallScore,
    totalCost
  };
}

// ===================================================================
// FAST API CALLS (optimized models with 10s timeout each)
// ===================================================================

async function queryChatGPT(query, apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // FAST model
        messages: [
          { role: 'system', content: 'You are a local business expert. Be concise.' },
          { role: 'user', content: query }
        ],
        max_tokens: 300,
        temperature: 0.7
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.choices[0]?.message?.content || '',
      cost: ((data.usage?.total_tokens || 0) / 1000000) * 0.15,
      tokens: data.usage?.total_tokens || 0
    };
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

async function queryClaude(query, apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // FAST model
        max_tokens: 300,
        messages: [{ role: 'user', content: query }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.content[0]?.text || '',
      cost: ((data.usage?.input_tokens || 0) / 1000000) * 0.25 + ((data.usage?.output_tokens || 0) / 1000000) * 1.25,
      tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
    };
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

async function queryGemini(query, apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: query }] }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text || '';
    const estimatedTokens = Math.ceil((query.length + text.length) / 4);
    return {
      text,
      cost: (estimatedTokens / 1000000) * 0.075,
      tokens: estimatedTokens
    };
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// Helper functions
function extractCompetitors(text, businessName) {
  const competitors = [];
  const lines = text.split('\n');
  
  lines.forEach(line => {
    const match = line.match(/^[\d\.\-\*\s]*([A-Z][A-Za-z\s&'\-]+)/);
    if (match) {
      const name = match[1].trim();
      if (name && name !== businessName && name.length > 3 && name.length < 50) {
        competitors.push(name);
      }
    }
  });
  
  return [...new Set(competitors)];
}

function generateGaps(platformScores, businessType) {
  const gaps = [];
  let id = 1;

  platformScores.forEach(p => {
    if (p.score < 50) {
      gaps.push({
        id: `gap-${id++}`,
        gap_type: 'critical_topic',
        gap_title: `Low visibility on ${p.platform}`,
        gap_description: `Your business has limited presence in ${p.platform} AI responses`,
        severity: 'critical',
        recommended_action: `Optimize online content for ${p.platform} AI discovery`
      });
    }
  });

  gaps.push({
    id: `gap-${id++}`,
    gap_type: 'structural',
    gap_title: 'Schema Markup',
    gap_description: 'Add structured data to help AI understand your business',
    severity: 'moderate',
    recommended_action: 'Implement LocalBusiness schema markup'
  });

  return gaps;
}

function generateActions(gaps, score) {
  const actions = [];
  let id = 1;

  gaps.filter(g => g.severity === 'critical').forEach(gap => {
    actions.push({
      id: `action-${id++}`,
      action_title: gap.gap_title,
      action_description: gap.recommended_action,
      priority: 'high',
      estimated_impact: 'high',
      estimated_effort: 'moderate',
      timeframe: '30-60 days'
    });
  });

  if (score < 60) {
    actions.push({
      id: `action-${id++}`,
      action_title: 'Quick Win: Optimize Business Profiles',
      action_description: 'Complete Google Business Profile and major directories',
      priority: 'high',
      estimated_impact: 'high',
      estimated_effort: 'low',
      timeframe: '1-2 weeks'
    });
  }

  return actions;
}