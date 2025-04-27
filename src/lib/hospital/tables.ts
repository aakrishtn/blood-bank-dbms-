import { supabase } from '../supabase';

/**
 * Check if a table exists in the database
 * @param tableName Name of the table to check
 * @returns Boolean indicating if table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .single();
    
    if (error) {
      // Use a different approach if information_schema is not accessible
      // Try to query the first row of the table to see if it exists
      const { error: tableError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (tableError && tableError.code === '42P01') {
        // 42P01 is PostgreSQL error code for "table does not exist"
        return false;
      }
      
      // If we can query the table, it exists
      return !tableError;
    }
    
    return !!data;
  } catch {
    // If any error occurs, try an alternative method
    try {
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      return !error || error.code !== '42P01';
    } catch {
      return false;
    }
  }
}

/**
 * Check if all required tables exist for hospital-doctor relationships
 * @returns Object with booleans for each required table
 */
export async function checkRequiredTables() {
  const results = {
    hospital: await tableExists('hospital'),
    doctor: await tableExists('doctor'),
    hospital_doctor: await tableExists('hospital_doctor'),
    city: await tableExists('city')
  };
  
  return {
    ...results,
    allExist: Object.values(results).every(value => value)
  };
}

/**
 * Check if tables are empty
 * @returns Object with booleans indicating if tables are empty
 */
export async function checkEmptyTables() {
  const checks = {
    hospital: false,
    doctor: false,
    hospital_doctor: false,
    city: false
  };
  
  // Check hospital table
  try {
    const { data: hospitals, error } = await supabase
      .from('hospital')
      .select('h_id')
      .limit(1);
    
    checks.hospital = !error && (hospitals?.length ?? 0) > 0;
  } catch {
    checks.hospital = false;
  }
  
  // Check doctor table
  try {
    const { data: doctors, error } = await supabase
      .from('doctor')
      .select('doc_id')
      .limit(1);
    
    checks.doctor = !error && (doctors?.length ?? 0) > 0;
  } catch {
    checks.doctor = false;
  }
  
  // Check hospital_doctor table
  try {
    const { data: relationships, error } = await supabase
      .from('hospital_doctor')
      .select('hospital_id')
      .limit(1);
    
    checks.hospital_doctor = !error && (relationships?.length ?? 0) > 0;
  } catch {
    checks.hospital_doctor = false;
  }
  
  // Check city table
  try {
    const { data: cities, error } = await supabase
      .from('city')
      .select('city_id')
      .limit(1);
    
    checks.city = !error && (cities?.length ?? 0) > 0;
  } catch {
    checks.city = false;
  }
  
  return {
    ...checks,
    allPopulated: Object.values(checks).every(value => value)
  };
} 