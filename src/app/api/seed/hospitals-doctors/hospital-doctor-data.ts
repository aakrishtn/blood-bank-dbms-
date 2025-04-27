import { supabase } from '@/lib/supabase';

/**
 * Interface for doctor data
 */
export interface Doctor {
  doc_id: string;
  doc_name: string;
  doc_phno: string;
  specialization: string;
}

/**
 * Interface for hospital data
 */
export interface Hospital {
  h_id: string;
  h_name: string;
  city_id: string;
  h_address: string;
}

/**
 * Interface for hospital-doctor relationship
 */
export interface HospitalDoctor {
  hospital_id: string;
  doctor_id: string;
}

/**
 * Get sample doctors data
 */
export function getSampleDoctors(): Doctor[] {
  return [
    { doc_id: 'DOC001', doc_name: 'Dr. James Smith', doc_phno: '555-0101', specialization: 'Hematology' },
    { doc_id: 'DOC002', doc_name: 'Dr. Maria Rodriguez', doc_phno: '555-0102', specialization: 'Internal Medicine' },
    { doc_id: 'DOC003', doc_name: 'Dr. David Johnson', doc_phno: '555-0103', specialization: 'Transfusion Medicine' },
    { doc_id: 'DOC004', doc_name: 'Dr. Sarah Chen', doc_phno: '555-0104', specialization: 'Clinical Pathology' },
    { doc_id: 'DOC005', doc_name: 'Dr. Robert Kim', doc_phno: '555-0105', specialization: 'Hematology' },
    { doc_id: 'DOC006', doc_name: 'Dr. Emily Wilson', doc_phno: '555-0106', specialization: 'Internal Medicine' },
    { doc_id: 'DOC007', doc_name: 'Dr. Michael Patel', doc_phno: '555-0107', specialization: 'Transfusion Medicine' },
    { doc_id: 'DOC008', doc_name: 'Dr. Jennifer Lopez', doc_phno: '555-0108', specialization: 'Clinical Pathology' },
    { doc_id: 'DOC009', doc_name: 'Dr. Thomas Brown', doc_phno: '555-0109', specialization: 'Hematology' },
    { doc_id: 'DOC010', doc_name: 'Dr. Lisa Martinez', doc_phno: '555-0110', specialization: 'Internal Medicine' }
  ];
}

/**
 * Generate sample hospitals for cities
 */
export function generateHospitalsForCities(cities: { city_id: string; city_name: string }[]): Hospital[] {
  return cities.flatMap(city => {
    return [
      { 
        h_id: `H${city.city_id}001`, 
        h_name: `${city.city_name} General Hospital`, 
        city_id: city.city_id,
        h_address: `123 Main St, ${city.city_name}`
      },
      { 
        h_id: `H${city.city_id}002`, 
        h_name: `${city.city_name} Community Medical Center`, 
        city_id: city.city_id,
        h_address: `456 Park Ave, ${city.city_name}`
      },
      { 
        h_id: `H${city.city_id}003`, 
        h_name: `${city.city_name} Memorial Hospital`, 
        city_id: city.city_id,
        h_address: `789 Broadway, ${city.city_name}`
      },
      { 
        h_id: `H${city.city_id}004`, 
        h_name: `University Medical Center of ${city.city_name}`, 
        city_id: city.city_id,
        h_address: `101 University Blvd, ${city.city_name}`
      },
      { 
        h_id: `H${city.city_id}005`, 
        h_name: `${city.city_name} Blood Center`, 
        city_id: city.city_id,
        h_address: `202 Health Dr, ${city.city_name}`
      }
    ];
  });
}

/**
 * Generate hospital-doctor relationships
 * Each doctor can work at multiple hospitals
 */
export function generateHospitalDoctorRelationships(hospitals: Hospital[], doctors: Doctor[]): HospitalDoctor[] {
  const relationships: HospitalDoctor[] = [];
  
  // Assign each doctor to 1-3 hospitals
  doctors.forEach(doctor => {
    // Randomly determine how many hospitals this doctor works at (1-3)
    const hospitalCount = Math.floor(Math.random() * 3) + 1;
    
    // Create a copy of hospitals array to randomly select from
    const availableHospitals = [...hospitals];
    
    // Randomly assign doctor to hospitalCount hospitals
    for (let i = 0; i < hospitalCount && availableHospitals.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableHospitals.length);
      const selectedHospital = availableHospitals.splice(randomIndex, 1)[0];
      
      relationships.push({
        hospital_id: selectedHospital.h_id,
        doctor_id: doctor.doc_id
      });
    }
  });
  
  return relationships;
}

/**
 * Create hospital-doctor relationship records in the database
 */
export async function createHospitalDoctorRelationships(relationships: HospitalDoctor[]) {
  // Check if the hospital_doctor table exists
  try {
    const { data: tableExists, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'hospital_doctor')
      .single();
    
    if (tableError && tableError.code !== 'PGRST116') {
      console.error('Error checking hospital_doctor table:', tableError);
      return false;
    }
    
    // If table doesn't exist, we can't create relationships
    if (!tableExists) {
      console.log('hospital_doctor table does not exist');
      return false;
    }
    
    // Check if relationships already exist
    const { data: existingRelationships, error: relError } = await supabase
      .from('hospital_doctor')
      .select('hospital_id, doctor_id')
      .limit(1);
      
    if (relError) {
      console.error('Error checking existing hospital-doctor relationships:', relError);
      return false;
    }
    
    // Only insert if no relationships exist
    if (!existingRelationships || existingRelationships.length === 0) {
      const { error: insertError } = await supabase
        .from('hospital_doctor')
        .insert(relationships);
        
      if (insertError) {
        console.error('Error creating hospital-doctor relationships:', insertError);
        return false;
      }
      
      console.log(`Created ${relationships.length} hospital-doctor relationships`);
      return true;
    }
    
    console.log('Hospital-doctor relationships already exist');
    return true;
  } catch (error) {
    console.error('Exception in createHospitalDoctorRelationships:', error);
    return false;
  }
} 