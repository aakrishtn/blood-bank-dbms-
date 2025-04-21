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

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
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
    
    let query = supabase.from('appointments').select('*');
    
    // If userId is provided, filter by it
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ appointments: data });
  } catch (error) {
    console.error('Unexpected error in appointments GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { donorId, appointmentDate, appointmentTime, bloodGroup } = body;
    
    if (!donorId || !appointmentDate || !appointmentTime || !bloodGroup) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
    
    // Create appointment record
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        donor_id: donorId,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        blood_group: bloodGroup,
        status: 'scheduled'
      })
      .select();
    
    if (error) {
      console.error('Error creating appointment:', error);
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Appointment scheduled successfully',
      appointment: data[0]
    });
  } catch (error) {
    console.error('Unexpected error in appointments POST route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { appointmentId, status } = body;
    
    if (!appointmentId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
    
    // Update appointment status
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId)
      .select();
    
    if (error) {
      console.error('Error updating appointment:', error);
      return NextResponse.json(
        { error: 'Failed to update appointment' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Appointment updated successfully',
      appointment: data[0]
    });
  } catch (error) {
    console.error('Unexpected error in appointments PUT route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get appointment ID from URL
    const url = new URL(request.url);
    const appointmentId = url.searchParams.get('id');
    
    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
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
    
    // Delete the appointment
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);
    
    if (error) {
      console.error('Error deleting appointment:', error);
      return NextResponse.json(
        { error: 'Failed to delete appointment' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error in appointments DELETE route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 