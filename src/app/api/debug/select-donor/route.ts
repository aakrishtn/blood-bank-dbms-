import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const donorId = formData.get('donorId');
    
    if (!donorId) {
      return NextResponse.json({ error: 'Donor ID is required' }, { status: 400 });
    }
    
    // Use the server-side Supabase client instead
    const supabase = createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Update user metadata with the selected donor ID
    const { error } = await supabase.auth.updateUser({
      data: { donorId }
    });
    
    if (error) {
      console.error('Error updating user metadata:', error);
      return NextResponse.json({ error: 'Failed to update user metadata' }, { status: 500 });
    }
    
    // Redirect back to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
    
  } catch (error) {
    console.error('Error in select-donor route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 