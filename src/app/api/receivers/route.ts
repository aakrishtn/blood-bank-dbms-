import { NextRequest, NextResponse } from 'next/server';
import { receiverAPI } from '@/lib/database';
import { supabase } from '@/lib/supabase';

// GET /api/receivers - Get all receivers or filter by blood group
export async function GET(request: NextRequest) {
  try {
    // Check authentication with Supabase
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const bloodGroup = searchParams.get('bloodGroup');
    const receiverId = searchParams.get('receiverId');

    let data;
    if (receiverId) {
      data = await receiverAPI.getReceiverById(receiverId);
    } else if (bloodGroup) {
      data = await receiverAPI.getReceiversByBloodGroup(bloodGroup);
    } else {
      data = await receiverAPI.getAllReceivers();
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/receivers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receivers' },
      { status: 500 }
    );
  }
}

// POST /api/receivers - Create a new receiver
export async function POST(request: NextRequest) {
  try {
    // Check authentication with Supabase
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const requiredFields = ['receiver_id', 'receiver_name', 'r_age', 'r_bgrp', 'r_sex', 'r_reg_date'];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const data = await receiverAPI.addReceiver(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/receivers:', error);
    return NextResponse.json(
      { error: 'Failed to create receiver' },
      { status: 500 }
    );
  }
}

// PATCH /api/receivers/:receiverId - Update a receiver
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication with Supabase
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, ...updateData } = body;

    if (!receiverId) {
      return NextResponse.json(
        { error: 'Receiver ID is required' },
        { status: 400 }
      );
    }

    const data = await receiverAPI.updateReceiver(receiverId, updateData);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/receivers:', error);
    return NextResponse.json(
      { error: 'Failed to update receiver' },
      { status: 500 }
    );
  }
}

// DELETE /api/receivers/:receiverId - Delete a receiver
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication with Supabase
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const receiverId = searchParams.get('receiverId');

    if (!receiverId) {
      return NextResponse.json(
        { error: 'Receiver ID is required' },
        { status: 400 }
      );
    }

    await receiverAPI.deleteReceiver(receiverId);
    return NextResponse.json({ message: 'Receiver deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/receivers:', error);
    return NextResponse.json(
      { error: 'Failed to delete receiver' },
      { status: 500 }
    );
  }
} 