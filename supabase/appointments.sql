-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    donor_id VARCHAR(255) REFERENCES donor(donor_id),
    receiver_id VARCHAR(255) REFERENCES receiver(receiver_id),
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    blood_center_id VARCHAR(255) REFERENCES blood_center(center_id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_appointments_donor_id ON appointments(donor_id);
CREATE INDEX idx_appointments_receiver_id ON appointments(receiver_id);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Create RLS policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own appointments"
    ON appointments FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE profile_id = donor_id OR profile_id = receiver_id
        )
    );

CREATE POLICY "Users can create their own appointments"
    ON appointments FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE profile_id = donor_id OR profile_id = receiver_id
        )
    );

CREATE POLICY "Users can update their own appointments"
    ON appointments FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE profile_id = donor_id OR profile_id = receiver_id
        )
    ); 