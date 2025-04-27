import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// This endpoint uses the service role key which has admin privileges
// Only use this for secure server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { userId, role, donorDetails, receiverDetails } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    // Validate that role is one of the allowed values
    const validRoles = ['donor', 'receiver', 'staff', 'doctor', 'manager'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Create metadata object with role
    const userMetadata: { 
      role: string; 
      donorId?: string; 
      donorName?: string;
      donorBloodGroup?: string;
      donorAge?: number;
      hospitalId?: string;
      doctorId?: string;
      doctorName?: string;
      receiverId?: string;
      receiverName?: string;
      receiverBloodGroup?: string;
      receiverAge?: number;
    } = { role };

    // If donor details are provided, add them to the metadata
    if (donorDetails && role === 'donor') {
      // Add selected donor details to user metadata for easier profile matching
      userMetadata.donorId = donorDetails.donor_id;
      userMetadata.donorName = donorDetails.donor_name;
      userMetadata.donorBloodGroup = donorDetails.donor_bgrp;
      userMetadata.donorAge = donorDetails.donor_age;
      
      // Add hospital and doctor information if provided
      if (donorDetails.hospital_id) {
        userMetadata.hospitalId = donorDetails.hospital_id;
      }
      
      if (donorDetails.doctor_id) {
        userMetadata.doctorId = donorDetails.doctor_id;
      }
      
      if (donorDetails.doctor_name) {
        userMetadata.doctorName = donorDetails.doctor_name;
      }
    }

    // If receiver details are provided, add them to the metadata
    if (receiverDetails && role === 'receiver') {
      // Add receiver details to user metadata for easier profile matching
      userMetadata.receiverId = receiverDetails.receiver_id;
      userMetadata.receiverName = receiverDetails.receiver_name;
      userMetadata.receiverBloodGroup = receiverDetails.r_bgrp;
      userMetadata.receiverAge = receiverDetails.r_age;
    }

    // Update user metadata in Supabase auth
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { 
        user_metadata: userMetadata
      }
    );

    if (error) {
      console.error('Error updating user role:', error);
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'User role updated successfully', user: data.user },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in update-role API:', error);
    return NextResponse.json(
      { error: 'Server error updating user role' },
      { status: 500 }
    );
  }
} 