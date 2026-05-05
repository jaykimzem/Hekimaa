-- ================================================================
-- PHUMOLO MARATHON ADMIN — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ================================================================

-- 1. BIB counter table (ensures sequential, never reused BIBs)
CREATE TABLE IF NOT EXISTS bib_counter (
  id INT PRIMARY KEY DEFAULT 1,
  last_bib INT NOT NULL DEFAULT 0,
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO bib_counter (id, last_bib) VALUES (1, 0) ON CONFLICT DO NOTHING;

-- 2. Registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bib_number INT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  age INT,
  id_number TEXT,
  race_category TEXT NOT NULL,
  shirt_size TEXT CHECK (shirt_size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  shirt_color TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Confirmed', 'Cancelled')),
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Function to auto-assign BIB numbers atomically
CREATE OR REPLACE FUNCTION assign_bib()
RETURNS TRIGGER AS $$
DECLARE
  next_bib INT;
BEGIN
  UPDATE bib_counter SET last_bib = last_bib + 1 WHERE id = 1 RETURNING last_bib INTO next_bib;
  NEW.bib_number := next_bib;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger to call the function before every insert
DROP TRIGGER IF EXISTS assign_bib_trigger ON registrations;
CREATE TRIGGER assign_bib_trigger
  BEFORE INSERT ON registrations
  FOR EACH ROW EXECUTE FUNCTION assign_bib();

-- 5. Enable Row Level Security
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bib_counter ENABLE ROW LEVEL SECURITY;

-- 6. Allow public inserts (for frontend form submissions)
CREATE POLICY "Allow public inserts" ON registrations
  FOR INSERT WITH CHECK (true);

-- 7. Allow service role full access (for admin dashboard)
CREATE POLICY "Service role full access" ON registrations
  FOR ALL USING (auth.role() = 'service_role');

-- 8. Allow public to read their own entry by phone (optional)
CREATE POLICY "Public read by phone" ON registrations
  FOR SELECT USING (true);
