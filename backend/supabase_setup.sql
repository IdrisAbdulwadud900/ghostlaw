-- ═══════════════════════════════════════════════════════════════
-- GhostLaw — Supabase Database Setup
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id    TEXT PRIMARY KEY,
    email      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL DEFAULT '',
    name       TEXT NOT NULL DEFAULT '',
    provider   TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    scans_count   INTEGER NOT NULL DEFAULT 0,
    disputes_count INTEGER NOT NULL DEFAULT 0,
    total_saved   REAL NOT NULL DEFAULT 0.0
);

-- Scans table (AI analysis stored as JSONB for flexibility)
CREATE TABLE IF NOT EXISTS scans (
    scan_id    TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    data       JSONB NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
);

-- Disputes table
CREATE TABLE IF NOT EXISTS disputes (
    dispute_id TEXT PRIMARY KEY,
    scan_id    TEXT NOT NULL DEFAULT '',
    user_id    TEXT NOT NULL,
    data       JSONB NOT NULL DEFAULT '{}',
    status     TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT NOT NULL
);

-- Calls table
CREATE TABLE IF NOT EXISTS calls (
    call_id    TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    data       JSONB NOT NULL DEFAULT '{}',
    status     TEXT NOT NULL DEFAULT 'queued',
    created_at TEXT NOT NULL
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_scans_user     ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created  ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disputes_user   ON disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_created ON disputes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_user      ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_created   ON calls(created_at DESC);

-- Disable RLS (our backend handles auth via JWT — no direct client access)
ALTER TABLE users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans    ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls    ENABLE ROW LEVEL SECURITY;

-- Allow all ops for the service_role key (used by backend)
CREATE POLICY "service_all" ON users    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON scans    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON disputes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON calls    FOR ALL USING (true) WITH CHECK (true);
