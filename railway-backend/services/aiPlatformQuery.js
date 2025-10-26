// railway-backend/services/aiPlatformQuery.js
// FIXED: Gemini using v1beta + Claude using correct model names
// Multi-model AI platform query service for AI Visibility Analysis

const axios = require('axios');

// ============================================
// MODEL CONFIGURATION - ALL WORKING MODELS
// ============================================
const MODEL_CONFIG = {
  chatgpt: [
    'gpt-4o',           // ✅ Working
    'gpt-4-turbo',      // ✅ Working
    'gpt-4o-mini',      // ✅ Working (BEST RESULTS!)
    'gpt-4',            // ✅ Working
    'gpt-3.5-turbo'     // ✅ Working
  ],
  claude: [
    'claude-sonnet-4-5-20250929',   // ✅ Working
    'claude-3-5-sonnet-20241022',   // ✅ FIXED: Updated model name
    'claude-3-5-sonnet-20240620'    // ✅ FIXED: Alternative working model
  ],
  gemini: [
    'gemini-1.5-flash-latest',  // ✅ FIXED: Using v1beta endpoint
    'gemini-1.5-pro-latest',    // ✅ FIXED: Using v1beta endpoint
    'gemini-pro'                // ✅ FIXED: Using v1beta endpoint
  ],
  perplexity: [
    'sonar',            // ✅ Working (BEST RESULTS!)
    'sonar-pro',        // ✅ Working
    'sonar-reasoning'   // ✅ Working
  ]
};

// ============================================
// QUERY FUNCTIONS
// ============================================

/**
 * Query ChatGPT (OpenAI) with multiple models
 */
async function queryChatGPT(businessName, businessType, location, models = MODEL_CONFIG.chatgpt) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️  OpenAI API key not configured');
    return models.map(model => ({
      platform: 'chatgpt',
      model,
      score: 0,
      status: 'error',
      error: 'API key not configured'
    }));
  }

  const prompt = `What do you know about ${businessName}, a ${businessType} in ${location}? 
  
If you know this business, provide details about their services, reputation, and what makes them stand out.
If you don't know this specific business, please say so clearly.`;

  const results = [];

  for (const model of models) {
    try {
      console.log(`🤖 Querying ChatGPT model: ${model}...`);
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant analyzing local businesses and their online presence.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const answer = response.data.choices[0].message.content;
      const mentioned = answer.toLowerCase().includes(businessName.toLowerCase());
      
      // Calculate score based on mention quality
      let score = 0;
      if (mentioned) {
        const hasDetails = answer.length > 100;
        const hasSpecifics = /service|product|location|review|customer/i.test(answer);
        score = hasDetails && hasSpecifics ? 80 : hasDetails ? 60 : 40;
      }

      results.push({
        platform: 'chatgpt',
        model: model,
        query: prompt,
        response: answer,
        business_mentioned: mentioned,
        score: score,
        status: 'success'
      });

      console.log(`   ✅ ${model}: Score ${score}/100 ${mentioned ? '(mentioned)' : '(not mentioned)'}`);

    } catch (error) {
      console.error(`   ❌ ${model}: ${error.message}`);
      results.push({
        platform: 'chatgpt',
        model: model,
        score: 0,
        status: 'error',
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Query Claude (Anthropic) with multiple models
 * FIXED: Using correct working model names
 */
async function queryClaude(businessName, businessType, location, models = MODEL_CONFIG.claude) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️  Anthropic API key not configured');
    return models.map(model => ({
      platform: 'claude',
      model,
      score: 0,
      status: 'error',
      error: 'API key not configured'
    }));
  }

  const prompt = `What do you know about ${businessName}, a ${businessType} in ${location}?

If you know this business, provide details about their services, reputation, and what makes them stand out.
If you don't know this specific business, please say so clearly.`;

  const results = [];

  for (const model of models) {
    try {
      console.log(`🤖 Querying Claude model: ${model}...`);
      
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: model,
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const answer = response.data.content[0].text;
      const mentioned = answer.toLowerCase().includes(businessName.toLowerCase());
      
      // Calculate score based on mention quality
      let score = 0;
      if (mentioned) {
        const hasDetails = answer.length > 100;
        const hasSpecifics = /service|product|location|review|customer/i.test(answer);
        score = hasDetails && hasSpecifics ? 80 : hasDetails ? 60 : 40;
      }

      results.push({
        platform: 'claude',
        model: model,
        query: prompt,
        response: answer,
        business_mentioned: mentioned,
        score: score,
        status: 'success'
      });

      console.log(`   ✅ ${model}: Score ${score}/100 ${mentioned ? '(mentioned)' : '(not mentioned)'}`);

    } catch (error) {
      console.error(`   ❌ ${model}: ${error.response?.data?.error?.message || error.message}`);
      results.push({
        platform: 'claude',
        model: model,
        score: 0,
        status: 'error',
        error: error.response?.data?.error?.message || error.message
      });
    }
  }

  return results;
}

/**
 * Query Gemini (Google) with multiple models
 * FIXED: Using v1beta REST API instead of SDK
 */
async function queryGemini(businessName, businessType, location, models = MODEL_CONFIG.gemini) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️  Google API key not configured');
    return models.map(model => ({
      platform: 'gemini',
      model,
      score: 0,
      status: 'error',
      error: 'API key not configured'
    }));
  }

  const prompt = `What do you know about ${businessName}, a ${businessType} in ${location}?

If you know this business, provide details about their services, reputation, and what makes them stand out.
If you don't know this specific business, please say so clearly.`;

  const results = [];

  for (const model of models) {
    try {
      console.log(`🤖 Querying Gemini model: ${model}...`);
      
      // FIXED: Use v1beta endpoint for Gemini models
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const answer = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const mentioned = answer.toLowerCase().includes(businessName.toLowerCase());
      
      // Calculate score based on mention quality
      let score = 0;
      if (mentioned) {
        const hasDetails = answer.length > 100;
        const hasSpecifics = /service|product|location|review|customer/i.test(answer);
        score = hasDetails && hasSpecifics ? 80 : hasDetails ? 60 : 40;
      }

      results.push({
        platform: 'gemini',
        model: model,
        query: prompt,
        response: answer,
        business_mentioned: mentioned,
        score: score,
        status: 'success'
      });

      console.log(`   ✅ ${model}: Score ${score}/100 ${mentioned ? '(mentioned)' : '(not mentioned)'}`);

    } catch (error) {
      console.error(`   ❌ ${model}: ${error.response?.data?.error?.message || error.message}`);
      results.push({
        platform: 'gemini',
        model: model,
        score: 0,
        status: 'error',
        error: error.response?.data?.error?.message || error.message
      });
    }
  }

  return results;
}

