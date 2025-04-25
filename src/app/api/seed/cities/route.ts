import { NextResponse } from 'next/server';

// US cities array
const cities = [
  { city_id: 'NYC', city_name: 'New York City' },
  { city_id: 'LA', city_name: 'Los Angeles' },
  { city_id: 'CHI', city_name: 'Chicago' },
  { city_id: 'HOU', city_name: 'Houston' },
  { city_id: 'PHX', city_name: 'Phoenix' },
  { city_id: 'PHI', city_name: 'Philadelphia' },
  { city_id: 'SAT', city_name: 'San Antonio' },
  { city_id: 'SD', city_name: 'San Diego' },
  { city_id: 'DAL', city_name: 'Dallas' },
  { city_id: 'SJ', city_name: 'San Jose' }
];

export async function GET() {
  try {
    // Simply return the static list of cities
    return NextResponse.json({ cities }, { status: 200 });
  } catch (error) {
    console.error('Error in cities endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 