import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://uno-game-eta.vercel.app/api/redis-cache';
const API_KEY = 'cruises';

// GET - Fetch cruises data
export async function GET() {
  try {
    console.log('Fetching cruises from external API...');
    
    const response = await fetch(`${API_BASE_URL}?key=${API_KEY}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error('External API error:', response.status, response.statusText);
      
      if (response.status === 404) {
        // Return empty data structure if key doesn't exist
        return NextResponse.json({ 
          caches: [{ data: [] }] 
        });
      }
      
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Successfully fetched cruises data');
    
    // Transform the response to match the expected format
    if (data.data && Array.isArray(data.data)) {
      return NextResponse.json({
        caches: [{ data: data.data }]
      });
    } else {
      // Fallback for unexpected response format
      return NextResponse.json({
        caches: [{ data: [] }]
      });
    }
    
  } catch (error) {
    console.error('Cruise API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : '';
    
    // Return empty data structure on error to prevent app crashes
    if (errorName === 'TimeoutError' || errorMessage.includes('timeout')) {
      return NextResponse.json(
        { 
          error: 'API timeout - external service is slow',
          caches: [{ data: [] }] 
        },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { 
        error: errorMessage || 'Failed to fetch cruises',
        caches: [{ data: [] }] 
      },
      { status: 500 }
    );
  }
}

// POST - Save cruises data (create new or update existing)
export async function POST(request: NextRequest) {
  return await saveOrUpdateCruises(request, 'POST');
}

// PUT - Update cruises data (create new or update existing)  
export async function PUT(request: NextRequest) {
  return await saveOrUpdateCruises(request, 'PUT');
}

// Helper function to handle both POST and PUT with fallback logic
async function saveOrUpdateCruises(request: NextRequest, preferredMethod: 'POST' | 'PUT') {
  try {
    const body = await request.json();
    console.log(`Saving cruises to external API using ${preferredMethod}...`);
    
    // First, try the preferred method
    let response = await fetch(API_BASE_URL, {
      method: preferredMethod,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: API_KEY,
        data: body.data,
        ttl: body.ttl || null,
      }),
      signal: AbortSignal.timeout(15000),
    });

    // If we get 404 on PUT (key doesn't exist), try POST
    if (!response.ok && response.status === 404 && preferredMethod === 'PUT') {
      console.log('Key not found for PUT, trying POST instead...');
      response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: API_KEY,
          data: body.data,
          ttl: body.ttl || null,
        }),
        signal: AbortSignal.timeout(15000),
      });
    }
    
    // If we get 409 on POST (key exists), try PUT
    if (!response.ok && response.status === 409 && preferredMethod === 'POST') {
      console.log('Key already exists for POST, trying PUT instead...');
      response = await fetch(API_BASE_URL, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: API_KEY,
          data: body.data,
          ttl: body.ttl || null,
        }),
        signal: AbortSignal.timeout(15000),
      });
    }

    if (!response.ok) {
      console.error('External API error:', response.status, response.statusText);
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Successfully saved cruises data');
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Cruise save API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : '';
    
    if (errorName === 'TimeoutError' || errorMessage.includes('timeout')) {
      return NextResponse.json(
        { error: 'Save timeout - external service is slow' },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage || 'Failed to save cruises' },
      { status: 500 }
    );
  }
} 