/**
 * Query Perplexity with multiple models
 */
async function queryPerplexity(businessName, businessType, location, models = MODEL_CONFIG.perplexity) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️  Perplexity API key not configured');
    return models.map(model => ({
      platform: 'perplexity',
      model,
      score: 0,
      status: 'error',
      error: 'API key not configured'
    }));
  }

  const prompt = `What do you know about ${businessName}, a ${businessType} in ${location}?

If you know this business, provide details about their services, reputation, and what makes them stand out.
If you don't know this specific business, please say so clearly.`;

  const results = [];

  for (const model of models) {
    try {
      console.log(`🤖 Querying Perplexity model: ${model}...`);
      
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant analyzing local businesses and their online presence.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const answer = response.data.choices[0].message.content;
      const mentioned = answer.toLowerCase().includes(businessName.toLowerCase());
      
      // Calculate score based on mention quality
      let score = 0;
      if (mentioned) {
        const hasDetails = answer.length > 100;
        const hasSpecifics = /service|product|location|review|customer/i.test(answer);
        score = hasDetails && hasSpecifics ? 80 : hasDetails ? 60 : 40;
      }

      results.push({
        platform: 'perplexity',
        model: model,
        query: prompt,
        response: answer,
        business_mentioned: mentioned,
        score: score,
        status: 'success'
      });

      console.log(`   ✅ ${model}: Score ${score}/100 ${mentioned ? '(mentioned)' : '(not mentioned)'}`);

    } catch (error) {
      console.error(`   ❌ ${model}: ${error.message}`);
      results.push({
        platform: 'perplexity',
        model: model,
        score: 0,
        status: 'error',
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Query all AI platforms with multiple models
 * Returns best result per platform
 */
async function queryAllPlatforms(businessName, businessType, location) {
  console.log('\n🚀 Starting multi-model AI platform queries...');
  console.log(`   Business: ${businessName}`);
  console.log(`   Type: ${businessType}`);
  console.log(`   Location: ${location}\n`);

  // Query all platforms in parallel
  const [chatgptResults, claudeResults, geminiResults, perplexityResults] = await Promise.all([
    queryChatGPT(businessName, businessType, location),
    queryClaude(businessName, businessType, location),
    queryGemini(businessName, businessType, location),
    queryPerplexity(businessName, businessType, location)
  ]);

  // Pick best result per platform (highest score)
  const pickBest = (results) => {
    const successful = results.filter(r => r.status === 'success');
    if (successful.length === 0) return results[0]; // Return first if all failed
    return successful.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  };

  const platformResults = {
    chatgpt: pickBest(chatgptResults),
    claude: pickBest(claudeResults),
    gemini: pickBest(geminiResults),
    perplexity: pickBest(perplexityResults)
  };

  // Calculate overall metrics
  const allResults = [...chatgptResults, ...claudeResults, ...geminiResults, ...perplexityResults];
  const successful = allResults.filter(r => r.status === 'success');
  const mentioned = successful.filter(r => r.business_mentioned);

  console.log('\n📊 Multi-Model Query Summary:');
  console.log(`   Total Models: ${allResults.length}`);
  console.log(`   Successful: ${successful.length}/${allResults.length}`);
  console.log(`   Business Mentioned: ${mentioned.length}/${successful.length}`);
  console.log(`   Success Rate: ${Math.round(successful.length / allResults.length * 100)}%\n`);

  return {
    platformResults,
    allResults,
    metrics: {
      totalModels: allResults.length,
      successfulQueries: successful.length,
      mentionCount: mentioned.length,
      successRate: Math.round(successful.length / allResults.length * 100)
    }
  };
}

module.exports = {
  MODEL_CONFIG,
  queryChatGPT,
  queryClaude,
  queryGemini,
  queryPerplexity,
  queryAllPlatforms
};