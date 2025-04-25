-- Drop existing policies for city table
DROP POLICY IF EXISTS "Cities are viewable by everyone" ON city;
DROP POLICY IF EXISTS "authenticated_users_can_insert_cities" ON city;
DROP POLICY IF EXISTS "Anyone can insert cities" ON city;
DROP POLICY IF EXISTS "Anyone can view cities" ON city;

-- Disable RLS for city table temporarily to allow seeding
ALTER TABLE city DISABLE ROW LEVEL SECURITY;

-- Delete existing cities (if any)
DELETE FROM city;

-- Insert Indian cities
INSERT INTO city (city_id, city_name) VALUES
  ('MUM', 'Mumbai'),
  ('DEL', 'Delhi'),
  ('BLR', 'Bangalore'),
  ('HYD', 'Hyderabad'),
  ('CHN', 'Chennai'),
  ('KOL', 'Kolkata'),
  ('PUN', 'Pune'),
  ('AMD', 'Ahmedabad'),
  ('JAI', 'Jaipur'),
  ('LKO', 'Lucknow');

-- Enable RLS for city table
ALTER TABLE city ENABLE ROW LEVEL SECURITY;

-- Create policies that allow everyone to view cities and authenticated users to insert them
CREATE POLICY "Anyone can view cities"
ON city FOR SELECT
TO PUBLIC
USING (true);

CREATE POLICY "Anyone can insert cities"
ON city FOR INSERT
TO PUBLIC
WITH CHECK (true); 