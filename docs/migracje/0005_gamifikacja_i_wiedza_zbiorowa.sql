-- ---------------------------------------------------------------------------
-- 0005 — gamifikacja i wiedza zbiorowa
-- ---------------------------------------------------------------------------
-- UWAGA: to środowisko (mirror w Lovable) nie ma prawa zapisu do
-- `supabase/migrations/`. Plik leży tutaj gotowy do przeniesienia jako
-- `supabase/migrations/0005_gamifikacja_i_wiedza_zbiorowa.sql` w oryginalnym
-- repozytorium — treść jest kompletna i nie wymaga zmian.
--
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
