-- Supabase Setup SQL for Plate Party
-- Run this in the Supabase SQL Editor after creating your project

-- ============================================
-- 1. USERS TABLE (triggered by auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Plate Tester',
  username TEXT UNIQUE,
  plates BIGINT NOT NULL DEFAULT 100,
  lifetime_purchased_plates BIGINT NOT NULL DEFAULT 0,
  device_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Constraint: plates cannot be negative
ALTER TABLE public.users ADD CONSTRAINT plates_non_negative CHECK (plates >= 0);

-- ============================================
-- 2. AUTH TRIGGER (auto-creates user row)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, display_name, username, device_id, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Plate Tester'),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'device_id',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. RLS POLICIES
-- ============================================

-- Users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Ledger entries
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own ledger" ON public.ledger_entries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "No direct inserts to ledger" ON public.ledger_entries FOR INSERT TO authenticated WITH CHECK (false);

-- Parties
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view their parties" ON public.parties FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.party_members WHERE party_members.party_id = parties.id AND party_members.user_id = auth.uid() AND party_members.deleted_at IS NULL)
  OR parties.host_id = auth.uid()
);
CREATE POLICY "Hosts can update their parties" ON public.parties FOR UPDATE TO authenticated USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());

-- Party members
ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own memberships" ON public.party_members FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update their own membership" ON public.party_members FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Challenges
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view open challenges" ON public.challenges FOR SELECT TO authenticated USING (status = 'open' AND deleted_at IS NULL);
CREATE POLICY "Creators can view their own challenges" ON public.challenges FOR SELECT TO authenticated USING (creator_id = auth.uid() AND deleted_at IS NULL);
CREATE POLICY "Authenticated users can create challenges" ON public.challenges FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Creators can update their open challenges" ON public.challenges FOR UPDATE TO authenticated USING (creator_id = auth.uid() AND status = 'open') WITH CHECK (creator_id = auth.uid());

-- Challenge entries
ALTER TABLE public.challenge_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own entries" ON public.challenge_entries FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Predictions
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Party members can view predictions" ON public.predictions FOR SELECT TO authenticated USING (
  party_id IS NULL OR
  EXISTS (SELECT 1 FROM public.party_members WHERE party_members.party_id = predictions.party_id AND party_members.user_id = auth.uid() AND party_members.deleted_at IS NULL)
);
CREATE POLICY "Creators can manage predictions" ON public.predictions FOR ALL TO authenticated USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

-- Prediction entries
ALTER TABLE public.prediction_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own prediction entries" ON public.prediction_entries FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Game sessions
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own game sessions" ON public.game_sessions FOR SELECT TO authenticated USING (user_id = auth.uid());

-- IAP receipts
ALTER TABLE public.iap_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own receipts" ON public.iap_receipts FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============================================
-- 4. INDEXES (performance)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_ledger_user_id ON public.ledger_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_parties_host_id ON public.parties(host_id);
CREATE INDEX IF NOT EXISTS idx_parties_invite_code ON public.parties(invite_code);
CREATE INDEX IF NOT EXISTS idx_party_members_party_user ON public.party_members(party_id, user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_creator_id ON public.challenges(creator_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.challenges(status);
CREATE INDEX IF NOT EXISTS idx_predictions_party_id ON public.predictions(party_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON public.game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_iap_receipts_user_id ON public.iap_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_iap_receipts_transaction_id ON public.iap_receipts(transaction_id);
