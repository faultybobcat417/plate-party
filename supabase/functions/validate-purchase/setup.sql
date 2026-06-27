-- ============================================
-- PHASE 2: ATOMIC PLATE ADDITION (RPC)
-- ============================================

CREATE OR REPLACE FUNCTION public.add_plates_atomic(
  p_user_id UUID,
  p_amount BIGINT,
  p_type TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new_balance BIGINT;
BEGIN
  UPDATE public.users
  SET plates = plates + p_amount,
      lifetime_purchased_plates = CASE WHEN p_amount > 0 AND p_type = 'iap_purchase' THEN lifetime_purchased_plates + p_amount ELSE lifetime_purchased_plates END,
      updated_at = NOW()
  WHERE id = p_user_id
    AND deleted_at IS NULL
  RETURNING plates INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'User not found or deleted';
  END IF;

  INSERT INTO public.ledger_entries (
    user_id, amount, balance_after, type, reference_id, reference_type, metadata
  ) VALUES (
    p_user_id, p_amount, v_new_balance, p_type, p_reference_id, p_reference_type, '{}'
  );

  RETURN v_new_balance;
END;
$$;

-- ============================================
-- PHASE 5: GOALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  stake_amount BIGINT NOT NULL DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  streak_weeks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own goals" ON public.goals FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);

-- ============================================
-- PHASE 7: DONATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  charity_name TEXT NOT NULL,
  charity_ein TEXT,
  plates_amount BIGINT NOT NULL,
  usd_value INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own donations" ON public.donations FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_donations_user_id ON public.donations(user_id);
