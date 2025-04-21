-- First make sure RLS is enabled on the donor table
ALTER TABLE donor ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies for donor table
DROP POLICY IF EXISTS "Donors can view their own data" ON donor;
DROP POLICY IF EXISTS "Staff can view all donors" ON donor;
DROP POLICY IF EXISTS "Authenticated users can insert donors" ON donor;

-- Create policy to allow authenticated users to insert donor records
CREATE POLICY "Authenticated users can insert donors"
ON donor
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow users to view their own donor records
-- This assumes the user_profiles table links auth.users to donor records
CREATE POLICY "Donors can view their own data"
ON donor
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.profile_id = donor.donor_id
        AND user_profiles.user_id = auth.uid()
        AND user_profiles.profile_type = 'donor'
    )
);

-- Create policy for staff to view all donor records
-- Assuming a staff role check through user metadata or roles
CREATE POLICY "Staff can view all donors"
ON donor
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'staff'
    )
);

-- Optional: Add policies for update and delete if needed
-- For example:
CREATE POLICY "Donors can update their own data"
ON donor
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.profile_id = donor.donor_id
        AND user_profiles.user_id = auth.uid()
        AND user_profiles.profile_type = 'donor'
    )
);

-- Make sure the user_profiles table also has proper RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert into user_profiles
DROP POLICY IF EXISTS "Authenticated users can manage their profiles" ON user_profiles;

CREATE POLICY "Authenticated users can manage their profiles"
ON user_profiles
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Verify the city policy is properly set
DROP POLICY IF EXISTS "Cities are viewable by everyone" ON city;
DROP POLICY IF EXISTS "authenticated_users_can_insert_cities" ON city;

CREATE POLICY "Cities are viewable by everyone"
ON city
FOR SELECT
USING (true);

CREATE POLICY "authenticated_users_can_insert_cities"
ON city
FOR INSERT
TO authenticated
WITH CHECK (true); 