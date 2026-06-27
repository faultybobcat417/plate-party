-- ============================================
-- COMPLETE SUPABASE SETUP SQL FOR PLATE PARTY
-- Run this in the Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. USERS TABLE (auto-created by auth trigger)
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

ALTER TABLE public.users ADD CONSTRAINT plates_non_negative CHECK (plates >= 0);

-- ============================================
-- 2. PARTIES
-- ============================================
CREATE TABLE IF NOT EXISTS public.parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  charity_org_name TEXT,
  charity_org_url TEXT,
  charity_pool_plates BIGINT NOT NULL DEFAULT 0,
  invite_code TEXT UNIQUE NOT NULL,
  host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 3. PARTY MEMBERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plate_balance BIGINT NOT NULL DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(party_id, user_id)
);

ALTER TABLE public.party_members ADD CONSTRAINT party_members_balance_non_negative CHECK (plate_balance >= 0);

-- ============================================
-- 4. CHALLENGES
-- ============================================
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'bounty',
  reward_plates BIGINT NOT NULL DEFAULT 0,
  fee_plates BIGINT NOT NULL DEFAULT 1,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  completer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  proof_image_url TEXT,
  proof_note TEXT,
  claimed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 5. CHALLENGE ENTRIES
-- ============================================
CREATE TABLE IF NOT EXISTS public.challenge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  proof_text TEXT,
  proof_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- ============================================
-- 6. PREDICTIONS (was wagers)
-- ============================================
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES public.parties(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  winning_option_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 7. PREDICTION OPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.prediction_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  vote_count BIGINT NOT NULL DEFAULT 0
);

-- ============================================
-- 8. PREDICTION ENTRIES (was bets)
-- ============================================
CREATE TABLE IF NOT EXISTS public.prediction_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.prediction_options(id) ON DELETE CASCADE,
  plates_wagered BIGINT NOT NULL DEFAULT 0,
  plates_won BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 9. LEDGER ENTRIES
-- ============================================
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  type TEXT NOT NULL,
  reference_id TEXT,
  reference_type TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 10. GAME SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'active',
  questions JSONB,
  answers JSONB,
  score INTEGER,
  plates_spent BIGINT DEFAULT 0,
  plates_earned BIGINT DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 11. GAME RECORDS
-- ============================================
CREATE TABLE IF NOT EXISTS public.game_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  score INTEGER,
  plates_earned BIGINT DEFAULT 0,
  plates_spent BIGINT DEFAULT 0,
  result TEXT,
  metadata JSONB,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 12. STAKE POSTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.stake_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  total_staked BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 13. STAKE ENTRIES
-- ============================================
CREATE TABLE IF NOT EXISTS public.stake_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stake_post_id UUID NOT NULL REFERENCES public.stake_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plates BIGINT NOT NULL DEFAULT 0,
  choice TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 14. IAP RECEIPTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.iap_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL UNIQUE,
  product_id TEXT NOT NULL,
  plates_added BIGINT NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  platform TEXT NOT NULL,
  receipt_data TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 15. SYNC OUTBOX (deprecated but kept for compatibility)
-- ============================================
CREATE TABLE IF NOT EXISTS public.sync_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  data JSONB,
  hlc TEXT,
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 16. AUTH TRIGGER (auto-creates user row on signup)
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
-- 17. RLS POLICIES
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
CREATE POLICY "Authenticated users can create parties" ON public.parties FOR INSERT TO authenticated WITH CHECK (true);

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
CREATE POLICY "Users can create entries" ON public.challenge_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Predictions
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Party members can view predictions" ON public.predictions FOR SELECT TO authenticated USING (
  party_id IS NULL OR
  EXISTS (SELECT 1 FROM public.party_members WHERE party_members.party_id = predictions.party_id AND party_members.user_id = auth.uid() AND party_members.deleted_at IS NULL)
);
CREATE POLICY "Creators can manage predictions" ON public.predictions FOR ALL TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- Prediction options
ALTER TABLE public.prediction_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view prediction options" ON public.prediction_options FOR SELECT TO authenticated USING (true);

-- Prediction entries
ALTER TABLE public.prediction_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own prediction entries" ON public.prediction_entries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create prediction entries" ON public.prediction_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Game sessions
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own game sessions" ON public.game_sessions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create game sessions" ON public.game_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Game records
ALTER TABLE public.game_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own game records" ON public.game_records FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Stake posts
ALTER TABLE public.stake_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view open stake posts" ON public.stake_posts FOR SELECT TO authenticated USING (status = 'open' AND deleted_at IS NULL);
CREATE POLICY "Creators can manage their stake posts" ON public.stake_posts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Stake entries
ALTER TABLE public.stake_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own stake entries" ON public.stake_entries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create stake entries" ON public.stake_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- IAP receipts
ALTER TABLE public.iap_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own receipts" ON public.iap_receipts FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Sync outbox
ALTER TABLE public.sync_outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own outbox" ON public.sync_outbox FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============================================
-- 18. INDEXES (performance)
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
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON public.game_sessions(state);
CREATE INDEX IF NOT EXISTS idx_iap_receipts_user_id ON public.iap_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_iap_receipts_transaction_id ON public.iap_receipts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_stake_posts_user_id ON public.stake_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_stake_posts_status ON public.stake_posts(status);
