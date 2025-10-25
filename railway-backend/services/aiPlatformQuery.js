// railway-backend/services/aiPlatformQuery.js
// ULTIMATE VERSION: Query ALL available models, pick best results
// Maximum quality - queries 15+ models per business for optimal accuracy

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

/**
 * ALL AVAILABLE MODELS PER PLATFORM
 */
const MODEL_CONFIG = {
  chatgpt: [
    'gpt-4o',                    // Latest GPT-4 Omni
    'gpt-4-turbo',               // GPT-4 Turbo
    'gpt-4o-mini',               // Smaller GPT-4 Omni
    'gpt-4',                     // Standard GPT-4
    'gpt-3.5-turbo'              // Faster, cheaper option
  ],
  claude: [
    'claude-3-5-sonnet-20241022', // Latest Claude 3.5 Sonnet
    'claude-3-opus-20240229',     // Most capable Claude 3
    'claude-3-sonnet-20240229'    // Balanced Claude 3
  ],
  gemini: [
    'gemini-2.0-flash-exp',       // Newest Gemini 2.0
    'gemini-1.5-pro-latest',      // Latest stable Pro
    'gemini-1.5-flash-latest',    // Latest stable Flash
    'gemini-1.5-pro',             // Stable Pro
    'gemini-1.5-flash'            // Fast Flash
  ],
  perplexity: [
    'sonar-reasoning',            // Best reasoning (most accurate)
    'sonar-pro',                  // Professional tier
    'sonar'                       // Standard tier
  ]
};

/**
 * Query ALL AI platforms with ALL available models
 * Returns best results from each platform
 */
export async function queryAllPlatforms(businessInfo) {
  console.log(`\n🤖 ULTIMATE Multi-Model Analysis for: ${businessInfo.name}`);
  console.log(`   Testing ${getTotalModelCount()} AI models across 4 platforms...\n`);
  
  const startTime = Date.now();
  
  // Query ALL models in parallel for maximum speed
  const allQueries = [
    ...queryPlatformMultiModel('chatgpt', businessInfo),
    ...queryPlatformMultiModel('claude', businessInfo),
    ...queryPlatformMultiModel('gemini', businessInfo),
    ...queryPlatformMultiModel('perplexity', businessInfo)
  ];

  console.log(`   Executing ${allQueries.length} parallel queries...`);
  const results = await Promise.allSettled(allQueries);

  // Group results by platform
  const groupedResults = {
    chatgpt: [],
    claude: [],
    gemini: [],
    perplexity: []
  };

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      const platform = result.value.platform;
      if (groupedResults[platform]) {
        groupedResults[platform].push(result.value);
      }
    }
  });

  // Pick best result from each platform
  console.log(`\n📊 Analyzing results and selecting best from each platform:\n`);
  
  const platformScores = [];
  let totalMentions = 0;
  let totalModelsQueried = 0;
  let successfulQueries = 0;

  for (const [platform, platformResults] of Object.entries(groupedResults)) {
    const validResults = platformResults.filter(r => r && r.score !== undefined);
    totalModelsQueried += MODEL_CONFIG[platform].length;
    successfulQueries += validResults.length;
    
    const bestResult = pickBestResult(validResults, platform);
    
    if (bestResult) {
      platformScores.push({
        platform: platform,
        score: bestResult.score,
        mentioned: bestResult.mentioned,
        mention_count: bestResult.mention_count,
        knowledge_level: bestResult.knowledge_level,
        facts_known: bestResult.facts_known,
        status: 'success',
        details: `${bestResult.details} (Best of ${validResults.length}/${MODEL_CONFIG[platform].length} models)`,
        model_used: bestResult.model,
        models_tested: MODEL_CONFIG[platform].length,
        successful_queries: validResults.length
      });
      
      if (bestResult.mentioned) {
        totalMentions++;
      }
      
      console.log(`   ✓ ${platform.toUpperCase()}: ${bestResult.score}/100 (${bestResult.knowledge_level})`);
      console.log(`      Best model: ${bestResult.model}`);
      console.log(`      Success rate: ${validResults.length}/${MODEL_CONFIG[platform].length} models`);
      if (bestResult.mentioned) {
        console.log(`      🎯 Mentioned ${bestResult.mention_count}x in training data!`);
      }
    } else {
      platformScores.push({
        platform: platform,
        score: 0,
        mentioned: false,
        mention_count: 0,
        knowledge_level: 'None',
        facts_known: [],
        status: 'error',
        details: `All ${MODEL_CONFIG[platform].length} models failed`,
        models_tested: MODEL_CONFIG[platform].length,
        successful_queries: 0
      });
      
      console.log(`   ✗ ${platform.toUpperCase()}: All models failed`);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`\n✅ Multi-model analysis complete:`);
  console.log(`   Total models queried: ${totalModelsQueried}`);
  console.log(`   Successful queries: ${successfulQueries}/${totalModelsQueried} (${Math.round(successfulQueries/totalModelsQueried*100)}%)`);
  console.log(`   Platforms with visibility: ${totalMentions}/4`);
  console.log(`   Processing time: ${duration}s`);

  return {
    platform_scores: platformScores,
    total_platforms_mentioned: totalMentions,
    overall_visibility_score: Math.round(
      platformScores.reduce((sum, p) => sum + p.score, 0) / platformScores.length
    ),
    total_models_queried: totalModelsQueried,
    successful_queries: successfulQueries
  };
}

