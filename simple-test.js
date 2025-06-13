// Simple Node.js test for the external API
const API_BASE_URL = 'https://uno-game-eta.vercel.app/api/redis-cache';
const API_KEY = 'cruises';

async function testExternalAPI() {
  console.log('🔍 Testing external API from Node.js...');
  
  try {
    const response = await fetch(`${API_BASE_URL}?key=${API_KEY}`);
    console.log('✅ Status:', response.status);
    console.log('✅ Status Text:', response.statusText);
    console.log('✅ Headers:');
    
    // Check CORS headers
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers',
      'access-control-allow-credentials'
    ];
    
    corsHeaders.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        console.log(`   ${header}: ${value}`);
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Data received successfully');
      console.log('✅ Data type:', typeof data);
      console.log('✅ Data keys:', Object.keys(data));
      
      if (data.caches && Array.isArray(data.caches) && data.caches[0]) {
        console.log('✅ Cache data found:', data.caches[0].data?.length || 0, 'items');
      }
    } else {
      console.log('❌ Response not OK');
      const text = await response.text();
      console.log('Response body:', text.substring(0, 200));
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('❌ Error type:', error.constructor.name);
    
    // Check if it's a CORS error
    if (error.message.includes('CORS') || error.message.includes('fetch')) {
      console.log('💡 This appears to be a CORS-related error');
      console.log('💡 The external API likely doesn\'t allow browser requests from your domain');
    }
  }
}

testExternalAPI(); 