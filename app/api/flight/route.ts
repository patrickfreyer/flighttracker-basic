import { NextRequest, NextResponse } from 'next/server';

// Get API key from environment variables
const API_KEY = process.env.NEXT_PUBLIC_AVIATIONSTACK_API_KEY;

export async function GET(request: NextRequest) {
  try {
    // Check if API key is available
    if (!API_KEY) {
      return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const flightNumber = searchParams.get('flight_number');
    
    if (!flightNumber) {
      return NextResponse.json({ error: 'Flight number is required' }, { status: 400 });
    }
    
    // Extract airline code and flight number
    // Format typically is: AA123, BA456, etc.
    let airlineCode = '';
    let flightNum = '';
    
    // Basic regex to extract airline code (letters) and flight number (digits)
    const match = flightNumber.match(/^([A-Za-z]+)(\d+)$/);
    if (match) {
      airlineCode = match[1];
      flightNum = match[2];
    } else {
      return NextResponse.json({ error: 'Invalid flight number format' }, { status: 400 });
    }
    
    // Make a request to the Aviationstack API
    const apiUrl = `https://api.aviationstack.com/v1/flights?access_key=${API_KEY}&flight_number=${flightNum}&airline_iata=${airlineCode}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: data.error?.info || 'Failed to fetch flight data' }, { status: response.status });
    }
    
    // Check if any flights were found
    if (!data.data || data.data.length === 0) {
      return NextResponse.json({ error: 'No flight found with that number' }, { status: 404 });
    }
    
    // Process the first flight data to match our existing format
    const flight = data.data[0];
    
    // Extract and format the data to maintain compatibility with our frontend
    const formattedFlight = {
      flight_number: flight.flight.number,
      flight_iata: flight.flight.iata,
      flight_icao: flight.flight.icao,
      dep_iata: flight.departure.iata,
      dep_icao: flight.departure.icao,
      arr_iata: flight.arrival.iata,
      arr_icao: flight.arrival.icao,
      airline_iata: flight.airline.iata,
      airline_icao: flight.airline.icao,
      lat: flight.live?.latitude || null,
      lng: flight.live?.longitude || null,
      alt: flight.live?.altitude || null,
      speed: flight.live?.speed_horizontal || null,
      status: flight.flight_status,
    };
    
    return NextResponse.json(formattedFlight);
  } catch (error) {
    console.error('Error fetching flight data:', error);
    return NextResponse.json({ error: 'Failed to fetch flight data' }, { status: 500 });
  }
} 