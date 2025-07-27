-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('finder', 'poster')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget DECIMAL(10,2) NOT NULL,
  posted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  poster_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  category TEXT NOT NULL
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  finder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  finder_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message TEXT,
  UNIQUE(job_id, finder_id)
);

-- Create negotiations table
CREATE TABLE IF NOT EXISTS negotiations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  finder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  finder_name TEXT NOT NULL,
  proposed_amount DECIMAL(10,2) NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, finder_id)
);

-- Create wallet table for tracking user balances
CREATE TABLE IF NOT EXISTS wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_earned DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  pending_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create transactions table for payment history
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('earning', 'withdrawal', 'refund', 'fee')),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create job_completions table to track completed work
CREATE TABLE IF NOT EXISTS job_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  finder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  poster_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  final_amount DECIMAL(10,2) NOT NULL,
  completion_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'disputed')),
  finder_rating INTEGER CHECK (finder_rating >= 1 AND finder_rating <= 5),
  poster_rating INTEGER CHECK (poster_rating >= 1 AND poster_rating <= 5),
  completion_notes TEXT,
  UNIQUE(job_id, finder_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_completions ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (true);

-- Create policies for jobs table
CREATE POLICY "Anyone can view active jobs" ON jobs
  FOR SELECT USING (status = 'active');

CREATE POLICY "Posters can insert their own jobs" ON jobs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Posters can update their own jobs" ON jobs
  FOR UPDATE USING (true);

CREATE POLICY "Posters can delete their own jobs" ON jobs
  FOR DELETE USING (true);

-- Create policies for applications table
CREATE POLICY "Finders can view their own applications" ON applications
  FOR SELECT USING (true);

CREATE POLICY "Posters can view applications for their jobs" ON applications
  FOR SELECT USING (
    job_id IN (SELECT id FROM jobs WHERE posted_by = auth.uid())
  );

CREATE POLICY "Finders can insert their own applications" ON applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Posters can update applications for their jobs" ON applications
  FOR UPDATE USING (
    job_id IN (SELECT id FROM jobs WHERE posted_by = auth.uid())
  );

-- Create policies for negotiations table
CREATE POLICY "Finders can view their own negotiations" ON negotiations
  FOR SELECT USING (true);

CREATE POLICY "Posters can view negotiations for their jobs" ON negotiations
  FOR SELECT USING (
    job_id IN (SELECT id FROM jobs WHERE posted_by = auth.uid())
  );

CREATE POLICY "Finders can insert their own negotiations" ON negotiations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Posters can update negotiations for their jobs" ON negotiations
  FOR UPDATE USING (
    job_id IN (SELECT id FROM jobs WHERE posted_by = auth.uid())
  );

-- Create policies for wallets
CREATE POLICY "Users can view their own wallet" ON wallets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own wallet" ON wallets
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert wallets" ON wallets
  FOR INSERT WITH CHECK (true);

-- Create policies for transactions
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert transactions" ON transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update transactions" ON transactions
  FOR UPDATE USING (true);

-- Create policies for job_completions
CREATE POLICY "Users can view completions they're involved in" ON job_completions
  FOR SELECT USING (finder_id = auth.uid() OR poster_id = auth.uid());

CREATE POLICY "System can insert job completions" ON job_completions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update completions they're involved in" ON job_completions
  FOR UPDATE USING (finder_id = auth.uid() OR poster_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs(posted_by);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_finder_id ON applications(finder_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_job_id ON negotiations(job_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_finder_id ON negotiations(finder_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_job_id ON transactions(job_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_job_completions_job_id ON job_completions(job_id);
CREATE INDEX IF NOT EXISTS idx_job_completions_finder_id ON job_completions(finder_id);
CREATE INDEX IF NOT EXISTS idx_job_completions_poster_id ON job_completions(poster_id);

-- Create function to automatically create wallet for new users
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create wallet
CREATE TRIGGER create_wallet_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_wallet();

-- Create function to update wallet balances
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
        pending_amount = GREATEST(pending_amount - NEW.amount, 0),
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
    ELSIF NEW.type = 'withdrawal' THEN
      UPDATE wallets 
      SET 
        balance = balance - NEW.amount,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update wallet on transaction completion
CREATE TRIGGER update_wallet_trigger
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_balance();
