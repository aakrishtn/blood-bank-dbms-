-- Create tables based on the ER and relational model

-- City table
CREATE TABLE city (
  city_id VARCHAR PRIMARY KEY,
  city_name VARCHAR NOT NULL
);

-- Manager table
CREATE TABLE manager (
  m_id VARCHAR PRIMARY KEY,
  m_name VARCHAR NOT NULL,
  m_phno VARCHAR
);

-- Doctor table
CREATE TABLE doctor (
  doc_id VARCHAR PRIMARY KEY,
  doc_name VARCHAR NOT NULL,
  doc_phno VARCHAR
);

-- Staff table
CREATE TABLE staff (
  staff_id VARCHAR PRIMARY KEY,
  staff_name VARCHAR NOT NULL,
  staff_phno VARCHAR
);

-- Donor table
CREATE TABLE donor (
  donor_id VARCHAR PRIMARY KEY,
  donor_name VARCHAR NOT NULL,
  donor_age INT NOT NULL,
  donor_bgrp VARCHAR NOT NULL,
  donor_sex VARCHAR NOT NULL,
  donor_phno VARCHAR,
  city_id VARCHAR REFERENCES city(city_id),
  staff_id VARCHAR REFERENCES staff(staff_id)
);

-- Receiver table
CREATE TABLE receiver (
  receiver_id VARCHAR PRIMARY KEY,
  receiver_name VARCHAR NOT NULL,
  r_age INT NOT NULL,
  r_bgrp VARCHAR NOT NULL,
  r_sex VARCHAR NOT NULL,
  r_reg_date DATE NOT NULL,
  r_phno VARCHAR,
  staff_id VARCHAR REFERENCES staff(staff_id),
  city_id VARCHAR REFERENCES city(city_id),
  m_id VARCHAR REFERENCES manager(m_id)
);

-- Hospital table
CREATE TABLE hospital (
  h_id VARCHAR PRIMARY KEY,
  h_name VARCHAR NOT NULL,
  h_bgrprequired VARCHAR, -- Blood group required
  h_bgrpreceived VARCHAR, -- Blood group received
  city_id VARCHAR REFERENCES city(city_id),
  m_id VARCHAR REFERENCES manager(m_id)
);

-- Blood Sample table
CREATE TABLE blood_sample (
  sample_id VARCHAR PRIMARY KEY,
  blood_grp VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  m_id VARCHAR REFERENCES manager(m_id),
  doc_id VARCHAR REFERENCES doctor(doc_id)
);

