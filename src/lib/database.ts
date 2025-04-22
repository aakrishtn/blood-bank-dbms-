import { supabase } from './supabase';

// City API
export const cityAPI = {
  async getAllCities() {
    const { data, error } = await supabase.from('city').select('*');
    if (error) throw error;
    return data;
  },
  
  async getCityById(cityId: string) {
    const { data, error } = await supabase
      .from('city')
      .select('*')
      .eq('city_id', cityId)
      .single();
    if (error) throw error;
    return data;
  },
  
  async addCity(city: { city_id: string; city_name: string }) {
    const { data, error } = await supabase.from('city').insert(city);
    if (error) throw error;
    return data;
  },
  
  async updateCity(cityId: string, city: { city_name: string }) {
    const { data, error } = await supabase
      .from('city')
      .update(city)
      .eq('city_id', cityId);
    if (error) throw error;
    return data;
  },
  
  async deleteCity(cityId: string) {
    const { error } = await supabase.from('city').delete().eq('city_id', cityId);
    if (error) throw error;
  }
};

// Donor API
export const donorAPI = {
  async getAllDonors() {
    const { data, error } = await supabase
      .from('donor')
      .select('*, city(city_name), staff(staff_name)');
    if (error) throw error;
    return data;
  },
  
  async getDonorById(donorId: string) {
    const { data, error } = await supabase
      .from('donor')
      .select('*, city(city_name), staff(staff_name)')
      .eq('donor_id', donorId)
      .single();
    if (error) throw error;
    return data;
  },
  
  async getDonorsByBloodGroup(bloodGroup: string) {
    const { data, error } = await supabase
      .from('donor')
      .select('*, city(city_name)')
      .eq('donor_bgrp', bloodGroup);
    if (error) throw error;
    return data;
  },
  
  async addDonor(donor: {
    donor_id: string;
    donor_name: string;
    donor_age: number;
    donor_bgrp: string;
    donor_sex: string;
    donor_phno?: string;
    city_id?: string;
    staff_id?: string;
  }) {
    const { data, error } = await supabase.from('donor').insert(donor);
    if (error) throw error;
    return data;
  },
  
  async updateDonor(donorId: string, donor: Partial<{
    donor_name: string;
    donor_age: number;
    donor_bgrp: string;
    donor_sex: string;
    donor_phno: string;
    city_id: string;
    staff_id: string;
  }>) {
    const { data, error } = await supabase
      .from('donor')
      .update(donor)
      .eq('donor_id', donorId);
    if (error) throw error;
    return data;
  },
  
  async deleteDonor(donorId: string) {
    const { error } = await supabase.from('donor').delete().eq('donor_id', donorId);
    if (error) throw error;
  }
};

// Receiver API
export const receiverAPI = {
  async getAllReceivers() {
    const { data, error } = await supabase
      .from('receiver')
      .select('*, city(city_name), staff(staff_name), manager(m_name)');
    if (error) throw error;
    return data;
  },
  
  async getReceiverById(receiverId: string) {
    const { data, error } = await supabase
      .from('receiver')
      .select('*, city(city_name), staff(staff_name), manager(m_name)')
      .eq('receiver_id', receiverId)
      .single();
    if (error) throw error;
    return data;
  },
  
  async getReceiversByBloodGroup(bloodGroup: string) {
    const { data, error } = await supabase
      .from('receiver')
      .select('*, city(city_name)')
      .eq('r_bgrp', bloodGroup);
    if (error) throw error;
    return data;
  },
  
  async addReceiver(receiver: {
    receiver_id: string;
    receiver_name: string;
    r_age: number;
    r_bgrp: string;
    r_sex: string;
    r_reg_date: string;
    r_phno?: string;
    staff_id?: string;
    city_id?: string;
    m_id?: string;
  }) {
    const { data, error } = await supabase.from('receiver').insert(receiver);
    if (error) throw error;
    return data;
  },
  
  async updateReceiver(receiverId: string, receiver: Partial<{
    receiver_name: string;
    r_age: number;
    r_bgrp: string;
    r_sex: string;
    r_reg_date: string;
    r_phno: string;
    staff_id: string;
    city_id: string;
    m_id: string;
  }>) {
    const { data, error } = await supabase
      .from('receiver')
      .update(receiver)
      .eq('receiver_id', receiverId);
    if (error) throw error;
    return data;
  },
  
  async deleteReceiver(receiverId: string) {
    const { error } = await supabase.from('receiver').delete().eq('receiver_id', receiverId);
    if (error) throw error;
  },
  
  // Call the match donors procedure
  async matchDonors(receiverId: string) {
    const { data, error } = await supabase.rpc('match_donors_with_receivers', {
      receiver_id_param: receiverId
    });
    if (error) throw error;
    return data;
  }
};

