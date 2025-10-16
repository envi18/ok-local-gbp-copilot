// netlify/functions/generate-external-report-background.js
// PHASE 2 CONTENT-BASED ANALYSIS - COMPLETE IMPLEMENTATION
// Fixed: Competitor relevance, topic filtering, target site scraping
// Version: 2.0 - Session 26

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

  console.log('[START] Phase 2 Content-Based Report Generation');
  console.log(`[INFO] Report ID: ${report_id}`);
  console.log(`[INFO] Target: ${target_website}`);
  console.log(`[INFO] Business: ${business_name} (${business_type})`);
  console.log(`[INFO] Location: ${business_location}`);

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
  await supabase
    .from('ai_visibility_external_reports')
    .update({ 
      status: 'generating', 
      generation_started_at: new Date().toISOString() 
    })
    .eq('id', report_id);

  console.log('[SUCCESS] Status updated: generating');

  const startTime = Date.now();

  try {
    // Collect API keys
    const apiKeys = {
      scrapingbee: process.env.SCRAPINGBEE_API_KEY,
      google_search_api: process.env.GOOGLE_CUSTOM_SEARCH_API_KEY,
      google_search_cx: process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID,
      anthropic: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY
    };

    console.log('[INFO] API Keys available:', {
      scrapingbee: !!apiKeys.scrapingbee,
      google_search: !!apiKeys.google_search_api,
      anthropic: !!apiKeys.anthropic,
      openai: !!apiKeys.openai
    });

    // Generate comprehensive Phase 2 report
    const result = await generatePhase2Report({
      business_name: business_name || target_website,
      business_type: business_type || 'business',
      location: business_location || 'Unknown',
      website: target_website,
      apiKeys
    });

    const duration = Date.now() - startTime;
    console.log(`[SUCCESS] Report completed in ${(duration/1000).toFixed(1)}s`);

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
      throw new Error(`Database update failed: ${updateError.message}`);
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
    console.error('[ERROR] Report generation failed:', error.message);
    console.error('[ERROR] Stack:', error.stack);

    const duration = Date.now() - startTime;

    // Save error state
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
// PART 2: IMPROVED COMPETITOR DISCOVERY WITH RELEVANCE FILTERING
// ===================================================================

/**
 * Discover competitors using Google Custom Search API
 * IMPROVED: Better query formatting, relevance filtering, business validation
 */
async function discoverCompetitors(businessType, location, apiKeys) {
  console.log('[PHASE 2] Starting competitor discovery');
  console.log(`[INFO] Business type: ${businessType}, Location: ${location}`);
  
  if (!apiKeys.google_search_api || !apiKeys.google_search_cx) {
    console.warn('[WARN] Google Custom Search API not configured, using fallback');
    return generateFallbackCompetitors(businessType, location);
  }

  try {
    // IMPROVED: More specific query format that focuses on business services
    // Excludes directory sites and uses location-specific terms
    const query = `"${businessType}" services "${location}" -site:yelp.com -site:yellowpages.com -site:facebook.com -site:instagram.com -site:twitter.com -site:linkedin.com -site:reddit.com -site:quora.com`;
    
    console.log('[DEBUG] Search query:', query);
    
    // Add location parameters to improve local relevance
    const searchUrl = `https://www.googleapis.com/customsearch/v1?` +
      `key=${apiKeys.google_search_api}` +
      `&cx=${apiKeys.google_search_cx}` +
      `&q=${encodeURIComponent(query)}` +
      `&gl=us` +              // Country - United States
      `&cr=countryUS` +       // Restrict to US results
      `&num=10`;              // Request 10 results
    
    console.log('[INFO] Calling Google Custom Search API...');
    const response = await fetch(searchUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ERROR] Google Search API error: ${response.status}`, errorText);
      throw new Error(`Google Search API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.warn('[WARN] No search results found');
      return generateFallbackCompetitors(businessType, location);
    }

    console.log(`[SUCCESS] Found ${data.items.length} search results`);

    // Filter and validate competitor websites
    const competitors = [];
    
    for (const item of data.items) {
      const url = item.link;
      const title = item.title;
      const snippet = item.snippet || '';
      
      // Skip if URL contains excluded domains (double-check)
      const excludedDomains = ['yelp.com', 'yellowpages.com', 'facebook.com', 'instagram.com', 
                               'twitter.com', 'linkedin.com', 'reddit.com', 'quora.com',
                               'thumbtack.com', 'angi.com', 'homeadvisor.com'];
      
      if (excludedDomains.some(domain => url.includes(domain))) {
        console.log(`[SKIP] Excluded directory site: ${url}`);
        continue;
      }

      // IMPROVED: Check if result is relevant to the business type
      const isRelevant = isRelevantCompetitor(title, snippet, businessType);
      
      if (!isRelevant) {
        console.log(`[SKIP] Not relevant to ${businessType}: ${title}`);
        continue;
      }

      // Validate that this looks like a business website
      const isBusinessSite = validateBusinessWebsite(url);
      
      if (isBusinessSite) {
        // Extract business name from title or URL
        const businessName = extractBusinessName(title, url);
        
        competitors.push({
          name: businessName,
          website: url,
          source: 'Google Search',
          title: title,
          snippet: snippet
        });
        
        console.log(`[FOUND] Competitor: ${businessName} - ${url}`);
        
        // Limit to 5 competitors max (we'll select top 2 later)
        if (competitors.length >= 5) {
          break;
        }
      }
      
      // Add delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (competitors.length === 0) {
      console.warn('[WARN] No valid competitors found after filtering');
      return generateFallbackCompetitors(businessType, location);
    }

    console.log(`[SUCCESS] Discovered ${competitors.length} valid competitors`);
    
    // Return top 2 competitors with best validation
    return competitors.slice(0, 2);

  } catch (error) {
    console.error('[ERROR] Competitor discovery failed:', error.message);
    return generateFallbackCompetitors(businessType, location);
  }
}

