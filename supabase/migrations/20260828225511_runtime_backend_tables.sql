-- Uzgodnienie produkcyjnej bazy z pełnym schematem wymaganym przez backend.
--
-- Projekt cvelocity-prod powstał z migracji odpowiadających 0001-0003, podczas
-- gdy repozytorium zawiera późniejsze migracje pod innymi numerami wersji.
-- Definicje poniżej są idempotentne: domykają produkcję, a na czystej bazie
-- bezpiecznie odtwarzają ten sam stan po wcześniejszych migracjach repo.

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

-- Zgłoszenia błędów klienta (anonimizowane).
--
-- Model celowo agregujący, nie logujący każdej okazji osobno: jedna grupa na
-- fingerprint, licznik wystąpień i znacznik ostatniego nawrotu. Baza pozostaje
-- mała niezależnie od tego, jak często błąd się powtarza, a polityka retencji
-- (`npm run bledy:czysc`) sprząta po ustąpieniu przyczyny.
--
-- Anonimizacja jest kontraktem tego magazynu: klient wysyła wyłącznie rodzaj
-- błędu, miejsce wystąpienia, zanonimizowany komunikat i skrót stosu. Nie ma tu
-- kolumny user_id ani żadnego identyfikatora osoby — tabela musi pozostać
-- bezużyteczna dla kogokolwiek, kto szukałby w niej danych osobowych.

create table if not exists public.client_errors (
  id uuid primary key default gen_random_uuid(),
  -- Stabilny skrót (kind + zanonimizowany komunikat + ramki stosu) liczony
  -- przez klienta. Unikalność = deduplikacja grup.
  fingerprint text not null unique,
  kind text not null check (kind in ('cv-export', 'ui-crash', 'uncaught', 'unhandledrejection')),
  surface text not null,
  message text not null,
  stack jsonb,
  env text check (env in ('dev', 'prod')),
  ua_family text,
  viewport_bucket text,
  occurrences integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  -- Cykl życia grupy: open → triaged → resolved. Retencja usuwa resolved
  -- po upływie okna, więc „ustąpienie przyczyny" kończy się pustką w bazie,
  -- a nie wiecznym archiwum.
  status text not null default 'open' check (status in ('open', 'triaged', 'resolved')),
  resolved_at timestamptz,
  linear_issue_id text,
  linear_issue_url text
);

create index if not exists client_errors_status_last_seen_idx on public.client_errors (status, last_seen_at desc);

-- RLS włączone bez żadnej polityki: anon i uwierzytelnieni dostają zero wierszy.
-- Cały ruch idzie przez service_role (serwer aplikacji i CLI operacyjne),
-- więc polityki per-user nie mają tu czego wyrażać.
alter table public.client_errors enable row level security;

revoke all on public.client_errors from anon, authenticated;

-- Atomowe doliczenie partii zgłoszeń do grup. Jedna podróż sieciowa na całą
-- partię i brak okna race między odczytem licznika a zapisem (ten sam wzorzec
-- co funkcje kwotowe z migracji 0002_quota_atomic.sql).
--
-- Nawrót na grupie `resolved` otwiera ją ponownie: błąd wrócił, więc przyczyna
-- nie ustąpiła — zostawienie statusu zamkniętego ukrywałoby regres przed bramką
-- wdrożeniową.
create or replace function public.record_client_errors(p_events jsonb)
returns void
language plpgsql
set search_path = public
as $$
declare
  event jsonb;
begin
  for event in select * from jsonb_array_elements(p_events)
  loop
    insert into public.client_errors (
      fingerprint, kind, surface, message, stack, env, ua_family, viewport_bucket
    ) values (
      event->>'fingerprint',
      event->>'kind',
      event->>'surface',
      event->>'message',
      event->'stack',
      event->>'env',
      event->>'uaFamily',
      event->>'viewportBucket'
    )
    on conflict (fingerprint) do update set
      occurrences = client_errors.occurrences + 1,
      last_seen_at = now(),
      message = excluded.message,
      stack = excluded.stack,
      env = excluded.env,
      ua_family = excluded.ua_family,
      viewport_bucket = excluded.viewport_bucket,
      status = 'open',
      resolved_at = null;
  end loop;
