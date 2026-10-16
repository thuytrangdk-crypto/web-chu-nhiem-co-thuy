-- Run once in Supabase SQL Editor. Does not modify app_data or other classes.
CREATE TABLE IF NOT EXISTS public.gvcn_private_state (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.gvcn_private_backups (
  id uuid PRIMARY KEY,
  scope text NOT NULL,
  reason text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gvcn_private_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gvcn_private_backups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gvcn_private_state, public.gvcn_private_backups FROM anon, authenticated;
GRANT ALL ON public.gvcn_private_state, public.gvcn_private_backups TO service_role;
