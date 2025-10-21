// railway-backend/services/competitorFinder.js
// AI-powered competitor discovery using Google Custom Search API

import axios from 'axios';

/**
 * Find real competitors using AI-generated search terms
 * Filters out irrelevant results (government sites, directories, etc.)
 * 
 * @param {Object} businessAnalysis - AI analysis results from businessAnalyzer
 * @param {string} location - Geographic location for search
 * @returns {Promise<Array>} Array of competitor objects
 */
export async function findCompetitorsWithAI(businessAnalysis, location) {
  console.log('🔍 Starting AI-powered competitor discovery...');
  
  const competitors = new Map(); // Use Map to deduplicate
  const searchTerms = businessAnalysis.competitor_search_terms || [];
  
  // Ensure we have search terms
  if (searchTerms.length === 0) {
    searchTerms.push(
      `${businessAnalysis.business_type} in ${location}`,
      `best ${businessAnalysis.business_type} ${location}`,
      `top ${businessAnalysis.business_type} near ${location}`
    );
  }

  console.log(`🔎 Using ${searchTerms.length} search queries...`);

  // Execute searches for each term
  for (const searchTerm of searchTerms.slice(0, 3)) { // Limit to 3 searches to control costs
    try {
      console.log(`   Searching: "${searchTerm}"`);
      
      const results = await executeGoogleSearch(searchTerm, location);
      
      // Process and filter results
      for (const result of results) {
        if (isValidCompetitor(result, businessAnalysis)) {
          const competitor = {
            name: extractBusinessName(result.title),
            website: result.link,
            description: result.snippet || '',
            source_query: searchTerm,
            relevance_score: calculateRelevanceScore(result, businessAnalysis)
          };
          
          // Use website as key to deduplicate
          if (!competitors.has(competitor.website)) {
            competitors.set(competitor.website, competitor);
          }
        }
      }
      
    } catch (error) {
      console.error(`   ❌ Search failed for "${searchTerm}":`, error.message);
      // Continue with other searches
    }
  }

  // Convert Map to Array and sort by relevance
  const competitorList = Array.from(competitors.values())
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 5); // Return top 5 competitors

  console.log(`✅ Found ${competitorList.length} relevant competitors`);
  competitorList.forEach((comp, idx) => {
    console.log(`   ${idx + 1}. ${comp.name} (${comp.website})`);
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
        gl: 'us', // Geographic location (can be made dynamic)
        lr: 'lang_en' // Language restriction
      },
      timeout: 10000
    });

    return response.data.items || [];

  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error('Google Search API rate limit exceeded');
    }
    throw new Error(`Google Search failed: ${error.message}`);
  }
}

/**
 * Validate if search result is a legitimate competitor
 * Filters out government sites, directories, and irrelevant results
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
    'youtube.com'
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
    'craigslist.org'
  ];
  
  if (directoryDomains.some(domain => url.includes(domain))) {
    return false;
  }

  // FILTER 3: Block generic terms that appear in bad results
  const irrelevantTerms = [
    'support',
    'help center',
    'customer service',
    'contact us',
    'about us',
    'privacy policy',
    'terms of service',
    'sitemap',
    'careers',
    'jobs',
    'hiring',
    'blog post',
    'article',
    'news'
  ];
  
  if (irrelevantTerms.some(term => title.includes(term) || snippet.includes(term))) {
    return false;
  }

  // FILTER 4: Must have a real business-like title
  // Titles like "Support" or "State of New Jersey" are invalid
  if (title.length < 5 || title.split(' ').length < 2) {
    return false;
  }

  // FILTER 5: Check for business type relevance
  const businessType = businessAnalysis.business_type.toLowerCase();
  const industryKeywords = businessAnalysis.industry_keywords || [];
  
  // At least one industry keyword should appear in title or snippet
  const hasRelevantKeyword = industryKeywords.some(keyword => 
    title.includes(keyword.toLowerCase()) || 
    snippet.includes(keyword.toLowerCase())
  ) || snippet.includes(businessType);
  
  if (!hasRelevantKeyword && industryKeywords.length > 0) {
    return false;
  }

  return true;
}

/**
 * Extract clean business name from search result title
 */
function extractBusinessName(title) {
  // Remove common title suffixes
  let cleanName = title
    .replace(/\s*[-|–—]\s*.*/g, '') // Remove everything after dash or pipe
    .replace(/\s*\.\.\.\s*$/g, '') // Remove trailing ellipsis
    .replace(/\s+/g, ' ')
    .trim();

  // If name is too short after cleaning, use original
  if (cleanName.length < 3) {
    cleanName = title;
  }

  return cleanName;
}

/**
 * Calculate relevance score for competitor
 * Higher score = more relevant competitor
 */
function calculateRelevanceScore(result, businessAnalysis) {
  let score = 50; // Base score

  const title = result.title.toLowerCase();
  const snippet = (result.snippet || '').toLowerCase();
  const url = result.link.toLowerCase();
  
  // BOOST: Business type match in title
  const businessType = businessAnalysis.business_type.toLowerCase();
  if (title.includes(businessType)) {
    score += 20;
  }

  // BOOST: Industry keywords in content
  const industryKeywords = businessAnalysis.industry_keywords || [];
  const keywordMatches = industryKeywords.filter(keyword =>
    title.includes(keyword.toLowerCase()) || snippet.includes(keyword.toLowerCase())
  ).length;
  score += keywordMatches * 5;

  // BOOST: Location match
  if (businessAnalysis.location) {
    const city = (businessAnalysis.location.city || '').toLowerCase();
    const state = (businessAnalysis.location.state || '').toLowerCase();
    
    if (city && (title.includes(city) || snippet.includes(city))) {
      score += 15;
    }
    if (state && (title.includes(state) || snippet.includes(state))) {
      score += 10;
    }
  }

  // BOOST: Has real domain (not subdomain)
  if (!url.includes('subdomain') && url.split('.').length === 3) {
    score += 10;
  }

  // BOOST: Services mentioned
  const services = businessAnalysis.primary_services || [];
  const serviceMatches = services.filter(service =>
    snippet.includes(service.toLowerCase())
  ).length;
  score += serviceMatches * 3;

  // PENALTY: Very long titles (often spam)
  if (title.length > 100) {
    score -= 15;
  }

  // PENALTY: URL has query parameters (often not main business page)
  if (url.includes('?') || url.includes('&')) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score)); // Clamp between 0-100
}

/**
 * Fetch competitor website content (for future competitive analysis)
 * This would use ScrapingBee to get full competitor website data
 * Keeping it separate to control costs - only fetch top competitors
 */
export async function fetchCompetitorDetails(competitor) {
  // This will be implemented in competitiveAnalyzer.js
  // For now, just return the basic competitor data
  return competitor;
}