import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { donorAPI } from '@/lib/database';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// This endpoint uses the service role key which has admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // Get the URL and extract any query parameters
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Get user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      return NextResponse.json(
        { error: 'Failed to fetch users', details: userError.message },
        { status: 500 }
      );
    }

    // Find the user with the matching email
    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found with the provided email' },
        { status: 404 }
      );
    }

    // Get all donors to find potential matches
    const donors = await donorAPI.getAllDonors();
    
    // Try different matching strategies
    const directMatch = donors.find(donor => 
      (donor.donor_phno === user.email) || 
      (donor.donor_name && user.user_metadata?.name && 
        donor.donor_name.toLowerCase() === user.user_metadata.name.toLowerCase())
    );
    
    const caseInsensitiveMatch = donors.find(donor => 
      (donor.donor_phno && user.email && 
        donor.donor_phno.toLowerCase() === user.email.toLowerCase())
    );
    
    const partialMatch = donors.find(donor => 
      (donor.donor_phno && user.email && 
        (user.email.toLowerCase().includes(donor.donor_phno.toLowerCase()) ||
         donor.donor_phno.toLowerCase().includes(user.email.toLowerCase())))
    );
    
    // Get the most recent donor (if any exist)
    let recentDonor = null;
    if (donors.length > 0) {
      const sortedDonors = [...donors].sort((a, b) => {
        const aId = a.donor_id.slice(1); // Remove the 'D' prefix
        const bId = b.donor_id.slice(1);
        return parseInt(bId) - parseInt(aId); // Descending order (newest first)
      });
      recentDonor = sortedDonors[0];
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
        created_at: user.created_at
      },
      donors: {
        total: donors.length,
        directMatch: directMatch || null,
        caseInsensitiveMatch: caseInsensitiveMatch || null,
        partialMatch: partialMatch || null,
        recentDonor: recentDonor || null,
        allDonors: donors.map(d => ({ 
          id: d.donor_id,
          name: d.donor_name,
          phone: d.donor_phno,
          bloodGroup: d.donor_bgrp
        }))
      }
    });
    
  } catch (error) {
    console.error('Error in debug API:', error);
    return NextResponse.json(
      { error: 'Server error in debug API', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 