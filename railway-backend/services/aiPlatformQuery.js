// railway-backend/services/aiPlatformQuery.js
// PHASE B: Real AI Platform Queries
// Queries ChatGPT, Claude, Gemini, and Perplexity about businesses
// FIXED: Updated model names to current versions

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

/**
 * Query all AI platforms about a business
 * Returns real visibility scores and mention counts
 */
export async function queryAllPlatforms(businessInfo) {
  console.log(`\n🤖 Querying AI platforms for: ${businessInfo.name}`);
  
  const results = await Promise.allSettled([
    queryChatGPT(businessInfo),
    queryClaude(businessInfo),
    queryGemini(businessInfo),
    queryPerplexity(businessInfo)
  ]);

  // Process results
  const platformScores = [];
  let totalMentions = 0;
  
  results.forEach((result, idx) => {
    const platforms = ['chatgpt', 'claude', 'gemini', 'perplexity'];
    const platform = platforms[idx];
    
    if (result.status === 'fulfilled' && result.value) {
      platformScores.push({
        platform: platform,
        score: result.value.score,
        mentioned: result.value.mentioned,
        mention_count: result.value.mention_count,
        knowledge_level: result.value.knowledge_level,
        facts_known: result.value.facts_known,
        status: 'success',
        details: result.value.details
      });
      
      if (result.value.mentioned) {
        totalMentions++;
      }
    } else {
      // Failed query - use fallback
      platformScores.push({
        platform: platform,
        score: 0,
        mentioned: false,
        mention_count: 0,
        knowledge_level: 'None',
        facts_known: [],
        status: 'error',
        details: 'Query failed'
      });
    }
  });

  return {
    platform_scores: platformScores,
    total_platforms_mentioned: totalMentions,
    overall_visibility_score: Math.round(
      platformScores.reduce((sum, p) => sum + p.score, 0) / platformScores.length
    )
  };
}

/**
 * Query ChatGPT (OpenAI) about a business
 */
async function queryChatGPT(businessInfo) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = buildQueryPrompt(businessInfo);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: 'You are an AI knowledge assessment tool. When asked about a business, provide a JSON response with: mentioned (boolean), mention_count (number 0-10), knowledge_level (None/Low/Medium/High), facts_known (array of facts), confidence (0-100). Be honest - if you don\'t know the business, say so.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const response = completion.choices[0].message.content;
    const parsed = parseAIResponse(response, 'chatgpt');
    
    console.log(`   ✓ ChatGPT: ${parsed.knowledge_level} knowledge (${parsed.score}/100)`);
    return parsed;

  } catch (error) {
    console.error(`   ✗ ChatGPT query failed:`, error.message);
    return null;
  }
}

/**
 * Query Claude (Anthropic) about a business
 * FIXED: Updated to claude-sonnet-4-5-20250929
 */
async function queryClaude(businessInfo) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const prompt = buildQueryPrompt(businessInfo);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929', // FIXED: Updated model name
      max_tokens: 500,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `You are an AI knowledge assessment tool. ${prompt}\n\nProvide a JSON response with: mentioned (boolean), mention_count (number 0-10), knowledge_level (None/Low/Medium/High), facts_known (array of facts), confidence (0-100). Be honest - if you don't know the business, say so.`
        }
      ]
    });

    const response = message.content[0].text;
    const parsed = parseAIResponse(response, 'claude');
    
    console.log(`   ✓ Claude: ${parsed.knowledge_level} knowledge (${parsed.score}/100)`);
    return parsed;

  } catch (error) {
    console.error(`   ✗ Claude query failed:`, error.message);
    return null;
  }
}

/**
 * Query Gemini (Google) about a business
 * FIXED: Updated to gemini-2.0-flash-exp
 */
async function queryGemini(businessInfo) {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('Google API key not configured');
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' }); // FIXED: Use stable model

    const prompt = buildQueryPrompt(businessInfo);
    const systemPrompt = 'You are an AI knowledge assessment tool. When asked about a business, provide a JSON response with: mentioned (boolean), mention_count (number 0-10), knowledge_level (None/Low/Medium/High), facts_known (array of facts), confidence (0-100). Be honest - if you don\'t know the business, say so.';

    const result = await model.generateContent(`${systemPrompt}\n\n${prompt}`);
    const response = result.response.text();
    const parsed = parseAIResponse(response, 'gemini');
    
    console.log(`   ✓ Gemini: ${parsed.knowledge_level} knowledge (${parsed.score}/100)`);
    return parsed;

  } catch (error) {
    console.error(`   ✗ Gemini query failed:`, error.message);
    return null;
  }
}

/**
 * Query Perplexity about a business
 * FIXED: Updated to llama-3.1-sonar-large-128k-online
 */
