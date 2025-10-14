import { testAllPlatforms } from '../lib/aiPlatforms/testPlatforms';
import './loadEnv'; // Add this at the very top

async function runTests() {
  const results = await testAllPlatforms();
  console.log('\n🎉 Testing complete!');
  console.log('\nResults:', results);
}

runTests();