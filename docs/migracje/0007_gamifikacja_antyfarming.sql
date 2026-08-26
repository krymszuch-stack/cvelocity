-- 0007 — Gamifikacja: rejestr akcji, profil i transakcyjne przyznawanie XP.
--
-- Klient liczy punkty lokalnie (tryb `local` musi działać bez konta), ale to
-- ta funkcja jest rozstrzygająca przy synchronizacji: przeglądarce nie wolno
-- ufać w kwestii tego, ile ktoś zdobył. Limity są tu powtórzone celowo i muszą
-- pozostać zgodne z `src/lib/xpGuard.ts` — jeśli zmieniasz jedno, zmień drugie
-- w tym samym commicie.
--
-- Odporność na wyścigi bierze się z unikalnego indeksu na (user, akcja, cel),
-- a nie ze sprawdzenia SELECT-em: dwa równoległe żądania przeszłyby przez
-- warunek i naliczyły punkty dwa razy. `ON CONFLICT DO NOTHING` przy wstawianiu
-- zamyka to okno w bazie.

CREATE TABLE IF NOT EXISTS public.gamification_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    target_hash TEXT NOT NULL,
    xp_awarded INT NOT NULL CHECK (xp_awarded >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gamification_user_daily
    ON public.gamification_actions (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_user_action_target
    ON public.gamification_actions (user_id, action_type, target_hash);

CREATE TABLE IF NOT EXISTS public.user_gamification_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_xp INT NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
    current_level INT NOT NULL DEFAULT 1,
    unlocked_features JSONB NOT NULL DEFAULT '["BASIC_TEMPLATES"]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Uprawnienia Data API. Bez nich RLS nie ma czego chronić, bo PostgREST i tak
-- odbije żądanie na braku przywilejów.
GRANT SELECT ON public.gamification_actions TO authenticated;
GRANT ALL ON public.gamification_actions TO service_role;
GRANT SELECT ON public.user_gamification_profiles TO authenticated;
GRANT ALL ON public.user_gamification_profiles TO service_role;

ALTER TABLE public.gamification_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification_profiles ENABLE ROW LEVEL SECURITY;

-- Tylko odczyt własnych danych. Zapis idzie wyłącznie przez funkcję poniżej:
-- polityka INSERT dla użytkownika pozwoliłaby wpisać sobie dowolne XP.
CREATE POLICY "wlasne akcje do odczytu" ON public.gamification_actions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "wlasny profil do odczytu" ON public.user_gamification_profiles
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.award_gamification_xp(
    p_user_id UUID,
    p_action_type TEXT,
    p_target_hash TEXT,
    p_base_xp INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_daily_cap CONSTANT INT := 800;
    v_daily_xp INT;
    v_awarded INT;
    v_inserted UUID;
    v_new_total INT;
    v_new_level INT;
    v_features JSONB;
BEGIN
    IF p_base_xp IS NULL OR p_base_xp <= 0 OR p_target_hash IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'INVALID_REQUEST',
            'message', 'Nieprawidłowe zgłoszenie punktów.');
    END IF;

    SELECT COALESCE(SUM(xp_awarded), 0) INTO v_daily_xp
    FROM public.gamification_actions
    WHERE user_id = p_user_id AND created_at >= date_trunc('day', NOW());

    IF v_daily_xp >= v_daily_cap THEN
        RETURN jsonb_build_object('success', false, 'reason', 'DAILY_CAP_REACHED',
            'message', format('Osiągnięto dzienny limit punktów XP (%s/%s). Licznik zeruje się o północy.',
                v_daily_cap, v_daily_cap));
    END IF;

    -- Przy sufcie przycinamy nagrodę zamiast ją odrzucać — akcja się wydarzyła.
    v_awarded := LEAST(p_base_xp, v_daily_cap - v_daily_xp);

    INSERT INTO public.gamification_actions (user_id, action_type, target_hash, xp_awarded)
    VALUES (p_user_id, p_action_type, p_target_hash, v_awarded)
    ON CONFLICT (user_id, action_type, target_hash) DO NOTHING
    RETURNING id INTO v_inserted;

    IF v_inserted IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'ALREADY_CLAIMED',
            'message', 'Punkty za to konkretne zadanie zostały już wcześniej naliczone.');
    END IF;

    INSERT INTO public.user_gamification_profiles (user_id, total_xp)
    VALUES (p_user_id, v_awarded)
    ON CONFLICT (user_id) DO UPDATE
        SET total_xp = public.user_gamification_profiles.total_xp + v_awarded,
            updated_at = NOW()
    RETURNING total_xp INTO v_new_total;

    v_new_level := CASE
        WHEN v_new_total >= 7000 THEN 5
        WHEN v_new_total >= 3500 THEN 4
        WHEN v_new_total >= 1500 THEN 3
        WHEN v_new_total >= 500  THEN 2
        ELSE 1
    END;

    v_features := CASE
        WHEN v_new_level >= 5 THEN '["BASIC_TEMPLATES","LIVE_HUD_TELEPROMPTER","DEEP_COMPANY_INTEL","UNLIMITED_TYPST_EXPORT"]'::jsonb
        WHEN v_new_level >= 4 THEN '["BASIC_TEMPLATES","LIVE_HUD_TELEPROMPTER","DEEP_COMPANY_INTEL"]'::jsonb
        WHEN v_new_level >= 3 THEN '["BASIC_TEMPLATES","LIVE_HUD_TELEPROMPTER"]'::jsonb
        ELSE '["BASIC_TEMPLATES"]'::jsonb
    END;

    UPDATE public.user_gamification_profiles
    SET current_level = v_new_level,
        unlocked_features = v_features
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'awarded_xp', v_awarded,
        'total_xp', v_new_total,
        'level', v_new_level,
        'unlocked_features', v_features
    );
END;
$$;

-- Wołana wyłącznie przez serwer kluczem service_role: gdyby mógł ją wywołać
-- klient, podałby własne `p_base_xp` i limit dobowy przestałby cokolwiek znaczyć.
REVOKE ALL ON FUNCTION public.award_gamification_xp(UUID, TEXT, TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_gamification_xp(UUID, TEXT, TEXT, INT) TO service_role;
