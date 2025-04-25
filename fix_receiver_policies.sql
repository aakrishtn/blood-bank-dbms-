-- Fix receiver table Row Level Security policies
DO $$
BEGIN
  -- First, make sure RLS is enabled on the receiver table
  ALTER TABLE receiver ENABLE ROW LEVEL SECURITY;
  
  -- Drop any existing policies for receiver table to avoid conflicts
  DROP POLICY IF EXISTS "Allow authenticated users to read all receivers" ON receiver;
  DROP POLICY IF EXISTS "Users can view own receiver profile" ON receiver;
  DROP POLICY IF EXISTS "Staff can update receiver information" ON receiver;
  DROP POLICY IF EXISTS "Authenticated users can insert receivers" ON receiver;
  DROP POLICY IF EXISTS "Anyone can read receivers" ON receiver;
  DROP POLICY IF EXISTS "Authenticated users can update receivers" ON receiver;
  DROP POLICY IF EXISTS "Allow anyone to insert receivers" ON receiver;

  -- Create a policy that allows authenticated users to insert receivers
  -- This is critical to fix the current error
  CREATE POLICY "Allow anyone to insert receivers"
  ON receiver
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
  
  -- Create policy for general read access to receivers
  CREATE POLICY "Anyone can read receivers"
  ON receiver
  FOR SELECT
  TO PUBLIC
  USING (true);
  
  -- Create policy for users to update their own receiver profile
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
  
  RAISE NOTICE 'Successfully updated receiver table policies';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating receiver policies: %', SQLERRM;
END
$$; 