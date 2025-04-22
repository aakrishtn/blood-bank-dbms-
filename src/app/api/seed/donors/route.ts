import { NextResponse } from 'next/server';
import { donorAPI, cityAPI } from '@/lib/database';

export async function GET() {
  try {
    // Get the first city to use for all donors
    const cities = await cityAPI.getAllCities();
    const cityId = cities.length > 0 ? cities[0].city_id : null;

    if (!cityId) {
      return NextResponse.json({ 
        error: 'No cities found. Please seed cities first.' 
      }, { status: 400 });
    }

    // Define test donors with different blood types
    const testDonors = [
      {
        donor_id: `D${Date.now()}1`,
        donor_name: 'John Donor',
        donor_age: 28,
        donor_bgrp: 'O+',
        donor_sex: 'M',
        donor_phno: '5551234001',
        city_id: cityId
      },
      {
        donor_id: `D${Date.now()}2`,
        donor_name: 'Jane Donor',
        donor_age: 32,
        donor_bgrp: 'A+',
        donor_sex: 'F',
        donor_phno: '5551234002',
        city_id: cityId
      },
      {
        donor_id: `D${Date.now()}3`,
        donor_name: 'Robert Donor',
        donor_age: 45,
        donor_bgrp: 'B-',
        donor_sex: 'M',
        donor_phno: '5551234003',
        city_id: cityId
      },
      {
        donor_id: `D${Date.now()}4`,
        donor_name: 'Emily Donor',
        donor_age: 29,
        donor_bgrp: 'AB+',
        donor_sex: 'F',
        donor_phno: '5551234004',
        city_id: cityId
      },
      {
        donor_id: `D${Date.now()}5`,
        donor_name: 'Michael Donor',
        donor_age: 35,
        donor_bgrp: 'O-',
        donor_sex: 'M',
        donor_phno: '5551234005',
        city_id: cityId
      },
      {
        donor_id: `D${Date.now()}6`,
        donor_name: 'Sarah Donor',
        donor_age: 27,
        donor_bgrp: 'B+',
        donor_sex: 'F',
        donor_phno: '5551234006',
        city_id: cityId
      }
    ];

    // Add donors to the database
    const results = await Promise.all(
      testDonors.map(async (donor) => {
        try {
          await donorAPI.addDonor(donor);
          return { success: true, donor: donor.donor_name, blood_type: donor.donor_bgrp };
        } catch (error) {
          console.error(`Error adding donor ${donor.donor_name}:`, error);
          return { success: false, donor: donor.donor_name, error };
        }
      })
    );

    // Count successful additions
    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      message: `${successCount} of ${testDonors.length} donors seeded successfully`,
      details: results
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error seeding donors:', error);
    return NextResponse.json({ 
      error: 'Failed to seed donors' 
    }, { status: 500 });
  }
} 