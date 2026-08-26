-- ---------------------------------------------------------------------------
-- 0005 — katalog płatny zsynchronizowany ze Stripe + dożywotnie szablony
-- ---------------------------------------------------------------------------
-- UWAGA: to repozytorium jest mirrorem. Bazą zarządza repozytorium źródłowe,
-- dlatego plik leży tutaj, a nie w `supabase/migrations/`. Przenieś go do
-- `supabase/migrations/0005_katalog_platnosci.sql` w repozytorium źródłowym
-- i tam zastosuj — nic tu nie uruchamia się automatycznie.
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
