-- Run this in Supabase SQL Editor to ensure the volunteers and activity_logs tables exist

CREATE TABLE IF NOT EXISTS volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  category TEXT NOT NULL,
  organization TEXT,
  id_number TEXT,
  residence TEXT,
  transport_assistance BOOLEAN DEFAULT false,
  accommodation_assistance BOOLEAN DEFAULT false,
  stipend_expectation BOOLEAN DEFAULT false,
  stipend_amount NUMERIC,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'volunteers' AND policyname = 'Allow public volunteer inserts'
  ) THEN
    CREATE POLICY "Allow public volunteer inserts" ON volunteers FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'volunteers' AND policyname = 'Service role volunteer access'
  ) THEN
    CREATE POLICY "Service role volunteer access" ON volunteers FOR ALL USING (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'Service role activity access'
  ) THEN
    CREATE POLICY "Service role activity access" ON activity_logs FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;
