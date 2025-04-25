import { NextRequest, NextResponse } from 'next/server';
import { receiverAPI } from '@/lib/database';
import { supabase } from '@/lib/supabase';

// POST /api/receivers/:receiverId/match - Match donors for a receiver
export async function POST(
  request: NextRequest,
  { params }: { params: { receiverId: string } }
) {
  try {
    // Check authentication with Supabase
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiverId } = params;
    if (!receiverId) {
      return NextResponse.json(
        { error: 'Receiver ID is required' },
        { status: 400 }
      );
    }

    const data = await receiverAPI.matchDonors(receiverId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/receivers/:receiverId/match:', error);
    return NextResponse.json(
      { error: 'Failed to match donors' },
      { status: 500 }
    );
  }
} 