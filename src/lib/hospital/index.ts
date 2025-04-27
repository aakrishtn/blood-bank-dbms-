import { supabase } from '../supabase';

/**
 * Check if a table exists in the database
 * @param tableName Name of the table to check
 * @returns Boolean indicating if table exists
 */
async function tableExists(tableName: string): Promise<boolean> {
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
 * Function to get a random doctor from the system
 * @returns A doctor object with id and name
 */
export async function getRandomDoctor() {
  try {
    // First check if the doctor table exists
    const doctorTableExists = await tableExists('doctor');
    if (!doctorTableExists) {
      console.log('Doctor table does not exist, will create dummy doctor');
      return { doc_id: 'DOC001', doc_name: 'Dr. James Smith' };
    }
    
    // Fetch all doctors
    const { data: doctors, error } = await supabase
      .from('doctor')
      .select('doc_id, doc_name');
    
    if (error) {
      console.error('Error fetching doctors:', error);
      return { doc_id: 'DOC001', doc_name: 'Dr. James Smith' };
    }
    
    if (!doctors || doctors.length === 0) {
      // If no doctors in the system, create some dummy doctors
      const dummyDoctors = [
        { doc_id: 'DOC001', doc_name: 'Dr. James Smith', doc_phno: '555-0101' },
        { doc_id: 'DOC002', doc_name: 'Dr. Maria Rodriguez', doc_phno: '555-0102' },
        { doc_id: 'DOC003', doc_name: 'Dr. David Johnson', doc_phno: '555-0103' },
        { doc_id: 'DOC004', doc_name: 'Dr. Sarah Chen', doc_phno: '555-0104' },
        { doc_id: 'DOC005', doc_name: 'Dr. Robert Kim', doc_phno: '555-0105' }
      ];
      
      try {
        // Insert dummy doctors
        const { error: insertError } = await supabase
          .from('doctor')
          .insert(dummyDoctors);
        
        if (insertError) {
          console.error('Error creating dummy doctors:', insertError);
          return { doc_id: 'DOC001', doc_name: 'Dr. James Smith' };
        }
      } catch (insertErr) {
        console.error('Exception creating dummy doctors:', insertErr);
        return { doc_id: 'DOC001', doc_name: 'Dr. James Smith' };
      }
      
      // Return a random doctor from the dummy list
      const randomIndex = Math.floor(Math.random() * dummyDoctors.length);
      return dummyDoctors[randomIndex];
    }
    
    // Select a random doctor from the list
    const randomIndex = Math.floor(Math.random() * doctors.length);
    return doctors[randomIndex];
    
  } catch (error) {
    console.error('Error in getRandomDoctor:', error);
    // Return a default doctor in case of error
    return { doc_id: 'DOC001', doc_name: 'Dr. James Smith' };
  }
}

/**
 * Function to fetch hospitals by city
 * @param cityId The city ID to filter hospitals
 * @returns List of hospitals in the specified city
 */
export async function getHospitalsByCity(cityId: string) {
  try {
    // First check if hospital table exists
    const hospitalTableExists = await tableExists('hospital');
    if (!hospitalTableExists) {
      console.log('Hospital table does not exist, will return dummy hospitals');
      return getDummyHospitals(cityId);
    }
    
    const { data, error } = await supabase
      .from('hospital')
      .select('h_id, h_name')
      .eq('city_id', cityId);
    
    if (error) {
      console.error('Error fetching hospitals by city:', error);
      return getDummyHospitals(cityId);
    }
    
    if (!data || data.length === 0) {
      const dummyHospitals = getDummyHospitals(cityId);
      
      try {
        // Insert dummy hospitals
        const { error: insertError } = await supabase
          .from('hospital')
          .insert(dummyHospitals);
        
        if (insertError) {
          console.error('Error creating dummy hospitals:', insertError);
          return dummyHospitals;
        }
        
        return dummyHospitals;
      } catch (insertErr) {
        console.error('Exception creating dummy hospitals:', insertErr);
        return dummyHospitals;
      }
    }
    
    return data;
    
  } catch (error) {
    console.error('Error in getHospitalsByCity:', error);
    return getDummyHospitals(cityId);
  }
}

/**
 * Helper function to get dummy hospitals for a city
 */
function getDummyHospitals(cityId: string) {
  return [
    { h_id: `H${cityId}001`, h_name: `General Hospital - ${cityId}` },
    { h_id: `H${cityId}002`, h_name: `Community Medical Center - ${cityId}` },
    { h_id: `H${cityId}003`, h_name: `Memorial Hospital - ${cityId}` }
  ];
}

/**
 * Function to seed hospitals and doctors if none exist
 */
export async function seedHospitalsAndDoctors() {
  try {
    // Check if doctor table exists
    const doctorTableExists = await tableExists('doctor');
    if (!doctorTableExists) {
      console.log('Doctor table does not exist, cannot seed doctors');
      return true; // Return true to continue with the app
    }
    
    // Check if doctors already exist
    const { data: existingDoctors, error: doctorError } = await supabase
      .from('doctor')
      .select('doc_id')
      .limit(1);
    
    if (doctorError) {
      console.error('Error checking doctors:', doctorError);
    } else if (!existingDoctors || existingDoctors.length === 0) {
      // No doctors found, create some
      const dummyDoctors = [
        { doc_id: 'DOC001', doc_name: 'Dr. James Smith', doc_phno: '555-0101' },
        { doc_id: 'DOC002', doc_name: 'Dr. Maria Rodriguez', doc_phno: '555-0102' },
        { doc_id: 'DOC003', doc_name: 'Dr. David Johnson', doc_phno: '555-0103' },
        { doc_id: 'DOC004', doc_name: 'Dr. Sarah Chen', doc_phno: '555-0104' },
        { doc_id: 'DOC005', doc_name: 'Dr. Robert Kim', doc_phno: '555-0105' }
      ];
      
      try {
        const { error: insertError } = await supabase
          .from('doctor')
          .insert(dummyDoctors);
        
        if (insertError) {
          console.error('Error seeding doctors:', insertError);
        } else {
          console.log('Doctors seeded successfully');
        }
      } catch (err) {
        console.error('Exception seeding doctors:', err);
      }
    }
    
    // Check if hospital table exists
    const hospitalTableExists = await tableExists('hospital');
    if (!hospitalTableExists) {
      console.log('Hospital table does not exist, cannot seed hospitals');
      return true; // Return true to continue with the app
    }
    
    // Check if hospitals already exist
    const { data: existingHospitals, error: hospitalError } = await supabase
      .from('hospital')
      .select('h_id')
      .limit(1);
    
    if (hospitalError) {
      console.error('Error checking hospitals:', hospitalError);
    } else if (!existingHospitals || existingHospitals.length === 0) {
      // Get cities to create hospitals in each city
      const { data: cities, error: cityError } = await supabase
        .from('city')
        .select('city_id, city_name');
      
      if (cityError || !cities || cities.length === 0) {
        console.error('Error fetching cities or no cities found');
        
        // Create dummy hospitals for a few cities anyway
        const defaultCities = [
          { city_id: 'NYC', city_name: 'New York City' },
          { city_id: 'LA', city_name: 'Los Angeles' },
          { city_id: 'CHI', city_name: 'Chicago' },
          { city_id: 'DAL', city_name: 'Dallas' }
        ];
        
        const hospitals = defaultCities.flatMap(city => [
          { h_id: `H${city.city_id}001`, h_name: `General Hospital - ${city.city_name}`, city_id: city.city_id },
          { h_id: `H${city.city_id}002`, h_name: `Community Medical Center - ${city.city_name}`, city_id: city.city_id },
          { h_id: `H${city.city_id}003`, h_name: `Memorial Hospital - ${city.city_name}`, city_id: city.city_id }
        ]);
        
        try {
          const { error: insertHospitalError } = await supabase
            .from('hospital')
            .insert(hospitals);
          
          if (insertHospitalError) {
            console.error('Error seeding hospitals:', insertHospitalError);
          } else {
            console.log('Default hospitals seeded successfully');
          }
        } catch (err) {
          console.error('Exception seeding hospitals:', err);
        }
        
        return true;
      }
      
      // Create hospitals for each city
      const hospitals = cities.flatMap(city => [
        { h_id: `H${city.city_id}001`, h_name: `General Hospital - ${city.city_name}`, city_id: city.city_id },
        { h_id: `H${city.city_id}002`, h_name: `Community Medical Center - ${city.city_name}`, city_id: city.city_id },
        { h_id: `H${city.city_id}003`, h_name: `Memorial Hospital - ${city.city_name}`, city_id: city.city_id }
      ]);
      
      try {
        const { error: insertHospitalError } = await supabase
          .from('hospital')
          .insert(hospitals);
        
        if (insertHospitalError) {
          console.error('Error seeding hospitals:', insertHospitalError);
        } else {
          console.log('Hospitals seeded successfully');
        }
      } catch (err) {
        console.error('Exception seeding hospitals:', err);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in seedHospitalsAndDoctors:', error);
    return true; // Return true to continue with the app even if seeding fails
  }
} 