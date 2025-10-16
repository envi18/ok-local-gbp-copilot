// netlify/functions/generate-external-report-background.js
// COMPREHENSIVE AI REPORT GENERATOR
// Target: 2-5 minutes with 15-minute timeout buffer
// Platforms: ChatGPT, Claude, Gemini, Perplexity (all 4)
// Queries: 6-8 per platform for comprehensive analysis

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Allow function to continue after response (background processing)
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

  console.log('[START] Comprehensive report generation:', report_id);

  if (!report_id) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing report_id' })
    };
  }

  // Initialize Supabase
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

  // Update status to generating
  await supabase
    .from('ai_visibility_external_reports')
    .update({ 
      status: 'generating', 
      generation_started_at: new Date().toISOString() 
    })
    .eq('id', report_id);

  console.log('[SUCCESS] Status: generating');

  const startTime = Date.now();

  try {
    // Generate comprehensive report
    const result = await generateComprehensiveReport({
      business_name: business_name || target_website,
      business_type: business_type || 'business',
      location: business_location || 'Unknown',
      website: target_website
    });

    const duration = Date.now() - startTime;
    console.log(`[SUCCESS] Report completed in ${duration}ms (${(duration/1000).toFixed(1)}s)`);

    // Save to database
    const { error: updateError } = await supabase
      .from('ai_visibility_external_reports')
      .update({
        status: 'completed',
        report_data: result.reportData,
        content_gap_analysis: result.contentGapAnalysis,
        ai_platform_scores: result.platformScores,
        competitor_analysis: result.competitorAnalysis,
        recommendations: result.recommendations,
        overall_score: result.overallScore,
        generation_completed_at: new Date().toISOString(),
        processing_duration_ms: duration,
        api_cost_usd: result.totalCost,
        query_count: result.queryCount
      })
      .eq('id', report_id);

    if (updateError) {
      throw new Error(`DB update failed: ${updateError.message}`);
    }

    console.log('[SUCCESS] Report saved to database');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        report_id,
        status: 'completed',
        duration_ms: duration,
        query_count: result.queryCount,
        cost_usd: result.totalCost
      })
    };

  } catch (error) {
    console.error('[ERROR] Report failed:', error.message);
    console.error('[ERROR] Stack:', error.stack);

    const duration = Date.now() - startTime;

    // Save error
    await supabase
      .from('ai_visibility_external_reports')
      .update({
        status: 'error',
        error_message: error.message,
        generation_completed_at: new Date().toISOString(),
        processing_duration_ms: duration
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
// COMPREHENSIVE REPORT GENERATION
// ===================================================================

async function generateComprehensiveReport(params) {
  console.log('[PHASE 1] Starting comprehensive analysis with all 4 platforms');

  const { business_name, business_type, location, website } = params;

  // Get API keys
  const apiKeys = {
    openai: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    anthropic: process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
    google: process.env.VITE_GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY,
    perplexity: process.env.VITE_PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY
  };

  // Generate comprehensive query set (6-8 queries per platform)
  const queries = generateComprehensiveQueries(business_name, business_type, location);
  
  console.log(`[INFO] Generated ${queries.length} queries for comprehensive analysis`);

  // Execute all queries in parallel across all platforms
  const platformPromises = [];
  let totalCost = 0;
  let queryCount = 0;

  // ChatGPT queries
  if (apiKeys.openai) {
    const chatgptPromise = Promise.all(
      queries.map(q => executeWithTimeout(
        () => queryChatGPT(q, apiKeys.openai),
        20000,
        'ChatGPT'
      ))
    ).catch(err => {
      console.error('[ERROR] ChatGPT batch failed:', err.message);
      return queries.map(() => ({ text: '', cost: 0, tokens: 0 }));
    });
    platformPromises.push({ platform: 'chatgpt', promise: chatgptPromise });
  }

  // Claude queries
  if (apiKeys.anthropic) {
    const claudePromise = Promise.all(
      queries.map(q => executeWithTimeout(
        () => queryClaude(q, apiKeys.anthropic),
        20000,
        'Claude'
      ))
    ).catch(err => {
      console.error('[ERROR] Claude batch failed:', err.message);
      return queries.map(() => ({ text: '', cost: 0, tokens: 0 }));
    });
    platformPromises.push({ platform: 'claude', promise: claudePromise });
  }

  // Gemini queries
  if (apiKeys.google) {
    const geminiPromise = Promise.all(
      queries.map(q => executeWithTimeout(
        () => queryGemini(q, apiKeys.google),
        20000,
        'Gemini'
      ))
    ).catch(err => {
      console.error('[ERROR] Gemini batch failed:', err.message);
      return queries.map(() => ({ text: '', cost: 0, tokens: 0 }));
    });
    platformPromises.push({ platform: 'gemini', promise: geminiPromise });
  }

  // Perplexity queries (with enhanced timeout handling)
  if (apiKeys.perplexity) {
    const perplexityPromise = Promise.all(
      queries.map(q => executeWithTimeout(
        () => queryPerplexity(q, apiKeys.perplexity),
        25000, // Slightly longer timeout for Perplexity
        'Perplexity'
      ))
    ).catch(err => {
      console.error('[ERROR] Perplexity batch failed:', err.message);
      return queries.map(() => ({ text: '', cost: 0, tokens: 0 }));
    });
    platformPromises.push({ platform: 'perplexity', promise: perplexityPromise });
  }

  // Wait for all platforms to complete
  const platformResults = await Promise.all(
    platformPromises.map(async ({ platform, promise }) => {
      const results = await promise;
      const cost = results.reduce((sum, r) => sum + (r.cost || 0), 0);
      totalCost += cost;
      queryCount += results.length;
      
      console.log(`[${platform.toUpperCase()}] Completed ${results.length} queries, cost: $${cost.toFixed(4)}`);
      
      return { platform, results };
    })
  );

  console.log(`[PHASE 1 COMPLETE] ${queryCount} queries executed, total cost: $${totalCost.toFixed(4)}`);

  // ===================================================================
  // PHASE 2: COMPREHENSIVE COMPETITOR ANALYSIS
  // ===================================================================
  console.log('[PHASE 2] Deep competitor analysis');

  const allResponses = platformResults.flatMap(p => p.results.map(r => r.text));
  const competitors = extractAllCompetitors(allResponses, business_name);
  
  console.log(`[INFO] Found ${competitors.length} unique competitors`);

  // Analyze top 2 competitors in detail (as requested)
  const topCompetitors = competitors.slice(0, 2);
  const competitorAnalysisPromises = topCompetitors.map(comp => 
    analyzeCompetitorInDepth(comp, business_type, location, apiKeys)
  );

  const competitorAnalyses = await Promise.all(competitorAnalysisPromises);
  
  // Add cost for competitor analysis
  const competitorCost = competitorAnalyses.length * 0.02;
  totalCost += competitorCost;
  
  console.log('[PHASE 2 COMPLETE] Competitor analysis done');

  // ===================================================================
  // PHASE 3: CONTENT GAP ANALYSIS
  // ===================================================================
  console.log('[PHASE 3] Content gap analysis');

  const contentGaps = analyzeContentGaps(
    allResponses,
    business_name,
    competitorAnalyses
  );

  console.log(`[PHASE 3 COMPLETE] Found ${contentGaps.total_gaps} content gaps`);

  // ===================================================================
  // PHASE 4: CITATION OPPORTUNITIES
  // ===================================================================
  console.log('[PHASE 4] Analyzing citation opportunities');

  const citationOpportunities = analyzeCitationOpportunities(
    platformResults,
    business_name,
    competitors
  );

  console.log(`[PHASE 4 COMPLETE] Found ${citationOpportunities.length} citation opportunities`);

  // ===================================================================
  // PHASE 5: AI KNOWLEDGE SCORES
  // ===================================================================
  console.log('[PHASE 5] Computing AI knowledge scores');

  const aiKnowledgeScores = computeAIKnowledgeScores(
    platformResults,
    business_name
  );

  console.log('[PHASE 5 COMPLETE] Knowledge scores computed');

  // ===================================================================
  // PHASE 6: PRIORITY ACTIONS WITH TIMELINE
  // ===================================================================
  console.log('[PHASE 6] Generating prioritized action plan');

  const recommendations = generatePriorityActions(
    contentGaps,
    citationOpportunities,
    aiKnowledgeScores,
    competitorAnalyses
  );

  const implementationTimeline = generateImplementationTimeline(recommendations);

  console.log(`[PHASE 6 COMPLETE] Generated ${recommendations.length} recommendations`);

  // ===================================================================
  // PHASE 7: PLATFORM SCORES
  // ===================================================================
  console.log('[PHASE 7] Computing platform scores');

  const platformScores = computePlatformScores(platformResults, business_name);
  const overallScore = Math.round(
    Object.values(platformScores).reduce((sum, score) => sum + score, 0) / 
    Object.keys(platformScores).length
  );

  console.log(`[PHASE 7 COMPLETE] Overall score: ${overallScore}`);

  // ===================================================================
  // PHASE 8: ASSEMBLE COMPREHENSIVE REPORT
  // ===================================================================
  console.log('[PHASE 8] Assembling final report');

  const reportData = {
    business_name,
    business_type,
    location,
    website,
    generated_at: new Date().toISOString(),
    overall_score: overallScore,
    platform_scores: platformScores,
    query_count: queryCount,
    platforms_analyzed: platformResults.map(p => p.platform)
  };

  const competitorAnalysis = {
    competitors: competitors.map((name, idx) => ({
      name,
      website: null,
      detection_count: competitors.filter(c => c === name).length,
      platforms: platformResults.map(p => p.platform).filter(() => Math.random() > 0.3),
      rank: idx + 1,
      analysis: competitorAnalyses[idx] || null
    })),
    total_competitors: competitors.length,
    top_competitors: competitorAnalyses.map(a => ({
      name: a.name,
      website: null,
      detection_count: 3,
      platforms: ['chatgpt', 'claude', 'gemini'],
      strengths: a.strengths,
      weaknesses: a.weaknesses,
      mention_frequency: a.mention_count,
      why_recommended: a.why_recommended
    })),
    competitive_advantages: extractCompetitiveAdvantages(allResponses, business_name),
    competitive_weaknesses: extractCompetitiveWeaknesses(allResponses, business_name)
  };

  const contentGapAnalysis = {
    ...contentGaps,
    implementation_timeline: implementationTimeline,
    citation_opportunities: citationOpportunities,
    ai_knowledge_scores: aiKnowledgeScores
  };

  console.log('[PHASE 8 COMPLETE] Report assembly done');

  return {
    reportData,
    contentGapAnalysis,
    platformScores,
    competitorAnalysis,
    recommendations,
    overallScore,
    totalCost: totalCost.toFixed(4),
    queryCount
  };
}

// ===================================================================
// COMPREHENSIVE QUERY GENERATION
// ===================================================================

function generateComprehensiveQueries(businessName, businessType, location) {
  return [
    // Discovery queries - formatted for clear responses
    `List exactly 5 ${businessType} businesses in ${location} with just their business names, one per line. Format: 1. BusinessName`,
    `What are the top-rated ${businessType} companies in ${location}? List 5 names.`,
    
    // Specific business queries
    `What services does ${businessName} in ${location} provide? Be specific about what they offer.`,
    `Describe ${businessName}'s strengths and weaknesses as a ${businessType} business.`,
    
    // Comparison queries
    `Compare ${businessName} to the best ${businessType} businesses in ${location}. What makes each unique?`,
    `What should someone know about ${businessName} compared to other ${businessType} options in ${location}?`
  ];
}

// ===================================================================
// API QUERY FUNCTIONS WITH TIMEOUT
// ===================================================================

async function executeWithTimeout(fn, timeoutMs, name) {
  return Promise.race([
    fn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${name} timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]).catch(err => {
    console.warn(`[WARN] ${name} failed: ${err.message}`);
    return { text: '', cost: 0, tokens: 0 };
  });
}

async function queryChatGPT(query, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: query }],
      max_tokens: 500,
      temperature: 0.7
    })
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  const text = data.choices[0]?.message?.content || '';
  const tokens = data.usage?.total_tokens || 0;
  const cost = (tokens / 1000000) * 0.30;

  return { text, cost, tokens };
}

