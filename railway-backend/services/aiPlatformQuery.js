// railway-backend/services/aiPlatformQuery.js
// PHASE B: Real AI Platform Queries
// Queries ChatGPT, Claude, Gemini, and Perplexity about businesses

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
      model: 'claude-3-5-sonnet-20241022',
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
 */
async function queryGemini(businessInfo) {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('Google API key not configured');
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
      model: 'llama-3.1-sonar-small-128k-online',
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
  return `What do you know about "${businessInfo.name}"${businessInfo.location ? ` in ${businessInfo.location}` : ''}?

Business Details:
- Name: ${businessInfo.name}
- Type: ${businessInfo.type || 'Unknown'}
- Location: ${businessInfo.location || 'Unknown'}
${businessInfo.website ? `- Website: ${businessInfo.website}` : ''}

Please assess your knowledge of this business and respond with JSON containing:
1. mentioned: true if you have any information about this specific business
2. mention_count: how many distinct facts/mentions you have (0-10)
3. knowledge_level: your knowledge level (None/Low/Medium/High)
4. facts_known: array of specific facts you know about this business
5. confidence: your confidence in this assessment (0-100)

If you don't know this specific business, be honest and return mentioned: false.`;
}

/**
 * Parse AI response and calculate visibility score
 */
function parseAIResponse(response, platform) {
  try {
    // Try to extract JSON from response
    let jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Try to find JSON in code blocks
      jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonMatch = [jsonMatch[1]];
      }
    }

    let data;
    if (jsonMatch) {
      data = JSON.parse(jsonMatch[0]);
    } else {
      // Fallback: try parsing entire response
      data = JSON.parse(response);
    }

    // Calculate score based on knowledge level and confidence
    let baseScore = 0;
    switch (data.knowledge_level?.toLowerCase()) {
      case 'high': baseScore = 80; break;
      case 'medium': baseScore = 60; break;
      case 'low': baseScore = 30; break;
      case 'none': baseScore = 0; break;
      default: baseScore = 0;
    }

    // Adjust score based on mention count
    const mentionBonus = Math.min(data.mention_count * 2, 20);
    const finalScore = Math.min(baseScore + mentionBonus, 100);

    return {
      mentioned: data.mentioned || false,
      mention_count: data.mention_count || 0,
      knowledge_level: data.knowledge_level || 'None',
      facts_known: data.facts_known || [],
      confidence: data.confidence || 0,
      score: finalScore,
      details: `${data.knowledge_level} knowledge with ${data.mention_count} facts known`
    };

  } catch (error) {
    console.error(`   ⚠️ Failed to parse ${platform} response:`, error.message);
    
    // Fallback: analyze response text for mentions
    const lowerResponse = response.toLowerCase();
    const mentioned = !lowerResponse.includes("don't know") && 
                     !lowerResponse.includes("no information") &&
                     !lowerResponse.includes("not familiar");

    return {
      mentioned: mentioned,
      mention_count: mentioned ? 1 : 0,
      knowledge_level: mentioned ? 'Low' : 'None',
      facts_known: [],
      confidence: 30,
      score: mentioned ? 30 : 0,
      details: mentioned ? 'Some information found' : 'No information found'
    };
  }
}

/**
 * Build AI Knowledge Scores comparison table
 */
export function buildKnowledgeComparison(mainBusinessResults, competitorResults, mainBusinessInfo, competitors) {
  const comparison = {
    main_business: {
      name: mainBusinessInfo.name,
      domain: mainBusinessInfo.website ? new URL(mainBusinessInfo.website).hostname : 'N/A',
      scores: {}
    },
    competitors: []
  };

  // Add main business scores
  mainBusinessResults.platform_scores.forEach(ps => {
    comparison.main_business.scores[ps.platform] = ps.score;
  });

  // Add competitor scores
  competitorResults.forEach((result, idx) => {
    const competitor = {
      name: competitors[idx]?.name || `Competitor ${idx + 1}`,
      domain: competitors[idx]?.website ? new URL(competitors[idx].website).hostname : 'N/A',
      scores: {}
    };

    result.platform_scores.forEach(ps => {
      competitor.scores[ps.platform] = ps.score;
    });

    comparison.competitors.push(competitor);
  });

  return comparison;
}