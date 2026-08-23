-- ---------------------------------------------------------------------------
-- user_quotas & atomic quota reservation/refund
-- ---------------------------------------------------------------------------
create table if not exists public.user_quotas (
    user_id uuid primary key references auth.users(id) on delete cascade,
    ai_uses_count integer not null default 0,
    daily_reset_date date not null default current_date,
    monthly_tokens_used bigint not null default 0,
    updated_at timestamptz default now()
);

alter table public.user_quotas enable row level security;

create policy "quotas read only by owner"
  on public.user_quotas for select using (auth.uid() = user_id);

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
        insert into public.user_quotas (user_id, ai_uses_count, daily_reset_date)
        values (p_user_id, 1, current_date)
        returning * into v_quota;

        return jsonb_build_object('allowed', true, 'current_uses', 1);
    end if;

    -- 3. Reset dziennego licznika, jeśli minęła doba
    if v_quota.daily_reset_date < current_date then
        update public.user_quotas
        set ai_uses_count = 1,
            daily_reset_date = current_date,
            updated_at = now()
        where user_id = p_user_id;

        return jsonb_build_object('allowed', true, 'current_uses', 1);
    end if;

    -- 4. Weryfikacja limitu
    if v_quota.ai_uses_count >= p_max_daily_uses then
        return jsonb_build_object('allowed', false, 'current_uses', v_quota.ai_uses_count);
    end if;

    -- 5. Atomowa inkrementacja rezerwacji
    update public.user_quotas
    set ai_uses_count = ai_uses_count + 1,
        updated_at = now()
    where user_id = p_user_id;

    return jsonb_build_object('allowed', true, 'current_uses', v_quota.ai_uses_count + 1);
end;
$$;

revoke all on function public.reserve_ai_quota(uuid, integer) from public, anon, authenticated;

create or replace function public.refund_ai_quota(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.user_quotas
    set ai_uses_count = greatest(0, ai_uses_count - 1),
        updated_at = now()
    where user_id = p_user_id;
end;
$$;

revoke all on function public.refund_ai_quota(uuid) from public, anon, authenticated;
