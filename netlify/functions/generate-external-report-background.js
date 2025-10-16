// netlify/functions/generate-external-report-background.js
// PART 1 OF 6 - Setup and Handler
// AI REPORT GENERATOR - PHASE 2: CONTENT-BASED ANALYSIS
// Uses real website scraping and competitor discovery instead of AI knowledge queries

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

  console.log('[START] Phase 2 content-based report generation:', report_id);

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
    // Generate comprehensive report using content analysis
    const result = await generateContentBasedReport({
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

// PART 2 OF 6 - Main Report Generation Function (Phases 1-3)
// Add after Part 1

// ===================================================================
// PHASE 2: CONTENT-BASED REPORT GENERATION
// ===================================================================

async function generateContentBasedReport(params) {
  console.log('[PHASE 2 START] Content-based analysis');
  
  const { business_name, business_type, location, website } = params;
  let totalCost = 0;
  let queryCount = 0;

  // ===================================================================
  // PHASE 1: FETCH TARGET WEBSITE CONTENT
  // ===================================================================
  console.log('[PHASE 1] Fetching target website content');
  
  let targetContent;
  try {
    targetContent = await fetchWebsiteContent(website);
    console.log(`[SUCCESS] Fetched ${targetContent.pages.length} pages from target site`);
    totalCost += 0.05 * targetContent.pages.length; // ScrapingBee cost estimate
  } catch (error) {
    console.error('[ERROR] Failed to fetch target website:', error.message);
    // Use fallback structure
    targetContent = createFallbackContent(website, business_name);
  }

  // ===================================================================
  // PHASE 2: DISCOVER REAL COMPETITORS
  // ===================================================================
  console.log('[PHASE 2] Discovering real competitors');
  
  let competitors = [];
  try {
    competitors = await discoverCompetitors(business_type, location, website, 2);
    console.log(`[SUCCESS] Found ${competitors.length} valid competitors`);
    totalCost += 0.05; // Google Custom Search API cost
  } catch (error) {
    console.error('[ERROR] Competitor discovery failed:', error.message);
    // Continue with empty competitors - will use generic analysis
  }

  // ===================================================================
  // PHASE 3: FETCH COMPETITOR WEBSITES
  // ===================================================================
  console.log('[PHASE 3] Fetching competitor websites');
  
  const competitorContent = [];
  for (const comp of competitors) {
    try {
      const content = await fetchWebsiteContent(comp.website);
      competitorContent.push({
        info: comp,
        content: content
      });
      console.log(`[SUCCESS] Fetched competitor: ${comp.name}`);
      totalCost += 0.05 * content.pages.length;
    } catch (error) {
      console.error(`[ERROR] Failed to fetch ${comp.name}:`, error.message);
      // Continue with other competitors
    }
  }

  // PART 3 OF 6 - Content Comparison & Recommendations (Phases 4-6)
// Add after Part 2

  // ===================================================================
  // PHASE 4: COMPARE CONTENT & GENERATE GAPS
  // ===================================================================
  console.log('[PHASE 4] Comparing content and generating gaps');
  
  const allGaps = [];
  for (const comp of competitorContent) {
    try {
      const gaps = await compareWebsites(
        targetContent,
        comp.content,
        business_name,
        comp.info.name
      );
      allGaps.push(...gaps);
      console.log(`[SUCCESS] Generated ${gaps.length} gaps vs ${comp.info.name}`);
    } catch (error) {
      console.error(`[ERROR] Comparison failed for ${comp.info.name}:`, error.message);
    }
  }

  // ===================================================================
  // PHASE 5: AI-POWERED DEEP ANALYSIS (Optional Enhancement)
  // ===================================================================
  console.log('[PHASE 5] AI-powered content analysis');
  
  // Get API keys
  const apiKeys = {
    openai: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    anthropic: process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY
  };

  // Use AI to enhance gap analysis with actual content
  if (apiKeys.anthropic && competitorContent.length > 0) {
    try {
      const aiGaps = await aiPoweredGapAnalysis(
        targetContent,
        competitorContent,
        business_name,
        apiKeys.anthropic
      );
      allGaps.push(...aiGaps);
      totalCost += 0.10; // Claude API cost
      queryCount += 1;
    } catch (error) {
      console.error('[ERROR] AI analysis failed:', error.message);
    }
  }

  // ===================================================================
  // PHASE 6: GENERATE RECOMMENDATIONS
  // ===================================================================
  console.log('[PHASE 6] Generating recommendations');
  
  const recommendations = generateRecommendations(allGaps);
  const timeline = generateImplementationTimeline(allGaps);

  // PART 4 OF 6 - Platform Visibility, Report Assembly, and Return (Phases 7-8)
// Add after Part 3

  // ===================================================================
  // PHASE 7: COMPUTE PLATFORM VISIBILITY SCORES
  // ===================================================================
  console.log('[PHASE 7] Computing AI platform visibility scores');
  
  const platformScores = await computePlatformVisibility(
    business_name,
    business_type,
    location,
    apiKeys
  );
  totalCost += platformScores.cost || 0.20;
  queryCount += platformScores.queryCount || 4;

  // ===================================================================
  // PHASE 8: ASSEMBLE FINAL REPORT
  // ===================================================================
  console.log('[PHASE 8] Assembling final report');
  
  const overallScore = calculateOverallScore(allGaps, platformScores.scores);

  const reportData = {
    business_name,
    business_type,
    location,
    website,
    generated_at: new Date().toISOString(),
    overall_score: overallScore,
    platform_scores: platformScores.scores,
    target_website_analysis: {
      page_count: targetContent.pages.length,
      has_faq: targetContent.pages.some(p => p.has_faq),
      has_process: targetContent.pages.some(p => p.has_process),
      has_schema: targetContent.metadata.has_schema,
      main_topics: Array.from(new Set(
        targetContent.pages.flatMap(p => p.main_topics)
      )).slice(0, 10),
      avg_word_count: Math.round(
        targetContent.pages.reduce((sum, p) => sum + p.word_count, 0) / 
        Math.max(targetContent.pages.length, 1)
      )
    }
  };

  const contentGapAnalysis = {
    primary_brand: {
      name: business_name,
      website: website,
      strengths: extractStrengths(targetContent),
      weaknesses: allGaps
        .filter(g => g.severity === 'critical' || g.severity === 'significant')
        .map(g => g.gap_title)
        .slice(0, 5),
      ai_visibility_score: overallScore
    },
    top_competitors: competitorContent.map(c => ({
      name: c.info.name,
      website: c.info.website,
      strengths: extractStrengths(c.content),
      mention_frequency: 3 // Will be from platform queries
    })),
    structural_gaps: allGaps.filter(g => g.gap_type === 'structural'),
    thematic_gaps: allGaps.filter(g => g.gap_type === 'thematic'),
    critical_topic_gaps: allGaps.filter(g => g.gap_type === 'critical_topic'),
    significant_topic_gaps: allGaps.filter(g => g.gap_type === 'significant_topic'),
    total_gaps: allGaps.length,
    severity_breakdown: {
      critical: allGaps.filter(g => g.severity === 'critical').length,
      significant: allGaps.filter(g => g.severity === 'significant').length,
      moderate: allGaps.filter(g => g.severity === 'moderate').length
    },
    implementation_timeline: timeline
  };

  const competitorAnalysis = {
    competitors: competitorContent.map((c, idx) => ({
      name: c.info.name,
      website: c.info.website,
      detection_count: 1,
      platforms: ['google_search'],
      rank: idx + 1,
      page_count: c.content.pages.length,
      has_faq: c.content.pages.some(p => p.has_faq),
      has_process: c.content.pages.some(p => p.has_process),
      has_schema: c.content.metadata.has_schema
    })),
    total_competitors: competitorContent.length,
    top_competitors: competitorContent.map(c => ({
      name: c.info.name,
      website: c.info.website,
      detection_count: 1,
      platforms: ['google_search', 'content_analysis'],
      strengths: extractStrengths(c.content)
    }))
  };

  console.log('[PHASE 8 COMPLETE] Report assembly done');

  return {
    reportData,
    contentGapAnalysis,
    platformScores: platformScores.scores,
    competitorAnalysis,
    recommendations,
    overallScore,
    totalCost: totalCost.toFixed(2),
    queryCount
  };
}

// PART 5 OF 6 - Content Fetching & Competitor Discovery Functions
// Add after Part 4

// ===================================================================
// CONTENT FETCHING (ScrapingBee Integration)
// ===================================================================

async function fetchWebsiteContent(url) {
  const SCRAPINGBEE_API_KEY = process.env.SCRAPINGBEE_API_KEY;
  
  if (!SCRAPINGBEE_API_KEY) {
    throw new Error('ScrapingBee API key not configured');
  }

  // Fetch homepage
  const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?` +
    `api_key=${SCRAPINGBEE_API_KEY}` +
    `&url=${encodeURIComponent(url)}` +
    `&render_js=false` +
    `&premium_proxy=false`;

  const response = await fetch(scrapingBeeUrl);
  
  if (!response.ok) {
    throw new Error(`ScrapingBee error: ${response.status}`);
  }

  const html = await response.text();

  // Parse HTML (using basic regex/string parsing)
  const pages = await extractPages(html, url);
  const navigation = extractNavigation(html);
  const metadata = extractMetadata(html, url);

  return {
    url,
    pages,
    navigation,
    footer_links: [],
    content_summary: `Website has ${pages.length} pages`,
    metadata,
    scraped_at: new Date().toISOString()
  };
}

async function extractPages(html, baseUrl) {
  const pages = [];
  
  // Analyze homepage
  const homePage = analyzePage(html, baseUrl);
  pages.push(homePage);

  // Extract important page URLs
  const linkRegex = /href=["']([^"']+)["']/g;
  const links = [];
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      links.push(href);
    }
  }

  // Prioritize important pages
  const importantPages = links.filter(link => {
    const lower = link.toLowerCase();
    return lower.includes('faq') || 
           lower.includes('about') ||
           lower.includes('service') ||
           lower.includes('contact') ||
           lower.includes('process') ||
           lower.includes('how-it-works');
  }).slice(0, 5);

  // Fetch important pages (with rate limiting)
  for (const link of importantPages) {
    try {
      const fullUrl = normalizeUrl(link, baseUrl);
      if (fullUrl && fullUrl.includes(new URL(baseUrl).hostname)) {
        const pageHtml = await fetchWithTimeout(fullUrl, 10000);
        const page = analyzePage(pageHtml, fullUrl);
        pages.push(page);
        await sleep(200); // Rate limit
      }
    } catch (error) {
      console.warn(`Failed to fetch ${link}:`, error.message);
    }
  }

  return pages;
}

function analyzePage(html, url) {
  // Extract title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

  // Extract headings
  const heading_structure = [];
  const h1Regex = /<h1[^>]*>([^<]+)<\/h1>/gi;
  const h2Regex = /<h2[^>]*>([^<]+)<\/h2>/gi;
  
  let match;
  while ((match = h1Regex.exec(html)) !== null && heading_structure.length < 10) {
    heading_structure.push(`H1: ${match[1].trim()}`);
  }
  while ((match = h2Regex.exec(html)) !== null && heading_structure.length < 10) {
    heading_structure.push(`H2: ${match[1].trim()}`);
  }

  // Extract topics (simple word frequency)
  const text = html.replace(/<[^>]+>/g, ' ').toLowerCase();
  const words = text.match(/\b[a-z]{4,}\b/g) || [];
  const frequency = {};
  const stopWords = new Set(['the', 'and', 'for', 'that', 'with', 'this', 'from', 'have']);
  
  words.forEach(word => {
    if (!stopWords.has(word)) {
      frequency[word] = (frequency[word] || 0) + 1;
    }
  });
  
  const main_topics = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  // Count words
  const word_count = words.length;

  // Check features
  const has_schema = html.includes('"@type"') || html.includes('itemtype=');
  const has_faq = html.toLowerCase().includes('faq') || 
                 html.includes('FAQPage') ||
                 html.match(/<h[1-6][^>]*>.*?faq.*?<\/h[1-6]>/i) !== null;
  const has_reviews = html.includes('"@type":"Review"') ||
                     html.includes('testimonial') ||
                     html.includes('customer-review');
  const has_process = html.toLowerCase().match(/how it works|our process|step[s]?/) !== null ||
                     html.includes('"@type":"HowTo"');

  return {
    url,
    title,
    heading_structure,
    main_topics,
    word_count,
    has_schema,
    has_faq,
    has_reviews,
    has_process
  };
}

function extractNavigation(html) {
  const navigation = [];
  const navRegex = /<nav[^>]*>(.*?)<\/nav>/is;
  const match = html.match(navRegex);
  
  if (match) {
    const navHtml = match[1];
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
    let linkMatch;
    
    while ((linkMatch = linkRegex.exec(navHtml)) !== null && navigation.length < 10) {
      navigation.push({
        text: linkMatch[2].trim(),
        url: linkMatch[1]
      });
    }
  }
  
  return navigation;
}

function extractMetadata(html, url) {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  
  const title = titleMatch ? titleMatch[1].trim() : '';
  const description = descMatch ? descMatch[1] : '';
  const has_schema = html.includes('"@type"');
  
  // Extract business type from schema
  let main_business_type = '';
  const schemaMatch = html.match(/"@type":\s*"([^"]+)"/);
  if (schemaMatch) {
    main_business_type = schemaMatch[1];
  }

  // Extract locations
  const locationPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})\b/g;
  const location_mentioned = [];
  let locMatch;
  while ((locMatch = locationPattern.exec(html)) !== null && location_mentioned.length < 3) {
    location_mentioned.push(locMatch[1]);
  }

  // Extract phone numbers
  const phonePattern = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phone_numbers = [];
  let phoneMatch;
  while ((phoneMatch = phonePattern.exec(html)) !== null && phone_numbers.length < 2) {
    phone_numbers.push(phoneMatch[0]);
  }

  return {
    title,
    description,
    has_schema,
    main_business_type,
    location_mentioned,
    phone_numbers,
    email_addresses: []
  };
}

// ===================================================================
// COMPETITOR DISCOVERY (Google Custom Search)
// ===================================================================

async function discoverCompetitors(businessType, location, excludeUrl, limit = 2) {
  const GOOGLE_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const GOOGLE_CX = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
  
  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    console.warn('[WARNING] Google Custom Search not configured');
    return [];
  }

  const query = `best ${businessType} in ${location}`;
  const url = `https://www.googleapis.com/customsearch/v1?` +
    `key=${GOOGLE_API_KEY}` +
    `&cx=${GOOGLE_CX}` +
    `&q=${encodeURIComponent(query)}` +
    `&num=10`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Google Search API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.items || data.items.length === 0) {
    return [];
  }

  const competitors = [];
  
  for (const item of data.items) {
    if (competitors.length >= limit) break;
    
    // Skip if same domain as target
    if (excludeUrl && isSameDomain(item.link, excludeUrl)) {
      continue;
    }
    
    // Skip directories and social media
    if (!isValidBusinessUrl(item.link)) {
      continue;
    }
    
    // Validate it's a real business
    try {
      const html = await fetchWithTimeout(item.link, 10000);
      
      if (hasBusinessIndicators(html)) {
        const businessName = extractBusinessName(html, item.title);
        competitors.push({
          name: businessName,
          website: item.link,
          snippet: item.snippet || '',
          is_valid: true,
          business_type: businessType,
          location: location,
          detection_method: 'search'
        });
      }
    } catch (error) {
      console.warn(`Failed to validate ${item.link}:`, error.message);
    }
    
    await sleep(500); // Rate limit
  }

  return competitors;
}

function isValidBusinessUrl(url) {
  const invalidDomains = [
    'yelp.com', 'facebook.com', 'instagram.com', 'twitter.com',
    'linkedin.com', 'yellowpages.com', 'google.com', 'youtube.com'
  ];
  
  const lowerUrl = url.toLowerCase();
  return !invalidDomains.some(domain => lowerUrl.includes(domain));
}

function hasBusinessIndicators(html) {
  if (html.length < 1000) return false;
  
  const phonePattern = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const hasPhone = phonePattern.test(html);
  const hasSchema = html.includes('"@type":"LocalBusiness"') ||
                   html.includes('"@type":"Organization"');
  const hasContact = html.toLowerCase().includes('contact');
  
  return (hasPhone || hasSchema) && hasContact;
}

function extractBusinessName(html, fallbackTitle) {
  const schemaMatch = html.match(/"name":\s*"([^"]+)"/);
  if (schemaMatch && schemaMatch[1].length < 100) {
    return cleanBusinessName(schemaMatch[1]);
  }
  
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    return cleanBusinessName(titleMatch[1]);
  }
  
  return cleanBusinessName(fallbackTitle);
}