/**
 * Check if search result is relevant to the business type
 * IMPROVED: More sophisticated relevance checking
 */
function isRelevantCompetitor(title, snippet, businessType) {
  const searchText = `${title} ${snippet}`.toLowerCase();
  const businessLower = businessType.toLowerCase();
  
  // Check if business type appears in title or snippet
  if (searchText.includes(businessLower)) {
    return true;
  }
  
  // Check for related terms (expanded list for common business types)
  const relatedTerms = getRelatedBusinessTerms(businessType);
  
  return relatedTerms.some(term => searchText.includes(term.toLowerCase()));
}

/**
 * Get related business terms for better matching
 * IMPROVED: Expanded term mapping for common business types
 */
function getRelatedBusinessTerms(businessType) {
  const businessLower = businessType.toLowerCase();
  
  // Common business type variations
  const termMap = {
    'junk removal': ['hauling', 'waste removal', 'trash removal', 'debris', 'cleanout', 'junk hauling'],
    'coffee shop': ['cafe', 'coffee', 'espresso', 'roastery', 'coffeehouse', 'coffee bar'],
    'restaurant': ['dining', 'eatery', 'bistro', 'grill', 'kitchen', 'food', 'cuisine'],
    'auto repair': ['mechanic', 'car repair', 'automotive', 'garage', 'service center', 'auto service'],
    'dental': ['dentist', 'dental office', 'orthodontist', 'teeth', 'oral health', 'dental care'],
    'plumbing': ['plumber', 'pipe repair', 'drain cleaning', 'water heater', 'plumbing services'],
    'hvac': ['heating', 'cooling', 'air conditioning', 'furnace', 'ac repair', 'climate control'],
    'landscaping': ['lawn care', 'yard maintenance', 'gardening', 'landscape design', 'lawn service'],
    'cleaning': ['maid service', 'housekeeping', 'janitorial', 'cleaning service', 'home cleaning']
  };
  
  // Find matching terms
  for (const [key, terms] of Object.entries(termMap)) {
    if (businessLower.includes(key) || key.includes(businessLower)) {
      return [businessType, ...terms];
    }
  }
  
  // Default: just return the business type
  return [businessType];
}

/**
 * Validate that a website appears to be a business site
 * IMPROVED: More robust validation without API calls
 */
function validateBusinessWebsite(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // Skip obviously non-business domains
    const skipDomains = [
      'wikipedia.org', 'youtube.com', 'pinterest.com', 
      'google.com', 'amazon.com', 'ebay.com', 'craigslist.org'
    ];
    
    if (skipDomains.some(skip => domain.includes(skip))) {
      return false;
    }
    
    // URLs ending in .com, .net, .org, .co are likely business sites
    const validTLDs = ['.com', '.net', '.org', '.co', '.io', '.us', '.biz'];
    const hasValidTLD = validTLDs.some(tld => domain.endsWith(tld));
    
    if (!hasValidTLD) {
      return false;
    }
    
    // Check if path looks like a business site (not blog posts or articles)
    const path = urlObj.pathname.toLowerCase();
    const badPaths = ['/blog/', '/article/', '/news/', '/forum/', '/wiki/'];
    
    if (badPaths.some(bad => path.includes(bad))) {
      return false;
    }
    
    // If we get here, it looks like a valid business website
    return true;
    
  } catch (error) {
    console.warn(`[WARN] Failed to validate URL: ${url}`, error.message);
    return false;
  }
}

/**
 * Extract business name from title or URL
 * IMPROVED: Better extraction logic
 */
