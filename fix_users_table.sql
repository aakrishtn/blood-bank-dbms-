-- Drop and recreate the users table if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'users'
  ) THEN
    -- Table exists, check structure
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'password_hash'
      AND is_nullable = 'YES'
    ) THEN
      -- Modify password_hash to allow NULL values since we're using Supabase Auth
      ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;
    END IF;
  ELSE
    -- Create users table with proper structure
    CREATE TABLE public.users (
      id UUID PRIMARY KEY,
      email VARCHAR UNIQUE NOT NULL,
      password_hash VARCHAR,  -- Allow NULL for Supabase Auth
      user_role VARCHAR NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;

  -- Make sure the auth.users table is properly linked
  -- This will ensure the auth.uid() function can match users across schemas
  
  -- Enable RLS on users table
  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can manage their own data" ON public.users;
  DROP POLICY IF EXISTS "Public can view users" ON public.users;
  
  -- Create policies
  CREATE POLICY "Users can manage their own data"
  ON public.users
  FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
  
  -- Allow public read of users for profile display
  CREATE POLICY "Public can view users"
  ON public.users
  FOR SELECT
  TO PUBLIC
  USING (true);
  
  -- Ensure user_profiles table has proper policies
  ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Authenticated users can manage their profiles" ON public.user_profiles;
  DROP POLICY IF EXISTS "Public can view user profiles" ON public.user_profiles;
  
  -- Allow users to manage their own profiles
  CREATE POLICY "Authenticated users can manage their profiles"
  ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  
  -- Allow public to view profiles for display purposes
  CREATE POLICY "Public can view user profiles"
  ON public.user_profiles
  FOR SELECT
  TO PUBLIC
  USING (true);
  
  -- Create function to automatically create users table entry from auth.users
  -- This will help keep the tables in sync
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

  -- Try to create trigger (may fail if auth schema doesn't allow it)
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