-- Run this in your Supabase SQL Editor

-- Karura Youth Run registrations (paid runners)
CREATE TABLE IF NOT EXISTS karura_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  names TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  company TEXT,
  emergency_contact TEXT,
  payment_status TEXT DEFAULT 'Pending',
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Karura sponsorship requests (student requests)
CREATE TABLE IF NOT EXISTS sponsorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  names TEXT NOT NULL,
  phone TEXT NOT NULL,
  reg_no TEXT NOT NULL,
  institution TEXT NOT NULL,
  program TEXT NOT NULL,
  emergency_contact TEXT,
  status TEXT DEFAULT 'Pending',
  submitted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE karura_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorship_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'karura_registrations' AND policyname = 'Allow public karura inserts') THEN
    CREATE POLICY "Allow public karura inserts" ON karura_registrations FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sponsorship_requests' AND policyname = 'Allow public sponsorship inserts') THEN
    CREATE POLICY "Allow public sponsorship inserts" ON sponsorship_requests FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'karura_registrations' AND policyname = 'Service role karura access') THEN
    CREATE POLICY "Service role karura access" ON karura_registrations FOR ALL USING (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sponsorship_requests' AND policyname = 'Service role sponsorship access') THEN
    CREATE POLICY "Service role sponsorship access" ON sponsorship_requests FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;
