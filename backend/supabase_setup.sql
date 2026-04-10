-- ═══════════════════════════════════════════════════════════════
--  GhostLaw — Supabase Schema Setup
--  Run this once in your Supabase SQL editor (Dashboard → SQL → New Query)
-- ═══════════════════════════════════════════════════════════════

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    user_id     TEXT PRIMARY KEY,
    email       TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL DEFAULT '',
    name        TEXT NOT NULL DEFAULT '',
    provider    TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    scans_count  INTEGER NOT NULL DEFAULT 0,
    disputes_count INTEGER NOT NULL DEFAULT 0,
    total_saved  NUMERIC NOT NULL DEFAULT 0.0
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ── SCANS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scans (
    scan_id    TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(user_id),
    data       JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scans_user ON scans(user_id, created_at DESC);

-- ── DISPUTES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS disputes (
    dispute_id TEXT PRIMARY KEY,
    scan_id    TEXT NOT NULL,
    user_id    TEXT NOT NULL REFERENCES users(user_id),
    data       JSONB NOT NULL,
    status     TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_disputes_user ON disputes(user_id, created_at DESC);

-- ── CALLS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calls (
    call_id    TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(user_id),
    data       JSONB NOT NULL,
    status     TEXT NOT NULL DEFAULT 'queued',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_calls_user ON calls(user_id, created_at DESC);

-- ── ROW LEVEL SECURITY (recommended) ────────────────────────
ALTER TABLE users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans    ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON users    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON scans    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON disputes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON calls    FOR ALL USING (true) WITH CHECK (true);