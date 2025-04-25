import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { donor_id, receiver_id, appointment_date, blood_center_id, notes } = await request.json();

    // Validate required fields
    if (!donor_id || !receiver_id || !appointment_date || !blood_center_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the appointment
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        donor_id,
        receiver_id,
        appointment_date,
        blood_center_id,
        notes,
        status: 'pending'
      })
      .select(`
        *,
        blood_center:blood_center_id (
          center_name,
          address
        ),
        receiver:receiver_id (
          receiver_name,
          r_bgrp
        )
      `)
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in appointments API:', error);
    return NextResponse.json(
      { error: 'Server error creating appointment' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const donorId = searchParams.get('donor_id');
    const receiverId = searchParams.get('receiver_id');

    let query = supabase
      .from('appointments')
      .select(`
        *,
        blood_center:blood_center_id (
          center_name,
          address
        ),
        receiver:receiver_id (
          receiver_name,
          r_bgrp
        )
      `);

    if (donorId) {
      query = query.eq('donor_id', donorId);
    }

    if (receiverId) {
      query = query.eq('receiver_id', receiverId);
    }

    const { data, error } = await query.order('appointment_date', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in appointments API:', error);
    return NextResponse.json(
      { error: 'Server error fetching appointments' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { appointment_id, status } = await request.json();

    if (!appointment_id || !status) {
      return NextResponse.json(
        { error: 'Appointment ID and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('appointment_id', appointment_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      return NextResponse.json(
        { error: 'Failed to update appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in appointments API:', error);
    return NextResponse.json(
      { error: 'Server error updating appointment' },
      { status: 500 }
    );
  }
} 