-- Add authentication/profile columns expected by server/routes/auth.ts
ALTER TABLE public.farmers
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS experience TEXT DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;

-- Helpful indexes for auth lookups
CREATE INDEX IF NOT EXISTS idx_farmers_phone ON public.farmers (phone);
CREATE INDEX IF NOT EXISTS idx_farmers_email ON public.farmers (email);