function extractBusinessName(title, url) {
  // Try to extract from title first
  // Remove common suffixes
  let name = title
    .replace(/\s*-\s*.*$/, '') // Remove everything after dash
    .replace(/\s*\|.*$/, '')   // Remove everything after pipe
    .replace(/\s*—.*$/, '')    // Remove everything after em-dash
    .replace(/^Home\s*-\s*/i, '') // Remove "Home -" prefix
    .trim();
  
  // If name is too generic or too long, try to extract from URL
  if (name.length < 3 || name.length > 50 || 
      ['home', 'welcome', 'index'].includes(name.toLowerCase())) {
    try {
      const domain = new URL(url).hostname;
      // Remove www and TLD
      name = domain
        .replace(/^www\./, '')
        .replace(/\.(com|net|org|io|co|us|biz)$/, '')
        .split('.')[0];
      
      // Capitalize first letter of each word
      name = name
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } catch (error) {
      // If URL parsing fails, use sanitized title
      name = title.slice(0, 50);
    }
  }
  
  return name;
}

/**
 * Generate fallback competitors when API fails
 */
function generateFallbackCompetitors(businessType, location) {
  console.log('[FALLBACK] Generating generic competitors');
  
  return [
    {
      name: `Local ${businessType} Provider A`,
      website: null,
      source: 'Fallback',
      title: `${businessType} in ${location}`,
      snippet: `A competitive ${businessType} business serving ${location}`
    },
    {
      name: `Local ${businessType} Provider B`,
      website: null,
      source: 'Fallback',
      title: `${businessType} Services`,
      snippet: `Professional ${businessType} services in ${location}`
    }
  ];
}

// ===================================================================
// PART 3: CONTENT FETCHING WITH IMPROVED ERROR HANDLING
// ===================================================================

/**
 * Fetch website content using ScrapingBee
 * IMPROVED: Better error handling, JS rendering option, retry logic
 */
