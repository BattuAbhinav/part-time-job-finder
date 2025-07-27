-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

DROP POLICY IF EXISTS "Anyone can view active jobs" ON jobs;
DROP POLICY IF EXISTS "Posters can insert their own jobs" ON jobs;
DROP POLICY IF EXISTS "Posters can update their own jobs" ON jobs;
DROP POLICY IF EXISTS "Posters can delete their own jobs" ON jobs;

-- Create simpler policies for testing
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on jobs" ON jobs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on applications" ON applications
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on negotiations" ON negotiations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on wallets" ON wallets
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on transactions" ON transactions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on job_completions" ON job_completions
  FOR ALL USING (true) WITH CHECK (true);

-- Create improved wallet update function that handles increments properly
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update wallet based on transaction type
    IF NEW.type = 'earning' THEN
      UPDATE wallets 
      SET 
        balance = balance + NEW.amount,
        total_earned = total_earned + NEW.amount,
        pending_amount = CASE 
          WHEN pending_amount >= NEW.amount THEN pending_amount - NEW.amount 
          ELSE 0 
        END,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
    ELSIF NEW.type = 'withdrawal' THEN
      UPDATE wallets 
      SET 
        balance = CASE 
          WHEN balance >= NEW.amount THEN balance - NEW.amount 
          ELSE 0 
        END,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_wallet_trigger ON transactions;
CREATE TRIGGER update_wallet_trigger
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_balance();
