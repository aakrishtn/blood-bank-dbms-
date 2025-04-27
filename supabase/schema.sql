-- First, drop any existing tables in reverse order of dependencies
DROP TABLE IF EXISTS appointment_notifications CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS receiver CASCADE;
DROP TABLE IF EXISTS donor CASCADE;
DROP TABLE IF EXISTS blood_inventory CASCADE;
DROP TABLE IF EXISTS blood_sample CASCADE;
DROP TABLE IF EXISTS hospital_doctor CASCADE;
DROP TABLE IF EXISTS hospital CASCADE;
DROP TABLE IF EXISTS blood_center CASCADE;
DROP TABLE IF EXISTS doctor CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS manager CASCADE;
DROP TABLE IF EXISTS city CASCADE;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create base tables without dependencies
CREATE TABLE IF NOT EXISTS city (
    city_id VARCHAR PRIMARY KEY,
    city_name VARCHAR NOT NULL
);

-- Insert US cities immediately after creating the table
INSERT INTO city (city_id, city_name) VALUES
  ('NYC', 'New York City'),
  ('LA', 'Los Angeles'),
  ('CHI', 'Chicago'),
  ('HOU', 'Houston'),
  ('PHX', 'Phoenix'),
  ('PHI', 'Philadelphia'),
  ('SAT', 'San Antonio'),
  ('SD', 'San Diego'),
  ('DAL', 'Dallas'),
  ('SJ', 'San Jose');

CREATE TABLE IF NOT EXISTS manager (
    m_id VARCHAR PRIMARY KEY,
    m_name VARCHAR NOT NULL,
    m_phno VARCHAR
);

CREATE TABLE IF NOT EXISTS staff (
    staff_id VARCHAR PRIMARY KEY,
    staff_name VARCHAR NOT NULL,
    staff_phno VARCHAR
);

CREATE TABLE IF NOT EXISTS doctor (
    doc_id VARCHAR PRIMARY KEY,
    doc_name VARCHAR NOT NULL,
    doc_phno VARCHAR,
    specialization VARCHAR(100)
);

-- Insert doctors immediately after creating the table
INSERT INTO doctor (doc_id, doc_name, doc_phno, specialization)
VALUES
  ('DOC001', 'Dr. James Smith', '555-0101', 'Hematology'),
  ('DOC002', 'Dr. Maria Rodriguez', '555-0102', 'Internal Medicine'),
  ('DOC003', 'Dr. David Johnson', '555-0103', 'Transfusion Medicine'),
  ('DOC004', 'Dr. Sarah Chen', '555-0104', 'Clinical Pathology'),
  ('DOC005', 'Dr. Robert Kim', '555-0105', 'Hematology')
ON CONFLICT (doc_id) 
DO UPDATE SET 
  doc_name = EXCLUDED.doc_name,
  doc_phno = EXCLUDED.doc_phno,
  specialization = EXCLUDED.specialization;

