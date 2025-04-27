-- Update donor table to include hospital_id and doctor_id
ALTER TABLE donor 
ADD COLUMN hospital_id VARCHAR REFERENCES hospital(h_id),
ADD COLUMN doctor_id VARCHAR REFERENCES doctor(doc_id);

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_donor_hospital ON donor(hospital_id);
CREATE INDEX IF NOT EXISTS idx_donor_doctor ON donor(doctor_id);

-- Update the donor table RLS policies to allow updates to these fields
DROP POLICY IF EXISTS "Authenticated users can update donors" ON donor;
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