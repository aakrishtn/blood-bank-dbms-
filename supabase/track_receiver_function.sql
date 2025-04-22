-- Function to ensure receivers appear in the dashboard
CREATE OR REPLACE FUNCTION track_receiver_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure the receiver is properly tracked
  -- This can be extended with more logic if needed
  
  -- For now, just return the NEW record to allow the insert
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on receiver table
DROP TRIGGER IF EXISTS track_receiver_after_insert ON receiver;
CREATE TRIGGER track_receiver_after_insert
AFTER INSERT ON receiver
FOR EACH ROW
EXECUTE FUNCTION track_receiver_registration();

-- Optional: Add an index on r_phno to improve lookup by email/phone
CREATE INDEX IF NOT EXISTS idx_receiver_phone ON receiver(r_phno);

-- Optional: Add more sophisticated receiver tracking if needed
-- For example, creating entries in a related tracking table 