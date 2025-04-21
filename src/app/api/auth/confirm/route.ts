import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

// Create a Supabase client only when the API is called
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and key must be provided in environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
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
    
    // Call our custom database function
    const { data, error } = await supabase.rpc('confirm_user_email', {
      user_email: email
    });
    
    if (error) {
      console.error('Error confirming email:', error);
      return NextResponse.json(
        { error: 'Failed to confirm email' },
        { status: 500 }
      );
    }
    
    if (data === false) {
      return NextResponse.json(
        { error: 'User not found or already confirmed' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Email confirmed successfully' 
    });
  } catch (error) {
    console.error('Unexpected error in confirm route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 