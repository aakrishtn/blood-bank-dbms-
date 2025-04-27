import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // Check for API key in request (for security)
    const { sql, apiKey } = await request.json();
    
    // Check API key (simple security measure)
    const expectedApiKey = process.env.SEED_API_KEY || 'development-seed-key';
    if (apiKey !== expectedApiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid API key' 
      }, { status: 401 });
    }
    
    // Validate SQL input
    if (!sql || typeof sql !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: 'SQL command is required' 
      }, { status: 400 });
    }
    
    // Create Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required environment variables for Supabase' 
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    
    // Execute the SQL command
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message || 'Error executing SQL command' 
      }, { status: 500 });
    }
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'SQL command executed successfully',
      data
    });
    
  } catch (error) {
    console.error('Error in execute-sql API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 