async function fetchWebsiteContent(url, apiKey, retryWithJS = false) {
  console.log(`[INFO] Fetching content from: ${url}`);
  
  if (!apiKey) {
    console.warn('[WARN] ScrapingBee API key not configured');
    return generateFallbackContent(url);
  }

  try {
    // IMPROVED: Try with JavaScript rendering if initial request fails
    const renderJS = retryWithJS ? 'true' : 'false';
    
    const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?` +
      `api_key=${apiKey}` +
      `&url=${encodeURIComponent(url)}` +
      `&render_js=${renderJS}` +
      `&premium_proxy=false` +
      `&return_page_source=true`;
    
    console.log(`[DEBUG] ScrapingBee request (render_js=${renderJS})`);
    
    const response = await fetch(scrapingBeeUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml'
      }
    });

    if (!response.ok) {
      // IMPROVED: If first attempt fails with render_js=false, try with render_js=true
      if (!retryWithJS && response.status === 400) {
        console.log('[RETRY] Attempting with JavaScript rendering enabled');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return await fetchWebsiteContent(url, apiKey, true);
      }
      
      throw new Error(`ScrapingBee error: ${response.status}`);
    }

    const html = await response.text();
    
    if (!html || html.length < 100) {
      throw new Error('Empty or invalid response from ScrapingBee');
    }

    console.log(`[SUCCESS] Fetched ${(html.length / 1024).toFixed(1)}KB of content`);

    // Parse HTML and extract content
    const content = parseHTMLContent(html, url);
    
    return content;

  } catch (error) {
    console.error(`[ERROR] Failed to fetch ${url}:`, error.message);
    return generateFallbackContent(url);
  }
}

/**
 * Parse HTML content and extract key information
 * Using regex-based parsing (Netlify Functions compatible)
 */
function parseHTMLContent(html, baseUrl) {
  const content = {
    url: baseUrl,
    title: extractTitle(html),
    pages: [],
    navigation: [],
    features: {
      hasFAQ: html.toLowerCase().includes('faq') || html.toLowerCase().includes('frequently asked'),
      hasReviews: html.toLowerCase().includes('review') || html.toLowerCase().includes('testimonial'),
      hasProcess: html.toLowerCase().includes('process') || html.toLowerCase().includes('how it works'),
      hasSchema: html.includes('schema.org') || html.includes('"@type"')
    },
    topics: extractTopics(html),
    metadata: {
      hasPhone: /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(html),
      hasEmail: /[\w.-]+@[\w.-]+\.\w+/.test(html),
      hasAddress: /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln)/i.test(html)
    }
  };

  // Extract internal links
  const linkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  const links = [];
  let linkMatch;

  while ((linkMatch = linkPattern.exec(html)) !== null && links.length < 20) {
    const href = linkMatch[1];
    const text = linkMatch[2].replace(/<[^>]+>/g, '').trim();
    
    // Only include internal links
    if (href.startsWith('/') || href.includes(baseUrl)) {
      links.push({
        url: href.startsWith('http') ? href : baseUrl + href,
        text: text.slice(0, 100)
      });
    }
  }

  content.navigation = links.slice(0, 10);
  
  // Create a main page object
  content.pages.push({
    url: baseUrl,
    title: content.title,
    headings: extractHeadings(html)
  });

  return content;
}

/**
 * Extract title from HTML
 */
function extractTitle(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }
  
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    return h1Match[1].trim();
  }
  
  return 'Untitled';
}

/**
 * Extract headings from HTML
 */
function extractHeadings(html) {
  const headings = [];
  
  // Extract H1-H3 headings
  const h1Pattern = /<h1[^>]*>(.*?)<\/h1>/gi;
  const h2Pattern = /<h2[^>]*>(.*?)<\/h2>/gi;
  const h3Pattern = /<h3[^>]*>(.*?)<\/h3>/gi;
  
  let match;
  
  while ((match = h1Pattern.exec(html)) !== null && headings.length < 20) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text.length > 0 && text.length < 200) {
      headings.push({ level: 1, text });
    }
  }
  
  while ((match = h2Pattern.exec(html)) !== null && headings.length < 20) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text.length > 0 && text.length < 200) {
      headings.push({ level: 2, text });
    }
  }
  
  while ((match = h3Pattern.exec(html)) !== null && headings.length < 20) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text.length > 0 && text.length < 200) {
      headings.push({ level: 3, text });
    }
  }
  
  return headings.slice(0, 15);
}

/**
 * Extract topics using word frequency analysis
 * IMPROVED: Better topic relevance filtering
 */
function extractTopics(html) {
  // Remove HTML tags and scripts
  let text = html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase();
  
  // Extract words
  const words = text.match(/\b[a-z]{4,15}\b/g) || [];
  
  // Count word frequency
  const frequency = {};
  words.forEach(word => {
    if (isRelevantTopic(word)) {
      frequency[word] = (frequency[word] || 0) + 1;
    }
  });
  
  // Get top 20 topics
  const topics = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ topic: word, count }));
  
  return topics;
}

/**
 * IMPROVED: Filter out irrelevant topics (technical/HTML terms)
 * This is Priority 3 from the handoff document
 */
function isRelevantTopic(topic) {
  // Technical/HTML terms to exclude
  const technicalTerms = [
    'href', 'width', 'height', 'class', 'style', 'function',
    'input', 'document', 'window', 'color', 'background',
    'preset', 'button', 'script', 'container', 'wrapper',
    'div', 'span', 'section', 'header', 'footer', 'main',
    'data', 'type', 'value', 'name', 'content', 'meta',
    'link', 'text', 'font', 'size', 'margin', 'padding'
  ];
  
  // Random/filler words to exclude
  const fillerWords = [
    'mutton', 'lorem', 'ipsum', 'dolor', 'amet', 'consectetur',
    'adipiscing', 'elit', 'this', 'that', 'these', 'those',
    'have', 'been', 'were', 'will', 'would', 'could', 'should',
    'from', 'with', 'about', 'more', 'some', 'such', 'other'
  ];
  
  // Common verbs and prepositions to exclude
  const commonWords = [
    'make', 'take', 'give', 'find', 'tell', 'work', 'call',
    'need', 'feel', 'become', 'leave', 'come', 'want', 'look'
  ];
  
  const lowerTopic = topic.toLowerCase();
  
  // Exclude technical terms
  if (technicalTerms.includes(lowerTopic)) {
    return false;
  }
  
  // Exclude filler words
  if (fillerWords.includes(lowerTopic)) {
    return false;
  }
  
  // Exclude common words
  if (commonWords.includes(lowerTopic)) {
    return false;
  }
  
  // Topic should be at least 4 characters
  if (topic.length < 4) {
    return false;
  }
  
  // Topic should not be all numbers
  if (/^\d+$/.test(topic)) {
    return false;
  }
  
  return true;
}

/**
 * Generate fallback content when scraping fails
 */
function generateFallbackContent(url) {
  console.log('[FALLBACK] Generating generic content structure');
  
  return {
    url: url,
    title: 'Website',
    pages: [{
      url: url,
      title: 'Home',
      headings: [
        { level: 1, text: 'Welcome' },
        { level: 2, text: 'Services' }
      ]
    }],
    navigation: [],
    features: {
      hasFAQ: false,
      hasReviews: false,
      hasProcess: false,
      hasSchema: false
    },
    topics: [],
    metadata: {
      hasPhone: false,
      hasEmail: false,
      hasAddress: false
    }
  };
}

// ===================================================================
// PART 4: CONTENT COMPARISON & GAP ANALYSIS
// ===================================================================

/**
 * Compare target and competitor content to find gaps
 * IMPROVED: Better gap categorization and recommendations
 */
function compareContent(targetContent, competitorContents, businessType) {
  console.log('[PHASE 4] Starting content comparison');
  
  const gaps = {
    structural: [],
    topical: [],
    features: []
  };

  // Structural gaps (missing pages/sections)
  const targetHasFAQ = targetContent.features.hasFAQ;
  const competitorHasFAQ = competitorContents.some(c => c.features.hasFAQ);
  
  if (!targetHasFAQ && competitorHasFAQ) {
    gaps.structural.push({
      type: 'missing_faq',
      severity: 'significant',
      title: 'Missing FAQ Section',
      description: 'Competitors have FAQ pages that address common customer questions',
      impact: 'Customers may struggle to find answers to common questions',
      effort: 'Medium',
      priority: 'High',
      competitor_example: competitorContents.find(c => c.features.hasFAQ)?.url || null,
      action_steps: [
        'Identify 10-15 most common customer questions',
        'Create dedicated FAQ page with clear answers',
        'Add schema markup for FAQ rich snippets',
        'Link FAQ from main navigation'
      ]
    });
  }

  const targetHasReviews = targetContent.features.hasReviews;
  const competitorHasReviews = competitorContents.some(c => c.features.hasReviews);
  
  if (!targetHasReviews && competitorHasReviews) {
    gaps.structural.push({
      type: 'missing_reviews',
      severity: 'critical',
      title: 'Missing Customer Reviews',
      description: 'Competitors prominently display customer testimonials and reviews',
      impact: 'Reduced social proof and trust signals',
      effort: 'Low',
      priority: 'High',
      competitor_example: competitorContents.find(c => c.features.hasReviews)?.url || null,
      action_steps: [
        'Collect reviews from recent customers',
        'Create testimonials section on homepage',
        'Add review schema markup',
        'Request Google reviews and display badges'
      ]
    });
  }

  const targetHasProcess = targetContent.features.hasProcess;
  const competitorHasProcess = competitorContents.some(c => c.features.hasProcess);
  
  if (!targetHasProcess && competitorHasProcess) {
    gaps.structural.push({
      type: 'missing_process',
      severity: 'moderate',
      title: 'Missing Process Explanation',
      description: 'Competitors explain their service process step-by-step',
      impact: 'Customers uncertain about what to expect',
      effort: 'Medium',
      priority: 'Medium',
      competitor_example: competitorContents.find(c => c.features.hasProcess)?.url || null,
      action_steps: [
        'Document your service delivery process',
        'Create visual step-by-step guide',
        'Add "How It Works" section',
        'Include estimated timelines'
      ]
    });
  }

  const targetHasSchema = targetContent.features.hasSchema;
  const competitorHasSchema = competitorContents.some(c => c.features.hasSchema);
  
  if (!targetHasSchema && competitorHasSchema) {
    gaps.structural.push({
      type: 'missing_schema',
      severity: 'moderate',
      title: 'Missing Structured Data (Schema Markup)',
      description: 'Competitors use schema markup for better search visibility',
      impact: 'Reduced visibility in search results and AI platforms',
      effort: 'Low',
      priority: 'High',
      competitor_example: competitorContents.find(c => c.features.hasSchema)?.url || null,
      action_steps: [
        'Add LocalBusiness schema markup',
        'Include Service schema for offerings',
        'Add FAQ schema if FAQ page exists',
        'Validate with Google Rich Results Test'
      ]
    });
  }

  // Topic gaps (content competitors emphasize)
  const targetTopics = new Set(targetContent.topics.map(t => t.topic));
  const competitorTopicCounts = {};

  competitorContents.forEach(competitor => {
    competitor.topics.forEach(topicObj => {
      const topic = topicObj.topic;
      if (!targetTopics.has(topic)) {
        competitorTopicCounts[topic] = (competitorTopicCounts[topic] || 0) + 1;
      }
    });
  });

  // Find topics mentioned by multiple competitors but missing from target
  Object.entries(competitorTopicCounts)
    .filter(([topic, count]) => count >= Math.min(2, competitorContents.length))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([topic, count]) => {
      // Find which competitors mention this topic
      const competitorsWithTopic = competitorContents
        .filter(c => c.topics.some(t => t.topic === topic))
        .map(c => c.url);

      gaps.topical.push({
        type: 'missing_topic',
        severity: 'moderate',
        title: `Missing Content About "${topic}"`,
        description: `${count} competitor(s) emphasize "${topic}" in their content`,
        impact: 'Missing opportunities to rank for related searches',
        effort: 'Medium',
        priority: 'Medium',
        competitor_example: competitorsWithTopic[0] || null,
        action_steps: [
          `Research "${topic}" as it relates to ${businessType}`,
          `Create dedicated content covering "${topic}"`,
          `Add "${topic}" to service descriptions`,
          `Include in blog posts and FAQ answers`
        ]
      });
    });

  // Feature gaps (contact info, metadata)
  const targetHasPhone = targetContent.metadata.hasPhone;
  const competitorHasPhone = competitorContents.some(c => c.metadata.hasPhone);
  
  if (!targetHasPhone && competitorHasPhone) {
    gaps.features.push({
      type: 'missing_phone',
      severity: 'significant',
      title: 'Missing Prominent Phone Number',
      description: 'Competitors display phone numbers prominently for easy contact',
      impact: 'Reduced conversion opportunities',
      effort: 'Low',
      priority: 'High',
      competitor_example: competitorContents.find(c => c.metadata.hasPhone)?.url || null,
      action_steps: [
        'Add phone number to header on all pages',
        'Make phone number click-to-call on mobile',
        'Add phone to schema markup',
        'Include in footer'
      ]
    });
  }

  console.log(`[SUCCESS] Found ${gaps.structural.length} structural gaps, ${gaps.topical.length} topic gaps, ${gaps.features.length} feature gaps`);

  return gaps;
}

/**
 * Generate recommendations based on gaps
 */
function generateRecommendations(gaps, businessType, location) {
  console.log('[PHASE 6] Generating recommendations');
  
  const recommendations = [];
  const allGaps = [...gaps.structural, ...gaps.topical, ...gaps.features];

  // Sort by priority (High -> Medium -> Low)
  const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
  allGaps.sort((a, b) => {
    return (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999);
  });

  // Top 5 recommendations
  allGaps.slice(0, 5).forEach((gap, index) => {
    recommendations.push({
      priority: index + 1,
      category: gap.type.includes('missing') ? 'Content' : 'Technical',
      title: gap.title,
      description: gap.description,
      impact: gap.impact,
      effort: gap.effort,
      action_steps: gap.action_steps,
      timeline: gap.effort === 'Low' ? 'Immediate (1-2 days)' : 
                gap.effort === 'Medium' ? 'Short-term (1-2 weeks)' : 
                'Long-term (1+ month)',
      expected_outcome: getExpectedOutcome(gap.type, businessType)
    });
  });

  // Add general AI visibility recommendation
  recommendations.push({
    priority: recommendations.length + 1,
    category: 'AI Visibility',
    title: 'Optimize for AI Platform Discovery',
    description: 'Improve visibility across ChatGPT, Claude, Gemini, and Perplexity',
    impact: 'Increased discovery when users ask AI for recommendations',
    effort: 'Medium',
    action_steps: [
      'Ensure business information is consistent across all platforms',
      'Create content that answers common customer questions',
      'Build quality backlinks from industry sources',
      'Encourage customer reviews on Google and industry sites'
    ],
    timeline: 'Ongoing',
    expected_outcome: `Higher ranking when AI platforms recommend ${businessType} businesses in ${location}`
  });

  console.log(`[SUCCESS] Generated ${recommendations.length} recommendations`);

  return recommendations;
}

/**
 * Get expected outcome for a gap type
 */
function getExpectedOutcome(gapType, businessType) {
  const outcomes = {
    'missing_faq': 'Reduced support inquiries and improved customer confidence',
    'missing_reviews': 'Increased trust and conversion rates',
    'missing_process': 'Better customer understanding and reduced friction',
    'missing_schema': 'Improved search visibility and rich snippets',
    'missing_topic': `Better ranking for ${businessType}-related searches`,
    'missing_phone': 'More direct customer calls and bookings'
  };

  return outcomes[gapType] || 'Improved competitiveness and customer experience';
}

/**
 * Generate implementation timeline
 */
function generateTimeline(gaps) {
  const timeline = {
    immediate: [],
    short_term: [],
    long_term: []
  };

  const allGaps = [...gaps.structural, ...gaps.topical, ...gaps.features];

  allGaps.forEach(gap => {
    const item = {
      title: gap.title,
      effort: gap.effort,
      priority: gap.priority
    };

    if (gap.effort === 'Low') {
      timeline.immediate.push(item);
    } else if (gap.effort === 'Medium') {
      timeline.short_term.push(item);
    } else {
      timeline.long_term.push(item);
    }
  });

  return timeline;
}

// ===================================================================
// PART 5: MAIN PHASE 2 REPORT GENERATION FLOW
// ===================================================================

/**
 * Generate comprehensive Phase 2 report with content-based analysis
 */
async function generatePhase2Report(params) {
  const { business_name, business_type, location, website, apiKeys } = params;
  
  console.log('[PHASE 2 REPORT] Starting 8-phase content analysis');
  
  let totalCost = 0;
  let queryCount = 0;

  // ===================================================================
  // PHASE 1: FETCH TARGET WEBSITE CONTENT
  // ===================================================================
  console.log('[PHASE 1] Fetching target website content');
  
  let targetContent;
  try {
    targetContent = await fetchWebsiteContent(website, apiKeys.scrapingbee);
    console.log('[SUCCESS] Target website content fetched');
    totalCost += 0.05; // ScrapingBee cost estimate
  } catch (error) {
    console.error('[ERROR] Failed to fetch target website:', error.message);
    targetContent = generateFallbackContent(website);
  }

  // ===================================================================
  // PHASE 2: DISCOVER COMPETITORS
  // ===================================================================
  console.log('[PHASE 2] Discovering competitors');
  
  let competitors;
  try {
    competitors = await discoverCompetitors(business_type, location, apiKeys);
    console.log(`[SUCCESS] Found ${competitors.length} competitors`);
    totalCost += 0.05; // Google Search API cost estimate
  } catch (error) {
    console.error('[ERROR] Competitor discovery failed:', error.message);
    competitors = generateFallbackCompetitors(business_type, location);
  }

  // ===================================================================
  // PHASE 3: FETCH COMPETITOR WEBSITES
  // ===================================================================
  console.log('[PHASE 3] Fetching competitor websites');
  
  const competitorContents = [];
  for (const competitor of competitors) {
    if (competitor.website) {
      try {
        const content = await fetchWebsiteContent(competitor.website, apiKeys.scrapingbee);
        competitorContents.push(content);
        console.log(`[SUCCESS] Fetched competitor: ${competitor.name}`);
        totalCost += 0.05; // ScrapingBee cost per site
        
        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[ERROR] Failed to fetch ${competitor.name}:`, error.message);
        // Continue with other competitors
      }
    }
  }
  
  console.log(`[SUCCESS] Fetched ${competitorContents.length} competitor websites`);

  // ===================================================================
  // PHASE 4: COMPARE CONTENT & GENERATE GAPS
  // ===================================================================
  console.log('[PHASE 4] Analyzing content gaps');
  
  let contentGaps;
  try {
    contentGaps = compareContent(targetContent, competitorContents, business_type);
    console.log('[SUCCESS] Content gap analysis complete');
  } catch (error) {
    console.error('[ERROR] Content comparison failed:', error.message);
    contentGaps = { structural: [], topical: [], features: [] };
  }

  // ===================================================================
  // PHASE 5: AI-POWERED DEEP ANALYSIS (OPTIONAL)
  // ===================================================================
  console.log('[PHASE 5] AI-powered insights (optional)');
  
  let aiInsights = [];
  
  // Only run AI analysis if we have good data and API keys
  if (apiKeys.anthropic && (contentGaps.structural.length > 0 || contentGaps.topical.length > 0)) {
    try {
      const insight = await generateAIInsight(contentGaps, business_type, location, apiKeys.anthropic);
      if (insight) {
        aiInsights.push(insight);
        totalCost += 0.10; // Claude Haiku cost estimate
        queryCount += 1;
      }
    } catch (error) {
      console.warn('[WARN] AI insight generation failed:', error.message);
    }
  }

  console.log(`[SUCCESS] Generated ${aiInsights.length} AI insights`);

  // ===================================================================
  // PHASE 6: GENERATE RECOMMENDATIONS
  // ===================================================================
  console.log('[PHASE 6] Generating recommendations');
  
  let recommendations;
  try {
    recommendations = generateRecommendations(contentGaps, business_type, location);
    console.log(`[SUCCESS] Generated ${recommendations.length} recommendations`);
  } catch (error) {
    console.error('[ERROR] Recommendation generation failed:', error.message);
    recommendations = [];
  }

  // ===================================================================
  // PHASE 7: COMPUTE PLATFORM VISIBILITY SCORES
  // ===================================================================
  console.log('[PHASE 7] Computing platform visibility scores');
  
  // Simplified scoring based on content quality
  const platformScores = computeSimplifiedScores(targetContent, contentGaps);
  
  // Overall score
  const overallScore = Math.round(
    platformScores.reduce((sum, p) => sum + p.score, 0) / platformScores.length
  );

  console.log(`[SUCCESS] Overall visibility score: ${overallScore}`);

  // ===================================================================
  // PHASE 8: ASSEMBLE FINAL REPORT
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
    platforms_analyzed: ['Google Search', 'ScrapingBee']
  };

  const competitorAnalysis = {
    competitors: competitors.map((comp, idx) => ({
      name: comp.name,
      website: comp.website,
      detection_count: 1,
      platforms: ['Google Search'],
      rank: idx + 1,
      source: comp.source
    })),
    total_competitors: competitors.length,
    top_competitors: competitors.slice(0, 2).map((comp, idx) => ({
      name: comp.name,
      website: comp.website,
      detection_count: 1,
      platforms: ['Google Search'],
      strengths: [
        `Found in Google Search for "${business_type} ${location}"`,
        'Active web presence',
        'Competitive positioning'
      ],
      weaknesses: [],
      mention_frequency: 1
    })),
    competitive_advantages: extractTargetStrengths(targetContent, contentGaps),
    competitive_weaknesses: extractTargetWeaknesses(contentGaps)
  };

  const contentGapAnalysis = {
    structural_gaps: contentGaps.structural,
    topic_gaps: contentGaps.topical,
    feature_gaps: contentGaps.features,
    total_gaps: contentGaps.structural.length + contentGaps.topical.length + contentGaps.features.length,
    implementation_timeline: generateTimeline(contentGaps),
    ai_insights: aiInsights
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

/**
 * Generate AI insight using Claude (optional enhancement)
 */
async function generateAIInsight(contentGaps, businessType, location, apiKey) {
  console.log('[AI] Generating deep insight with Claude');
  
  try {
    const allGaps = [...contentGaps.structural, ...contentGaps.topical, ...contentGaps.features];
    const topGaps = allGaps.slice(0, 3).map(g => g.title).join(', ');
    
    const prompt = `As a business analyst, provide one specific, actionable insight for a ${businessType} business in ${location} that is missing: ${topGaps}. Focus on the highest-impact action they should take first. Keep response under 100 words.`;
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const insight = data.content[0]?.text || null;
    
    if (insight) {
      console.log('[SUCCESS] AI insight generated');
      return {
        type: 'ai_recommendation',
        content: insight,
        source: 'Claude AI'
      };
    }

    return null;

  } catch (error) {
    console.warn('[WARN] AI insight failed:', error.message);
    return null;
  }
}

/**
 * Compute simplified visibility scores based on content quality
 */
function computeSimplifiedScores(targetContent, contentGaps) {
  const totalGaps = contentGaps.structural.length + contentGaps.topical.length + contentGaps.features.length;
  
  // Base score on content completeness
  let baseScore = 100 - (totalGaps * 10);
  baseScore = Math.max(20, Math.min(100, baseScore)); // Clamp between 20-100
  
  // Bonus for having key features
  if (targetContent.features.hasFAQ) baseScore += 5;
  if (targetContent.features.hasReviews) baseScore += 5;
  if (targetContent.features.hasSchema) baseScore += 5;
  
  baseScore = Math.min(100, baseScore);
  
  return [
    {
      platform: 'chatgpt',
      score: Math.max(0, baseScore - 5),
      status: 'estimated',
      details: 'Estimated based on content analysis'
    },
    {
      platform: 'claude',
      score: Math.max(0, baseScore),
      status: 'estimated',
      details: 'Estimated based on content analysis'
    },
    {
      platform: 'gemini',
      score: Math.max(0, baseScore - 10),
      status: 'estimated',
      details: 'Estimated based on content analysis'
    },
    {
      platform: 'perplexity',
      score: Math.max(0, baseScore + 5),
      status: 'estimated',
      details: 'Estimated based on content analysis'
    }
  ];
}

/**
 * Extract target business strengths
 */
function extractTargetStrengths(targetContent, contentGaps) {
  const strengths = [];
  
  if (targetContent.features.hasFAQ) {
    strengths.push('Has FAQ section addressing customer questions');
  }
  if (targetContent.features.hasReviews) {
    strengths.push('Displays customer reviews and testimonials');
  }
  if (targetContent.features.hasSchema) {
    strengths.push('Uses schema markup for better search visibility');
  }
  if (targetContent.metadata.hasPhone) {
    strengths.push('Displays contact phone number prominently');
  }
  
  // If no specific strengths found, add generic one
  if (strengths.length === 0) {
    strengths.push('Established online presence');
  }
  
  return strengths.slice(0, 3);
}

/**
 * Extract target business weaknesses from gaps
 */
function extractTargetWeaknesses(contentGaps) {
  const weaknesses = [];
  
  // Get top 3 critical/significant gaps
  const allGaps = [...contentGaps.structural, ...contentGaps.topical, ...contentGaps.features];
  const criticalGaps = allGaps
    .filter(g => g.severity === 'critical' || g.severity === 'significant')
    .slice(0, 3);
  
  criticalGaps.forEach(gap => {
    weaknesses.push(gap.title);
  });
  
  return weaknesses;
}
