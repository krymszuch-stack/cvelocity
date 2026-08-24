-- CVELOCITY — pytania uzupełniające i korpus podpowiedzi.
--
-- Ta sama zasada co w `0001_init.sql`: RLS włączone na każdej tabeli bez
-- wyjątku, a to, co decyduje o widoczności cudzych danych, jest częścią
-- **polityki**, a nie warunkiem w zapytaniu aplikacji. Warunek pominięty raz
-- w kodzie odsłania dane; polityki pominąć się nie da.
--
-- Czego tu świadomie NIE MA: ani jednej trasy Express i ani jednego wywołania
-- z przeglądarki. Klient nie ma dziś ekranu logowania (`AuthContext` obsługuje
-- wyłącznie profil lokalny), więc trasa pod `requireAuth` nie miałaby jak
-- zostać wywołana i dołożyłaby się do dziewięciu tras, które już dziś nie mają
-- konsumenta. Ta migracja jest fundamentem pod funkcję, nie samą funkcją.

-- ---------------------------------------------------------------------------
-- consents — zgody, dopisywane, nigdy nadpisywane
-- ---------------------------------------------------------------------------
-- Zgoda nie jest polem `boolean` w profilu, bo zgoda ma historię: kiedy jej
-- udzielono, na jaką wersję treści i kiedy ją cofnięto. Udzielenie i cofnięcie
-- to dwa osobne wiersze — inaczej nie da się odpowiedzieć na pytanie „na jakiej
-- podstawie przetwarzaliście to w marcu" (art. 7 ust. 1 RODO).
create table if not exists public.consents (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('suggestion_corpus')),
  granted    boolean not null,
  -- Wersja dokumentu, na którą zgoda została wyrażona. Zmiana treści zgody
  -- unieważnia starą, zamiast po cichu rozszerzać zakres tej już udzielonej.
  document_version text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists consents_user_idx on public.consents (user_id, kind, created_at desc);

alter table public.consents enable row level security;

create policy "zgody widzi tylko właściciel"
  on public.consents for select using (auth.uid() = user_id);
create policy "zgody dopisuje tylko właściciel"
  on public.consents for insert with check (auth.uid() = user_id);

-- Brak polityk UPDATE i DELETE jest celowy i jest całym sensem tej tabeli.
-- Zgodę się **cofa** dopisaniem wiersza z `granted = false`, a nie edycją
-- poprzedniego: skasowany albo nadpisany wiersz nie zostawia śladu, że zgoda
-- kiedykolwiek istniała, więc nie da się nim niczego wykazać. Przy usuwaniu
-- konta wiersze znikają przez `delete_user_data`, która RLS omija.

-- ---------------------------------------------------------------------------
-- cv_question_skips — pytania uzupełniające pominięte przez użytkownika
-- ---------------------------------------------------------------------------
-- Chmurowy odpowiednik klucza `cvelocity:cv-questions-skipped`. „Nie pytaj mnie
-- o to" należy do konta, nie do przeglądarki: pominięcie na telefonie, po
-- którym to samo pytanie wraca na laptopie, czyta się jak awaria.
--
-- **Odpowiedzi tu nie ma i nie będzie.** Odpowiedź jest treścią CV i mieszka
-- w `vaults.data`; drugi egzemplarz tego samego faktu rozjechałby się przy
-- pierwszej edycji profilu i podwoiłby powierzchnię usuwania danych.
create table if not exists public.cv_question_skips (
  user_id     uuid not null references auth.users (id) on delete cascade,
  -- Ten sam ciąg, którym posługuje się `src/lib/cvQuestionEngine.ts`
  -- (np. `metric:exp-1:hl-1`). Baza go nie parsuje i nie sprawdza kształtu:
  -- katalog reguł zmienia się częściej niż schemat, a `check` na jego postać
  -- wymuszałby migrację przy każdym nowym pytaniu.
  question_id text not null,
  skipped_at  timestamptz not null default now(),
  -- Klucz naturalny, nie sztuczne `id`: pominięcie tego samego pytania drugi
  -- raz ma być bezgłośne, a nie zakładać drugi wiersz.
  primary key (user_id, question_id)
);

