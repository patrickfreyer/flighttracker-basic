import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

// Define the route data schema
const RouteData = z.object({
  departure: z.object({
    code: z.string(),
    name: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  }),
  arrival: z.object({
    code: z.string(),
    name: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  }),
  distance: z.number().optional(),
  bearing: z.number().optional(),
});

// Initialize OpenAI client
let openai: OpenAI;

// Initialize OpenAI client if API key is available
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const departureCode = searchParams.get('departure');
    const arrivalCode = searchParams.get('arrival');
    
    if (!departureCode || !arrivalCode) {
      return NextResponse.json(
        { error: 'Both departure and arrival airport codes are required' }, 
        { status: 400 }
      );
    }
    
    // Check if OpenAI client is initialized
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' }, 
        { status: 500 }
      );
    }
    
    // Call OpenAI to get airport data
    try {
      const completion = await openai.beta.chat.completions.parse({
        model: "gpt-4o-2024-08-06",
        messages: [
          {
            role: "system",
            content: 
              "You are a flight route information system. Provide accurate airport coordinates and calculate route information."
          },
          {
            role: "user",
            content: 
              `Provide the coordinates (latitude and longitude) for airports ${departureCode} and ${arrivalCode}. 
               Include the full airport name, calculate the bearing (direction in degrees) from departure to arrival airport,
               and the distance in kilometers.`
          }
        ],
        response_format: zodResponseFormat(RouteData, "routeData"),
      });

      return NextResponse.json(completion.choices[0].message.parsed);
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      return NextResponse.json(
        { error: 'Failed to fetch airport coordinates' }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in route-data API:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 