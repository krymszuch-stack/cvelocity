-- CVELOCITY — schemat startowy.
--
-- Zasada nadrzędna: RLS włączone na każdej tabeli bez wyjątku, a tabele
-- decydujące o pieniądzach (`plans`, `subscriptions`, `usage_counters`,
-- `ai_usage_events`) są dla użytkownika **tylko do odczytu**. Do czasu tej
-- migracji status subskrypcji trzymał `localStorage`, więc każdy mógł sobie
-- wpisać plan Pro z konsoli przeglądarki. Zapisy do tych tabel wykonuje
-- wyłącznie serwer kluczem `service_role`, na podstawie webhooka Stripe'a.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profil widzi tylko właściciel"
  on public.profiles for select using (auth.uid() = id);
create policy "profil edytuje tylko właściciel"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profil zakłada tylko właściciel"
  on public.profiles for insert with check (auth.uid() = id);

-- Konto założone przez Supabase Auth dostaje profil od razu. Bez tego pierwsze
-- żądanie po rejestracji trafiałoby na brakujący wiersz i musiałoby go tworzyć
-- w locie — czyli każdy odczyt profilu musiałby umieć też zapisywać.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- vaults — MasterVault jako jsonb
-- ---------------------------------------------------------------------------
-- Kształt pilnuje `zod` po stronie serwera (src/types/contracts.ts), a nie baza.
-- MasterVault jest strukturą głęboko zagnieżdżoną i zmienia się razem z
-- interfejsem; rozbicie jej na kilkanaście tabel oznaczałoby migrację przy
-- każdym nowym polu w CV.
create table if not exists public.vaults (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  version    text not null default '1',
  updated_at timestamptz not null default now()
);

alter table public.vaults enable row level security;

create policy "vault widzi tylko właściciel"
  on public.vaults for select using (auth.uid() = user_id);
create policy "vault zapisuje tylko właściciel"
  on public.vaults for insert with check (auth.uid() = user_id);
create policy "vault aktualizuje tylko właściciel"
  on public.vaults for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "vault usuwa tylko właściciel"
  on public.vaults for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- applications — historia wysłanych aplikacji
-- ---------------------------------------------------------------------------
create table if not exists public.applications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  company    text not null,
  position   text not null,
  salary     text,
  applied_at date,
  status     text not null default 'Wysłana',
  notes      text,
  job_url    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applications_user_idx on public.applications (user_id, applied_at desc);

alter table public.applications enable row level security;

create policy "aplikacje widzi tylko właściciel"
  on public.applications for select using (auth.uid() = user_id);
create policy "aplikacje dodaje tylko właściciel"
  on public.applications for insert with check (auth.uid() = user_id);
create policy "aplikacje edytuje tylko właściciel"
  on public.applications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "aplikacje usuwa tylko właściciel"
  on public.applications for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- plans — cennik
-- ---------------------------------------------------------------------------
-- Ceny i limity mieszkają w bazie, a nie w kodzie przeglądarki: identyfikator
-- ceny przysłany przez klienta jest weryfikowany tutaj, zanim powstanie sesja
-- płatności. Inaczej wystarczyłoby podmienić `price_...` w żądaniu.
create table if not exists public.plans (
  id              text primary key,
  stripe_price_id text unique not null,
  name            text not null,
  interval        text not null check (interval in ('month', 'year', 'one_time')),
  ai_quota        integer not null default 5,
  import_quota    integer not null default 1,
  trial_days      integer not null default 0,
  active          boolean not null default true
);

alter table public.plans enable row level security;

-- Cennik jest publiczny z natury; zapis wyłącznie przez `service_role`, który
-- politykami nie jest ograniczony.
create policy "cennik czyta każdy zalogowany"
  on public.plans for select to authenticated using (active);

-- ---------------------------------------------------------------------------
-- subscriptions — stan opłacenia
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  plan_id                text references public.plans (id),
  status                 text not null default 'free'
                         check (status in ('free','trialing','active','cancelled','past_due')),
  current_period_end     timestamptz,
  updated_at             timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Tylko SELECT. Brak polityk INSERT/UPDATE/DELETE oznacza, że użytkownik nie
-- może dopisać sobie `status = 'active'` — i to jest cały sens tej tabeli.
create policy "subskrypcję czyta tylko właściciel"
  on public.subscriptions for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- stripe_events — idempotencja webhooka
