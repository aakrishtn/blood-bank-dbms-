import { NextResponse } from 'next/server';
import { checkRequiredTables, checkEmptyTables } from '@/lib/hospital/tables';

export async function GET() {
  try {
    // Check if all required tables exist
    const tablesExist = await checkRequiredTables();
    
    // Check if tables are populated
    const tablesPopulated = await checkEmptyTables();
    
    return NextResponse.json({
      success: true,
      tables: tablesExist,
      data: tablesPopulated
    });
  } catch (error) {
    console.error('Error checking hospital-doctor status:', error);
    return NextResponse.json({ 
      error: 'Failed to check hospital-doctor status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 