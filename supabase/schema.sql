-- ==============================================================================
-- AI EBITDA Cold Call Copilot - Supabase Database Schema
-- Compatible with PostgreSQL 14+ and Supabase Hosted Postgres
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean existing tables if needed for fresh migrations
-- DROP TABLE IF EXISTS call_records CASCADE;
-- DROP TABLE IF EXISTS companies CASCADE;

-- 1. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    industry VARCHAR(120),
    location VARCHAR(255),
    contact_name VARCHAR(255),
    contact_designation VARCHAR(255),
    business_challenges TEXT,
    revenue NUMERIC(15, 2) DEFAULT 0.00,
    operating_expenses NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. CALL RECORDS TABLE
CREATE TABLE IF NOT EXISTS call_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_name VARCHAR(255),
    call_date TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    notes TEXT,
    call_outcome VARCHAR(50) NOT NULL CHECK (
        call_outcome IN ('Interested', 'Follow-up Required', 'Not Interested', 'No Answer')
    ),
    follow_up_date TIMESTAMPTZ,
    ai_preparation JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. INDEXES FOR HIGH-PERFORMANCE SEARCH & FILTERING
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(company_name);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_calls_company_id ON call_records(company_id);
CREATE INDEX IF NOT EXISTS idx_calls_call_date ON call_records(call_date DESC);
CREATE INDEX IF NOT EXISTS idx_calls_follow_up_date ON call_records(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_calls_outcome ON call_records(call_outcome);

-- 4. TRIGGER FUNCTION FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_companies_updated_at ON companies;
CREATE TRIGGER trigger_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_records ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access for anon key in demo / single-tenant setup
-- In multi-tenant environments with Supabase Auth, you can replace these with (auth.uid() = user_id)
DROP POLICY IF EXISTS "Allow anon read access on companies" ON companies;
CREATE POLICY "Allow anon read access on companies"
    ON companies FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow anon insert access on companies" ON companies;
CREATE POLICY "Allow anon insert access on companies"
    ON companies FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update access on companies" ON companies;
CREATE POLICY "Allow anon update access on companies"
    ON companies FOR UPDATE
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow anon delete access on companies" ON companies;
CREATE POLICY "Allow anon delete access on companies"
    ON companies FOR DELETE
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow anon read access on call_records" ON call_records;
CREATE POLICY "Allow anon read access on call_records"
    ON call_records FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow anon insert access on call_records" ON call_records;
CREATE POLICY "Allow anon insert access on call_records"
    ON call_records FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update access on call_records" ON call_records;
CREATE POLICY "Allow anon update access on call_records"
    ON call_records FOR UPDATE
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow anon delete access on call_records" ON call_records;
CREATE POLICY "Allow anon delete access on call_records"
    ON call_records FOR DELETE
    TO anon, authenticated
    USING (true);
