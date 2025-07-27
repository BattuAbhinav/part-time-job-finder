-- Add new columns to jobs table for enhanced job posting
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS roles_responsibilities TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS end_time TIME;

-- Update existing jobs to have default values
UPDATE jobs SET roles_responsibilities = '' WHERE roles_responsibilities IS NULL;
