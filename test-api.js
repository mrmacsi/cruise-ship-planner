// Test script to diagnose CORS issues with the external API
const API_BASE_URL = 'https://uno-game-eta.vercel.app/api/redis-cache';
const API_KEY = 'cruises';

console.log('Testing API endpoints...\n');

// Test 1: Basic fetch to check CORS headers
async function testBasicFetch() {
  console.log('🔍 Test 1: Basic fetch to external API');
  try {
    const response = await fetch(`${API_BASE_URL}?key=${API_KEY}`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    console.log('✅ Status:', response.status);
    console.log('✅ Headers:');
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase().includes('cors') || key.toLowerCase().includes('access-control')) {
        console.log(`   ${key}: ${value}`);
      }
    }
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Data received:', typeof data, Object.keys(data));
    } else {
      console.log('❌ Response not OK:', response.statusText);
    }
  } catch (error) {
    console.log('❌ Fetch error:', error.message);
    console.log('❌ Error type:', error.name);
  }
  console.log('');
}

// Test 2: Test with no-cors mode
async function testNoCors() {
  console.log('🔍 Test 2: Fetch with no-cors mode');
  try {
    const response = await fetch(`${API_BASE_URL}?key=${API_KEY}`, {
      method: 'GET',
      mode: 'no-cors',
    });
    
    console.log('✅ Status:', response.status);
    console.log('✅ Type:', response.type);
    console.log('✅ Body readable:', response.body !== null);
  } catch (error) {
    console.log('❌ No-cors error:', error.message);
  }
  console.log('');
}

// Test 3: Test POST request (for admin functions)
async function testPostRequest() {
  console.log('🔍 Test 3: POST request test');
  try {
    const testData = {
      key: API_KEY,
      data: [{ "Ship Name": "Test Ship", "Duration": "7 Nights" }],
      ttl: null
    };
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('✅ POST Status:', response.status);
    console.log('✅ POST Headers:');
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase().includes('cors') || key.toLowerCase().includes('access-control')) {
        console.log(`   ${key}: ${value}`);
      }
    }
  } catch (error) {
    console.log('❌ POST error:', error.message);
  }
  console.log('');
}

// Test 4: Check if it's a browser-specific issue
async function testFromNode() {
  console.log('🔍 Test 4: Node.js fetch (simulating server-side)');
  try {
    // This simulates how it would work in a server environment
    const response = await fetch(`${API_BASE_URL}?key=${API_KEY}`);
    console.log('✅ Node fetch status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Data structure:', Object.keys(data));
      if (data.caches && data.caches[0]) {
        console.log('✅ First cache data count:', data.caches[0].data?.length || 0);
      }
    }
  } catch (error) {
    console.log('❌ Node fetch error:', error.message);
  }
  console.log('');
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting CORS diagnostics...\n');
  
  await testBasicFetch();
  await testNoCors();
  await testPostRequest();
  await testFromNode();
  
  console.log('📋 Summary:');
  console.log('- If Test 1 fails with CORS error: External API needs CORS headers');
  console.log('- If Test 2 works: We can use no-cors mode (but no response data)');
  console.log('- If Test 4 works: We need to proxy through our API routes');
  console.log('- If all fail: External API might be down or changed');
}

// Export for use in browser or run directly in Node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, testBasicFetch, testFromNode };
} else {
  // Run in browser console
  runAllTests();
} 