function cleanBusinessName(name) {
  let cleaned = name.split('|')[0].split('-')[0].trim();
  cleaned = cleaned.replace(/\s*(LLC|Inc|Corp|Ltd)\.?$/i, '').trim();
  cleaned = cleaned.replace(/\s*\([^)]+\)$/, '').trim();
  
  if (cleaned.length > 60) {
    cleaned = cleaned.substring(0, 60) + '...';
  }
  
  return cleaned;
}

// PART 6 OF 6 - Content Comparison, Helpers, and Platform Visibility
// Add after Part 5 - This completes the file

// ===================================================================
// CONTENT COMPARISON
// ===================================================================

async function compareWebsites(target, competitor, targetName, competitorName) {
  const gaps = [];

  // Structural gaps
  gaps.push(...findStructuralGaps(target, competitor, competitorName));
  
  // Topic gaps
  gaps.push(...findTopicGaps(target, competitor, competitorName));
  
  return gaps;
}

function findStructuralGaps(target, competitor, competitorName) {
  const gaps = [];

  // FAQ check
  const targetHasFAQ = target.pages.some(p => p.has_faq);
  const competitorHasFAQ = competitor.pages.some(p => p.has_faq);
  
  if (!targetHasFAQ && competitorHasFAQ) {
    const faqPage = competitor.pages.find(p => p.has_faq);
    gaps.push({
      gap_type: 'structural',
      gap_title: 'Missing FAQ Section',
      gap_description: `Competitor ${competitorName} has a comprehensive FAQ page addressing common customer questions. Your site lacks this critical trust-building element.`,
      severity: 'significant',
      competitors_have_this: [competitorName],
      recommended_action: 'Create a dedicated FAQ page at /faq with 10-15 common questions covering pricing, scheduling, service process, and guarantees.',
      content_type: 'trust_building',
      competitor_example_url: faqPage ? faqPage.url : null,
      estimated_impact: 'high',
      estimated_effort: 'medium'
    });
  }

  // Process page check
  const targetHasProcess = target.pages.some(p => p.has_process);
  const competitorHasProcess = competitor.pages.some(p => p.has_process);
  
  if (!targetHasProcess && competitorHasProcess) {
    const processPage = competitor.pages.find(p => p.has_process);
    gaps.push({
      gap_type: 'structural',
      gap_title: 'Missing Process Explanation Page',
      gap_description: `Competitor ${competitorName} has a dedicated page explaining their service process step-by-step. This helps set customer expectations and builds trust.`,
      severity: 'critical',
      competitors_have_this: [competitorName],
      recommended_action: 'Create /how-it-works page with step-by-step process: 1) Contact/quote, 2) Scheduling, 3) Assessment, 4) Service execution, 5) Follow-up.',
      content_type: 'service_pages',
      competitor_example_url: processPage ? processPage.url : null,
      estimated_impact: 'high',
      estimated_effort: 'medium'
    });
  }

  // Schema markup check
  if (!target.metadata.has_schema && competitor.metadata.has_schema) {
    gaps.push({
      gap_type: 'structural',
      gap_title: 'Missing Schema Markup',
      gap_description: `Competitor ${competitorName} uses schema markup to help search engines understand their business better. This improves visibility in search results.`,
      severity: 'critical',
      competitors_have_this: [competitorName],
      recommended_action: 'Implement LocalBusiness schema markup on homepage including business name, address, phone, hours, services, and rating.',
      content_type: 'technical_seo',
      competitor_example_url: competitor.url,
      estimated_impact: 'high',
      estimated_effort: 'low'
    });
  }

  return gaps;
}