alter table public.cv_question_skips enable row level security;

create policy "pominięcia widzi tylko właściciel"
  on public.cv_question_skips for select using (auth.uid() = user_id);
create policy "pominięcia dodaje tylko właściciel"
  on public.cv_question_skips for insert with check (auth.uid() = user_id);
create policy "pominięcia usuwa tylko właściciel"
  on public.cv_question_skips for delete using (auth.uid() = user_id);

-- Świadomie bez osobnego indeksu na `user_id`: klucz główny zaczyna się od tej
-- kolumny, a jedyne zapytanie brzmi „wszystkie pominięcia tego użytkownika".
-- Drugi indeks byłby martwym kosztem przy każdym zapisie.

-- ---------------------------------------------------------------------------
-- suggestion_contributions — wkład jednej osoby do korpusu podpowiedzi
-- ---------------------------------------------------------------------------
-- TO SĄ DANE OSOBOWE i tak są traktowane. Wiersz mówi wprost „ta osoba podała
-- tę umiejętność na tym stanowisku w tej firmie".
--
-- Co tu trafia: wyłącznie znormalizowane nazwy umiejętności, narzędzi
-- i uprawnień. Czego tu nie ma i nie będzie: treści CV, opisów obowiązków,
-- osiągnięć, dat zatrudnienia, widełek, nazwisk. To jest różnica między
-- „słownikiem branżowym budowanym przez użytkowników" a „CV na serwerze",
-- a ta druga rzecz jest w `docs/rejestr-czynnosci.md` wymieniona jako
-- przesłanka wymuszająca pełną ocenę skutków (DPIA).
--
-- `user_id` zostaje mimo anonimowego odczytu, bo bez niego nie da się ani
-- policzyć progu k-anonimowości (liczba RÓŻNYCH osób, nie wystąpień), ani
-- usunąć czyjegoś wkładu przy „usuń moje dane".
create table if not exists public.suggestion_contributions (
  user_id      uuid not null references auth.users (id) on delete cascade,
  company_norm text not null,
  role_norm    text not null,
  token_kind   text not null check (token_kind in ('hard_skill', 'tool', 'certification')),
  token        text not null,
  updated_at   timestamptz not null default now(),
  -- Jedna osoba liczy się do progu raz. Bez tego wystarczyłoby dopisać tę samą
  -- wartość dwadzieścia pięć razy z jednego konta, żeby ją opublikować.
  primary key (user_id, company_norm, role_norm, token_kind, token)
);

-- Indeks pod jedyne ciężkie zapytanie: „ilu różnych ludzi podało tę wartość".
-- Klucz główny zaczyna się od `user_id`, więc na to pytanie nie odpowiada.
create index if not exists suggestion_contributions_lookup_idx
  on public.suggestion_contributions (company_norm, role_norm, token_kind);

alter table public.suggestion_contributions enable row level security;

create policy "wkład widzi tylko właściciel"
  on public.suggestion_contributions for select using (auth.uid() = user_id);
create policy "wkład dodaje tylko właściciel"
  on public.suggestion_contributions for insert with check (auth.uid() = user_id);
create policy "wkład usuwa tylko właściciel"
  on public.suggestion_contributions for delete using (auth.uid() = user_id);

-- Czytania cudzych wierszy nie ma w żadnej polityce i nie może być: jedyną
-- drogą do korpusu jest funkcja niżej, która oddaje wyłącznie agregat.

