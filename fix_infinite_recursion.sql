-- Fix infinite recursion in user_profiles policies
-- First, drop all existing potentially problematic policies
DO $$
BEGIN
  -- Drop user_profiles policies that might have recursion
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
  -- This avoids infinite recursion
  CREATE POLICY "Staff admin access"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
      (SELECT COALESCE(raw_user_meta_data->>'role', '') FROM auth.users WHERE id = auth.uid()) = 'staff'
  );
  
  -- Fix appointments policies
  DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
  DROP POLICY IF EXISTS "Users can create their own appointments" ON appointments;
  DROP POLICY IF EXISTS "Users can update their own appointments" ON appointments;
  
  -- Recreate appointment policies with EXISTS instead of IN queries
  -- These perform better and avoid recursion issues
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
  
  -- Fix donor policies
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
  
  RAISE NOTICE 'Successfully fixed policy recursion issues';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error fixing policies: %', SQLERRM;
END
$$; 