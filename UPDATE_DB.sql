-- Rode este comando no SQL Editor do Supabase para habilitar o sistema de planos e créditos

ALTER TABLE profiles
ADD COLUMN credits INTEGER DEFAULT 10,
ADD COLUMN subscription_plan TEXT DEFAULT 'free', -- 'free', 'amateur', 'pro'
ADD COLUMN subscription_status TEXT DEFAULT 'active';

-- Opcional: Atualizar usuários existentes para ter 10 créditos
UPDATE profiles SET credits = 10 WHERE credits IS NULL;
