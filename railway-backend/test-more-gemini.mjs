// Quick test for additional Gemini models mentioned in error messages
// Run: node test-more-gemini.mjs

import dotenv from 'dotenv';
dotenv.config();

const GOOGLE_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

console.log('🔑 Using API key:', GOOGLE_API_KEY.substring(0, 8) + '...');
console.log('📍 Testing additional Gemini models...\n');

// Additional models to test based on error hints
const ADDITIONAL_MODELS = [
  'gemini-2.5-pro-preview-03-25',  // Mentioned in quota error
  'gemini-2.0-flash-exp',           // Already know this works
  'gemini-2.0-flash',               // Try without -exp
  'gemini-2.0-pro-exp',             // Try pro version
  'gemini-2.0-pro',                 // Try pro without -exp
  'gemini-flash-exp',               // Try shorthand
  'gemini-pro-exp',                 // Try shorthand
];

const TEST_PROMPT = 'What is 2+2? Answer in one word.';

async function testModel(modelName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GOOGLE_API_KEY}`;
  
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
      console.log(`✅ ${modelName.padEnd(35)} → Working! Answer: "${answer.trim().substring(0, 50)}"`);
      return { success: true, model: modelName };
    } else {
      console.log(`❌ ${modelName.padEnd(35)} → ${response.status} - ${data.error?.message || 'Unknown error'}`);
      return { success: false, model: modelName };
    }
  } catch (error) {
    console.log(`❌ ${modelName.padEnd(35)} → Error: ${error.message}`);
    return { success: false, model: modelName };
  }
}

async function runTests() {
  console.log('🔄 Testing models on v1beta endpoint:\n');
  
  const working = [];
  
  for (const model of ADDITIONAL_MODELS) {
    const result = await testModel(model);
    if (result.success) {
      working.push(result.model);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n\n📊 RESULTS:');
  console.log('━'.repeat(60));
  console.log(`✅ Working Models: ${working.length}`);
  
  if (working.length > 0) {
    console.log('\n🎉 Copy this to your MODEL_CONFIG:');
    console.log('━'.repeat(60));
    console.log('gemini: [');
    working.forEach((model, idx) => {
      const comma = idx < working.length - 1 ? ',' : '';
      console.log(`  '${model}'${comma}`);
    });
    console.log(']');
  }
}

runTests().catch(console.error);
