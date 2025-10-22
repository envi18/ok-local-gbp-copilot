// railway-backend/services/competitorFinder.js
// COMPLETE WORKING VERSION - Real competitor discovery using Google Custom Search API
// Based on proven Netlify function logic

import axios from 'axios';

/**
 * Find real competitors using AI-generated search terms and Google Custom Search
 * Returns 3-5 validated, relevant competitors
 * 
 * @param {Object} businessAnalysis - AI analysis from businessAnalyzer
 * @param {string} location - Geographic location (e.g., "San Diego, CA")
 * @returns {Promise<Array>} Array of competitor objects
 */
export async function findCompetitorsWithAI(businessAnalysis, location) {
  console.log('🔍 Starting intelligent competitor discovery...');
  console.log(`   Business Type: ${businessAnalysis.business_type}`);
  console.log(`   Location: ${location}`);
  
  const competitors = new Map(); // Use Map to deduplicate by domain
  
  // Get search terms from business analysis or generate fallbacks
  let searchTerms = businessAnalysis.competitor_search_terms || [];
  
  if (searchTerms.length === 0) {
    // Generate fallback search terms
    searchTerms = generateSearchTerms(businessAnalysis.business_type, location);
  }
  
  console.log(`🔎 Using ${searchTerms.length} search queries...`);

  // Execute searches for each term (limit to 3 to control costs)
  for (const searchTerm of searchTerms.slice(0, 3)) {
    try {
      console.log(`   Searching: "${searchTerm}"`);
      
      const results = await executeGoogleSearch(searchTerm, location);
      console.log(`   Found ${results.length} results`);
      
      // Filter and validate each result
      for (const result of results) {
        if (isValidCompetitor(result, businessAnalysis)) {
          const domain = extractDomain(result.link);
          
          // Skip if already added (deduplicate)
          if (!competitors.has(domain)) {
            const competitor = {
              name: extractBusinessName(result.title),
              website: result.link,
              description: result.snippet || '',
              source_query: searchTerm,
              relevance_score: calculateRelevanceScore(result, businessAnalysis)
            };
            
            competitors.set(domain, competitor);
            console.log(`   ✓ Valid: ${competitor.name} (score: ${competitor.relevance_score})`);
          }
        }
      }
      
    } catch (error) {
      console.error(`   ❌ Search failed for "${searchTerm}":`, error.message);
      // Continue with other searches even if one fails
    }
  }

  // Convert Map to Array, sort by relevance, return top 5
  const competitorList = Array.from(competitors.values())
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 5);

  console.log(`✅ Found ${competitorList.length} valid competitors`);
  competitorList.forEach((comp, idx) => {
    console.log(`   ${idx + 1}. ${comp.name} (${comp.website}) - Score: ${comp.relevance_score}`);
  });

  return competitorList;
}

/**
 * Execute Google Custom Search API query
 */
async function executeGoogleSearch(query, location) {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    throw new Error('Google Custom Search API credentials not configured');
  }

  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx: searchEngineId,
        q: query,
        num: 10, // Get 10 results per search
        gl: 'us', // Geographic location
        lr: 'lang_en' // Language restriction
      },
      timeout: 10000 // 10 second timeout
    });

    return response.data.items || [];

  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error('Google Search API rate limit exceeded');
    }
    if (error.response?.status === 403) {
      throw new Error('Google Search API access denied - check API key');
    }
    throw new Error(`Google Search failed: ${error.message}`);
  }
}

/**
 * Generate search terms from business type and location
 */
function generateSearchTerms(businessType, location) {
  const terms = [
    `${businessType} ${location}`,
    `best ${businessType} in ${location}`,
    `top ${businessType} near ${location}`
  ];
  
  return terms;
}

/**
 * Validate if search result is a legitimate competitor
 * Filters out directories, government sites, social media, etc.
 */
