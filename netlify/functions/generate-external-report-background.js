// netlify/functions/generate-external-report-background.js
// MINIMAL VERSION - Just make ONE API call to prove it works

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
    console.error('[ERROR] JSON parse error:', error.message);
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
    console.error('[ERROR] Supabase connection failed:', error.message);
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
      .update({ status: 'generating', generation_started_at: new Date().toISOString() })
      .eq('id', report_id);

    console.log('[SUCCESS] Status updated to generating');

    // Start background processing (fire and forget)
    generateReport(supabase, report_id, {
      business_name: business_name || target_website,
      business_type: business_type || 'business',
      location: business_location || 'Unknown',
      website: target_website
    }).catch(error => {
      console.error('[ERROR] Background generation failed:', error.message);
    });

    // Return immediately
    return {
      statusCode: 202,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, report_id, status: 'generating' })
    };

  } catch (error) {
    console.error('[ERROR] Function error:', error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};

// Background report generation
async function generateReport(supabase, report_id, params) {
  console.log('[BACKGROUND] Starting report generation');
  const startTime = Date.now();
  
  try {
    // Make ONE test API call to ChatGPT
    const openaiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!openaiKey) {
      throw new Error('OpenAI API key not found');
    }

    console.log('[INFO] Making ChatGPT API call...');
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Use mini for faster response
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: `List 3 well-known ${params.business_type} businesses in ${params.location}` }
        ],
        max_tokens: 150,
        temperature: 0.7
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ChatGPT error: ${response.status} - ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'No response';
    
    console.log('[SUCCESS] ChatGPT responded:', aiResponse.substring(0, 100));

    const duration = Date.now() - startTime;

    // Create minimal report data
    const reportData = {
      overall_score: 75,
      platform_scores: [
        { platform: 'chatgpt', score: 75, mentions: 1, status: 'success' },
        { platform: 'claude', score: 0, mentions: 0, status: 'skipped' },
        { platform: 'gemini', score: 0, mentions: 0, status: 'skipped' }
      ],
      content_gaps: [
        {
          id: 'gap-1',
          gap_type: 'structural',
          gap_title: 'Test Gap',
          gap_description: 'This is a test report',
          severity: 'moderate',
          recommended_action: 'Complete full analysis'
        }
      ],
      priority_actions: [
        {
          id: 'action-1',
          action_title: 'Test Action',
          action_description: 'Run full report generation',
          priority: 'high',
          estimated_impact: 'high',
          estimated_effort: 'low',
          timeframe: '1 week'
        }
      ],
      top_competitors: [],
      primary_brand: {
        name: params.business_name,
        website: params.website,
        strengths: ['Test successful'],
        weaknesses: ['Need full analysis'],
        ai_visibility_score: 75
      },
      ai_response_sample: aiResponse,
      generated_at: new Date().toISOString()
    };

    // Update database with completed report
    console.log('[INFO] Updating database...');
    const { error: updateError } = await supabase
      .from('ai_visibility_external_reports')
      .update({
        status: 'completed',
        report_data: reportData,
        overall_score: 75,
        generation_completed_at: new Date().toISOString(),
        processing_time_ms: duration,
        api_cost_usd: 0.001
      })
      .eq('id', report_id);

    if (updateError) {
      throw new Error(`Failed to update report: ${updateError.message}`);
    }

    console.log('[SUCCESS] Report completed in', duration, 'ms');

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
      
      console.log('[INFO] Error status saved to database');
    } catch (dbError) {
      console.error('[ERROR] Failed to save error status:', dbError.message);
    }
  }
}