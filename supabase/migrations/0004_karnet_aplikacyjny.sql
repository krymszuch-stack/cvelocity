-- Karnet Aplikacyjny — jednorazowa płatność za 30 dni dostępu.
--
-- Model przechodzi z subskrypcji na jednorazowy zakup: webhook
-- `checkout.session.completed` z `mode = 'payment'` woła poniższą procedurę,
-- która jednym poleceniem SQL przedłuża dostęp i resetuje liczniki. Transakcyjność
-- zapewnia sama plpgsql: obie aktualizacje biegną w jednej transakcji wywołania,
-- więc awaria między nimi nie zostawia konta z dłuższym planem i starym limitem.

alter table public.profiles add column if not exists plan_expires_at timestamptz;

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

    -- Przedłużenie liczy się od końca bieżącego karnetu, nie od "teraz": ktoś,
    -- kto kupi kolejny karnet dzień przed wygaśnięciem, nie traci tego dnia.
    -- Bez `greatest` drugi zakup w trakcie aktywnego karnetu skracałby sumę.
    update public.profiles
       set plan_expires_at = greatest(coalesce(plan_expires_at, to_timestamp(0)), now())
                               + make_interval(days => p_days),
           updated_at = now()
     where id = p_user_id
    returning plan_expires_at into v_expires;

    if not found then
        raise exception 'Brak profilu dla użytkownika %.', p_user_id;
    end if;

    -- Reset liczników rezerwacji AI. Wiersz może nie istnieć (konto nigdy nie
    -- użyło modelu), więc upsert, nie update — inaczej pierwsze użycie po zakupie
    -- zaczynałoby od przypadkowo zachowanego stanu sprzed karnetu.
    insert into public.user_quotas (user_id, ai_uses_count, daily_reset_date, monthly_tokens_used)
    values (p_user_id, 0, current_date, 0)
    on conflict (user_id) do update
        set ai_uses_count = 0,
            daily_reset_date = current_date,
            updated_at = now();

    return v_expires;
end;
$$;

-- Funkcja pisze do tabel, których właściciel nie może zmieniać, więc woła ją
-- wyłącznie serwer kluczem service_role z poziomu webhooka. Anonim i użytkownik
-- nie mogą jej nawet zobaczyć w swoich uprawnieniach.
revoke all on function public.activate_application_pass(uuid, integer) from public, anon, authenticated;

-- Cennik: pojedynczy produkt jednorazowy. `stripe_price_id` jest wartością
-- zastępczą z tej samej przyczyny co dla planu `free` — prawdziwy identyfikator
-- ceny wpisuje właściciel projektu w bazie po utworzeniu produktu w Stripe,
-- a `billing.routes.ts` weryfikuje cenę właśnie tutaj, nigdy w żądaniu klienta.
insert into public.plans (id, stripe_price_id, name, interval, ai_quota, import_quota, active)
values ('karnet', 'price_karnet_placeholder', 'Karnet Aplikacyjny', 'one_time', 30, 0, true)
on conflict (id) do nothing;
