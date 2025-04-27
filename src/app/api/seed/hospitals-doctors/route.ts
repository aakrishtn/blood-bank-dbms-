import { NextResponse } from 'next/server';
import { seedHospitalsAndDoctors } from '@/lib/hospital';

export async function GET() {
  try {
    // Seed hospitals and doctors
    const success = await seedHospitalsAndDoctors();
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Successfully seeded hospitals and doctors'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to seed hospitals and doctors'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error seeding hospitals and doctors:', error);
    return NextResponse.json({
      success: false,
      error: 'Error seeding hospitals and doctors'
    }, { status: 500 });
  }
} 