function findTopicGaps(target, competitor, competitorName) {
  const gaps = [];

  // Get topic sets
  const targetTopics = new Set();
  target.pages.forEach(p => p.main_topics.forEach(t => targetTopics.add(t)));
  
  const competitorTopicPages = {};
  competitor.pages.forEach(p => {
    p.main_topics.forEach(t => {
      if (!competitorTopicPages[t]) {
        competitorTopicPages[t] = [];
      }
      competitorTopicPages[t].push(p);
    });
  });

  // Find missing topics
  Object.keys(competitorTopicPages).forEach(topic => {
    if (!targetTopics.has(topic) && competitorTopicPages[topic].length >= 2) {
      const pages = competitorTopicPages[topic];
      const severity = pages.length >= 4 ? 'critical' : pages.length >= 3 ? 'significant' : 'moderate';
      
      gaps.push({
        gap_type: pages.length >= 4 ? 'critical_topic' : 'significant_topic',
        gap_title: `Missing Topic: ${capitalizeWords(topic)}`,
        gap_description: `Competitor ${competitorName} emphasizes "${topic}" across ${pages.length} pages, but your site doesn't cover this topic.`,
        severity,
        competitors_have_this: [competitorName],
        recommended_action: `Add content about "${topic}" to relevant pages or create dedicated content.`,
        content_type: 'website_content',
        competitor_example_url: pages[0].url,
        estimated_impact: severity === 'critical' ? 'high' : 'medium',
        estimated_effort: 'medium'
      });
    }
  });

  return gaps.slice(0, 5); // Limit topic gaps
}

