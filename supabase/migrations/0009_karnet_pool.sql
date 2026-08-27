-- ---------------------------------------------------------------------------
-- 0009_karnet_pool.sql
-- Karnet Aplikacyjny: rozdzielenie dedykowanej puli AI (30 wywołań)
-- od odnawialnego licznika dobowego.
-- ---------------------------------------------------------------------------

-- 1. Dodanie kolumn dedykowanej puli AI oraz daty wygaśnięcia karnetu do user_quotas
alter table public.user_quotas
  add column if not exists karnet_ai_pool integer not null default 0,
  add column if not exists karnet_expires_at timestamptz;

-- 2. Aktualizacja activate_application_pass: doładowanie puli 30 wywołań i przedłużenie ważności
create or replace function public.activate_application_pass(
    p_user_id uuid,
    p_days integer default 30
) returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
    v_expires timestamptz;
begin
    if p_days is null or p_days <= 0 then
        raise exception 'Długość karnetu musi być liczbą dni większą od zera.';
    end if;

    -- Aktualizacja profilu (plan_expires_at dla odblokowania funkcji eksportu)
    update public.profiles
       set plan_expires_at = greatest(coalesce(plan_expires_at, to_timestamp(0)), now())
                               + make_interval(days => p_days),
           updated_at = now()
     where id = p_user_id
    returning plan_expires_at into v_expires;

    if not found then
        raise exception 'Brak profilu dla użytkownika %.', p_user_id;
    end if;

    -- Doładowanie dedykowanej puli 30 wywołań AI w user_quotas
    insert into public.user_quotas (user_id, ai_uses_count, daily_reset_date, karnet_ai_pool, karnet_expires_at)
    values (p_user_id, 0, current_date, 30, v_expires)
    on conflict (user_id) do update
        set karnet_ai_pool = coalesce(public.user_quotas.karnet_ai_pool, 0) + 30,
            karnet_expires_at = v_expires,
            updated_at = now();

    return v_expires;
end;
$$;

revoke all on function public.activate_application_pass(uuid, integer) from public, anon, authenticated;

-- 3. Aktualizacja procedury reserve_ai_quota uwzględniająca karnet_ai_pool
create or replace function public.reserve_ai_quota(
    p_user_id uuid,
    p_max_daily_uses integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_quota public.user_quotas%rowtype;
begin
    -- 1. Blokada pesymistyczna wiersza danego użytkownika
    select * into v_quota
    from public.user_quotas
    where user_id = p_user_id
    for update;

    -- 2. Inicjalizacja wiersza, jeśli nie istnieje
    if not found then
        insert into public.user_quotas (user_id, ai_uses_count, daily_reset_date, karnet_ai_pool)
        values (p_user_id, 1, current_date, 0)
        returning * into v_quota;

        return jsonb_build_object('allowed', true, 'current_uses', 1, 'type', 'FREE');
    end if;

    -- 3. Sprawdź, czy użytkownik ma aktywny karnet z pulą kredytów
    if v_quota.karnet_expires_at is not null and v_quota.karnet_expires_at > now() then
        if v_quota.karnet_ai_pool > 0 then
            update public.user_quotas
            set karnet_ai_pool = karnet_ai_pool - 1,
                updated_at = now()
            where user_id = p_user_id;

            return jsonb_build_object('allowed', true, 'pool_left', v_quota.karnet_ai_pool - 1, 'type', 'KARNET');
        else
            return jsonb_build_object(
                'allowed', false,
                'reason', 'KARNET_POOL_EXHAUSTED',
                'message', 'Wykorzystano 30 wywołań AI z karnetu. Nielimitowane eksporty DOCX/PDF pozostają aktywne.'
            );
        end if;
    end if;

    -- 4. Fallback dla darmowego użytkownika / wygasłego karnetu (reset dobowy 5/dzień)
    if v_quota.daily_reset_date < current_date then
        update public.user_quotas
        set ai_uses_count = 1,
            daily_reset_date = current_date,
            updated_at = now()
        where user_id = p_user_id;

        return jsonb_build_object('allowed', true, 'current_uses', 1, 'type', 'FREE');
    end if;

    -- 5. Weryfikacja limitu dobowego
    if v_quota.ai_uses_count >= p_max_daily_uses then
        return jsonb_build_object('allowed', false, 'current_uses', v_quota.ai_uses_count, 'type', 'FREE');
    end if;

    -- 6. Atomowa inkrementacja rezerwacji dobowej
    update public.user_quotas
    set ai_uses_count = ai_uses_count + 1,
        updated_at = now()
    where user_id = p_user_id;

    return jsonb_build_object('allowed', true, 'current_uses', v_quota.ai_uses_count + 1, 'type', 'FREE');
end;
$$;

revoke all on function public.reserve_ai_quota(uuid, integer) from public, anon, authenticated;
