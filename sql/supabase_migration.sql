-- ═══════════════════════════════════════════════════════════════════
-- HEKIMA MARATHON — SUPABASE MIGRATION
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. REGISTRATIONS TABLE ──────────────────────────────────────────
-- Drop & recreate as a clean flat table matching register.html payload
-- (safe to run multiple times due to IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS registrations (
  id             bigserial PRIMARY KEY,
  first_name     text NOT NULL,
  last_name      text NOT NULL,
  email          text NOT NULL,
  phone          text NOT NULL,
  id_number      text,
  race_category  text NOT NULL,
  gender         text,
  bib_number     integer,
  shirt_size     text,
  payment_status text NOT NULL DEFAULT 'Pending',
  terms_accepted boolean NOT NULL DEFAULT false,
  submitted_at   timestamptz DEFAULT now(),
  created_at     timestamptz DEFAULT now()
);

-- If the table already exists, add any missing columns one by one:
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS first_name     text;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS last_name      text;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS email          text;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS phone          text;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS id_number      text;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS race_category  text;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS gender         text;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS bib_number     integer;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS shirt_size     text;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'Pending';
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS submitted_at   timestamptz DEFAULT now();
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS created_at     timestamptz DEFAULT now();

-- ── 2. VOLUNTEERS TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS volunteers (
  id                       bigserial PRIMARY KEY,
  full_name                text NOT NULL,
  email                    text NOT NULL,
  phone                    text NOT NULL,
  category                 text NOT NULL,
  organization             text,
  id_number                text,
  residence                text,
  transport_assistance     boolean DEFAULT false,
  accommodation_assistance boolean DEFAULT false,
  stipend_expectation      boolean DEFAULT false,
  stipend_amount           numeric(10,2),
  status                   text DEFAULT 'pending',
  created_at               timestamptz DEFAULT now()
);

-- ── 3. KARURA REGISTRATIONS TABLE ───────────────────────────────────
-- Paybill 880100 (same as Molo Marathon)
CREATE TABLE IF NOT EXISTS karura_registrations (
  id                   bigserial PRIMARY KEY,
  names                text NOT NULL,
  phone                text NOT NULL,
  email                text NOT NULL,
  race_category        text NOT NULL,
  with_car             boolean DEFAULT false,
  company              text,
  emergency_contact    text NOT NULL,
  payment_status       text DEFAULT 'Pending',
  transaction_id       text,
  checkout_request_id  text,
  reference            text,
  created_at           timestamptz DEFAULT now()
);

-- Add any missing columns if table already exists:
ALTER TABLE karura_registrations ADD COLUMN IF NOT EXISTS checkout_request_id text;
ALTER TABLE karura_registrations ADD COLUMN IF NOT EXISTS transaction_id      text;
ALTER TABLE karura_registrations ADD COLUMN IF NOT EXISTS reference           text;

-- ── 4. DONATIONS TABLE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donations (
  id                   bigserial PRIMARY KEY,
  donor_name           text DEFAULT 'Anonymous',
  phone                text NOT NULL,
  amount               numeric(10,2) NOT NULL,
  status               text DEFAULT 'Pending',
  cause                text DEFAULT 'Karura Youth Run',
  checkout_request_id  text,
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE donations ADD COLUMN IF NOT EXISTS checkout_request_id text;

-- ── 5. SPONSORSHIP REQUESTS TABLE ───────────────────────────────────
CREATE TABLE IF NOT EXISTS sponsorship_requests (
  id                bigserial PRIMARY KEY,
  names             text NOT NULL,
  phone             text NOT NULL,
  reg_no            text NOT NULL,
  institution       text NOT NULL,
  program           text NOT NULL,
  emergency_contact text NOT NULL,
  status            text DEFAULT 'pending',
  created_at        timestamptz DEFAULT now()
);

-- ── 6. ROW LEVEL SECURITY (RLS) ─────────────────────────────────────
-- Enable RLS on all tables (required for anon key inserts to work)

ALTER TABLE registrations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE karura_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorship_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public registration forms use anon key)
DO $$
BEGIN
  -- registrations
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'registrations' AND policyname = 'anon_insert_registrations') THEN
    CREATE POLICY anon_insert_registrations ON registrations FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'registrations' AND policyname = 'anon_select_registrations') THEN
    CREATE POLICY anon_select_registrations ON registrations FOR SELECT TO anon USING (true);
  END IF;

  -- volunteers
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'volunteers' AND policyname = 'anon_insert_volunteers') THEN
    CREATE POLICY anon_insert_volunteers ON volunteers FOR INSERT TO anon WITH CHECK (true);
  END IF;

  -- karura_registrations
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'karura_registrations' AND policyname = 'anon_insert_karura') THEN
    CREATE POLICY anon_insert_karura ON karura_registrations FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'karura_registrations' AND policyname = 'anon_select_karura') THEN
    CREATE POLICY anon_select_karura ON karura_registrations FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'karura_registrations' AND policyname = 'anon_update_karura') THEN
    CREATE POLICY anon_update_karura ON karura_registrations FOR UPDATE TO anon USING (true);
  END IF;

  -- donations
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'donations' AND policyname = 'anon_insert_donations') THEN
    CREATE POLICY anon_insert_donations ON donations FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'donations' AND policyname = 'anon_select_donations') THEN
    CREATE POLICY anon_select_donations ON donations FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'donations' AND policyname = 'anon_update_donations') THEN
    CREATE POLICY anon_update_donations ON donations FOR UPDATE TO anon USING (true);
  END IF;

  -- sponsorship_requests
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sponsorship_requests' AND policyname = 'anon_insert_sponsorships') THEN
    CREATE POLICY anon_insert_sponsorships ON sponsorship_requests FOR INSERT TO anon WITH CHECK (true);
  END IF;
END$$;

-- ── 7. SHOP ORDERS TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_orders (
  id             bigserial PRIMARY KEY,
  full_name      text NOT NULL,
  email          text,
  phone          text NOT NULL,
  product_name   text NOT NULL,
  color          text,
  size           text,
  quantity       integer DEFAULT 1,
  total_amount   numeric DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'Pending',
  created_at     timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shop_orders' AND policyname = 'anon_insert_shop_orders') THEN
    CREATE POLICY anon_insert_shop_orders ON shop_orders FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shop_orders' AND policyname = 'anon_select_shop_orders') THEN
    CREATE POLICY anon_select_shop_orders ON shop_orders FOR SELECT TO anon USING (true);
  END IF;
END$$;

-- Make email optional in registrations
ALTER TABLE registrations ALTER COLUMN email DROP NOT NULL;

-- ── DONE ─────────────────────────────────────────────────────────────
-- After running this, refresh your Supabase schema cache:
-- Supabase Dashboard → Settings → API → "Reload Schema Cache"

