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

create table public.client_errors (
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

create index client_errors_status_last_seen_idx on public.client_errors (status, last_seen_at desc);

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