-- ---------------------------------------------------------------------------
-- suggestion_corpus — jedyne wyjście z korpusu, z progiem k-anonimowości
-- ---------------------------------------------------------------------------
-- `security definer`, bo musi widzieć wiersze wszystkich użytkowników, żeby
-- policzyć próg — a żaden użytkownik takiego prawa nie ma i mieć nie może.
-- Zwracany jest sam token i liczba osób, nigdy identyfikator kogokolwiek.
create or replace function public.suggestion_corpus(
  p_company text,
  p_role    text,
  p_kind    text
)
returns table (token text, contributors integer)
language sql
stable
security definer
set search_path = public
as $$
  select c.token, count(distinct c.user_id)::int as contributors
    from public.suggestion_contributions c
   where c.company_norm = lower(btrim(p_company))
     and c.role_norm    = lower(btrim(p_role))
     and c.token_kind   = p_kind
   group by c.token
  -- Próg pięciu RÓŻNYCH osób. Poniżej niego rzadka umiejętność wskazuje
  -- konkretnego człowieka, a „anonimowy korpus" przestaje być anonimowy —
  -- podpowiedź „ktoś w tej firmie umie X" przy jednym wkładzie jest zdaniem
  -- o tej jednej osobie.
  having count(distinct c.user_id) >= 5
   order by contributors desc, token
   limit 20;
$$;

-- Wywoływać może wyłącznie serwer kluczem `service_role` — po sprawdzeniu, że
-- pytający sam ma udzieloną zgodę. Gdyby funkcja była dostępna dla `anon`,
-- korpus byłby publicznym API do sondowania rynku pracy.
revoke all on function public.suggestion_corpus(text, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- delete_user_data — uzupełnienie o nowe tabele (RODO art. 17)
-- ---------------------------------------------------------------------------
-- Nadpisanie definicji z `0001_init.sql`. Ta funkcja jest jedynym miejscem,
-- które wie, co składa się na „wszystkie moje dane"; dopisanie tabeli bez
-- dopisania jej tutaj daje „usuń moje dane", które czegoś nie usuwa — a to jest
-- gorsze niż brak takiej funkcji, bo obiecuje coś, czego nie robi.
--
-- Przy okazji naprawione `user_quotas`: tabela powstała w `0002_quota_atomic.sql`
-- i nigdy nie została tu dopisana, więc licznik zużycia przeżywał usunięcie
-- konta. To jest dokładnie ta klasa błędu, o której mówi reguła 4 w `AGENTS.md`.
create or replace function public.delete_user_data(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ai_usage_events set user_id = null where user_id = p_user;

  delete from public.suggestion_contributions where user_id = p_user;
  delete from public.cv_question_skips         where user_id = p_user;
  delete from public.consents                  where user_id = p_user;
  delete from public.user_quotas               where user_id = p_user;
  delete from public.usage_counters where user_id = p_user;
  delete from public.subscriptions  where user_id = p_user;
  delete from public.applications   where user_id = p_user;
  delete from public.vaults         where user_id = p_user;
  delete from public.profiles       where id      = p_user;
end;
$$;

revoke all on function public.delete_user_data(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- handle_new_user — odcięcie od publicznego API
-- ---------------------------------------------------------------------------
-- `0001_init.sql` odbiera prawo wykonania `consume_quota` i `delete_user_data`,
-- ale o `handle_new_user` zapomina. Efekt: funkcja `security definer` jest
-- wystawiona pod `/rest/v1/rpc/handle_new_user` dla ról `anon`
-- i `authenticated` — wychwycił to linter bezpieczeństwa Supabase zaraz po
-- zastosowaniu migracji.
--
-- To jest funkcja wyzwalacza. Wywołana spoza kontekstu `after insert` nie ma
-- `NEW` i wywróci się, więc szkoda jest raczej teoretyczna niż praktyczna —
-- ale wystawianie `security definer` bez potrzeby jest dokładnie tą klasą
-- niedopatrzenia, którą reguła 4 każe poprawiać w całości, a nie po jednym
-- wystąpieniu. Wyzwalacz działa dalej: `revoke` dotyczy wywołań przez API,
-- nie wykonania przez samą bazę.
revoke all on function public.handle_new_user() from public, anon, authenticated;