// ===================================================================
// AI-POWERED GAP ANALYSIS (Optional Enhancement)
// ===================================================================

async function aiPoweredGapAnalysis(target, competitors, targetName, apiKey) {
  if (competitors.length === 0) return [];

  const comp = competitors[0];
  
  const prompt = `Compare these two business websites and identify 3 critical content gaps:

TARGET: ${targetName}
- Pages: ${target.pages.length}
- Has FAQ: ${target.pages.some(p => p.has_faq) ? 'Yes' : 'No'}
- Has Process: ${target.pages.some(p => p.has_process) ? 'Yes' : 'No'}
- Has Schema: ${target.metadata.has_schema ? 'Yes' : 'No'}

COMPETITOR: ${comp.info.name}
- Pages: ${comp.content.pages.length}
- Has FAQ: ${comp.content.pages.some(p => p.has_faq) ? 'Yes' : 'No'}
- Has Process: ${comp.content.pages.some(p => p.has_process) ? 'Yes' : 'No'}
- Has Schema: ${comp.content.metadata.has_schema ? 'Yes' : 'No'}

List 3 specific gaps the target should address. Format: Gap - Description - Priority (High/Medium)`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) return [];

    const data = await response.json();
    const text = data.content[0].text;

    const gaps = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      if (line.match(/^\d+\./)) {
        gaps.push({
          gap_type: 'thematic',
          gap_title: line.substring(0, 60),
          gap_description: line,
          severity: line.toLowerCase().includes('high') ? 'critical' : 'significant',
          competitors_have_this: [comp.info.name],
          recommended_action: 'Address this gap based on competitor analysis.',
          content_type: 'website_content',
          competitor_example_url: comp.info.website,
          estimated_impact: 'medium',
          estimated_effort: 'medium'
        });
      }
    });

    return gaps.slice(0, 3);
  } catch (error) {
    console.error('[ERROR] AI gap analysis failed:', error.message);
    return [];
  }
}

