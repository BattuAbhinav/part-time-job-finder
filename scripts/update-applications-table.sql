-- Add student details columns to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS student_email TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS student_contact TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS student_distance TEXT DEFAULT '5 km';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS student_time_to_reach TEXT DEFAULT '30 mins';

-- Add student details columns to negotiations table
ALTER TABLE negotiations ADD COLUMN IF NOT EXISTS student_email TEXT;
ALTER TABLE negotiations ADD COLUMN IF NOT EXISTS student_contact TEXT;
ALTER TABLE negotiations ADD COLUMN IF NOT EXISTS student_distance TEXT DEFAULT '5 km';
ALTER TABLE negotiations ADD COLUMN IF NOT EXISTS student_time_to_reach TEXT DEFAULT '30 mins';

-- Create withdrawal_history table
CREATE TABLE IF NOT EXISTS withdrawal_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  upi_id TEXT,
  bank_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  transaction_id TEXT
);

-- Create policies for withdrawal_history
CREATE POLICY "Users can view their own withdrawal history" ON withdrawal_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert withdrawal history" ON withdrawal_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update withdrawal history" ON withdrawal_history
  FOR UPDATE USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_withdrawal_history_user_id ON withdrawal_history(user_id);