// Blood Sample API
export const bloodSampleAPI = {
  async getAllBloodSamples() {
    const { data, error } = await supabase
      .from('blood_sample')
      .select('*, manager(m_name), doctor(doc_name)');
    if (error) throw error;
    return data;
  },
  
  async getBloodSampleById(sampleId: string) {
    const { data, error } = await supabase
      .from('blood_sample')
      .select('*, manager(m_name), doctor(doc_name)')
      .eq('sample_id', sampleId)
      .single();
    if (error) throw error;
    return data;
  },
  
  async getBloodSamplesByGroup(bloodGroup: string) {
    const { data, error } = await supabase
      .from('blood_sample')
      .select('*')
      .eq('blood_grp', bloodGroup);
    if (error) throw error;
    return data;
  },
  
  async getBloodSamplesByStatus(status: string) {
    const { data, error } = await supabase
      .from('blood_sample')
      .select('*')
      .eq('status', status);
    if (error) throw error;
    return data;
  },
  
  async addBloodSample(sample: {
    sample_id: string;
    blood_grp: string;
    status: string;
    m_id?: string;
    doc_id?: string;
  }) {
    const { data, error } = await supabase.from('blood_sample').insert(sample);
    if (error) throw error;
    return data;
  },
  
  async updateBloodSample(sampleId: string, sample: Partial<{
    blood_grp: string;
    status: string;
    m_id: string;
    doc_id: string;
  }>) {
    const { data, error } = await supabase
      .from('blood_sample')
      .update(sample)
      .eq('sample_id', sampleId);
    if (error) throw error;
    return data;
  },
  
  async updateBloodSampleStatus(sampleId: string, status: string) {
    const { data, error } = await supabase.rpc('update_blood_sample_status', {
      sample_id_param: sampleId,
      new_status: status
    });
    if (error) throw error;
    return data;
  },
  
  async deleteBloodSample(sampleId: string) {
    const { error } = await supabase.from('blood_sample').delete().eq('sample_id', sampleId);
    if (error) throw error;
  }
};

// Hospital API
export const hospitalAPI = {
  async getAllHospitals() {
    const { data, error } = await supabase
      .from('hospital')
      .select('*, city(city_name), manager(m_name)');
    if (error) throw error;
    return data;
  },
  
  async getHospitalById(hospitalId: string) {
    const { data, error } = await supabase
      .from('hospital')
      .select('*, city(city_name), manager(m_name)')
      .eq('h_id', hospitalId)
      .single();
    if (error) throw error;
    return data;
  },
  
  async getHospitalsByCity(cityId: string) {
    const { data, error } = await supabase
      .from('hospital')
      .select('*')
      .eq('city_id', cityId);
    if (error) throw error;
    return data;
  },
  
  async addHospital(hospital: {
    h_id: string;
    h_name: string;
    h_bgrprequired?: string;
    h_bgrpreceived?: string;
    city_id?: string;
    m_id?: string;
  }) {
    const { data, error } = await supabase.from('hospital').insert(hospital);
    if (error) throw error;
    return data;
  },
  
  async updateHospital(hospitalId: string, hospital: Partial<{
    h_name: string;
    h_bgrprequired: string;
    h_bgrpreceived: string;
    city_id: string;
    m_id: string;
  }>) {
    const { data, error } = await supabase
      .from('hospital')
      .update(hospital)
      .eq('h_id', hospitalId);
    if (error) throw error;
    return data;
  },
  
  async deleteHospital(hospitalId: string) {
    const { error } = await supabase.from('hospital').delete().eq('h_id', hospitalId);
    if (error) throw error;
  }
};

// Staff API
export const staffAPI = {
  async getAllStaff() {
    const { data, error } = await supabase.from('staff').select('*');
    if (error) throw error;
    return data;
  },
  
  async getStaffById(staffId: string) {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('staff_id', staffId)
      .single();
    if (error) throw error;
    return data;
  },
  
  async addStaff(staff: {
    staff_id: string;
    staff_name: string;
    staff_phno?: string;
  }) {
    const { data, error } = await supabase.from('staff').insert(staff);
    if (error) throw error;
    return data;
  },
  
  async updateStaff(staffId: string, staff: Partial<{
    staff_name: string;
    staff_phno: string;
  }>) {
    const { data, error } = await supabase
      .from('staff')
      .update(staff)
      .eq('staff_id', staffId);
    if (error) throw error;
    return data;
  },
  
  async deleteStaff(staffId: string) {
    const { error } = await supabase.from('staff').delete().eq('staff_id', staffId);
    if (error) throw error;
  }
};

