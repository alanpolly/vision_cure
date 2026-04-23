-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL, -- Use TEXT to support MongoDB IDs or UUIDs
  telegram_id TEXT,
  caregiver_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medication_logs table
CREATE TABLE IF NOT EXISTS medication_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  medicine_name TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  taken_at TIMESTAMPTZ,
  status TEXT DEFAULT 'PENDING', -- PENDING, TAKEN, MISSED
  created_at TIMESTAMPTZ DEFAULT NOW()
);
