// Test Claude models to find working ones
// Run: node test-claude-models.mjs

import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY not found in environment');
  process.exit(1);
}

console.log('🔑 API Key found:', ANTHROPIC_API_KEY.substring(0, 10) + '...');
console.log('📍 Testing Claude models...\n');

// Models to test - including current ones and alternatives
const MODELS_TO_TEST = [
  // Current Claude 4/Sonnet 4 models
  'claude-sonnet-4-5-20250929',     // Currently working
  'claude-sonnet-4-20250514',       // Alternative date
  'claude-4-sonnet-20250514',       // Alternative naming
  
  // Claude 3.5 Sonnet models
  'claude-3-5-sonnet-20241022',     // Latest version
  'claude-3-5-sonnet-20240620',     // Current in config
  'claude-3-5-sonnet-latest',       // Latest alias
  
  // Claude 3 Opus models
  'claude-3-opus-20240229',         // Original Opus
  'claude-3-opus-20240307',         // Current in config (likely wrong date)
  'claude-3-opus-latest',           // Latest alias
  
  // Claude 3 Haiku (cheaper, faster)
  'claude-3-haiku-20240307',        // Haiku model
  'claude-3-5-haiku-20241022',      // Newest Haiku
  
  // Older stable models
  'claude-3-sonnet-20240229',       // Original Claude 3 Sonnet
];

const TEST_PROMPT = 'What is 2+2? Answer in one word.';

async function testModel(modelName) {
  try {
    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY
    });

    const message = await anthropic.messages.create({
      model: modelName,
      max_tokens: 50,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: TEST_PROMPT
        }
      ]
    });

    const response = message.content[0].text;
    console.log(`✅ ${modelName.padEnd(40)} → Working! Answer: "${response.trim()}"`);
    return { success: true, model: modelName, response };

  } catch (error) {
    const errorMsg = error.message || error.error?.message || 'Unknown error';
    console.log(`❌ ${modelName.padEnd(40)} → ${error.status || 'Error'} - ${errorMsg}`);
    return { success: false, model: modelName, error: errorMsg };
  }
}

async function runTests() {
  console.log('🔄 Testing all Claude models:\n');
  
  const results = {
    working: [],
    failing: []
  };
  
  for (const model of MODELS_TO_TEST) {
    const result = await testModel(model);
    
    if (result.success) {
      results.working.push(result.model);
    } else {
      results.failing.push({ model: result.model, error: result.error });
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n\n📊 SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Working Models: ${results.working.length}`);
  console.log(`❌ Failed Models: ${results.failing.length}`);
  
  if (results.working.length > 0) {
    console.log('\n\n🎉 WORKING MODELS TO USE IN PRODUCTION:');
    console.log('━'.repeat(60));
    
    results.working.forEach(model => {
      console.log(`  - '${model}'`);
    });
    
    console.log('\n\n📝 Copy this to your MODEL_CONFIG:');
    console.log('━'.repeat(60));
    console.log('claude: [');
    
    // Show top 3 working models
    const topModels = results.working.slice(0, 3);
    topModels.forEach((model, idx) => {
      const comma = idx < topModels.length - 1 ? ',' : '';
      console.log(`  '${model}'${comma}`);
    });
    console.log(']');
    
  } else {
    console.log('\n\n⛔ NO WORKING MODELS FOUND');
    console.log('━'.repeat(60));
    console.log('This is unexpected - please check:');
    console.log('1. API key is valid');
    console.log('2. Account has API access enabled');
    console.log('3. Billing is configured');
  }
  
  // Show common error patterns
  if (results.failing.length > 0) {
    console.log('\n\n🔍 COMMON ERRORS:');
    console.log('━'.repeat(60));
    
    const errorCounts = results.failing.reduce((acc, r) => {
      const key = r.error.substring(0, 80);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([error, count]) => {
        console.log(`${count}x ${error}...`);
      });
  }
}

runTests().catch(console.error);