// Manager API
export const managerAPI = {
  async getAllManagers() {
    const { data, error } = await supabase.from('manager').select('*');
    if (error) throw error;
    return data;
  },
  
  async getManagerById(managerId: string) {
    const { data, error } = await supabase
      .from('manager')
      .select('*')
      .eq('m_id', managerId)
      .single();
    if (error) throw error;
    return data;
  },
  
  async addManager(manager: {
    m_id: string;
    m_name: string;
    m_phno?: string;
  }) {
    const { data, error } = await supabase.from('manager').insert(manager);
    if (error) throw error;
    return data;
  },
  
  async updateManager(managerId: string, manager: Partial<{
    m_name: string;
    m_phno: string;
  }>) {
    const { data, error } = await supabase
      .from('manager')
      .update(manager)
      .eq('m_id', managerId);
    if (error) throw error;
    return data;
  },
  
  async deleteManager(managerId: string) {
    const { error } = await supabase.from('manager').delete().eq('m_id', managerId);
    if (error) throw error;
  }
};

// Doctor API
export const doctorAPI = {
  async getAllDoctors() {
    const { data, error } = await supabase.from('doctor').select('*');
    if (error) throw error;
    return data;
  },
  
  async getDoctorById(doctorId: string) {
    const { data, error } = await supabase
      .from('doctor')
      .select('*')
      .eq('doc_id', doctorId)
      .single();
    if (error) throw error;
    return data;
  },
  
  async addDoctor(doctor: {
    doc_id: string;
    doc_name: string;
    doc_phno?: string;
  }) {
    const { data, error } = await supabase.from('doctor').insert(doctor);
    if (error) throw error;
    return data;
  },
  
  async updateDoctor(doctorId: string, doctor: Partial<{
    doc_name: string;
    doc_phno: string;
  }>) {
    const { data, error } = await supabase
      .from('doctor')
      .update(doctor)
      .eq('doc_id', doctorId);
    if (error) throw error;
    return data;
  },
  
  async deleteDoctor(doctorId: string) {
    const { error } = await supabase.from('doctor').delete().eq('doc_id', doctorId);
    if (error) throw error;
  }
};

// Blood Center API
export const bloodCenterAPI = {
  async getAllBloodCenters() {
    const { data, error } = await supabase
      .from('blood_center')
      .select('*, city(city_name)');
    if (error) throw error;
    return data;
  },
  
  async getBloodCenterById(centerId: string) {
    const { data, error } = await supabase
      .from('blood_center')
      .select('*, city(city_name)')
      .eq('center_id', centerId)
      .single();
    if (error) throw error;
    return data;
  },
  
  async getBloodCentersByCity(cityId: string) {
    const { data, error } = await supabase
      .from('blood_center')
      .select('*, city(city_name)')
      .eq('city_id', cityId);
    if (error) throw error;
    return data;
  },
  
  async addBloodCenter(center: {
    center_id: string;
    center_name: string;
    address?: string;
    city_id?: string;
    coordinates?: string; // Format as 'POINT(lng lat)'
    phone?: string;
    operating_hours?: string;
    available_services?: string[];
    api_source?: string;
  }) {
    const { data, error } = await supabase.from('blood_center').insert(center);
    if (error) throw error;
    return data;
  },
  
  async updateBloodCenter(centerId: string, center: Partial<{
    center_name: string;
    address: string;
    city_id: string;
    coordinates: string;
    phone: string;
    operating_hours: string;
    available_services: string[];
    api_source: string;
    last_updated: string;
  }>) {
    // Set last_updated to current timestamp
    const updateData = {
      ...center,
      last_updated: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('blood_center')
      .update(updateData)
      .eq('center_id', centerId);
    if (error) throw error;
    return data;
  },
  
  async deleteBloodCenter(centerId: string) {
    const { error } = await supabase.from('blood_center').delete().eq('center_id', centerId);
    if (error) throw error;
  },
  
  // Get blood centers by proximity (requires PostGIS extension in Supabase)
  async getBloodCentersByProximity(lat: number, lng: number, radiusKm: number = 15) {
    try {
      // This query uses PostGIS to find centers within a certain radius
      const { data, error } = await supabase.rpc('find_centers_by_location', {
        lat_param: lat,
        lng_param: lng,
        radius_km: radiusKm
      });
      
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Error in proximity search, falling back to regular query:", e);
      // Fallback to regular query if PostGIS function is not available
      const { data, error } = await supabase.from('blood_center').select('*, city(city_name)');
      if (error) throw error;
      return data;
    }
  }
}; 