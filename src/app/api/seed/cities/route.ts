import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client only when the API is called
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and key must be provided in environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

// Cities data to seed
const citiesData = [
  { city_id: 'C001', city_name: 'New York' },
  { city_id: 'C002', city_name: 'Los Angeles' },
  { city_id: 'C003', city_name: 'Chicago' },
  { city_id: 'C004', city_name: 'Houston' },
  { city_id: 'C005', city_name: 'Phoenix' },
  { city_id: 'C006', city_name: 'Philadelphia' },
  { city_id: 'C007', city_name: 'San Antonio' },
  { city_id: 'C008', city_name: 'San Diego' },
  { city_id: 'C009', city_name: 'Dallas' },
  { city_id: 'C010', city_name: 'San Jose' },
  { city_id: 'C011', city_name: 'Austin' },
  { city_id: 'C012', city_name: 'Jacksonville' },
  { city_id: 'C013', city_name: 'San Francisco' },
  { city_id: 'C014', city_name: 'Columbus' },
  { city_id: 'C015', city_name: 'Indianapolis' },
  { city_id: 'C016', city_name: 'Seattle' },
  { city_id: 'C017', city_name: 'Denver' },
  { city_id: 'C018', city_name: 'Washington D.C.' },
  { city_id: 'C019', city_name: 'Boston' },
  { city_id: 'C020', city_name: 'Nashville' }
];

export async function GET() {
  try {
    // Create the Supabase client
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Check if cities table has data
    const { data: existingCities, error: countError } = await supabase
      .from('city')
      .select('*')
      .limit(1);
    
    if (countError) {
      console.error('Error checking cities:', countError);
      return NextResponse.json(
        { error: 'Failed to check cities table' },
        { status: 500 }
      );
    }
    
    // If cities exist already, return that info
    if (existingCities && existingCities.length > 0) {
      return NextResponse.json({
        message: 'Cities already exist in the database',
        count: existingCities.length,
        sample: existingCities[0]
      });
    }
    
    // If no cities exist, add the seed data
    const { error } = await supabase
      .from('city')
      .insert(citiesData)
      .select();
    
    if (error) {
      console.error('Error adding cities:', error);
      return NextResponse.json(
        { error: 'Failed to seed cities' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully seeded cities data',
      count: citiesData.length
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 