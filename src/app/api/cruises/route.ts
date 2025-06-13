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
    
    return NextResponse.json(data);
    
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

// POST - Save cruises data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Saving cruises to external API...');
    
    const response = await fetch(API_BASE_URL, {
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
      // Add timeout
      signal: AbortSignal.timeout(15000), // 15 second timeout for saves
    });

    if (!response.ok) {
      console.error('External API POST error:', response.status, response.statusText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
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

// PUT - Update cruises data  
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Updating cruises in external API...');
    
    const response = await fetch(API_BASE_URL, {
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

    if (!response.ok) {
      console.error('External API PUT error:', response.status, response.statusText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Successfully updated cruises data');
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Cruise update API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : '';
    
    if (errorName === 'TimeoutError' || errorMessage.includes('timeout')) {
      return NextResponse.json(
        { error: 'Update timeout - external service is slow' },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage || 'Failed to update cruises' },
      { status: 500 }
    );
  }
} 