// railway-backend/services/businessAnalyzer.js
// AI-powered universal business analysis using OpenAI GPT-4

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Analyze business using AI to intelligently detect business type, services, and generate search strategies
 * Works for ANY of the 4000+ Google Business Profile categories
 * 
 * @param {Object} websiteData - Extracted website content from ScrapingBee
 * @returns {Promise<Object>} Comprehensive business analysis
 */
export async function analyzeBusinessWithAI(websiteData) {
  console.log('🤖 Starting AI business analysis...');
  
  try {
    // Prepare comprehensive context for AI
    const analysisContext = prepareAnalysisContext(websiteData);
    
    // Call OpenAI GPT-4 for intelligent analysis
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      temperature: 0.3, // Lower temperature for more consistent, factual results
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content: `You are a business analysis expert. Analyze website data and extract accurate business information.

Your task is to intelligently identify:
1. The EXACT business name (not domain, not generic terms)
2. The SPECIFIC business type/industry from 4000+ possible Google Business Profile categories
3. Primary services or products offered
4. Geographic location (city, state, country)
5. Target customer demographics
6. Unique value proposition
7. Strategic search terms for finding similar competitors

CRITICAL RULES:
- Be SPECIFIC with business type (e.g., "residential junk removal service" not just "service company")
- Extract actual business name from branding, not domain names
- Identify real location from addresses, contact info, or service areas
- Generate 3-5 highly targeted competitor search queries
- Return ONLY valid JSON, no markdown formatting`
        },
        {
          role: 'user',
          content: analysisContext
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse AI response
    const aiResponse = completion.choices[0].message.content;
    let businessAnalysis;
    
    try {
      businessAnalysis = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      throw new Error('AI returned invalid JSON format');
    }

    // Validate and enhance the response
    const validatedAnalysis = validateAndEnhanceAnalysis(businessAnalysis, websiteData);
    
    console.log('✅ AI analysis complete:');
    console.log(`   Business: ${validatedAnalysis.business_name}`);
    console.log(`   Type: ${validatedAnalysis.business_type}`);
    console.log(`   Location: ${validatedAnalysis.location_string}`);
    console.log(`   Services: ${validatedAnalysis.primary_services.slice(0, 3).join(', ')}`);
    
    return validatedAnalysis;

  } catch (error) {
    console.error('❌ AI business analysis failed:', error);
    
    // Fallback to basic extraction if AI fails
    console.log('⚠️  Falling back to basic extraction...');
    return fallbackAnalysis(websiteData);
  }
}

/**
 * Prepare comprehensive context for AI analysis
 */
function prepareAnalysisContext(websiteData) {
  // Build a rich context string for the AI
  let context = `Analyze this business website and return a JSON object with the following structure:

{
  "business_name": "Exact business name from branding",
  "business_type": "Specific industry/category (e.g., 'residential junk removal service', 'specialty coffee roaster', 'pediatric dental clinic')",
  "business_description": "One-sentence description of what they do",
  "primary_services": ["service1", "service2", "service3"],
  "location": {
    "city": "City name or null",
    "state": "State/Province or null", 
    "country": "Country or 'United States'"
  },
  "target_market": "Primary customer demographic",
  "unique_value_proposition": "What makes them different from competitors",
  "competitor_search_terms": ["search query 1", "search query 2", "search query 3"],
  "industry_keywords": ["keyword1", "keyword2", "keyword3"],
  "service_area": "Geographic area they serve"
}

WEBSITE DATA:
`;

  // Add extracted data in priority order
  context += `\nURL: ${websiteData.url}`;
  context += `\nDomain: ${websiteData.domain}`;
  context += `\nPage Title: ${websiteData.title}`;
  
  if (websiteData.meta_description) {
    context += `\nMeta Description: ${websiteData.meta_description}`;
  }

  // Schema.org data (very valuable)
  if (websiteData.schema_data && websiteData.schema_data.length > 0) {
    context += `\n\nSchema.org Data:\n${JSON.stringify(websiteData.schema_data, null, 2).substring(0, 1000)}`;
  }

  // Open Graph data
  if (websiteData.og_data && Object.keys(websiteData.og_data).length > 0) {
    context += `\n\nOpen Graph Data:\n${JSON.stringify(websiteData.og_data, null, 2)}`;
  }

  // Headings (important for understanding structure)
  if (websiteData.headings && websiteData.headings.length > 0) {
    const headingText = websiteData.headings
      .slice(0, 10)
      .map(h => `${h.level}: ${h.text}`)
      .join('\n');
    context += `\n\nMain Headings:\n${headingText}`;
  }

  // Services (critical for business type detection)
  if (websiteData.services && websiteData.services.length > 0) {
    context += `\n\nServices/Products Listed:\n${websiteData.services.join('\n')}`;
  }

  // Contact information
  if (websiteData.contact_info) {
    if (websiteData.contact_info.emails.length > 0) {
      context += `\n\nEmail: ${websiteData.contact_info.emails[0]}`;
    }
    if (websiteData.contact_info.phones.length > 0) {
      context += `\nPhone: ${websiteData.contact_info.phones[0]}`;
    }
    if (websiteData.contact_info.addresses.length > 0) {
      context += `\nAddress: ${websiteData.contact_info.addresses[0]}`;
    }
  }

  // About content
  if (websiteData.about_content) {
    context += `\n\nAbout Section:\n${websiteData.about_content.substring(0, 500)}`;
  }

  // Main text content sample
  context += `\n\nMain Content (first 2000 chars):\n${websiteData.text_content.substring(0, 2000)}`;

  return context;
}

