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