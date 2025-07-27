-- Add bank account number column to withdrawal_history table
ALTER TABLE withdrawal_history ADD COLUMN IF NOT EXISTS bank_account_no TEXT;

-- Update the status values to include 'deposited'
ALTER TABLE withdrawal_history DROP CONSTRAINT IF EXISTS withdrawal_history_status_check;
ALTER TABLE withdrawal_history ADD CONSTRAINT withdrawal_history_status_check 
  CHECK (status IN ('pending', 'completed', 'failed', 'deposited'));