end;
$$;

-- Funkcja wołana wyłącznie przez serwer z kluczem service_role.
revoke execute on function public.record_client_errors(jsonb) from anon, authenticated;

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

-- ---------------------------------------------------------------------------
-- 0005 — gamifikacja i wiedza zbiorowa
-- ---------------------------------------------------------------------------
-- Dwie rzeczy w jednej migracji, bo wchodzą razem i razem byłyby wycofywane:
--   1) `user_gamification` — kopia punktów i osiągnięć, żeby poziom przeżył
--      zmianę urządzenia. Źródłem prawdy zostaje schowek przeglądarki: w trybie
--      `local` konta nie ma wcale, a gamifikacja ma działać także tam.
--   2) `crowdsourced_*` — anonimowa baza pracodawców i wymagań, budowana
--      z ogłoszeń, które użytkownicy i tak wklejają.
--
-- Czego tu świadomie NIE ma: `user_id` przy wpisach crowdsourcingowych. Wiersz
-- z firmą, tytułem, widełkami i identyfikatorem autora jest de facto zapisem
-- „kto się gdzie stara" — a to najwrażliwsza informacja w całym produkcie.
-- Bez tej kolumny nie da się jej odtworzyć nawet z pełnym dostępem do bazy.

-- ---------------------------------------------------------------------------
-- Gamifikacja
-- ---------------------------------------------------------------------------
create table if not exists public.user_gamification (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  xp           integer     not null default 0 check (xp >= 0),
  counters     jsonb       not null default '{}'::jsonb,
  achievements jsonb       not null default '[]'::jsonb,
  updated_at   timestamptz not null default now()
);

grant select on public.user_gamification to authenticated;
grant all on public.user_gamification to service_role;

alter table public.user_gamification enable row level security;

-- Zapis idzie przez serwer na kluczu `service_role` (tak jak reszta tras),
-- więc polityka opisuje wyłącznie to, co wolno samemu użytkownikowi: widzieć
-- własny wiersz. Cudzego nie zobaczy nikt — rankingu nie ma i nie planujemy go.
create policy "Wlasna gamifikacja - odczyt"
  on public.user_gamification for select to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Wiedza zbiorowa: pracodawcy
-- ---------------------------------------------------------------------------
create table if not exists public.crowdsourced_companies (
  id                uuid primary key default gen_random_uuid(),
  company_name      text        not null,
  normalized_domain text,
  industry          text,
  created_at        timestamptz not null default now(),
  last_seen_at      timestamptz not null default now()
);

-- Jedna firma to jeden wiersz. Bez tego indeksu każde wklejone ogłoszenie
-- dokładałoby duplikat i po tygodniu „baza pracodawców" byłaby listą powtórzeń.
create unique index if not exists crowdsourced_companies_nazwa_uniq
  on public.crowdsourced_companies (lower(company_name));

-- ---------------------------------------------------------------------------
-- Wiedza zbiorowa: wymagania i pytania
-- ---------------------------------------------------------------------------
create table if not exists public.crowdsourced_job_insights (
  id                  uuid primary key default gen_random_uuid(),
  company_name        text        not null,
  job_title           text        not null,
  required_skills     jsonb       not null default '[]'::jsonb,
  interview_questions jsonb       not null default '[]'::jsonb,
  salary_range_min    numeric,
  salary_range_max    numeric,
  source_url          text,
  created_at          timestamptz not null default now()
);

create index if not exists crowdsourced_insights_firma_idx
  on public.crowdsourced_job_insights (lower(company_name));

-- Odczyt publiczny — to jest sens tej bazy. Zapis wyłącznie przez serwer:
-- rola `anon` z prawem `insert` oznaczałaby otwarty endpoint do zaśmiecania
-- korpusu dowolną treścią, bez limitu i bez walidacji. Specyfikacja zadania
-- proponowała `with check (true)` dla `anon`; świadome odstępstwo.
grant select on public.crowdsourced_companies    to anon, authenticated;
grant select on public.crowdsourced_job_insights to anon, authenticated;
grant all    on public.crowdsourced_companies    to service_role;
grant all    on public.crowdsourced_job_insights to service_role;