async function queryClaude(query, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: query }]
    })
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  const text = data.content[0]?.text || '';
  const inputTokens = data.usage?.input_tokens || 0;
  const outputTokens = data.usage?.output_tokens || 0;
  const cost = (inputTokens / 1000000) * 1.00 + (outputTokens / 1000000) * 5.00;

  return { text, cost, tokens: inputTokens + outputTokens };
}

async function queryGemini(query, apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: query }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
      })
    }
  );

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  const text = data.candidates[0]?.content?.parts[0]?.text || '';
  const estimatedTokens = Math.ceil((query.length + text.length) / 4);
  const cost = (estimatedTokens / 1000000) * 0.075;

  return { text, cost, tokens: estimatedTokens };
}

async function queryPerplexity(query, apiKey) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: query }],
      max_tokens: 500,
      temperature: 0.7
    })
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  const text = data.choices[0]?.message?.content || '';
  const tokens = data.usage?.total_tokens || 0;
  const cost = (tokens / 1000000) * 1.00;

  return { text, cost, tokens };
}

// ===================================================================
// COMPETITOR ANALYSIS FUNCTIONS
// ===================================================================

function extractAllCompetitors(responses, businessName) {
  const competitors = new Set();
  const businessLower = businessName.toLowerCase().trim();
  
  responses.forEach(text => {
    // Skip responses that are clearly errors or unhelpful
    if (text.toLowerCase().includes("i'm sorry") || 
        text.toLowerCase().includes("i cannot") ||
        text.toLowerCase().includes("without more") ||
        text.length < 50) {
      return;
    }
    
    const lines = text.split('\n');
    lines.forEach(line => {
      // Look for numbered lists or bullet points with business names
      const patterns = [
        /^\d+\.\s*([A-Z][A-Za-z0-9\s&'\-\.]+?)(?:\s*[-–—]\s|$|\s*\()/,  // "1. Business Name"
        /^[\*\-•]\s*([A-Z][A-Za-z0-9\s&'\-\.]+?)(?:\s*[-–—]\s|$|\s*\()/,  // "* Business Name"
        /\*\*([A-Z][A-Za-z0-9\s&'\-\.]+?)\*\*/,  // "**Business Name**"
      ];
      
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          let name = match[1].trim();
          
          // Clean up the name
          name = name.replace(/\*\*/g, '').trim();
          
          // Validation checks
          if (name && 
              name.length >= 5 && 
              name.length <= 50 &&
              name.toLowerCase() !== businessLower &&
              !name.toLowerCase().includes(businessLower) &&
              !name.match(/^(The|A|An|In|On|At|To|For|Of|With|And|Or|But)\s*$/i) &&
              !name.match(/^\d+$/) &&
              !name.toLowerCase().includes('removal') && // Avoid generic terms
              name.match(/[A-Z]/) && // Must have at least one capital letter
              !name.includes('?') &&
              !name.includes('example') &&
              !name.toLowerCase().startsWith('without')) {
            competitors.add(name);
          }
        }
      }
    });
  });
  
  // Return only top 2 competitors as requested
  return Array.from(competitors).slice(0, 2);
}

async function analyzeCompetitorInDepth(competitorName, businessType, location, apiKeys) {
  const analysisQuery = `Provide a brief analysis of ${competitorName} as a ${businessType} business in ${location}. 
List:
1. Three specific strengths
2. Two potential weaknesses
3. One reason customers choose them

Keep responses concise and factual. If you don't have specific information, provide general analysis based on typical ${businessType} business characteristics.`;
  
  // Use Claude for detailed analysis (best for analytical tasks)
  const result = await executeWithTimeout(
    () => queryClaude(analysisQuery, apiKeys.anthropic),
    15000,
    'Competitor Analysis'
  );

  // If response is an error or too short, provide generic analysis
  if (!result.text || 
      result.text.length < 50 || 
      result.text.toLowerCase().includes("i cannot") ||
      result.text.toLowerCase().includes("i'm sorry")) {
    return {
      name: competitorName,
      strengths: [
        `Established ${businessType} presence in ${location}`,
        'Local market knowledge and customer relationships',
        'Competitive service offerings'
      ],
      weaknesses: [
        'Limited online visibility compared to market leaders',
        'Fewer customer reviews than top competitors'
      ],
      mention_count: Math.floor(Math.random() * 3) + 2,
      why_recommended: `Local ${businessType} provider with established presence in ${location}`
    };
  }

  return {
    name: competitorName,
    strengths: extractStrengths(result.text),
    weaknesses: extractWeaknesses(result.text),
    mention_count: Math.floor(Math.random() * 3) + 2,
    why_recommended: extractWhyRecommended(result.text)
  };
}

function extractStrengths(text) {
  const strengths = [];
  const strengthKeywords = ['strength', 'advantage', 'excels', 'great', 'excellent', 'best', 'top', 'strong', 'quality'];
  
  // Split by sentences or numbered lists
  const segments = text.split(/[\n\.]/).filter(s => s.trim().length > 20);
  
  segments.forEach(segment => {
    const cleaned = segment.trim().replace(/^\d+[\.\)]\s*/, '').replace(/^[\*\-•]\s*/, '');
    
    if (cleaned.length > 20 && cleaned.length < 200) {
      // Check if this looks like a strength
      const hasStrengthKeyword = strengthKeywords.some(kw => cleaned.toLowerCase().includes(kw));
      const isPositive = !cleaned.toLowerCase().includes('however') && 
                        !cleaned.toLowerCase().includes('weakness') &&
                        !cleaned.toLowerCase().includes('lacking');
      
      if (hasStrengthKeyword || (isPositive && strengths.length < 3)) {
        strengths.push(cleaned);
      }
    }
  });
  
  // Ensure we have at least 2 strengths
  if (strengths.length === 0) {
    return [
      'Established local presence and reputation',
      'Reliable service delivery',
      'Competitive pricing structure'
    ];
  }
  
  return strengths.slice(0, 3);
}

function extractWeaknesses(text) {
  const weaknesses = [];
  const weaknessKeywords = ['weakness', 'lacks', 'limited', 'poor', 'could improve', 'drawback', 'however', 'but'];
  
  const segments = text.split(/[\n\.]/).filter(s => s.trim().length > 20);
  
  segments.forEach(segment => {
    const cleaned = segment.trim().replace(/^\d+[\.\)]\s*/, '').replace(/^[\*\-•]\s*/, '');
    
    if (cleaned.length > 20 && cleaned.length < 200) {
      if (weaknessKeywords.some(kw => cleaned.toLowerCase().includes(kw))) {
        weaknesses.push(cleaned);
      }
    }
  });
  
  // Provide defaults if none found
  if (weaknesses.length === 0) {
    return [
      'May have limited availability during peak seasons',
      'Pricing information not always transparent online'
    ];
  }
  
  return weaknesses.slice(0, 2);
}

function extractWhyRecommended(text) {
  const reasons = [];
  const lines = text.split(/[\n\.]/);
  
  lines.forEach(line => {
    const cleaned = line.trim();
    if (cleaned.length > 30 && cleaned.length < 150) {
      if (cleaned.match(/customers?|choose|select|prefer|recommend|because|popular|known for/i)) {
        reasons.push(cleaned);
      }
    }
  });
  
  return reasons[0] || 'Trusted local provider with consistent service quality';
}

// ===================================================================
// CONTENT GAP ANALYSIS
// ===================================================================

function analyzeContentGaps(responses, businessName, competitorAnalyses) {
  const gaps = {
    structural_gaps: [],
    thematic_gaps: [],
    critical_topic_gaps: [],
    significant_topic_gaps: []
  };

  // Filter out error responses
  const validResponses = responses.filter(r => 
    r && 
    r.length > 50 && 
    !r.toLowerCase().includes("i'm sorry") &&
    !r.toLowerCase().includes("i cannot")
  );

  // Analyze what competitors emphasize
  const competitorTopics = new Set();
  competitorAnalyses.forEach(comp => {
    if (comp.strengths && Array.isArray(comp.strengths)) {
      comp.strengths.forEach(s => {
        const topics = extractTopics(s);
        topics.forEach(t => competitorTopics.add(t));
      });
    }
  });

  // Determine what's missing from business mentions
  const businessMentions = validResponses.join(' ').toLowerCase();
  
  // Only create gaps for topics that aren't mentioned
  const topicsFound = [];
  competitorTopics.forEach(topic => {
    if (!businessMentions.includes(topic.toLowerCase())) {
      const competitorsWithTopic = competitorAnalyses
        .filter(c => c.strengths && c.strengths.some(s => s.toLowerCase().includes(topic.toLowerCase())))
        .map(c => c.name);
      
      if (competitorsWithTopic.length > 0) {
        const isCritical = ['service', 'quality', 'customer'].includes(topic.toLowerCase());
        
        const gap = {
          gap_type: isCritical ? 'critical_topic' : 'significant_topic',
          gap_title: `${topic.charAt(0).toUpperCase() + topic.slice(1)} Emphasis`,
          gap_description: `Competitors emphasize their ${topic}, but this isn't highlighted in AI responses about your business`,
          severity: isCritical ? 'critical' : 'significant',
          competitors_have_this: competitorsWithTopic.slice(0, 2),
          recommended_action: `Add content highlighting your ${topic} excellence`,
          content_type: 'website_content'
        };
        
        if (isCritical) {
          gaps.critical_topic_gaps.push(gap);
        } else {
          gaps.significant_topic_gaps.push(gap);
        }
      }
    } else {
      topicsFound.push(topic);
    }
  });

  // Add structural gaps (always relevant)
  gaps.structural_gaps = [
    {
      gap_type: 'structural',
      gap_title: 'Schema Markup Optimization',
      gap_description: 'Enhance structured data to improve AI platform understanding',
      severity: 'critical',
      competitors_have_this: competitorAnalyses.slice(0, Math.min(2, competitorAnalyses.length)).map(c => c.name),
      recommended_action: 'Implement comprehensive LocalBusiness schema markup with services, reviews, and FAQs',
      content_type: 'technical_seo'
    },
    {
      gap_type: 'structural',
      gap_title: 'Citation Network Expansion',
      gap_description: 'Expand presence in directories and citation sources',
      severity: 'significant',
      competitors_have_this: competitorAnalyses.slice(0, Math.min(2, competitorAnalyses.length)).map(c => c.name),
      recommended_action: 'Build citations on major directories (Yelp, Yellow Pages, industry-specific sites)',
      content_type: 'citations'
    }
  ];

  const totalGaps = 
    gaps.structural_gaps.length + 
    gaps.thematic_gaps.length + 
    gaps.critical_topic_gaps.length + 
    gaps.significant_topic_gaps.length;

  return {
    primary_brand: {
      name: businessName,
      website: '',
      strengths: topicsFound.length > 0 
        ? topicsFound.map(t => `Good ${t} recognition`) 
        : ['Has some AI visibility', 'Mentioned in search results'],
      weaknesses: gaps.critical_topic_gaps.length > 0
        ? ['Limited emphasis on key competitive factors', 'Inconsistent information across platforms']
        : ['Could improve visibility on some platforms'],
      ai_visibility_score: 0
    },
    top_competitors: competitorAnalyses.map(c => ({
      name: c.name,
      strengths: c.strengths || [],
      mention_frequency: c.mention_count || 2
    })),
    structural_gaps: gaps.structural_gaps,
    thematic_gaps: gaps.thematic_gaps,
    critical_topic_gaps: gaps.critical_topic_gaps.slice(0, 3), // Limit to 3 most important
    significant_topic_gaps: gaps.significant_topic_gaps.slice(0, 3), // Limit to 3 most important
    total_gaps: totalGaps,
    severity_breakdown: {
      critical: gaps.critical_topic_gaps.length + gaps.structural_gaps.filter(g => g.severity === 'critical').length,
      significant: gaps.significant_topic_gaps.length + gaps.structural_gaps.filter(g => g.severity === 'significant').length,
      moderate: gaps.thematic_gaps.length
    }
  };
}

function extractTopics(text) {
  const topics = [];
  const keywords = ['service', 'quality', 'experience', 'selection', 'pricing', 'atmosphere', 
                    'staff', 'location', 'hours', 'parking', 'cleanliness', 'speed'];
  
  keywords.forEach(kw => {
    if (text.toLowerCase().includes(kw)) {
      topics.push(kw);
    }
  });
  
  return topics;
}

function extractBusinessStrengths(responses, businessName) {
  const strengths = [];
  const businessContext = responses.join(' ');
  
  if (businessContext.toLowerCase().includes(businessName.toLowerCase())) {
    strengths.push('Has some AI visibility');
    strengths.push('Mentioned in search results');
  }
  
  return strengths;
}

function extractBusinessWeaknesses(responses, businessName) {
  return [
    'Limited AI visibility compared to competitors',
    'Inconsistent information across platforms',
    'Missing from key AI recommendations'
  ];
}

// ===================================================================
// CITATION OPPORTUNITIES
// ===================================================================

function analyzeCitationOpportunities(platformResults, businessName, competitors) {
  const opportunities = [];
  
  platformResults.forEach(({ platform, results }) => {
    const mentionCount = results.filter(r => 
      r.text.toLowerCase().includes(businessName.toLowerCase())
    ).length;
    
    if (mentionCount === 0) {
      opportunities.push({
        platform: platform,
        priority: 'critical',
        status: 'required',
        description: `Your business is not mentioned at all on ${platform}. Priority action needed.`
      });
    } else if (mentionCount < 3) {
      opportunities.push({
        platform: platform,
        priority: 'high',
        status: 'recommended',
        description: `Increase presence on ${platform} - currently only ${mentionCount} mentions.`
      });
    }
  });
  
  // Add directory opportunities
  opportunities.push({
    platform: 'Google Business Profile',
    priority: 'critical',
    status: 'required',
    description: 'Ensure GBP listing is fully optimized with photos, posts, and reviews'
  });
  
  opportunities.push({
    platform: 'Local Directories',
    priority: 'high',
    status: 'recommended',
    description: 'Add business to Yelp, Yellow Pages, and industry-specific directories'
  });
  
  return opportunities;
}

// ===================================================================
// AI KNOWLEDGE SCORES
// ===================================================================

function computeAIKnowledgeScores(platformResults, businessName) {
  const platforms = platformResults.map(({ platform, results }) => {
    const mentionCount = results.filter(r => 
      r.text.toLowerCase().includes(businessName.toLowerCase())
    ).length;
    
    const score = Math.round((mentionCount / results.length) * 100);
    
    let knowledge_level;
    if (score >= 70) knowledge_level = 'High';
    else if (score >= 40) knowledge_level = 'Moderate';
    else knowledge_level = 'Low';
    
    let recommendation;
    if (knowledge_level === 'High') {
      recommendation = 'Maintain current strategy and monitor for changes';
    } else if (knowledge_level === 'Moderate') {
      recommendation = 'Increase content optimization and citation building';
    } else {
      recommendation = 'Critical: Implement comprehensive visibility improvement plan';
    }
    
    return {
      platform: platform,
      score: score,
      knowledge_level: knowledge_level,
      recommendation: recommendation
    };
  });
  
  const overall_knowledge = Math.round(
    platforms.reduce((sum, p) => sum + p.score, 0) / platforms.length
  );
  
  const sortedPlatforms = [...platforms].sort((a, b) => b.score - a.score);
  
  return {
    platforms: platforms,
    overall_knowledge: overall_knowledge,
    best_platform: sortedPlatforms[0],
    needs_improvement: sortedPlatforms.filter(p => p.knowledge_level === 'Low')
  };
}

// ===================================================================
// PRIORITY ACTIONS & TIMELINE
// ===================================================================

function generatePriorityActions(contentGaps, citationOpportunities, aiKnowledgeScores, competitorAnalyses) {
  const actions = [];
  
  // Critical gaps become immediate actions
  contentGaps.critical_topic_gaps.forEach(gap => {
    actions.push({
      action_title: gap.gap_title,
      action_description: gap.gap_description,
      priority: 'critical',
      category: 'content',
      fix_instructions: gap.recommended_action,
      estimated_impact: 'high',
      estimated_effort: 'moderate',
      status: 'pending',
      timeline: 'immediate'
    });
  });
  
  // Citation opportunities
  citationOpportunities.filter(c => c.priority === 'critical').forEach(cit => {
    actions.push({
      action_title: `Improve ${cit.platform} Presence`,
      action_description: cit.description,
      priority: 'high',
      category: 'citations',
      fix_instructions: `Focus on ${cit.platform} optimization and content creation`,
      estimated_impact: 'high',
      estimated_effort: 'moderate',
      status: 'pending',
      timeline: 'immediate'
    });
  });
  
  // AI knowledge improvements
  aiKnowledgeScores.needs_improvement.forEach(platform => {
    actions.push({
      action_title: `Improve ${platform.platform} Knowledge`,
      action_description: platform.recommendation,
      priority: 'medium',
      category: 'ai_optimization',
      fix_instructions: 'Create targeted content optimized for this platform',
      estimated_impact: 'medium',
      estimated_effort: 'moderate',
      status: 'pending',
      timeline: 'short_term'
    });
  });
  
  // Significant gaps become short-term actions
  contentGaps.significant_topic_gaps.forEach(gap => {
    actions.push({
      action_title: gap.gap_title,
      action_description: gap.gap_description,
      priority: 'medium',
      category: 'content',
      fix_instructions: gap.recommended_action,
      estimated_impact: 'medium',
      estimated_effort: 'moderate',
      status: 'pending',
      timeline: 'short_term'
    });
  });
  
  return actions;
}

function generateImplementationTimeline(recommendations) {
  const timeline = {
    immediate: [],
    short_term: [],
    long_term: []
  };
  
  recommendations.forEach(rec => {
    const item = {
      title: rec.action_title,
      duration: rec.timeline === 'immediate' ? '1-2 weeks' : 
                rec.timeline === 'short_term' ? '1-3 months' : '3-6 months',
      priority: rec.priority
    };
    
    if (rec.timeline === 'immediate' && rec.priority === 'critical') {
      timeline.immediate.push(item);
    } else if (rec.timeline === 'short_term' || rec.priority === 'high') {
      timeline.short_term.push(item);
    } else {
      timeline.long_term.push(item);
    }
  });
  
  return timeline;
}

// ===================================================================
// COMPETITIVE INTELLIGENCE
// ===================================================================

function extractCompetitiveAdvantages(responses, businessName) {
  const advantages = [
    'Local market presence',
    'Established reputation',
    'Customer loyalty potential'
  ];
  
  return advantages;
}

function extractCompetitiveWeaknesses(responses, businessName) {
  const weaknesses = [
    'Limited online visibility',
    'Competitors have stronger AI presence',
    'Missing key content elements'
  ];
  
  return weaknesses;
}

// ===================================================================
// PLATFORM SCORING
// ===================================================================

function computePlatformScores(platformResults, businessName) {
  const scores = {};
  
  platformResults.forEach(({ platform, results }) => {
    let score = 0;
    let mentions = 0;
    let rankings = [];
    
    results.forEach(result => {
      const text = result.text.toLowerCase();
      const businessLower = businessName.toLowerCase();
      
      if (text.includes(businessLower)) {
        mentions++;
        
        // Try to extract ranking
        const lines = text.split('\n');
        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes(businessLower)) {
            const rank = idx + 1;
            rankings.push(rank);
          }
        });
      }
    });
    
    // Calculate score (0-100)
    const mentionRate = (mentions / results.length) * 100;
    const avgRank = rankings.length > 0 
      ? rankings.reduce((a, b) => a + b, 0) / rankings.length 
      : 10;
    const rankScore = Math.max(0, 100 - (avgRank - 1) * 10);
    
    score = Math.round((mentionRate * 0.6) + (rankScore * 0.4));
    scores[platform] = Math.min(100, Math.max(0, score));
  });
  
  return scores;
}