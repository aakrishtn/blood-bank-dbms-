-- Add index to donor_id field for better performance when searching by donor_id
CREATE INDEX IF NOT EXISTS idx_donor_donor_id ON donor(donor_id);
 
-- Make sure donor_phno field can handle our shortened email addresses
ALTER TABLE donor ALTER COLUMN donor_phno TYPE VARCHAR(15); 