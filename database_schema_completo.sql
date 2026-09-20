-- =========================================================================
-- GODESC 360 - ESQUEMA COMPLETO DE BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- =========================================================================
-- Copie todo o conteúdo deste arquivo e execute no "SQL Editor" do seu Supabase.
-- Ele cria todas as tabelas com RLS habilitado e publicação em Tempo Real (Realtime).
-- =========================================================================

-- 1. TABELA DE CHAMADOS / TICKETS
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
  messages JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total publico tickets" ON public.tickets;
CREATE POLICY "Acesso total publico tickets" ON public.tickets FOR ALL USING (true) WITH CHECK (true);

-- 2. TABELA DE NOTIFICAÇÕES DO SISTEMA
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
DROP POLICY IF EXISTS "Acesso total publico notifications" ON public.notifications;
CREATE POLICY "Acesso total publico notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- 3. TABELA DE USUÁRIOS GERENCIADOS (EQUIPE T.I. & CLIENTES)
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
DROP POLICY IF EXISTS "Acesso total publico managed_users" ON public.managed_users FOR ALL USING (true) WITH CHECK (true);

-- 4. TABELA DE EVENTOS DO CALENDÁRIO & LEMBRETES
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  time TEXT,
  type TEXT DEFAULT 'reminder',
  created_by TEXT,
  created_at TEXT,
  completed BOOLEAN DEFAULT false
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total publico calendar_events" ON public.calendar_events FOR ALL USING (true) WITH CHECK (true);

-- 5. TABELA DO COFRE DE SENHAS & CREDENCIAIS DE T.I. (VAULT)
CREATE TABLE IF NOT EXISTS public.vault_credentials (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  service TEXT,
  username TEXT,
  password TEXT NOT NULL,
  url TEXT,
  notes TEXT,
  category TEXT,
  created_at TEXT,
  updated_at TEXT
);

ALTER TABLE public.vault_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total publico vault_credentials" ON public.vault_credentials FOR ALL USING (true) WITH CHECK (true);

-- 6. TABELA DE PASTAS E NOTAS DA BASE DE DADOS
CREATE TABLE IF NOT EXISTS public.db_folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#45dfa4',
  created_at TEXT
);

ALTER TABLE public.db_folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total publico db_folders" ON public.db_folders FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.db_notes (
  id TEXT PRIMARY KEY,
  folder_id TEXT,
  title TEXT NOT NULL,
  content TEXT,
  created_at TEXT,
  updated_at TEXT
);

ALTER TABLE public.db_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total publico db_notes" ON public.db_notes FOR ALL USING (true) WITH CHECK (true);

-- 7. TABELAS AUXILIARES: CATEGORIAS DE TICKETS & EMPRESAS CLIENTES
CREATE TABLE IF NOT EXISTS public.ticket_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  subcategories JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total publico ticket_categories" ON public.ticket_categories FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  address TEXT,
  created_at TEXT
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total publico companies" ON public.companies FOR ALL USING (true) WITH CHECK (true);

-- 8. PUBLICAÇÃO EM TEMPO REAL (REALTIME)
-- Permite que alterações feitas por um usuário reflitam instantaneamente na tela dos outros
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.managed_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vault_credentials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.db_folders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.db_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