-- ---------------------------------------------------------------------------
-- Stripe dostarcza zdarzenia *co najmniej raz*, więc to samo zdarzenie potrafi
-- przyjść kilka razy. Bez tej tabeli powtórka nadpisywałaby stan starszymi
-- danymi albo dubla naliczała.
create table if not exists public.stripe_events (
  id           text primary key,
  type         text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
-- Brak jakiejkolwiek polityki: tabela techniczna, dostępna wyłącznie serwerowi.

-- ---------------------------------------------------------------------------
-- ai_usage_events — realne zużycie modelu
-- ---------------------------------------------------------------------------
create table if not exists public.ai_usage_events (
  id                 bigint generated always as identity primary key,
  user_id            uuid references auth.users (id) on delete set null,
  context            text not null,
  model              text not null,
  prompt_tokens      integer not null default 0,
  output_tokens      integer not null default 0,
  estimated_cost_usd numeric(12, 6),
  created_at         timestamptz not null default now()
);

create index if not exists ai_usage_user_idx on public.ai_usage_events (user_id, created_at desc);

alter table public.ai_usage_events enable row level security;

create policy "zużycie czyta tylko właściciel"
  on public.ai_usage_events for select using (auth.uid() = user_id);

-- `on delete set null`, nie `cascade`: po usunięciu konta koszt wywołań musi
-- zostać w rozliczeniach, ale bez powiązania z osobą. Wiersz przestaje wtedy
-- być daną osobową i nie stoi w sprzeczności z prawem do usunięcia (art. 17).

-- ---------------------------------------------------------------------------
-- usage_counters — miesięczne limity
-- ---------------------------------------------------------------------------
create table if not exists public.usage_counters (
  user_id     uuid not null references auth.users (id) on delete cascade,
  month_key   text not null,
  ai_uses     integer not null default 0,
  import_uses integer not null default 0,
  primary key (user_id, month_key)
);

alter table public.usage_counters enable row level security;

create policy "liczniki czyta tylko właściciel"
  on public.usage_counters for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- consume_quota — sprawdzenie i pobranie limitu w jednej transakcji
-- ---------------------------------------------------------------------------
-- Gdyby to były dwa zapytania z aplikacji ("ile zostało?" i "odejmij jeden"),
-- dwie równolegle otwarte karty przeglądarki mogłyby obie odczytać "został 1"
-- i obie go zużyć. `insert … on conflict … do update … where` rozstrzyga to
-- w bazie: warunek jest częścią tego samego polecenia co zapis.
--
-- Zwraca `true`, gdy limit został pobrany, `false` gdy wyczerpany.
create or replace function public.consume_quota(p_user uuid, p_kind text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month     text := to_char(now() at time zone 'utc', 'YYYY-MM');
  v_status    text;
  v_limit     integer;
  v_updated   integer;
begin
  if p_kind not in ('ai', 'import') then
    raise exception 'Nieznany rodzaj limitu: %', p_kind;
  end if;

  select s.status into v_status
    from public.subscriptions s
   where s.user_id = p_user;

  -- Plan opłacony nie ma limitu miesięcznego, ale zużycie i tak jest zliczane —
  -- bez tego nie da się odpowiedzieć na pytanie, ile kosztuje jeden użytkownik.
  if v_status in ('active', 'trialing') then
    insert into public.usage_counters as c (user_id, month_key, ai_uses, import_uses)
    values (p_user, v_month, case when p_kind = 'ai' then 1 else 0 end,
                             case when p_kind = 'import' then 1 else 0 end)
    on conflict (user_id, month_key) do update
      set ai_uses     = c.ai_uses     + case when p_kind = 'ai' then 1 else 0 end,
          import_uses = c.import_uses + case when p_kind = 'import' then 1 else 0 end;
    return true;
  end if;

  select case when p_kind = 'ai' then p.ai_quota else p.import_quota end
    into v_limit
    from public.plans p
   where p.id = 'free';

  -- Brak wiersza planu darmowego to błąd wdrożenia, nie sytuacja do obsłużenia
  -- domyślną wartością — cicha "0" odcięłaby wszystkich, cicha "999" rozdałaby
  -- darmowe wywołania modelu.
  if v_limit is null then
    raise exception 'Brak planu "free" w tabeli plans — uzupełnij dane startowe.';
  end if;

  -- Limit zerowy trzeba odciąć przed INSERT-em. Klauzula `where` niżej pilnuje
  -- wyłącznie gałęzi `do update`; przy pierwszym wywołaniu w miesiącu wiersza
  -- jeszcze nie ma, więc INSERT przechodzi bezwarunkowo i rozdałby jedno
  -- darmowe użycie planowi, który ma ich mieć zero.
  if v_limit <= 0 then
    return false;
  end if;

  insert into public.usage_counters as c (user_id, month_key, ai_uses, import_uses)
  values (p_user, v_month, case when p_kind = 'ai' then 1 else 0 end,
                           case when p_kind = 'import' then 1 else 0 end)
  on conflict (user_id, month_key) do update
    set ai_uses     = c.ai_uses     + case when p_kind = 'ai' then 1 else 0 end,
        import_uses = c.import_uses + case when p_kind = 'import' then 1 else 0 end
    where case when p_kind = 'ai' then c.ai_uses else c.import_uses end < v_limit;

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

revoke all on function public.consume_quota(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- delete_user_data — realizacja prawa do usunięcia (RODO art. 17)
-- ---------------------------------------------------------------------------
-- Kasowanie konta w `auth.users` zdejmuje wiersze przez `on delete cascade`,
-- ale `ai_usage_events` celowo cascade nie ma. Ta funkcja domyka całość jednym
-- wywołaniem, żeby "usuń moje konto" nie zależało od tego, czy ktoś pamiętał
-- dopisać nową tabelę w kodzie aplikacji.
create or replace function public.delete_user_data(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ai_usage_events set user_id = null where user_id = p_user;
  delete from public.usage_counters where user_id = p_user;
  delete from public.subscriptions  where user_id = p_user;
  delete from public.applications   where user_id = p_user;
  delete from public.vaults         where user_id = p_user;
  delete from public.profiles       where id      = p_user;
end;
$$;

revoke all on function public.delete_user_data(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Dane startowe
-- ---------------------------------------------------------------------------
-- Plan darmowy musi istnieć, bo `consume_quota` czyta z niego limity.
-- `stripe_price_id` jest tu wartością zastępczą — plan darmowy nie ma ceny
-- w Stripe, a kolumna jest `not null unique`.
insert into public.plans (id, stripe_price_id, name, interval, ai_quota, import_quota, active)
values ('free', 'price_free_placeholder', 'Free', 'month', 5, 1, true)
on conflict (id) do nothing;