// ===================================================================
// PLATFORM VISIBILITY SCORING
// ===================================================================

async function computePlatformVisibility(businessName, businessType, location, apiKeys) {
  const scores = {
    chatgpt: 20,
    claude: 20,
    gemini: 20,
    perplexity: 20
  };
  
  let totalCost = 0.20;
  let queryCount = 2;

  // Simple visibility check (optional)
  const query = `What do you know about ${businessName} in ${location}?`;

  // You can add actual API calls here if needed
  // For now, using placeholder scores

  return {
    scores,
    cost: totalCost,
    queryCount
  };
}

// ===================================================================
// RECOMMENDATIONS & TIMELINE
// ===================================================================

function generateRecommendations(gaps) {
  return gaps.map(gap => ({
    action_title: gap.gap_title,
    action_description: gap.recommended_action,
    priority: gap.severity === 'critical' ? 'high' : gap.severity === 'significant' ? 'medium' : 'low',
    category: gap.content_type,
    fix_instructions: gap.recommended_action,
    estimated_impact: gap.estimated_impact,
    estimated_effort: gap.estimated_effort,
    status: 'pending',
    timeline: gap.severity === 'critical' ? 'immediate' : gap.severity === 'significant' ? 'short_term' : 'long_term',
    example_url: gap.competitor_example_url
  }));
}