function isValidCompetitor(result, businessAnalysis) {
  const url = result.link.toLowerCase();
  const title = result.title.toLowerCase();
  const snippet = (result.snippet || '').toLowerCase();
  
  // FILTER 1: Block government and educational sites
  const blockedDomains = [
    '.gov',
    '.edu',
    '.mil',
    'wikipedia.org',
    'facebook.com',
    'linkedin.com',
    'twitter.com',
    'instagram.com',
    'youtube.com',
    'tiktok.com'
  ];
  
  if (blockedDomains.some(domain => url.includes(domain))) {
    return false;
  }

  // FILTER 2: Block business directories and review sites
  const directoryDomains = [
    'yelp.com',
    'yellowpages.com',
    'bbb.org',
    'mapquest.com',
    'superpages.com',
    'manta.com',
    'chamberofcommerce.com',
    'bizapedia.com',
    'whitepages.com',
    'angi.com',
    'homeadvisor.com',
    'thumbtack.com',
    'indeed.com',
    'glassdoor.com',
    'craigslist.org',
    'apartments.com',
    'zillow.com',
    'trulia.com'
  ];
  
  if (directoryDomains.some(domain => url.includes(domain))) {
    return false;
  }

  // FILTER 3: Block generic/irrelevant terms
  const irrelevantTerms = [
    'support',
    'help center',
    'customer service',
    'contact us',
    'about us',
    'privacy policy',
    'terms of service',
    'login',
    'sign up',
    'register',
    'account',
    'careers',
    'jobs'
  ];
  
  if (irrelevantTerms.some(term => title.includes(term) || snippet.includes(term))) {
    return false;
  }

  // FILTER 4: Block results that are clearly not businesses
  const nonBusinessIndicators = [
    'wikipedia',
    'dictionary',
    'definition',
    'how to',
    'guide to',
    'state of',
    'city of',
    'county of',
    'department of'
  ];
  
  if (nonBusinessIndicators.some(indicator => 
    title.includes(indicator) || snippet.includes(indicator)
  )) {
    return false;
  }

  // FILTER 5: Must have relevance to business type
  const businessType = (businessAnalysis.business_type || '').toLowerCase();
  const businessKeywords = businessType.split(' ');
  
  // At least one keyword from business type should appear in title or snippet
  const hasRelevance = businessKeywords.some(keyword => 
    keyword.length > 3 && (title.includes(keyword) || snippet.includes(keyword))
  );
  
  if (!hasRelevance) {
    return false;
  }

  return true;
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch (error) {
    return url;
  }
}

/**
 * Extract business name from search result title
 */
function extractBusinessName(title) {
  // Remove common suffixes like " | Home", " - Services", etc.
  let name = title
    .split('|')[0]
    .split('-')[0]
    .split('–')[0]
    .split(':')[0]
    .trim();
  
  // Limit length
  if (name.length > 60) {
    name = name.substring(0, 60) + '...';
  }
  
  return name || 'Unknown Business';
}

/**
 * Calculate relevance score for ranking competitors
 */
function calculateRelevanceScore(result, businessAnalysis) {
  let score = 50; // Base score
  
  const url = result.link.toLowerCase();
  const title = result.title.toLowerCase();
  const snippet = (result.snippet || '').toLowerCase();
  const businessType = (businessAnalysis.business_type || '').toLowerCase();
  
  // BOOST: Business type appears in title
  if (title.includes(businessType)) {
    score += 20;
  }
  
  // BOOST: Business type appears in snippet
  if (snippet.includes(businessType)) {
    score += 10;
  }
  
  // BOOST: Location mentioned
  const location = businessAnalysis.location_string || '';
  const locationKeywords = location.toLowerCase().split(/[,\s]+/);
  locationKeywords.forEach(keyword => {
    if (keyword.length > 2 && (title.includes(keyword) || snippet.includes(keyword))) {
      score += 5;
    }
  });
  
  // BOOST: Clean URL structure (e.g., businessname.com not businessname.com/support/page?id=123)
  const pathParts = new URL(url).pathname.split('/').filter(p => p);
  if (pathParts.length <= 1) {
    score += 10;
  }
  
  // BOOST: HTTPS
  if (url.startsWith('https://')) {
    score += 5;
  }
  
  // BOOST: Services mentioned
  const services = businessAnalysis.primary_services || [];
  services.forEach(service => {
    if (snippet.includes(service.toLowerCase())) {
      score += 3;
    }
  });
  
  // PENALTY: Very long titles (often spam)
  if (title.length > 100) {
    score -= 15;
  }
  
  // PENALTY: URL has query parameters (often not main business page)
  if (url.includes('?') || url.includes('&')) {
    score -= 10;
  }
  
  // PENALTY: Too many path segments (deep pages, not homepage)
  if (pathParts.length > 3) {
    score -= 10;
  }

  // Clamp score between 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Test function for debugging
 */
export async function testCompetitorFinder() {
  const testBusinessAnalysis = {
    business_name: 'Clear Junk Removal',
    business_type: 'junk removal service',
    location_string: 'San Diego, CA',
    primary_services: ['junk removal', 'furniture disposal', 'waste hauling'],
    competitor_search_terms: [
      'junk removal services San Diego',
      'furniture removal San Diego',
      'waste hauling San Diego'
    ]
  };

  const competitors = await findCompetitorsWithAI(testBusinessAnalysis, 'San Diego, CA');
  
  console.log('\n🎯 TEST RESULTS:');
  console.log(JSON.stringify(competitors, null, 2));
  
  return competitors;
}