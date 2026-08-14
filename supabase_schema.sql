-- SQL Migration Schema for GoDesc 360 Service Desk Realtime Database
-- Copy and paste this into Supabase SQL Editor and click RUN.

-- 1. TICKETS TABLE
CREATE TABLE IF NOT EXISTS public.tickets (
  id TEXT PRIMARY KEY,
  ticket_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  company TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  queue TEXT,
  assigned_to TEXT,
  paused_reason TEXT,
  paused_at TEXT,
  messages JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS and create permissive policies for public access (testing environment)
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access tickets" ON public.tickets FOR ALL USING (true) WITH CHECK (true);

-- 2. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  company TEXT NOT NULL,
  time TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  read BOOLEAN DEFAULT false,
  priority TEXT,
  ticket_id TEXT
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- 3. MANAGED USERS TABLE
CREATE TABLE IF NOT EXISTS public.managed_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  allowed_modules JSONB DEFAULT '[]'::jsonb,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TEXT,
  locked BOOLEAN DEFAULT false,
  locked_at TEXT,
  failed_login_attempts INT DEFAULT 0
);

ALTER TABLE public.managed_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access managed_users" ON public.managed_users FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.managed_users;