function generateImplementationTimeline(gaps) {
  const timeline = {
    immediate: [],
    short_term: [],
    long_term: []
  };

  gaps.forEach(gap => {
    const item = {
      title: gap.gap_title,
      duration: gap.severity === 'critical' ? '1-2 weeks' : 
                gap.severity === 'significant' ? '1-3 months' : '3-6 months',
      priority: gap.severity === 'critical' ? 'high' : gap.severity === 'significant' ? 'medium' : 'low',
      description: gap.recommended_action,
      example_url: gap.competitor_example_url
    };

    if (gap.severity === 'critical') {
      timeline.immediate.push(item);
    } else if (gap.severity === 'significant') {
      timeline.short_term.push(item);
    } else {
      timeline.long_term.push(item);
    }
  });

  return timeline;
}

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

function calculateOverallScore(gaps, platformScores) {
  let score = 100;
  
  gaps.forEach(gap => {
    if (gap.severity === 'critical') score -= 15;
    else if (gap.severity === 'significant') score -= 10;
    else score -= 5;
  });

  const avgPlatformScore = Object.values(platformScores).reduce((a, b) => a + b, 0) / 
                          Math.max(Object.values(platformScores).length, 1);
  
  score = Math.round(score * 0.7 + avgPlatformScore * 0.3);

  return Math.max(0, Math.min(100, score));
}