/**
 * Validate and enhance AI analysis results
 */
function validateAndEnhanceAnalysis(analysis, websiteData) {
  // Ensure required fields exist
  const enhanced = {
    business_name: analysis.business_name || websiteData.title || websiteData.domain,
    business_type: analysis.business_type || 'business',
    business_description: analysis.business_description || '',
    primary_services: Array.isArray(analysis.primary_services) ? analysis.primary_services : [],
    location: analysis.location || {},
    location_string: formatLocation(analysis.location),
    target_market: analysis.target_market || 'general consumers',
    unique_value_proposition: analysis.unique_value_proposition || '',
    competitor_search_terms: Array.isArray(analysis.competitor_search_terms) ? 
      analysis.competitor_search_terms : [],
    industry_keywords: Array.isArray(analysis.industry_keywords) ? 
      analysis.industry_keywords : [],
    service_area: analysis.service_area || '',
    
    // Add metadata
    confidence_score: calculateConfidenceScore(analysis, websiteData),
    analysis_timestamp: new Date().toISOString()
  };

  // Ensure we have at least some competitor search terms
  if (enhanced.competitor_search_terms.length === 0) {
    enhanced.competitor_search_terms = generateFallbackSearchTerms(
      enhanced.business_type,
      enhanced.location_string
    );
  }

  return enhanced;
}

/**
 * Format location object into readable string
 */
function formatLocation(location) {
  if (!location) return 'United States';
  
  const parts = [];
  if (location.city) parts.push(location.city);
  if (location.state) parts.push(location.state);
  if (parts.length === 0 && location.country) parts.push(location.country);
  
  return parts.length > 0 ? parts.join(', ') : 'United States';
}

/**
 * Calculate confidence score for the analysis
 */
function calculateConfidenceScore(analysis, websiteData) {
  let score = 0;
  
  // Check for high-quality data indicators
  if (analysis.business_name && analysis.business_name !== websiteData.domain) score += 20;
  if (analysis.business_type && analysis.business_type.length > 5) score += 20;
  if (analysis.location && (analysis.location.city || analysis.location.state)) score += 15;
  if (analysis.primary_services && analysis.primary_services.length >= 3) score += 15;
  if (analysis.competitor_search_terms && analysis.competitor_search_terms.length >= 3) score += 15;
  if (websiteData.schema_data && websiteData.schema_data.length > 0) score += 15;
  
  return Math.min(100, score);
}

/**
 * Generate fallback search terms if AI doesn't provide them
 */
function generateFallbackSearchTerms(businessType, location) {
  return [
    `${businessType} in ${location}`,
    `best ${businessType} ${location}`,
    `top ${businessType} near ${location}`
  ];
}

/**
 * Fallback analysis if AI fails completely
 */
function fallbackAnalysis(websiteData) {
  console.log('⚠️  Using fallback analysis method');
  
  // Extract what we can from the data
  const businessName = websiteData.og_data?.title || 
                      websiteData.title || 
                      websiteData.domain;
  
  // Try to determine business type from title/description
  let businessType = 'business';
  const description = (websiteData.meta_description || websiteData.title || '').toLowerCase();
  
  // Simple keyword matching for common business types
  const typeKeywords = {
    'restaurant': ['restaurant', 'dining', 'cafe', 'bistro', 'eatery'],
    'dental clinic': ['dental', 'dentist', 'orthodont'],
    'law firm': ['attorney', 'lawyer', 'legal', 'law firm'],
    'plumbing service': ['plumber', 'plumbing'],
    'auto repair': ['auto repair', 'mechanic', 'car service'],
    'real estate': ['real estate', 'realtor', 'property'],
    'salon': ['salon', 'hair', 'beauty'],
    'gym': ['gym', 'fitness', 'workout']
  };
  
  for (const [type, keywords] of Object.entries(typeKeywords)) {
    if (keywords.some(keyword => description.includes(keyword))) {
      businessType = type;
      break;
    }
  }

  return {
    business_name: businessName,
    business_type: businessType,
    business_description: websiteData.meta_description || '',
    primary_services: websiteData.services || [],
    location: {},
    location_string: 'United States',
    target_market: 'general consumers',
    unique_value_proposition: '',
    competitor_search_terms: [
      `${businessType} near me`,
      `best ${businessType}`,
      `top ${businessType} services`
    ],
    industry_keywords: [businessType],
    service_area: '',
    confidence_score: 30,
    analysis_timestamp: new Date().toISOString(),
    fallback_used: true
  };
}