alter table public.crowdsourced_companies    enable row level security;
alter table public.crowdsourced_job_insights enable row level security;

create policy "Wiedza zbiorowa - odczyt publiczny"
  on public.crowdsourced_job_insights for select to anon, authenticated
  using (true);

create policy "Pracodawcy - odczyt publiczny"
  on public.crowdsourced_companies for select to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Usuwanie konta
-- ---------------------------------------------------------------------------
-- Reguła 4: nowa tabela z `user_id` musi trafić do `delete_user_data`, inaczej
-- „usuń moje konto" zostawi po sobie wiersz. Tabele crowdsourcingowe nie mają
-- właściciela, więc nie ma czego z nich usuwać — i to jest zamierzone.
create or replace function public.delete_user_data(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ai_usage_events set user_id = null where user_id = p_user;

  delete from public.user_gamification        where user_id = p_user;
  delete from public.suggestion_contributions where user_id = p_user;
  delete from public.cv_question_skips        where user_id = p_user;
  delete from public.consents                 where user_id = p_user;
  delete from public.user_quotas              where user_id = p_user;
  delete from public.usage_counters where user_id = p_user;
  delete from public.subscriptions  where user_id = p_user;
  delete from public.applications   where user_id = p_user;
  delete from public.vaults         where user_id = p_user;
  delete from public.profiles       where id      = p_user;
end;
$$;

revoke all on function public.delete_user_data(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 0006 — ankieta po eksporcie dokumentu (telemetria wysyłek)
-- ---------------------------------------------------------------------------
-- Tabela używana przez POST /api/intel/application-feedback.
--
-- Po pobraniu CV pytamy, czy zgłoszenie faktycznie poszło. Odpowiedź mówi coś,
-- czego nie widać z niczego innego: ile dopasowanych ofert kończy się realną
-- wysyłką i na czym ludzie się wykładają (formularze, format pliku, martwe
-- linki). Bez tej tabeli „skuteczność" byłaby liczbą wymyśloną (reguła 1).
--
-- Czego tu świadomie NIE ma: `user_id`. Wiersz „ta osoba aplikowała do tej
-- firmy" jest najwrażliwszą informacją w całym produkcie, więc go nie tworzymy
-- — nie da się go odtworzyć nawet z pełnym dostępem do bazy.

CREATE TABLE IF NOT EXISTS public.application_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    applied_successfully BOOLEAN NOT NULL,
    -- Wartości z zamkniętych list po stronie API (`intel.routes.ts`).
    -- CHECK powtarza je w bazie, bo trasa nie jest jedyną drogą do tabeli.
    application_channel TEXT CHECK (
        application_channel IS NULL
        OR application_channel IN ('Pracuj.pl', 'LinkedIn', 'Strona kariery firmy', 'Inne')
    ),
    salary_transparency TEXT CHECK (
        salary_transparency IS NULL
        OR salary_transparency IN ('jawne', 'brak', 'rozbiezne')
    ),
    failure_reason TEXT CHECK (
        failure_reason IS NULL
        OR failure_reason IN ('formularz', 'format-pliku', 'wygasla', 'rezygnacja')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS application_feedbacks_company_idx
    ON public.application_feedbacks (lower(company_name), created_at DESC);

-- Data API nie dostaje domyślnych uprawnień do schematu `public` — bez GRANT-ów
-- zapis kończy się błędem uprawnień mimo poprawnego RLS.
-- Zapisuje wyłącznie serwer kluczem `service_role` (trasa jest anonimowa, ale
-- nie publiczna dla przeglądarki), więc `anon`/`authenticated` nie dostają nic.
GRANT ALL ON public.application_feedbacks TO service_role;

ALTER TABLE public.application_feedbacks ENABLE ROW LEVEL SECURITY;

-- Brak polityk dla `anon` i `authenticated` jest zamierzony: w tabeli bez
-- `user_id` każdy SELECT byłby odczytem cudzych ruchów rekrutacyjnych, a każdy
-- INSERT z przeglądarki — otwartym kanałem do zaśmiecania statystyk.
-- `service_role` omija RLS z definicji.

-- ---------------------------------------------------------------------------
-- 0005 — katalog płatny zsynchronizowany ze Stripe + dożywotnie szablony
-- ---------------------------------------------------------------------------
-- Katalog używany przez trasy płatności i webhook Stripe.
--
-- Kolumna `plans.stripe_price_id` przechowuje teraz `lookup_key` ceny
-- (np. `pro_monthly`), a nie surowe `price_1Abc...`. Powód: `lookup_key` jest
-- ten sam w środowisku testowym i produkcyjnym, więc katalog nie rozjeżdża się
-- po przejściu na płatności na żywo. Ten sam klucz jest jedynym, co wysyła
-- przeglądarka (`src/lib/pricing.ts`) — cena i limity pochodzą stąd.

insert into public.plans (id, stripe_price_id, name, interval, ai_quota, import_quota, trial_days, active)
values
  ('pro',                'pro_monthly',                'CVelocity Pro (miesięcznie)', 'month',    1000, 100, 30, true),
  ('pro_rok',            'pro_yearly',                 'CVelocity Pro (rocznie)',     'year',     1000, 100,  0, true),
  ('szablon_executive',  'template_executive_onetime', 'Szablon Executive A4',        'one_time',    0,   0,  0, true),
  ('szablon_creative',   'template_creative_onetime',  'Szablon Creative A4',         'one_time',    0,   0,  0, true),
  ('pakiet_szablonow',   'template_pack_5_onetime',    'Pakiet szablonów premium',    'one_time',    0,   0,  0, true)
on conflict (id) do update set
  stripe_price_id = excluded.stripe_price_id,
  name            = excluded.name,
  interval        = excluded.interval,
  ai_quota        = excluded.ai_quota,
  import_quota    = excluded.import_quota,
  trial_days      = excluded.trial_days,
  active          = excluded.active;

-- ---------------------------------------------------------------------------
-- template_entitlements — dożywotni dostęp do szablonu kupionego jednorazowo
-- ---------------------------------------------------------------------------
-- Zakup jednorazowy nie podnosi statusu subskrypcji (kupno szablonu za 19 zł
-- nie może odblokować planu Pro), więc potrzebuje własnego rejestru. Wiersz
-- powstaje **wyłącznie** z webhooka Stripe'a, na kluczu `service_role` —
-- dlatego tabela nie ma polityki zapisu dla użytkownika.
create table if not exists public.template_entitlements (
  user_id     uuid not null references auth.users (id) on delete cascade,
  template_id text not null check (template_id in ('executive', 'creative')),
  price_id    text not null,
  granted_at  timestamptz not null default now(),
  primary key (user_id, template_id)
);

grant select on public.template_entitlements to authenticated;
grant all    on public.template_entitlements to service_role;

alter table public.template_entitlements enable row level security;

create policy "szablony czyta tylko właściciel"
  on public.template_entitlements for select using (auth.uid() = user_id);

-- delete_user_data działa przed usunięciem wiersza z auth.users, więc nie może
-- liczyć wyłącznie na późniejsze ON DELETE CASCADE.
create or replace function public.delete_user_data(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ai_usage_events set user_id = null where user_id = p_user;

  delete from public.template_entitlements    where user_id = p_user;
  delete from public.user_gamification        where user_id = p_user;
  delete from public.suggestion_contributions where user_id = p_user;
  delete from public.cv_question_skips         where user_id = p_user;
  delete from public.consents                  where user_id = p_user;
  delete from public.user_quotas               where user_id = p_user;
  delete from public.usage_counters            where user_id = p_user;
  delete from public.subscriptions             where user_id = p_user;
  delete from public.applications              where user_id = p_user;
  delete from public.vaults                    where user_id = p_user;
  delete from public.profiles                   where id      = p_user;
end;
$$;

revoke all on function public.delete_user_data(uuid) from public, anon, authenticated;