-- Create blood center table
CREATE TABLE IF NOT EXISTS blood_center (
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

-- Insert blood centers immediately after creating the table
INSERT INTO blood_center (center_id, center_name, address, city_id)
VALUES 
  ('BC001', 'Central Blood Bank', '123 Main St', 'NYC'),
  ('BC002', 'LifeSavers Blood Center', '456 Oak Ave', 'LA'),
  ('BC003', 'Community Blood Services', '789 Pine Rd', 'CHI')
ON CONFLICT DO NOTHING;

-- Create hospital table
CREATE TABLE IF NOT EXISTS hospital (
    h_id VARCHAR PRIMARY KEY,
    h_name VARCHAR NOT NULL,
    h_bgrprequired VARCHAR,
    h_bgrpreceived VARCHAR,
    city_id VARCHAR REFERENCES city(city_id),
    m_id VARCHAR REFERENCES manager(m_id),
    h_address VARCHAR(255)
);

-- Insert hospitals immediately after creating the table
INSERT INTO hospital (h_id, h_name, city_id, h_address)
VALUES
  ('HNYC001', 'New York General Hospital', 'NYC', '123 Main St, New York'),
  ('HNYC002', 'New York Community Medical Center', 'NYC', '456 Park Ave, New York'),
  ('HLA001', 'Los Angeles General Hospital', 'LA', '123 Broadway, Los Angeles'),
  ('HLA002', 'LA Community Medical Center', 'LA', '456 Hollywood Blvd, Los Angeles'),
  ('HCHI001', 'Chicago General Hospital', 'CHI', '123 State St, Chicago')
ON CONFLICT (h_id) 
DO UPDATE SET
  h_name = EXCLUDED.h_name,
  city_id = EXCLUDED.city_id,
  h_address = EXCLUDED.h_address;

-- Create hospital_doctor relationship table
CREATE TABLE IF NOT EXISTS hospital_doctor (
    hospital_id VARCHAR REFERENCES hospital(h_id),
    doctor_id VARCHAR REFERENCES doctor(doc_id),
    PRIMARY KEY (hospital_id, doctor_id)
);

-- Insert hospital-doctor relationships
INSERT INTO hospital_doctor (hospital_id, doctor_id)
VALUES
  ('HNYC001', 'DOC001'),
  ('HNYC001', 'DOC002'),
  ('HNYC002', 'DOC003'),
  ('HLA001', 'DOC004'),
  ('HLA002', 'DOC005'),
  ('HCHI001', 'DOC001')
ON CONFLICT (hospital_id, doctor_id) DO NOTHING;

-- Create blood sample table
CREATE TABLE IF NOT EXISTS blood_sample (
    sample_id VARCHAR PRIMARY KEY,
    blood_grp VARCHAR NOT NULL,
    status VARCHAR NOT NULL,
    collection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE,
    m_id VARCHAR REFERENCES manager(m_id),
    doc_id VARCHAR REFERENCES doctor(doc_id)
);

-- Create blood inventory table to track blood samples at hospitals and blood centers
CREATE TABLE IF NOT EXISTS blood_inventory (
    inventory_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    blood_grp VARCHAR NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    status VARCHAR NOT NULL DEFAULT 'available',
    hospital_id VARCHAR REFERENCES hospital(h_id),
    center_id VARCHAR REFERENCES blood_center(center_id),
    doc_id VARCHAR REFERENCES doctor(doc_id),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT either_hospital_or_center CHECK (
        (hospital_id IS NOT NULL AND center_id IS NULL) OR
        (hospital_id IS NULL AND center_id IS NOT NULL)
    )
);

-- Insert blood inventory data
INSERT INTO blood_inventory (blood_grp, quantity, status, hospital_id, doc_id)
VALUES 
  ('A+', 10, 'available', 'HNYC001', 'DOC001'),
  ('A-', 5, 'available', 'HNYC001', 'DOC002'),
  ('B+', 8, 'available', 'HNYC002', 'DOC003'),
  ('B-', 3, 'available', 'HLA001', 'DOC004'),
  ('AB+', 2, 'available', 'HLA002', 'DOC005'),
  ('O+', 15, 'available', 'HCHI001', 'DOC001'),
  ('O-', 7, 'available', 'HNYC001', 'DOC001')
ON CONFLICT DO NOTHING;

-- Create donor table
CREATE TABLE IF NOT EXISTS donor (
    donor_id VARCHAR PRIMARY KEY,
    donor_name VARCHAR NOT NULL,
    donor_age INT NOT NULL,
    donor_bgrp VARCHAR NOT NULL,
    donor_sex VARCHAR NOT NULL,
    donor_phno VARCHAR(50),
    city_id VARCHAR REFERENCES city(city_id),
    staff_id VARCHAR REFERENCES staff(staff_id),
    hospital_id VARCHAR REFERENCES hospital(h_id),
    doctor_id VARCHAR REFERENCES doctor(doc_id),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create receiver table
CREATE TABLE IF NOT EXISTS receiver (
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

-- Create users table with nullable password_hash for Supabase Auth
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR, -- Made nullable to work with Supabase Auth
    user_role VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    profile_id VARCHAR NOT NULL,
    profile_type VARCHAR NOT NULL,
    UNIQUE(profile_id, profile_type)
);

-- Create appointments table with correct data types for foreign keys
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    donation_date TIMESTAMP NOT NULL,
    date_created TIMESTAMP DEFAULT NOW(),
    status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    hospital VARCHAR(255),
    doctor VARCHAR(255),
    donor_id VARCHAR REFERENCES donor(donor_id),
    center_id VARCHAR REFERENCES blood_center(center_id) NOT NULL,
    receiver_id VARCHAR REFERENCES receiver(receiver_id) NOT NULL
);

-- Create appointment notifications table
CREATE TABLE IF NOT EXISTS appointment_notifications (
    notification_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    appointment_id UUID REFERENCES appointments(appointment_id),
    notification_type VARCHAR(50),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE UNIQUE INDEX unique_active_appointment_per_donor 
ON appointments (donor_id) 
WHERE status IN ('pending', 'confirmed');

CREATE INDEX idx_appointments_donor_id ON appointments(donor_id);
CREATE INDEX idx_appointments_receiver_id ON appointments(receiver_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date ON appointments(donation_date);
CREATE INDEX idx_appointments_center ON appointments(center_id);
CREATE INDEX idx_donor_bgrp ON donor(donor_bgrp);
CREATE INDEX idx_receiver_bgrp ON receiver(r_bgrp);
CREATE INDEX idx_blood_sample_grp ON blood_sample(blood_grp);
CREATE INDEX idx_hospital_city ON hospital(city_id);
CREATE INDEX idx_donor_city ON donor(city_id);
CREATE INDEX idx_receiver_city ON receiver(city_id);
CREATE INDEX idx_blood_center_city ON blood_center(city_id);
CREATE INDEX idx_donor_donor_id ON donor(donor_id);
CREATE INDEX idx_receiver_phone ON receiver(r_phno);
CREATE INDEX idx_donor_hospital ON donor(hospital_id);
CREATE INDEX idx_donor_doctor ON donor(doctor_id);
CREATE INDEX idx_blood_inventory_grp ON blood_inventory(blood_grp);
CREATE INDEX idx_blood_inventory_hospital ON blood_inventory(hospital_id);
CREATE INDEX idx_blood_inventory_center ON blood_inventory(center_id);
CREATE INDEX idx_blood_inventory_status ON blood_inventory(status);

-- Drop existing function and triggers
DROP TRIGGER IF EXISTS check_blood_group_sample ON blood_sample;
DROP TRIGGER IF EXISTS check_blood_group_donor ON donor;
DROP TRIGGER IF EXISTS check_blood_group_receiver ON receiver;
DROP TRIGGER IF EXISTS check_blood_group_inventory ON blood_inventory;
DROP FUNCTION IF EXISTS validate_blood_group();

-- Also drop the match_donors_with_receivers function to avoid type conflict
DROP FUNCTION IF EXISTS match_donors_with_receivers(VARCHAR);
DROP FUNCTION IF EXISTS get_hospital_blood_inventory(VARCHAR);
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS notify_appointment_status_change();
DROP FUNCTION IF EXISTS find_centers_by_location(FLOAT, FLOAT, FLOAT);
DROP FUNCTION IF EXISTS get_available_slots(VARCHAR, DATE);
DROP FUNCTION IF EXISTS is_donor_eligible(VARCHAR);

-- Create the updated blood group validation function
CREATE OR REPLACE FUNCTION validate_blood_group()
RETURNS TRIGGER AS $$
BEGIN
    -- Check which table the trigger is firing on and use appropriate column name
    IF TG_TABLE_NAME = 'blood_sample' THEN
        IF NEW.blood_grp NOT IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') THEN
            RAISE EXCEPTION 'Invalid blood group: %', NEW.blood_grp;
        END IF;
    ELSIF TG_TABLE_NAME = 'donor' THEN
        IF NEW.donor_bgrp NOT IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') THEN
            RAISE EXCEPTION 'Invalid blood group: %', NEW.donor_bgrp;
        END IF;
    ELSIF TG_TABLE_NAME = 'receiver' THEN
        IF NEW.r_bgrp NOT IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') THEN
            RAISE EXCEPTION 'Invalid blood group: %', NEW.r_bgrp;
        END IF;
    ELSIF TG_TABLE_NAME = 'blood_inventory' THEN
        IF NEW.blood_grp NOT IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') THEN
            RAISE EXCEPTION 'Invalid blood group: %', NEW.blood_grp;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for blood group validation
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

CREATE TRIGGER check_blood_group_inventory
    BEFORE INSERT OR UPDATE ON blood_inventory
    FOR EACH ROW
    EXECUTE FUNCTION validate_blood_group();

-- Function to match donors with receivers (keeping for compatibility)
CREATE OR REPLACE FUNCTION match_donors_with_receivers(receiver_id_param VARCHAR)
RETURNS TABLE (donor_id VARCHAR, donor_name VARCHAR, donor_bgrp VARCHAR) AS $$
DECLARE
    r_bgrp_var VARCHAR;
BEGIN
    SELECT r_bgrp INTO r_bgrp_var FROM receiver WHERE receiver_id = receiver_id_param;
    
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

-- Function to get hospital blood inventory with blood group compatibility
CREATE OR REPLACE FUNCTION get_hospital_blood_inventory(blood_group_param VARCHAR)
RETURNS TABLE (
    inventory_id UUID,
    hospital_id VARCHAR,
    hospital_name VARCHAR,
    city_id VARCHAR,
    city_name VARCHAR,
    blood_group VARCHAR,
    quantity INTEGER,
    doctor_id VARCHAR,
    doctor_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bi.inventory_id,
        h.h_id,
        h.h_name,
        c.city_id,
        c.city_name,
        bi.blood_grp,
        bi.quantity,
        d.doc_id,
        d.doc_name
    FROM 
        blood_inventory bi
    JOIN 
        hospital h ON bi.hospital_id = h.h_id
    LEFT JOIN 
        city c ON h.city_id = c.city_id
    LEFT JOIN 
        doctor d ON bi.doc_id = d.doc_id
    WHERE 
        bi.status = 'available' AND
        bi.quantity > 0 AND
        (
            (blood_group_param = 'A+' AND bi.blood_grp IN ('A+', 'A-', 'O+', 'O-')) OR
            (blood_group_param = 'A-' AND bi.blood_grp IN ('A-', 'O-')) OR
            (blood_group_param = 'B+' AND bi.blood_grp IN ('B+', 'B-', 'O+', 'O-')) OR
            (blood_group_param = 'B-' AND bi.blood_grp IN ('B-', 'O-')) OR
            (blood_group_param = 'AB+' AND bi.blood_grp IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')) OR
            (blood_group_param = 'AB-' AND bi.blood_grp IN ('A-', 'B-', 'AB-', 'O-')) OR
            (blood_group_param = 'O+' AND bi.blood_grp IN ('O+', 'O-')) OR
            (blood_group_param = 'O-' AND bi.blood_grp = 'O-')
        );
END;
$$ LANGUAGE plpgsql;

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamp
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Notification function
CREATE OR REPLACE FUNCTION notify_appointment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO appointment_notifications (
        appointment_id, 
        notification_type, 
        message
    ) VALUES (
        NEW.appointment_id, 
        'status_change', 
        'Appointment status changed from ' || OLD.status || ' to ' || NEW.status
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notifications
CREATE TRIGGER appointment_status_change_notification
    AFTER UPDATE OF status ON appointments
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_appointment_status_change();

-- Function to find blood centers by location
CREATE OR REPLACE FUNCTION find_centers_by_location(lat FLOAT, lng FLOAT, radius_km FLOAT)
RETURNS TABLE (
    center_id VARCHAR,
    center_name VARCHAR,
    address VARCHAR,
    city_name VARCHAR,
    distance FLOAT,
    phone VARCHAR,
    operating_hours VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bc.center_id,
        bc.center_name,
        bc.address,
        c.city_name,
        ST_Distance(
            bc.coordinates::geography,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        ) / 1000 AS distance_km,
        bc.phone,
        bc.operating_hours
    FROM 
        blood_center bc
    LEFT JOIN 
        city c ON bc.city_id = c.city_id
    WHERE 
        ST_DWithin(
            bc.coordinates::geography,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
            radius_km * 1000 -- Convert km to meters
        )
    ORDER BY 
        distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get available appointment slots for a center
CREATE OR REPLACE FUNCTION get_available_slots(center_id_param VARCHAR, date_param DATE)
RETURNS TABLE (
    available_slot TIMESTAMP
) AS $$
DECLARE
    opening_time TIME := '08:00:00';
    closing_time TIME := '18:00:00';
    slot_interval INTERVAL := '30 minutes';
    current_slot TIMESTAMP;
    day_end TIMESTAMP;
BEGIN
    -- Set the start and end times for the day
    current_slot := date_param + opening_time;
    day_end := date_param + closing_time;
    
    -- Loop through each time slot
    WHILE current_slot < day_end LOOP
        -- If the slot isn't already booked, return it
        IF NOT EXISTS (
            SELECT 1 FROM appointments
            WHERE center_id = center_id_param
            AND donation_date = current_slot
            AND status IN ('pending', 'confirmed')
        ) THEN
            available_slot := current_slot;
            RETURN NEXT;
        END IF;
        
        -- Move to next slot
        current_slot := current_slot + slot_interval;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a donor is eligible to donate
CREATE OR REPLACE FUNCTION is_donor_eligible(p_donor_id VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    last_donation_date TIMESTAMP;
    min_interval INTERVAL := '56 days'; -- Standard minimum interval between whole blood donations
BEGIN
    -- Find the most recent completed donation
    SELECT MAX(donation_date)
    INTO last_donation_date
    FROM appointments
    WHERE donor_id = p_donor_id
    AND status = 'completed';
    
    -- If no previous donation or enough time has passed, donor is eligible
    RETURN (
        last_donation_date IS NULL OR
        (CURRENT_TIMESTAMP - last_donation_date) >= min_interval
    );
END;
$$ LANGUAGE plpgsql;

-- Enable RLS and set policies
ALTER TABLE city ENABLE ROW LEVEL SECURITY;

-- Create policy for reading cities
DROP POLICY IF EXISTS "Anyone can view cities" ON city;
CREATE POLICY "Anyone can view cities"
ON city FOR SELECT
TO PUBLIC
USING (true);

-- Create policy for inserting cities
DROP POLICY IF EXISTS "Anyone can insert cities" ON city;
CREATE POLICY "Anyone can insert cities"
ON city FOR INSERT
TO PUBLIC
WITH CHECK (true);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
DROP POLICY IF EXISTS "Users can manage their own data" ON users;
CREATE POLICY "Users can manage their own data"
ON users
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Public can view users" ON users;
CREATE POLICY "Public can view users"
ON users
FOR SELECT
TO PUBLIC
USING (true);

-- Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles table - REMOVE THESE, they're duplicated
DROP POLICY IF EXISTS "Authenticated users can manage their profiles" ON user_profiles;
DROP POLICY IF EXISTS "Public can view user profiles" ON user_profiles;

-- Create function to automatically sync users from auth to public.users
CREATE OR REPLACE FUNCTION public.sync_user_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, user_role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    user_role = COALESCE(NEW.raw_user_meta_data->>'role', users.user_role),
    updated_at = EXCLUDED.updated_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Try to create trigger on auth.users (may fail in some environments)
DO $$
BEGIN
  BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.sync_user_from_auth();
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not create trigger on auth schema. You may need to manually sync users.';
  END;
END
$$;

-- Create policy for general read access to receivers
CREATE POLICY "Anyone can read receivers"
ON receiver
FOR SELECT
TO PUBLIC
USING (true);

-- Create policy that allows authenticated users to insert receivers
CREATE POLICY "Allow anyone to insert receivers"
ON receiver
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy for users to update their own receiver profiles
CREATE POLICY "Authenticated users can update receivers"
ON receiver
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.profile_id = receiver_id
    AND up.user_id = auth.uid()
    AND up.profile_type = 'receiver'
  )
  OR
  (SELECT COALESCE(raw_user_meta_data->>'role', '') FROM auth.users WHERE id = auth.uid()) = 'staff'
);

-- Create policy for deleting receivers (staff only)
CREATE POLICY "Staff can delete receivers"
ON receiver
FOR DELETE
TO authenticated
USING (
  (SELECT COALESCE(raw_user_meta_data->>'role', '') FROM auth.users WHERE id = auth.uid()) = 'staff'
);

-- Create policies for hospital_doctor table
CREATE POLICY "Anyone can read hospital_doctor relationships"
ON hospital_doctor
FOR SELECT
TO PUBLIC
USING (true);

-- Update the database schema cache - important for PostgREST
NOTIFY pgrst, 'reload schema';