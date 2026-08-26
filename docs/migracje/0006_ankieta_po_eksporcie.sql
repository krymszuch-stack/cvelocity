-- ---------------------------------------------------------------------------
-- 0006 — ankieta po eksporcie dokumentu (telemetria wysyłek)
-- ---------------------------------------------------------------------------
-- UWAGA: to środowisko (mirror w Lovable) nie ma prawa zapisu do
-- `supabase/migrations/`. Plik jest kompletny — przenieś go w oryginalnym
-- repozytorium jako `supabase/migrations/0006_ankieta_po_eksporcie.sql`.
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