/**
 * Query all models for a specific platform
 */
function queryPlatformMultiModel(platform, businessInfo) {
  const models = MODEL_CONFIG[platform];
  
  return models.map(model => {
    switch(platform) {
      case 'chatgpt':
        return queryChatGPT(businessInfo, model);
      case 'claude':
        return queryClaude(businessInfo, model);
      case 'gemini':
        return queryGemini(businessInfo, model);
      case 'perplexity':
        return queryPerplexity(businessInfo, model);
      default:
        return Promise.resolve(null);
    }
  });
}

/**
 * Pick the best result from multiple model queries
 * Priority: 
 * 1) Highest mention_count (real mentions are gold)
 * 2) Highest confidence (reliability)
 * 3) Most facts_known (detail)
 * 4) Highest score (overall)
 */
function pickBestResult(results, platform) {
  if (results.length === 0) return null;
  
  // Sort by quality metrics
  const sorted = results.sort((a, b) => {
    // PRIMARY: Most mentions (this is the most valuable signal)
    if (a.mention_count !== b.mention_count) {
      return b.mention_count - a.mention_count;
    }
    
    // SECONDARY: Highest confidence
    if (a.confidence !== b.confidence) {
      return b.confidence - a.confidence;
    }
    
    // TERTIARY: Most facts
    const aFacts = a.facts_known?.length || 0;
    const bFacts = b.facts_known?.length || 0;
    if (aFacts !== bFacts) {
      return bFacts - aFacts;
    }
    
    // QUATERNARY: Highest score
    return b.score - a.score;
  });
  
  return sorted[0];
}

/**
 * Query ChatGPT with specific model
 */
async function queryChatGPT(businessInfo, model) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = buildQueryPrompt(businessInfo);

    const completion = await openai.chat.completions.create({
      model: model,
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
    const parsed = parseAIResponse(response, model);
    
    return {
      ...parsed,
      platform: 'chatgpt',
      model: model
    };

  } catch (error) {
    console.error(`   ✗ ChatGPT ${model}:`, error.message);
    return null;
  }
}

/**
 * Query Claude with specific model
 */
async function queryClaude(businessInfo, model) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const prompt = buildQueryPrompt(businessInfo);

    const message = await anthropic.messages.create({
      model: model,
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
    const parsed = parseAIResponse(response, model);
    
    return {
      ...parsed,
      platform: 'claude',
      model: model
    };

  } catch (error) {
    console.error(`   ✗ Claude ${model}:`, error.message);
    return null;
  }
}

/**
 * Query Gemini with specific model
 */
async function queryGemini(businessInfo, model) {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('Google API key not configured');
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const geminiModel = genAI.getGenerativeModel({ model: model });

    const prompt = buildQueryPrompt(businessInfo);
    const systemPrompt = 'You are an AI knowledge assessment tool. When asked about a business, provide a JSON response with: mentioned (boolean), mention_count (number 0-10), knowledge_level (None/Low/Medium/High), facts_known (array of facts), confidence (0-100). Be honest - if you don\'t know the business, say so.';

    const result = await geminiModel.generateContent(`${systemPrompt}\n\n${prompt}`);
    const response = result.response.text();
    const parsed = parseAIResponse(response, model);
    
    return {
      ...parsed,
      platform: 'gemini',
      model: model
    };

  } catch (error) {
    console.error(`   ✗ Gemini ${model}:`, error.message);
    return null;
  }
}

/**
 * Query Perplexity with specific model
 */
async function queryPerplexity(businessInfo, model) {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error('Perplexity API key not configured');
    }

    const perplexity = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai'
    });

    const prompt = buildQueryPrompt(businessInfo);

    const completion = await perplexity.chat.completions.create({
      model: model,
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
    const parsed = parseAIResponse(response, model);
    
    return {
      ...parsed,
      platform: 'perplexity',
      model: model
    };

  } catch (error) {
    console.error(`   ✗ Perplexity ${model}:`, error.message);
    return null;
  }
}

/**
 * Build query prompt for AI platforms
 */
function buildQueryPrompt(businessInfo) {
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
function parseAIResponse(response, model) {
  try {
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
    console.error(`   ⚠️  Failed to parse ${model}:`, error.message);
    
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
 * Get total number of models across all platforms
 */
function getTotalModelCount() {
  return Object.values(MODEL_CONFIG).reduce((sum, models) => sum + models.length, 0);
}

/**
 * Build AI knowledge comparison table
 */
export function buildKnowledgeComparison(mainBusinessResults, competitorResults) {
  const comparison = {
    businesses: [],
    platforms: ['chatgpt', 'claude', 'gemini', 'perplexity']
  };
  
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