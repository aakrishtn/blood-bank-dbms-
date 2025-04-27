import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Check if any blood centers already exist
    const { data: existingCenters, error: checkError } = await supabase
      .from('blood_center')
      .select('center_id')
      .limit(1);
    
    if (checkError) {
      console.error('Error checking existing blood centers:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    // If blood centers already exist, return them
    if (existingCenters && existingCenters.length > 0) {
      const { data, error } = await supabase
        .from('blood_center')
        .select('*');
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ centers: data });
    }
    
    // Default blood centers to seed
    const defaultCenters = [
      {
        center_id: 'BC001',
        center_name: 'Central Blood Bank',
        address: '123 Main Street, New York, NY 10001',
        city_id: 'NYC',
        phone: '(212) 555-1234',
        operating_hours: '9:00 AM - 5:00 PM',
        available_services: ['Blood Donation', 'Plasma Donation']
      },
      {
        center_id: 'BC002',
        center_name: 'LifeSource Blood Center',
        address: '456 Medical Drive, Los Angeles, CA 90001',
        city_id: 'LA',
        phone: '(310) 555-6789',
        operating_hours: '8:00 AM - 6:00 PM',
        available_services: ['Blood Donation', 'Plasma Donation', 'Platelet Donation']
      },
      {
        center_id: 'BC003',
        center_name: 'Red Cross Donation Center',
        address: '789 Health Avenue, Chicago, IL 60601',
        city_id: 'CHI',
        phone: '(312) 555-9012',
        operating_hours: '10:00 AM - 7:00 PM',
        available_services: ['Blood Donation', 'Blood Testing']
      }
    ];
    
    // Insert blood centers
    const { data, error } = await supabase
      .from('blood_center')
      .insert(defaultCenters)
      .select();
    
    if (error) {
      console.error('Error seeding blood centers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'Blood centers seeded successfully',
      centers: data 
    });
    
  } catch (error: unknown) {
    console.error('Unexpected error seeding blood centers:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 