-- Blood Center table
CREATE TABLE blood_center (
  center_id VARCHAR PRIMARY KEY,
  center_name VARCHAR NOT NULL,
  address VARCHAR,
  city_id VARCHAR REFERENCES city(city_id),
  coordinates POINT,
  phone VARCHAR,
  operating_hours VARCHAR,
  available_services VARCHAR[],
  api_source VARCHAR,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add triggers and procedures

-- Trigger to validate blood group
CREATE OR REPLACE FUNCTION validate_blood_group()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.blood_grp NOT IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') THEN
    RAISE EXCEPTION 'Invalid blood group: %', NEW.blood_grp;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_blood_group_sample
BEFORE INSERT OR UPDATE ON blood_sample
FOR EACH ROW
EXECUTE FUNCTION validate_blood_group();

CREATE TRIGGER check_blood_group_donor
BEFORE INSERT OR UPDATE ON donor
FOR EACH ROW
EXECUTE FUNCTION validate_blood_group();

CREATE TRIGGER check_blood_group_receiver
BEFORE INSERT OR UPDATE ON receiver
FOR EACH ROW
EXECUTE FUNCTION validate_blood_group();

-- Procedure to match donors with receivers
CREATE OR REPLACE FUNCTION match_donors_with_receivers(receiver_id_param VARCHAR)
RETURNS TABLE (donor_id VARCHAR, donor_name VARCHAR, blood_grp VARCHAR) AS $$
DECLARE
  r_bgrp_var VARCHAR;
BEGIN
  -- Get the blood group of the receiver
  SELECT r_bgrp INTO r_bgrp_var FROM receiver WHERE receiver_id = receiver_id_param;
  
  -- Return compatible donors based on blood group compatibility
  RETURN QUERY
  SELECT d.donor_id, d.donor_name, d.donor_bgrp
  FROM donor d
  WHERE 
    (r_bgrp_var = 'A+' AND d.donor_bgrp IN ('A+', 'A-', 'O+', 'O-')) OR
    (r_bgrp_var = 'A-' AND d.donor_bgrp IN ('A-', 'O-')) OR
    (r_bgrp_var = 'B+' AND d.donor_bgrp IN ('B+', 'B-', 'O+', 'O-')) OR
    (r_bgrp_var = 'B-' AND d.donor_bgrp IN ('B-', 'O-')) OR
    (r_bgrp_var = 'AB+' AND d.donor_bgrp IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')) OR
    (r_bgrp_var = 'AB-' AND d.donor_bgrp IN ('A-', 'B-', 'AB-', 'O-')) OR
    (r_bgrp_var = 'O+' AND d.donor_bgrp IN ('O+', 'O-')) OR
    (r_bgrp_var = 'O-' AND d.donor_bgrp = 'O-');
END;
$$ LANGUAGE plpgsql;

-- Procedure to update blood sample status
CREATE OR REPLACE FUNCTION update_blood_sample_status(sample_id_param VARCHAR, new_status VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE blood_sample
  SET status = new_status
  WHERE sample_id = sample_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create auth tables for custom authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  user_role VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profiles table to link users with different roles
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  profile_id VARCHAR NOT NULL,
  profile_type VARCHAR NOT NULL, -- 'donor', 'receiver', 'staff', 'manager', 'doctor'
  UNIQUE(profile_id, profile_type)
);

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor ENABLE ROW LEVEL SECURITY;
ALTER TABLE receiver ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_sample ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor ENABLE ROW LEVEL SECURITY;
ALTER TABLE city ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_center ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Example: Allow authenticated users to read all donors
CREATE POLICY "Allow authenticated users to read all donors"
ON donor FOR SELECT
TO authenticated
USING (true);

-- Example: Allow users to view their own donor profile
CREATE POLICY "Users can view own donor profile"
ON donor FOR SELECT
TO authenticated
USING (donor_id IN (
  SELECT profile_id FROM user_profiles 
  WHERE user_id = auth.uid() AND profile_type = 'donor'
));

-- Example: Allow staff to update donor information
CREATE POLICY "Staff can update donor information"
ON donor FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_profiles 
  WHERE user_id = auth.uid() AND profile_type = 'staff'
));

-- Example: Allow authenticated users to read all blood centers
CREATE POLICY "Allow authenticated users to read all blood centers"
ON blood_center FOR SELECT
TO authenticated
USING (true);

-- Create indexes for improved query performance
CREATE INDEX idx_donor_bgrp ON donor(donor_bgrp);
CREATE INDEX idx_receiver_bgrp ON receiver(r_bgrp);
CREATE INDEX idx_blood_sample_grp ON blood_sample(blood_grp);
CREATE INDEX idx_hospital_city ON hospital(city_id);
CREATE INDEX idx_donor_city ON donor(city_id);
CREATE INDEX idx_receiver_city ON receiver(city_id);
CREATE INDEX idx_blood_center_city ON blood_center(city_id);

-- Function to find blood centers by proximity (requires PostGIS extension)
CREATE OR REPLACE FUNCTION find_centers_by_location(lat_param FLOAT, lng_param FLOAT, radius_km FLOAT)
RETURNS TABLE (
  center_id VARCHAR,
  center_name VARCHAR,
  address VARCHAR,
  city_id VARCHAR,
  coordinates POINT,
  phone VARCHAR,
  operating_hours VARCHAR,
  available_services VARCHAR[],
  api_source VARCHAR,
  last_updated TIMESTAMP WITH TIME ZONE,
  distance_km FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bc.*,
    ST_Distance(
      bc.coordinates::geography, 
      ST_SetSRID(ST_MakePoint(lng_param, lat_param), 4326)::geography
    ) / 1000 AS distance_km
  FROM 
    blood_center bc
  WHERE 
    ST_DWithin(
      bc.coordinates::geography,
      ST_SetSRID(ST_MakePoint(lng_param, lat_param), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY 
    distance_km;
END;
$$ LANGUAGE plpgsql; 