async function queryPerplexity(businessInfo) {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error('Perplexity API key not configured');
    }

    // Perplexity uses OpenAI-compatible API
    const perplexity = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai'
    });

    const prompt = buildQueryPrompt(businessInfo);

    const completion = await perplexity.chat.completions.create({
      model: 'llama-3.1-sonar-small-128k-online', // FIXED: Use small version (works correctly)
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: 'You are an AI knowledge assessment tool. When asked about a business, provide a JSON response with: mentioned (boolean), mention_count (number 0-10), knowledge_level (None/Low/Medium/High), facts_known (array of facts), confidence (0-100). Be honest - if you don\'t know the business, say so.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const response = completion.choices[0].message.content;
    const parsed = parseAIResponse(response, 'perplexity');
    
    console.log(`   ✓ Perplexity: ${parsed.knowledge_level} knowledge (${parsed.score}/100)`);
    return parsed;

  } catch (error) {
    console.error(`   ✗ Perplexity query failed:`, error.message);
    return null;
  }
}

/**
 * Build query prompt for AI platforms
 */
function buildQueryPrompt(businessInfo) {
  // FIXED: Handle location object properly
  const locationStr = typeof businessInfo.location === 'object' 
    ? `${businessInfo.location.city}, ${businessInfo.location.state}`
    : businessInfo.location;

  return `What do you know about "${businessInfo.name}"${locationStr ? ` in ${locationStr}` : ''}?

Business Details:
- Name: ${businessInfo.name}
- Type: ${businessInfo.type || 'Unknown'}
- Location: ${locationStr || 'Unknown'}
${businessInfo.website ? `- Website: ${businessInfo.website}` : ''}

Please assess your knowledge about this business and provide details about:
1. Whether you have heard of or know about this business
2. How many times it might appear in your training data (estimate 0-10)
3. Your overall knowledge level: None, Low, Medium, or High
4. Specific facts you know about them
5. Your confidence level (0-100%)

Respond ONLY with a JSON object in this exact format:
{
  "mentioned": true/false,
  "mention_count": 0-10,
  "knowledge_level": "None"/"Low"/"Medium"/"High",
  "facts_known": ["fact 1", "fact 2", ...],
  "confidence": 0-100
}`;
}

/**
 * Parse AI response into standardized format
 */
function parseAIResponse(response, platform) {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = response;
    
    // Remove markdown code blocks if present
    if (response.includes('```')) {
      const match = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        jsonStr = match[1].trim();
      }
    }
    
    const parsed = JSON.parse(jsonStr);
    
    // Calculate score based on knowledge level and confidence
    let baseScore = 0;
    switch (parsed.knowledge_level) {
      case 'High': baseScore = 85; break;
      case 'Medium': baseScore = 65; break;
      case 'Low': baseScore = 35; break;
      case 'None': baseScore = 0; break;
      default: baseScore = 0;
    }
    
    // Adjust score based on mention count and confidence
    const mentionBonus = Math.min(parsed.mention_count * 2, 15);
    const confidenceAdjustment = (parsed.confidence - 50) / 10;
    
    const finalScore = Math.max(0, Math.min(100, 
      Math.round(baseScore + mentionBonus + confidenceAdjustment)
    ));
    
    return {
      mentioned: parsed.mentioned || false,
      mention_count: parsed.mention_count || 0,
      knowledge_level: parsed.knowledge_level || 'None',
      facts_known: parsed.facts_known || [],
      confidence: parsed.confidence || 0,
      score: finalScore,
      details: `Score based on ${parsed.knowledge_level} knowledge level with ${parsed.confidence}% confidence`
    };
    
  } catch (error) {
    console.error(`   ⚠️  Failed to parse ${platform} response:`, error.message);
    
    // Fallback: Try to extract basic info from text
    const mentioned = response.toLowerCase().includes('yes') || 
                     response.toLowerCase().includes('know about') ||
                     response.toLowerCase().includes('familiar with');
    
    return {
      mentioned: mentioned,
      mention_count: mentioned ? 1 : 0,
      knowledge_level: mentioned ? 'Low' : 'None',
      facts_known: [],
      confidence: 30,
      score: mentioned ? 25 : 0,
      details: 'Parsed from text response (JSON parsing failed)'
    };
  }
}

/**
 * Build AI knowledge comparison table
 * Shows how your business and competitors perform across all platforms
 */
export function buildKnowledgeComparison(mainBusinessResults, competitorResults) {
  const comparison = {
    businesses: [],
    platforms: ['chatgpt', 'claude', 'gemini', 'perplexity']
  };
  
  // Add main business
  comparison.businesses.push({
    name: mainBusinessResults.name || 'Your Business',
    is_target: true,
    platform_scores: mainBusinessResults.platform_scores.map(p => ({
      platform: p.platform,
      score: p.score,
      knowledge_level: p.knowledge_level,
      mention_count: p.mention_count
    })),
    overall_score: mainBusinessResults.overall_visibility_score,
    total_mentions: mainBusinessResults.total_platforms_mentioned
  });
  
  // Add competitors
  competitorResults.forEach(competitor => {
    if (competitor.aiResults) {
      comparison.businesses.push({
        name: competitor.name,
        is_target: false,
        platform_scores: competitor.aiResults.platform_scores.map(p => ({
          platform: p.platform,
          score: p.score,
          knowledge_level: p.knowledge_level,
          mention_count: p.mention_count
        })),
        overall_score: competitor.aiResults.overall_visibility_score,
        total_mentions: competitor.aiResults.total_platforms_mentioned
      });
    }
  });
  
  return comparison;
}