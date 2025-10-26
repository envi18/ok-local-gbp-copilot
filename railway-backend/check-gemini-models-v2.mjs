// Comprehensive Gemini Model Checker - ES Module Version
// Run: node check-gemini-models-v2.mjs

import dotenv from 'dotenv';
dotenv.config();

// Use GEMINI_API_KEY if available, fallback to GOOGLE_API_KEY
const GOOGLE_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error('❌ Neither GEMINI_API_KEY nor GOOGLE_API_KEY found in environment');
  process.exit(1);
}

const keySource = process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : 'GOOGLE_API_KEY';
console.log(`🔑 Using ${keySource}:`, GOOGLE_API_KEY.substring(0, 8) + '...');
console.log('📍 Testing Gemini API endpoints and models...\n');

// Models to test
const MODELS_TO_TEST = [
  // Current stable models (v1.5)
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest',
  
  // Older stable models (v1.0)
  'gemini-1.0-pro',
  'gemini-1.0-pro-001',
  'gemini-1.0-pro-latest',
  'gemini-pro',
  
  // Vision models
  'gemini-pro-vision',
  'gemini-1.0-pro-vision',
  'gemini-1.5-pro-vision',
  
  // Experimental/newest
  'gemini-2.0-flash-exp',
  'gemini-exp-1206',
  'gemini-exp-1114'
];

// Endpoints to test
const ENDPOINTS = [
  { name: 'v1', url: 'https://generativelanguage.googleapis.com/v1' },
  { name: 'v1beta', url: 'https://generativelanguage.googleapis.com/v1beta' }
];

// Test prompt
const TEST_PROMPT = 'What is 2+2? Answer in one word.';

async function testModel(endpoint, modelName) {
  const url = `${endpoint.url}/models/${modelName}:generateContent?key=${GOOGLE_API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: TEST_PROMPT }]
        }]
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.candidates && data.candidates[0]) {
      const answer = data.candidates[0].content.parts[0].text;
      return { 
        success: true, 
        endpoint: endpoint.name,
        model: modelName,
        answer: answer.trim().substring(0, 50)
      };
    } else {
      return { 
        success: false, 
        endpoint: endpoint.name,
        model: modelName,
        error: data.error?.message || 'Unknown error',
        status: response.status
      };
    }
  } catch (error) {
    return { 
      success: false, 
      endpoint: endpoint.name,
      model: modelName,
      error: error.message,
      status: 'network_error'
    };
  }
}

async function runTests() {
  const results = {
    working: [],
    failing: []
  };
  
  console.log('🔄 Testing all combinations...\n');
  
  for (const endpoint of ENDPOINTS) {
    console.log(`\n📡 Testing ${endpoint.name} endpoint:`);
    console.log('━'.repeat(60));
    
    for (const model of MODELS_TO_TEST) {
      const result = await testModel(endpoint, model);
      
      if (result.success) {
        console.log(`✅ ${model.padEnd(30)} → Working! Answer: "${result.answer}"`);
        results.working.push(result);
      } else {
        console.log(`❌ ${model.padEnd(30)} → ${result.status} - ${result.error}`);
        results.failing.push(result);
      }
      
      // Rate limiting: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Summary
  console.log('\n\n📊 SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Working Models: ${results.working.length}`);
  console.log(`❌ Failed Models: ${results.failing.length}`);
  
  if (results.working.length > 0) {
    console.log('\n\n🎉 WORKING MODELS TO USE IN PRODUCTION:');
    console.log('━'.repeat(60));
    
    // Group by endpoint
    const byEndpoint = results.working.reduce((acc, r) => {
      if (!acc[r.endpoint]) acc[r.endpoint] = [];
      acc[r.endpoint].push(r.model);
      return acc;
    }, {});
    
    for (const [endpoint, models] of Object.entries(byEndpoint)) {
      console.log(`\n${endpoint} endpoint:`);
      models.forEach(model => {
        console.log(`  - '${model}'`);
      });
    }
    
    console.log('\n\n📝 Copy this to aiPlatformQuery.js MODEL_CONFIG:');
    console.log('━'.repeat(60));
    console.log('gemini: [');
    
    // Show top 3 working models
    const topModels = results.working.slice(0, 3);
    topModels.forEach((result, idx) => {
      const comma = idx < topModels.length - 1 ? ',' : '';
      console.log(`  '${result.model}'${comma}  // ${result.endpoint} endpoint`);
    });
    console.log(']');
    
    // Check if we need to modify the query function
    const needsBeta = results.working.some(r => r.endpoint === 'v1beta');
    const hasV1 = results.working.some(r => r.endpoint === 'v1');
    
    if (needsBeta && !hasV1) {
      console.log('\n⚠️  WARNING: All working models use v1beta endpoint!');
      console.log('You need to update the queryGemini() function to use:');
      console.log('https://generativelanguage.googleapis.com/v1beta/');
    } else if (needsBeta && hasV1) {
      console.log('\n💡 TIP: Both v1 and v1beta have working models.');
      console.log('Recommend using v1 models for stability.');
    }
    
  } else {
    console.log('\n\n⛔ NO WORKING MODELS FOUND');
    console.log('━'.repeat(60));
    console.log('Possible issues:');
    console.log('1. API key needs to be created from Google AI Studio');
    console.log('   → https://aistudio.google.com/app/apikey');
    console.log('2. Project may need Gemini access approval (waitlist)');
    console.log('3. Billing may not be enabled on the project');
    console.log('4. Regional restrictions may apply');
    console.log('\nCheck Google Cloud Console:');
    console.log('→ APIs & Services > Enabled APIs');
    console.log('→ Billing > Check if billing is active');
    console.log('→ IAM & Admin > Quotas (check for Gemini quotas)');
  }
  
  // Show common error patterns
  if (results.failing.length > 0) {
    console.log('\n\n🔍 COMMON ERRORS:');
    console.log('━'.repeat(60));
    
    const errorCounts = results.failing.reduce((acc, r) => {
      const key = `${r.status}: ${r.error}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([error, count]) => {
        console.log(`${count}x ${error}`);
      });
  }
}

// Run the tests
runTests().catch(console.error);
