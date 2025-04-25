-- First, drop any existing tables in reverse order of dependencies
DROP TABLE IF EXISTS appointment_notifications CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS receiver CASCADE;
DROP TABLE IF EXISTS donor CASCADE;
DROP TABLE IF EXISTS blood_sample CASCADE;
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
    doc_phno VARCHAR
);

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

-- Create hospital table
CREATE TABLE IF NOT EXISTS hospital (
    h_id VARCHAR PRIMARY KEY,
    h_name VARCHAR NOT NULL,
    h_bgrprequired VARCHAR,
    h_bgrpreceived VARCHAR,
    city_id VARCHAR REFERENCES city(city_id),
    m_id VARCHAR REFERENCES manager(m_id)
);

-- Create blood sample table
CREATE TABLE IF NOT EXISTS blood_sample (
    sample_id VARCHAR PRIMARY KEY,
    blood_grp VARCHAR NOT NULL,
    status VARCHAR NOT NULL,
    m_id VARCHAR REFERENCES manager(m_id),
    doc_id VARCHAR REFERENCES doctor(doc_id)
);

-- Create donor table
CREATE TABLE IF NOT EXISTS donor (
    donor_id VARCHAR PRIMARY KEY,
    donor_name VARCHAR NOT NULL,
    donor_age INT NOT NULL,
    donor_bgrp VARCHAR NOT NULL,
    donor_sex VARCHAR NOT NULL,
    donor_phno VARCHAR(15),
    city_id VARCHAR REFERENCES city(city_id),
    staff_id VARCHAR REFERENCES staff(staff_id)
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

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    donor_id VARCHAR REFERENCES donor(donor_id),
    receiver_id VARCHAR REFERENCES receiver(receiver_id),
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    blood_center_id VARCHAR REFERENCES blood_center(center_id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT appointment_date_check CHECK (appointment_date > NOW())
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
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_center ON appointments(blood_center_id);
CREATE INDEX idx_donor_bgrp ON donor(donor_bgrp);
CREATE INDEX idx_receiver_bgrp ON receiver(r_bgrp);
CREATE INDEX idx_blood_sample_grp ON blood_sample(blood_grp);
CREATE INDEX idx_hospital_city ON hospital(city_id);
CREATE INDEX idx_donor_city ON donor(city_id);
CREATE INDEX idx_receiver_city ON receiver(city_id);
CREATE INDEX idx_blood_center_city ON blood_center(city_id);
CREATE INDEX idx_donor_donor_id ON donor(donor_id);
CREATE INDEX idx_receiver_phone ON receiver(r_phno);

-- Drop existing function and triggers
DROP TRIGGER IF EXISTS check_blood_group_sample ON blood_sample;
DROP TRIGGER IF EXISTS check_blood_group_donor ON donor;
DROP TRIGGER IF EXISTS check_blood_group_receiver ON receiver;
DROP FUNCTION IF EXISTS validate_blood_group();

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

-- Function to match donors with receivers
CREATE OR REPLACE FUNCTION match_donors_with_receivers(receiver_id_param VARCHAR)
RETURNS TABLE (donor_id VARCHAR, donor_name VARCHAR, blood_grp VARCHAR) AS $$
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

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to handle appointment notifications
CREATE OR REPLACE FUNCTION notify_appointment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO appointment_notifications (
        appointment_id,
        notification_type,
        message,
        created_at
    ) VALUES (
        NEW.appointment_id,
        'status_change',
        format('Appointment status changed from %s to %s', OLD.status, NEW.status),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointment_status_change_notification
    AFTER UPDATE OF status ON appointments
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION notify_appointment_status_change();

-- Function to find blood centers by location
CREATE OR REPLACE FUNCTION find_centers_by_location(
    lat_param FLOAT,
    lng_param FLOAT,
    radius_km FLOAT
)
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
    FROM blood_center bc
    WHERE ST_DWithin(
        bc.coordinates::geography,
        ST_SetSRID(ST_MakePoint(lng_param, lat_param), 4326)::geography,
        radius_km * 1000
    )
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Function to get available appointment slots
CREATE OR REPLACE FUNCTION get_available_slots(
    p_center_id VARCHAR,
    p_date DATE
)
RETURNS TABLE (
    time_slot TIME
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE
    hours AS (
        SELECT '09:00'::TIME AS slot
        UNION ALL
        SELECT (slot + INTERVAL '1 hour')::TIME
        FROM hours
        WHERE slot < '17:00'::TIME
    ),
    booked_slots AS (
        SELECT DISTINCT DATE_TRUNC('hour', appointment_date)::TIME as booked_time
        FROM appointments
        WHERE blood_center_id = p_center_id
        AND DATE(appointment_date) = p_date
        AND status IN ('pending', 'confirmed')
    )
    SELECT h.slot
    FROM hours h
    WHERE h.slot NOT IN (SELECT booked_time FROM booked_slots)
    ORDER BY h.slot;
END;
$$ LANGUAGE plpgsql;

-- Function to check donor eligibility
CREATE OR REPLACE FUNCTION is_donor_eligible(p_donor_id VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    last_donation_date DATE;
BEGIN
    SELECT DATE(appointment_date)
    INTO last_donation_date
    FROM appointments
    WHERE donor_id = p_donor_id
    AND status = 'completed'
    ORDER BY appointment_date DESC
    LIMIT 1;

    RETURN (
        last_donation_date IS NULL OR 
        last_donation_date < CURRENT_DATE - INTERVAL '3 months'
    );
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
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
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Cities are viewable by everyone" ON city;
DROP POLICY IF EXISTS "authenticated_users_can_insert_cities" ON city;
DROP POLICY IF EXISTS "Allow authenticated users to read all donors" ON donor;
DROP POLICY IF EXISTS "Users can view own donor profile" ON donor;
DROP POLICY IF EXISTS "Staff can update donor information" ON donor;
DROP POLICY IF EXISTS "Allow authenticated users to read all blood centers" ON blood_center;

-- Create RLS policies
-- City policies
CREATE POLICY "Cities are viewable by everyone"
ON city FOR SELECT
TO PUBLIC
USING (true);

CREATE POLICY "authenticated_users_can_insert_cities"
ON city FOR INSERT
TO authenticated
WITH CHECK (true);

-- Donor policies
DROP POLICY IF EXISTS "Allow authenticated users to read all donors" ON donor;
DROP POLICY IF EXISTS "Users can view own donor profile" ON donor;
DROP POLICY IF EXISTS "Staff can update donor information" ON donor;
DROP POLICY IF EXISTS "Authenticated users can insert donors" ON donor;

-- Recreate donor policies with simpler logic
CREATE POLICY "Anyone can read donors"
ON donor FOR SELECT
TO PUBLIC
USING (true);

CREATE POLICY "Authenticated users can insert donors"
ON donor FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update donors"
ON donor FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.profile_id = donor_id
        AND up.user_id = auth.uid()
        AND up.profile_type = 'donor'
    )
    OR
    (SELECT COALESCE(raw_user_meta_data->>'role', '') FROM auth.users WHERE id = auth.uid()) = 'staff'
);

-- Blood center policies
CREATE POLICY "Allow authenticated users to read all blood centers"
ON blood_center FOR SELECT
TO authenticated
USING (true);

-- Appointment policies
CREATE POLICY "Users can view their own appointments"
ON appointments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE (up.profile_id = donor_id OR up.profile_id = receiver_id)
        AND up.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create their own appointments"
ON appointments FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE (up.profile_id = donor_id OR up.profile_id = receiver_id)
        AND up.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own appointments"
ON appointments FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE (up.profile_id = donor_id OR up.profile_id = receiver_id)
        AND up.user_id = auth.uid()
    )
);

-- Drop existing user_profiles policies
DROP POLICY IF EXISTS "Users can manage their own profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can read their own profiles" ON user_profiles;
DROP POLICY IF EXISTS "Staff can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can manage their profiles" ON user_profiles;
DROP POLICY IF EXISTS "Public can view user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON user_profiles;

-- Create simplified user_profiles policies without circular references
CREATE POLICY "User profiles basic access"
ON user_profiles
FOR SELECT
TO PUBLIC
USING (true);

CREATE POLICY "User profiles self management"
ON user_profiles
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- This policy allows inserting any profile (users will be limited by application logic)
CREATE POLICY "User profiles insert"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix staff policy to use user metadata instead of referencing the same table
-- This was causing infinite recursion
DROP POLICY IF EXISTS "Staff can read all profiles" ON user_profiles;
CREATE POLICY "Staff admin access"
ON user_profiles
FOR SELECT
TO authenticated
USING (
    (SELECT COALESCE(raw_user_meta_data->>'role', '') FROM auth.users WHERE id = auth.uid()) = 'staff'
);

-- Add policy for inserting user profiles
CREATE POLICY "Allow authenticated users to insert profiles"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add policy for users table
DROP POLICY IF EXISTS "Users can view and update their own data" ON users;

CREATE POLICY "Users can view and update their own data"
ON users
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Function to set up city table policies
CREATE OR REPLACE FUNCTION setup_city_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Disable RLS temporarily
    ALTER TABLE city DISABLE ROW LEVEL SECURITY;

    -- Drop existing policies
    DROP POLICY IF EXISTS "Enable read access for all users" ON city;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON city;

    -- Create new policies
    CREATE POLICY "Enable read access for all users"
    ON city FOR SELECT
    USING (true);

    CREATE POLICY "Enable insert for authenticated users"
    ON city FOR INSERT
    WITH CHECK (true);

    -- Enable RLS
    ALTER TABLE city ENABLE ROW LEVEL SECURITY;
END;
$$;

-- First, disable RLS
ALTER TABLE city DISABLE ROW LEVEL SECURITY;

-- Delete existing cities
DELETE FROM city;

-- Insert US cities
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