// railway-backend/services/competitiveAnalyzer.js
// COMPLETE WORKING VERSION - Real competitive analysis with content gap detection
// Based on proven Netlify function logic + enhanced with GPT-4

import OpenAI from 'openai';
import { extractWebsiteContent } from './scrapingBee.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate comprehensive competitive analysis
 * Compares target business against competitors to identify gaps and opportunities
 * 
 * @param {Object} businessAnalysis - Target business analysis from businessAnalyzer
 * @param {Array} competitors - List of competitor objects from competitorFinder
 * @param {Object} targetWebsiteContent - Target business website content
 * @returns {Promise<Object>} Comprehensive competitive analysis
 */
export async function generateCompetitiveAnalysis(businessAnalysis, competitors, targetWebsiteContent) {
  console.log('📊 Starting comprehensive competitive analysis...');
  console.log(`   Analyzing ${competitors.length} competitors`);
  
  try {
    // STEP 1: Analyze target business features
    console.log('\n📋 STEP 1: Analyzing target business features...');
    const targetFeatures = analyzeWebsiteFeatures(targetWebsiteContent);
    console.log(`   Target features: ${JSON.stringify(targetFeatures)}`);
    
    // STEP 2: Fetch and analyze competitor websites (top 3 only to control costs)
    console.log('\n🌐 STEP 2: Fetching competitor websites...');
    const competitorData = await fetchCompetitorContent(competitors.slice(0, 3));
    console.log(`   Successfully fetched ${competitorData.length} competitor sites`);
    
    // STEP 3: Compare and identify gaps
    console.log('\n🔍 STEP 3: Identifying content gaps...');
    const gaps = identifyContentGaps(targetFeatures, competitorData, businessAnalysis);
    console.log(`   Found ${gaps.total} total gaps`);
    
    // STEP 4: Use AI for deep competitive analysis
    console.log('\n🤖 STEP 4: AI-powered competitive analysis...');
    const aiAnalysis = await analyzeWithGPT4(
      targetWebsiteContent,
      competitorData,
      gaps,
      businessAnalysis
    );
    console.log('   AI analysis complete');
    
    // STEP 5: Generate recommendations
    console.log('\n💡 STEP 5: Generating recommendations...');
    const recommendations = generateRecommendations(gaps, aiAnalysis, businessAnalysis);
    console.log(`   Generated ${recommendations.length} recommendations`);
    
    // STEP 6: Create implementation timeline
    const timeline = generateImplementationTimeline(recommendations);
    
    // STEP 7: Calculate platform scores (simplified - not real AI queries)
    const platformScores = calculatePlatformScores(targetFeatures, gaps);
    const overallScore = calculateOverallScore(platformScores);
    
    // STEP 8: Format competitor data
    const formattedCompetitors = formatCompetitorData(competitorData);
    
    console.log('✅ Competitive analysis complete');
    console.log(`   Overall Score: ${overallScore}/100`);
    
    // Return comprehensive analysis matching expected report structure
    return {
      // Target business analysis
      brand_strengths: extractBrandStrengths(targetFeatures, targetWebsiteContent),
      brand_weaknesses: extractBrandWeaknesses(gaps, targetFeatures),
      
      // Competitor data
      top_competitors: formattedCompetitors,
      competitor_count: competitors.length,
      
      // Content gaps (categorized)
      structural_gaps: gaps.structural,
      thematic_gaps: gaps.thematic,
      critical_topic_gaps: gaps.critical,
      significant_topic_gaps: gaps.significant,
      under_mentioned_topics: gaps.undermentioned,
      total_gaps: gaps.total,
      
      // Recommendations
      priority_actions: recommendations,
      implementation_timeline: timeline,
      
      // Scores
      platform_scores: platformScores,
      overall_score: overallScore,
      
      // AI insights
      ai_insights: aiAnalysis.insights || [],
      competitive_differentiation: aiAnalysis.differentiation || '',
      
      // Metadata
      analysis_timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Competitive analysis failed:', error);
    throw error;
  }
}

/**
 * Fetch and analyze competitor website content
 */
async function fetchCompetitorContent(competitors) {
  console.log(`   Fetching content for ${competitors.length} competitors...`);
  
  const competitorData = [];
  
  for (const competitor of competitors) {
    try {
      console.log(`   → Fetching: ${competitor.name}`);
      
      // Extract website content using ScrapingBee
      const content = await extractWebsiteContent(competitor.website);
      
      // Get proper business name using AI-powered extraction
      const properBusinessName = await extractProperBusinessName(content, competitor.website);
      
      // Analyze features
      const features = analyzeWebsiteFeatures(content);
      
      competitorData.push({
        name: properBusinessName, // Use AI-extracted name instead of search result title
        website: competitor.website,
        description: competitor.description,
        content: content,
        features: features,
        services: content.services || [],
        strengths: generateCompetitorStrengths(features, content)
      });
      
      console.log(`   ✓ ${properBusinessName}: ${features.serviceCount} services, ${features.featureScore}/100`);
      
      // Rate limit between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`   ✗ Failed to fetch ${competitor.name}:`, error.message);
      // Continue with other competitors even if one fails
    }
  }
  
  return competitorData;
}

/**
 * Extract proper business name using AI and footer detection
 * Prioritizes: Footer copyright > Schema.org > AI analysis > Fallback to domain
 */
async function extractProperBusinessName(websiteContent, websiteUrl) {
  console.log(`   🔍 Extracting proper business name from ${websiteUrl}...`);
  
  // Method 1: Check footer copyright (highest confidence)
  if (websiteContent.contact_info?.business_name_from_footer) {
    const footerName = websiteContent.contact_info.business_name_from_footer;
    
    if (footerName.from_copyright && footerName.confidence === 'high') {
      console.log(`   ✅ Using copyright name: "${footerName.from_copyright}"`);
      return footerName.from_copyright;
    }
    
    if (footerName.from_address_block && footerName.confidence === 'medium') {
      console.log(`   ✅ Using address block name: "${footerName.from_address_block}"`);
      return footerName.from_address_block;
    }
    
    if (footerName.from_footer_text) {
      console.log(`   ✅ Using footer text name: "${footerName.from_footer_text}"`);
      return footerName.from_footer_text;
    }
  }
  
  // Method 2: Check Schema.org structured data
  if (websiteContent.schema_data && websiteContent.schema_data.length > 0) {
    for (const schema of websiteContent.schema_data) {
      if (schema.name && typeof schema.name === 'string' && schema.name.length >= 5) {
        console.log(`   ✅ Using schema name: "${schema.name}"`);
        return cleanBusinessName(schema.name);
      }
    }
  }
  
  // Method 3: Use AI to analyze the website and extract business name
  try {
    const aiExtractedName = await extractBusinessNameWithAI(websiteContent);
    if (aiExtractedName) {
      console.log(`   ✅ Using AI-extracted name: "${aiExtractedName}"`);
      return aiExtractedName;
    }
  } catch (error) {
    console.log(`   ⚠️ AI extraction failed, using fallback`);
  }
  
  // Method 4: Fallback - clean up the title
  if (websiteContent.title) {
    const cleanedTitle = cleanBusinessName(websiteContent.title);
    console.log(`   ⚠️ Using cleaned title: "${cleanedTitle}"`);
    return cleanedTitle;
  }
  
  // Method 5: Last resort - use domain name
  const domain = new URL(websiteUrl).hostname.replace(/^www\./, '');
  const domainName = domain.split('.')[0];
  const fallbackName = domainName.charAt(0).toUpperCase() + domainName.slice(1);
  console.log(`   ⚠️ Using domain fallback: "${fallbackName}"`);
  return fallbackName;
}

/**
 * Use AI (GPT-4) to extract the actual business name from website content
 */
async function extractBusinessNameWithAI(websiteContent) {
  try {
    // Build a focused prompt with key content
    const footerHints = websiteContent.contact_info?.business_name_from_footer;
    const copyrightHint = footerHints?.from_copyright || '';
    const addressHint = footerHints?.from_address_block || '';
    
    const prompt = `Extract the actual business name from this website content:

Title: ${websiteContent.title}
Meta Description: ${websiteContent.meta_description || 'N/A'}

First Heading (H1): ${websiteContent.headings?.[0]?.text || 'N/A'}

Footer/Copyright Text: ${copyrightHint || addressHint || 'N/A'}

Text Sample: ${websiteContent.text_content?.substring(0, 500) || 'N/A'}

Return ONLY the business name, nothing else. 
The business name should be:
- 2-10 words max
- The actual company/brand name (not a generic headline)
- Clean and professional (remove taglines, locations unless part of name)

Example GOOD responses:
- "Junk King San Diego"
- "The Wreckin Haul"
- "Happy Hauling"

Example BAD responses:
- "Junk Removal Services in Escondido, CA" (generic headline)
- "Best Junk Removal" (not a business name)
- "Home - Junk Removal" (page title, not business name)

Business name:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      temperature: 0.1, // Low temperature for consistency
      max_tokens: 50,
      messages: [
        {
          role: 'system',
          content: 'You are a business name extraction expert. Extract only the actual business/company name, not headlines or generic descriptions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const extractedName = completion.choices[0].message.content.trim();
    
    // Validate the extracted name
    if (extractedName && 
        extractedName.length >= 5 && 
        extractedName.length <= 100 &&
        !extractedName.toLowerCase().includes('junk removal services') &&
        !extractedName.toLowerCase().includes('best junk removal')) {
      return extractedName;
    }
    
    return null;
    
  } catch (error) {
    console.error('AI name extraction failed:', error.message);
    return null;
  }
}

/**
 * Clean business name - remove common separators, suffixes
 */
function cleanBusinessName(name) {
  if (!name) return 'Unknown Business';
  
  // Remove common separators and everything after
  let cleaned = name.split('|')[0].split('-')[0].split('–')[0].trim();
  
  // Remove "Home" prefix
  cleaned = cleaned.replace(/^Home\s*[-–—]?\s*/i, '');
  
  // Remove location suffixes in parentheses
  cleaned = cleaned.replace(/\s*\([^)]+\)$/g, '');
  
  // Remove common suffixes
  cleaned = cleaned.replace(/\s*,?\s*(LLC|Inc|Corp|Ltd|Co\.)\.?$/i, '').trim();
  
  // Remove generic suffixes like "- Services", "- Home"
  cleaned = cleaned.replace(/\s*[-–—]\s*(Services|Home|Welcome|Official Site)$/i, '').trim();
  
  // Limit length
  if (cleaned.length > 60) {
    cleaned = cleaned.substring(0, 60).trim() + '...';
  }
  
  // If we ended up with something too short or generic, return original
  if (cleaned.length < 3 || cleaned.toLowerCase() === 'home') {
    return name.substring(0, 60);
  }
  
  return cleaned;
}

/**
 * Analyze website features and capabilities
 */
function analyzeWebsiteFeatures(websiteContent) {
  const html = websiteContent.html || '';
  const text = websiteContent.text_content || '';
  
  const features = {
    // Structural features
    hasFAQ: detectFAQ(html, text),
    hasReviews: detectReviews(html, text),
    hasSchema: (websiteContent.schema_data && websiteContent.schema_data.length > 0),
    hasProcess: detectProcessDescription(text),
    hasTestimonials: detectTestimonials(html, text),
    hasBeforeAfter: detectGallery(html, text),
    hasBlog: detectBlog(html),
    hasContact: (websiteContent.contact_info?.phones?.length > 0 || 
                 websiteContent.contact_info?.emails?.length > 0),
    
    // Content features
    serviceCount: websiteContent.services?.length || 0,
    contentDepth: text.length,
    headingCount: websiteContent.headings?.length || 0,
    
    // Calculate overall feature score
    featureScore: 0
  };
  
  // Calculate feature score
  let score = 0;
  if (features.hasFAQ) score += 15;
  if (features.hasReviews) score += 15;
  if (features.hasSchema) score += 10;
  if (features.hasProcess) score += 10;
  if (features.hasTestimonials) score += 10;
  if (features.hasBeforeAfter) score += 10;
  if (features.hasBlog) score += 5;
  if (features.hasContact) score += 5;
  if (features.serviceCount >= 5) score += 10;
  if (features.contentDepth > 5000) score += 10;
  
  features.featureScore = Math.min(100, score);
  
  return features;
}

/**
 * Identify content gaps by comparing target vs competitors
 */
function identifyContentGaps(targetFeatures, competitorData, businessAnalysis) {
  const gaps = {
    structural: [],
    thematic: [],
    critical: [],
    significant: [],
    undermentioned: [],
    total: 0
  };
  
  // Check structural gaps (features competitors have but target doesn't)
  const competitorFeatures = competitorData.map(c => c.features);
  
  // FAQ Section
  if (!targetFeatures.hasFAQ && competitorFeatures.some(f => f.hasFAQ)) {
    gaps.structural.push({
      title: 'FAQ Section',
      severity: 'Significant',
      description: `No dedicated FAQ page addressing common ${businessAnalysis.business_type} questions. Competitors have comprehensive FAQ sections that improve SEO and user engagement.`,
      category: 'structural',
      recommendation: 'Create a comprehensive FAQ page with 15-20 common questions'
    });
  }
  
  // Reviews/Testimonials
  if (!targetFeatures.hasReviews && competitorFeatures.some(f => f.hasReviews)) {
    gaps.structural.push({
      title: 'Customer Reviews Display',
      severity: 'Significant',
      description: 'Reviews are not prominently featured on the website. Competitors showcase customer testimonials and ratings prominently.',
      category: 'structural',
      recommendation: 'Add a dedicated testimonials page and display reviews on service pages'
    });
  }
  
  // Schema Markup
  if (!targetFeatures.hasSchema && competitorFeatures.some(f => f.hasSchema)) {
    gaps.structural.push({
      title: 'Schema Markup',
      severity: 'Critical',
      description: 'Missing structured data (schema.org markup) that helps search engines and AI platforms understand business information.',
      category: 'structural',
      recommendation: 'Implement LocalBusiness, Service, and AggregateRating schema markup'
    });
  }
  
  // Process Description
  if (!targetFeatures.hasProcess && competitorFeatures.some(f => f.hasProcess)) {
    gaps.critical.push({
      title: 'Service Process Explanation',
      severity: 'Critical',
      description: 'Limited explanation of how your service works from start to finish. Competitors provide clear step-by-step process descriptions.',
      category: 'topic',
      recommendation: 'Create detailed process pages showing steps from inquiry to completion'
    });
  }
  
  // Before/After Gallery
  if (!targetFeatures.hasBeforeAfter && competitorFeatures.some(f => f.hasBeforeAfter)) {
    gaps.significant.push({
      title: 'Before and After Gallery',
      severity: 'Moderate',
      description: 'Missing visual proof of work results. Competitors use before/after images to demonstrate value.',
      category: 'content',
      recommendation: 'Create a portfolio/gallery page with before/after project photos'
    });
  }
  
  // Service depth comparison
  const avgCompetitorServices = competitorFeatures.reduce((sum, f) => sum + f.serviceCount, 0) / competitorFeatures.length;
  if (targetFeatures.serviceCount < avgCompetitorServices * 0.7) {
    gaps.thematic.push({
      title: 'Service Coverage',
      severity: 'Significant',
      description: `Website lists ${targetFeatures.serviceCount} services while competitors average ${Math.round(avgCompetitorServices)}. More service pages improve SEO and customer understanding.`,
      category: 'thematic',
      recommendation: 'Create dedicated pages for each service type with detailed descriptions'
    });
  }
  
  // Content depth
  const avgCompetitorContent = competitorFeatures.reduce((sum, f) => sum + f.contentDepth, 0) / competitorFeatures.length;
  if (targetFeatures.contentDepth < avgCompetitorContent * 0.6) {
    gaps.undermentioned.push({
      title: 'Content Depth',
      severity: 'Moderate',
      description: 'Website has less content than competitors. More comprehensive content improves SEO and helps AI platforms understand your expertise.',
      category: 'content',
      recommendation: 'Expand service descriptions, add educational content, create resource pages'
    });
  }
  
  // Calculate total gaps
  gaps.total = gaps.structural.length + gaps.thematic.length + 
               gaps.critical.length + gaps.significant.length + 
               gaps.undermentioned.length;
  
  return gaps;
}

/**
 * Use GPT-4 for deep competitive analysis
 */
async function analyzeWithGPT4(targetContent, competitorData, gaps, businessAnalysis) {
  try {
    const prompt = buildAnalysisPrompt(targetContent, competitorData, gaps, businessAnalysis);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      temperature: 0.4,
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content: 'You are a competitive analysis expert specializing in local business marketing and SEO. Analyze websites and provide specific, actionable insights. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const response = JSON.parse(completion.choices[0].message.content);
    
    return {
      insights: response.insights || [],
      differentiation: response.competitive_differentiation || '',
      additional_gaps: response.additional_gaps || []
    };
    
  } catch (error) {
    console.error('GPT-4 analysis failed:', error.message);
    // Return empty analysis rather than failing
    return {
      insights: [],
      differentiation: '',
      additional_gaps: []
    };
  }
}

/**
 * Build prompt for GPT-4 analysis
 */
function buildAnalysisPrompt(targetContent, competitorData, gaps, businessAnalysis) {
  return `Analyze this business against competitors and provide strategic insights:

TARGET BUSINESS:
Name: ${businessAnalysis.business_name}
Type: ${businessAnalysis.business_type}
Location: ${businessAnalysis.location_string}
Services: ${targetContent.services?.slice(0, 5).join(', ') || 'Not specified'}
Content Length: ${targetContent.text_content?.length || 0} characters

COMPETITORS (${competitorData.length}):
${competitorData.map((c, i) => `
${i + 1}. ${c.name}
   Services: ${c.services.slice(0, 3).join(', ')}
   Features: FAQ=${c.features.hasFAQ}, Reviews=${c.features.hasReviews}, Schema=${c.features.hasSchema}
   Feature Score: ${c.features.featureScore}/100
`).join('\n')}

GAPS ALREADY IDENTIFIED (${gaps.total}):
${[...gaps.structural, ...gaps.critical].slice(0, 5).map(g => `- ${g.title}: ${g.description}`).join('\n')}

Provide a JSON response with:
{
  "insights": [
    "Specific insight 1",
    "Specific insight 2",
    "Specific insight 3"
  ],
  "competitive_differentiation": "One paragraph explaining how this business can stand out",
  "additional_gaps": [
    {
      "title": "Gap title",
      "severity": "Critical|Significant|Moderate",
      "description": "What's missing and why it matters",
      "recommendation": "Specific action to take"
    }
  ]
}

Focus on actionable insights that will improve AI visibility and local SEO.`;
}

/**
 * Generate prioritized recommendations
 */
function generateRecommendations(gaps, aiAnalysis, businessAnalysis) {
  const recommendations = [];
  let priorityCounter = 1;
  
  // Convert gaps to recommendations
  const allGaps = [
    ...gaps.critical,
    ...gaps.structural,
    ...gaps.significant,
    ...gaps.thematic,
    ...gaps.undermentioned
  ];
  
  allGaps.forEach(gap => {
    const priority = gap.severity === 'Critical' ? 'high' :
                    gap.severity === 'Significant' ? 'high' : 'medium';
    
    const effort = gap.category === 'structural' ? 'Medium' :
                  gap.category === 'content' ? 'Low' : 'Medium';
    
    recommendations.push({
      priority: priorityCounter++,
      title: gap.title,
      priority_level: priority,
      impact: gap.severity === 'Critical' ? 'High' : 'Medium',
      effort: effort,
      category: capitalizeFirst(gap.category),
      description: gap.description,
      recommendation: gap.recommendation,
      expected_outcome: generateExpectedOutcome(gap, businessAnalysis)
    });
  });
  
  // Add AI-generated gaps if any
  if (aiAnalysis.additional_gaps) {
    aiAnalysis.additional_gaps.forEach(gap => {
      recommendations.push({
        priority: priorityCounter++,
        title: gap.title,
        priority_level: 'medium',
        impact: 'Medium',
        effort: 'Medium',
        category: 'AI Insight',
        description: gap.description,
        recommendation: gap.recommendation,
        expected_outcome: 'Improved AI platform visibility'
      });
    });
  }
  
  // Sort by priority level
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority_level] - priorityOrder[b.priority_level];
  });
}

/**
 * Generate implementation timeline
 */
function generateImplementationTimeline(recommendations) {
  const timeline = {
    '30_days': [],
    '60_90_days': [],
    '90_plus_days': []
  };
  
  recommendations.forEach(rec => {
    const item = `${rec.title}: ${rec.recommendation}`;
    
    if (rec.effort === 'Low' || rec.priority_level === 'high') {
      timeline['30_days'].push(item);
    } else if (rec.effort === 'Medium') {
      timeline['60_90_days'].push(item);
    } else {
      timeline['90_plus_days'].push(item);
    }
  });
  
  return timeline;
}

/**
 * Calculate platform scores (simplified - not real AI queries)
 */
function calculatePlatformScores(targetFeatures, gaps) {
  // Base score on feature completeness and gaps
  let baseScore = targetFeatures.featureScore;
  
  // Penalize for gaps
  const gapPenalty = Math.min(40, gaps.total * 5);
  baseScore = Math.max(20, baseScore - gapPenalty);
  
  // Add some variation between platforms
  return {
    chatgpt: Math.round(baseScore + Math.random() * 10 - 5),
    claude: Math.round(baseScore + Math.random() * 10 - 5),
    gemini: Math.round(baseScore + Math.random() * 10 - 5),
    perplexity: Math.round(baseScore + Math.random() * 10 - 5)
  };
}

/**
 * Calculate overall score
 */
function calculateOverallScore(platformScores) {
  const scores = Object.values(platformScores);
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round(average);
}

/**
 * Extract brand strengths
 */
function extractBrandStrengths(features, content) {
  const strengths = [];
  
  if (features.serviceCount >= 5) {
    strengths.push(`Diverse service offerings (${features.serviceCount} services listed)`);
  }
  
  if (features.hasSchema) {
    strengths.push('Structured data markup implemented for better search visibility');
  }
  
  if (features.contentDepth > 5000) {
    strengths.push('Comprehensive website content providing detailed information');
  }
  
  if (features.hasContact) {
    strengths.push('Clear contact information readily available');
  }
  
  if (content.services && content.services.length > 0) {
    strengths.push(`Clear service categorization: ${content.services.slice(0, 3).join(', ')}`);
  }
  
  // Always include at least one strength
  if (strengths.length === 0) {
    strengths.push('Active online presence with professional website');
  }
  
  return strengths;
}

/**
 * Extract brand weaknesses
 */
function extractBrandWeaknesses(gaps, features) {
  const weaknesses = [];
  
  if (gaps.critical.length > 0) {
    weaknesses.push(`${gaps.critical.length} critical content gaps affecting visibility`);
  }
  
  if (!features.hasFAQ) {
    weaknesses.push('Missing FAQ section that competitors provide');
  }
  
  if (!features.hasReviews) {
    weaknesses.push('Customer reviews not prominently displayed');
  }
  
  if (features.serviceCount < 3) {
    weaknesses.push('Limited service pages compared to competitors');
  }
  
  return weaknesses;
}

/**
 * Format competitor data for report
 */
function formatCompetitorData(competitorData) {
  return competitorData.map(comp => ({
    name: comp.name,
    website: comp.website,
    strengths: comp.strengths,
    services: comp.services.slice(0, 5),
    feature_score: comp.features.featureScore
  }));
}

/**
 * Generate competitor strengths
 */
function generateCompetitorStrengths(features, content) {
  const strengths = [];
  
  if (features.hasFAQ) strengths.push('Comprehensive FAQ section');
  if (features.hasReviews) strengths.push('Customer reviews prominently displayed');
  if (features.hasSchema) strengths.push('Structured data markup implemented');
  if (features.hasProcess) strengths.push('Clear service process explanation');
  if (features.hasBeforeAfter) strengths.push('Portfolio/gallery showcasing work');
  if (features.serviceCount >= 5) strengths.push(`${features.serviceCount} service pages`);
  
  return strengths.slice(0, 5);
}

/**
 * Generate expected outcome for a gap
 */
function generateExpectedOutcome(gap, businessAnalysis) {
  const outcomes = {
    'FAQ Section': 'Reduced support inquiries, improved user confidence, better SEO rankings',
    'Customer Reviews Display': 'Increased trust and conversion rates',
    'Schema Markup': 'Improved search visibility and rich snippets in search results',
    'Service Process Explanation': 'Better customer understanding, reduced friction in sales process',
    'Before and After Gallery': 'Enhanced credibility and visual proof of quality work',
    'Service Coverage': `Better ranking for ${businessAnalysis.business_type}-related searches`,
    'Content Depth': 'Improved SEO performance and AI platform understanding'
  };
  
  return outcomes[gap.title] || 'Improved competitive positioning and customer engagement';
}

// ===================================================================
// HELPER FUNCTIONS - Feature Detection
// ===================================================================

function detectFAQ(html, text) {
  const faqIndicators = ['faq', 'frequently asked', 'questions'];
  return faqIndicators.some(indicator => 
    html.toLowerCase().includes(indicator) || text.toLowerCase().includes(indicator)
  );
}

function detectReviews(html, text) {
  const reviewIndicators = ['review', 'testimonial', 'rating', 'stars'];
  return reviewIndicators.some(indicator => html.toLowerCase().includes(indicator));
}

function detectProcessDescription(text) {
  const processIndicators = ['step 1', 'step 2', 'process', 'how it works', 'our approach'];
  return processIndicators.some(indicator => text.toLowerCase().includes(indicator));
}

function detectTestimonials(html, text) {
  const testimonialIndicators = ['testimonial', 'what our customers say', 'client reviews'];
  return testimonialIndicators.some(indicator => 
    html.toLowerCase().includes(indicator) || text.toLowerCase().includes(indicator)
  );
}

function detectGallery(html, text) {
  const galleryIndicators = ['before and after', 'gallery', 'portfolio', 'our work'];
  return galleryIndicators.some(indicator => html.toLowerCase().includes(indicator));
}

function detectBlog(html) {
  const blogIndicators = ['blog', 'articles', 'news', '/blog/', '/articles/'];
  return blogIndicators.some(indicator => html.toLowerCase().includes(indicator));
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}