function extractStrengths(content) {
  const strengths = [];
  
  if (content.pages.some(p => p.has_faq)) {
    strengths.push('Comprehensive FAQ section');
  }
  if (content.pages.some(p => p.has_process)) {
    strengths.push('Clear process explanation');
  }
  if (content.metadata.has_schema) {
    strengths.push('Proper schema markup');
  }
  if (content.pages.some(p => p.has_reviews)) {
    strengths.push('Customer testimonials');
  }
  if (content.pages.length > 10) {
    strengths.push('Comprehensive site structure');
  }
  
  return strengths.length > 0 ? strengths : ['Established online presence'];
}

function createFallbackContent(url, businessName) {
  return {
    url,
    pages: [{
      url,
      title: businessName,
      heading_structure: [],
      main_topics: [],
      word_count: 0,
      has_schema: false,
      has_faq: false,
      has_reviews: false,
      has_process: false
    }],
    navigation: [],
    footer_links: [],
    content_summary: 'Unable to fetch content',
    metadata: {
      title: businessName,
      description: '',
      has_schema: false,
      main_business_type: '',
      location_mentioned: [],
      phone_numbers: [],
      email_addresses: []
    },
    scraped_at: new Date().toISOString()
  };
}

function normalizeUrl(href, baseUrl) {
  try {
    if (href.startsWith('http')) {
      return href;
    }
    const base = new URL(baseUrl);
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function isSameDomain(url1, url2) {
  try {
    const domain1 = new URL(url1).hostname.replace('www.', '');
    const domain2 = new URL(url2).hostname.replace('www.', '');
    return domain1 === domain2;
  } catch {
    return false;
  }
}

function capitalizeWords(str) {
  return str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function fetchWithTimeout(url, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GBP-Analyzer/1.0)' }
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}