-- Function to disable RLS for city table
CREATE OR REPLACE FUNCTION disable_city_rls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    ALTER TABLE city DISABLE ROW LEVEL SECURITY;
END;
$$;

-- Function to enable RLS for city table
CREATE OR REPLACE FUNCTION enable_city_rls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    ALTER TABLE city ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Enable read access for all users" ON city;
    DROP POLICY IF EXISTS "Enable insert for service role" ON city;
    
    -- Create policies
    CREATE POLICY "Enable read access for all users"
    ON city FOR SELECT
    USING (true);
    
    CREATE POLICY "Enable insert for service role"
    ON city FOR INSERT
    WITH CHECK (true);
END;
$$; 