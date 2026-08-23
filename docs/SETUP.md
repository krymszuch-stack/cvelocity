# CVELOCITY — przewodnik konfiguracji

Lista rzeczy do zrobienia ręcznie: konta, klucze, DNS, formalności. Wszystko, czego nie da się zrobić z poziomu kodu.

> **O aktualności:** panele tych usług zmieniają się co kilka miesięcy. Opisane są **ścieżki nawigacji i czego szukać**, nie położenie przycisków. Jeśli nazwa sekcji się nie zgadza — szukaj najbliższej znaczeniowo.

## Kolejność

| Kiedy | Krok | Co blokuje |
|---|---|---|
| Teraz | [1 Gemini](#1--google-cloud--gemini-api) · [2 Supabase](#2--supabase) · [3 Stripe test](#3--stripe) | prace nad backendem |
| Po kluczach | [Poradnik wdrożeniowy](./BACKEND-ROADMAP.md) | migracje, uruchomienie, wdrożenie |
| Tydzień 1–2 | [4 Domena i poczta](#4--domena-dns-i-poczta) | rejestrację użytkowników |
| Tydzień 4–5 | [5 Hosting](#5--hosting) | publiczne wystawienie |
| Przed 1. płatnością | [6 Formalności](#6--formalności) | przyjmowanie płatności |
| Później | [7 Mini PC](#7--mini-pc) | worker scrapera |

---

## 1 · Google Cloud + Gemini API

**Dlaczego to jest pierwsze:** darmowy tier Gemini API wykorzystuje przesłane dane do trenowania modeli. Przy CV realnych osób to nie jest kwestia budżetu, tylko legalności — potrzebny jest tier płatny.

Subskrypcja „Google AI Pro" **nie obejmuje API**. Google pisze to wprost:
> „AI Studio UI only: (…) Direct use of the Gemini API (such as using API keys or external applications) is billed and managed separately."
> — https://ai.google.dev/gemini-api/docs/google-ai-plans

### Kroki

1. **Projekt** → https://console.cloud.google.com/projectcreate
   Nazwa np. `cvelocity-prod`. Zapisz **Project ID** (różni się od nazwy).

2. **⚠️ Najpierw budżet, dopiero potem karta.** Ta kolejność ratuje przed rachunkiem za pomyłkę w pętli.
   → https://console.cloud.google.com/billing → *Budgets & alerts* → *Create budget*
   Limit np. 50 zł/mc, alerty na 50 / 90 / 100%.
   **Budżet Google nie odcina usług** — wysyła tylko maila. Twarde odcięcie wymaga Cloud Function podpiętej pod alert (opcjonalne).

3. **Karta** → https://console.cloud.google.com/billing → *Link a billing account*

4. **Włącz API** → w konsoli wyszukaj „Generative Language API" → *Enable*

5. **Klucz** → https://aistudio.google.com/apikey
   ⚠️ Przy tworzeniu wybierz **projekt z billingiem**, nie „nowy projekt". To moment, w którym najłatwiej wylądować na darmowym tierze.

6. **Zweryfikuj tier** → https://aistudio.google.com/ → sekcja rozliczeń. Szukasz **Tier 1** lub wyżej. „Free" = dane idą do trenowania.

7. **Sprawdź dostępne modele:**
   ```bash
   curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=TWOJ_KLUCZ" \
     | grep -o '"name": "[^"]*"'
   ```
   Szukasz `gemini-2.5-flash-lite` — najtańszy zdolny do naszego zadania.

8. **Do `.env`:**
   ```
   GEMINI_API_KEY=AIza...
   GEMINI_MODEL=gemini-2.5-flash-lite
   ```

9. **Warunki i DPA** → https://ai.google.dev/gemini-api/terms — sprawdź sekcję o wykorzystaniu danych dla płatnego tieru, zrób zrzut ekranu z datą (dowód należytej staranności do dokumentacji RODO).

### Ceny (zweryfikowane 2026-08)

| Model | Input / 1M | Output / 1M |
|---|---|---|
| `gemini-2.5-flash-lite` | $0.10 | $0.40 |
| `gemini-3.1-flash-lite` | $0.25 | $1.50 |
| `gemini-3.6-flash` | $0.75 | $3.75 → **$1.50 / $7.50 od 1.01.2027** |

**Batch mode = −50%.** Parsowanie ogłoszeń jest asynchroniczne, więc `2.5-flash-lite` w batchu wychodzi $0.05 / $0.20 za milion.

---

## 2 · Supabase

1. **Konto** → https://supabase.com/dashboard (najwygodniej przez GitHub)

2. **Nowy projekt** → *New project*
   - **Region: `Central EU (Frankfurt)`** ⚠️ nie da się zmienić później bez migracji
   - Hasło do bazy: długie, **zapisz w menedżerze haseł** — pokazywane raz
   - Free na start; **Pro (~25 USD/mc) obowiązkowo od pierwszego płacącego klienta** (kopie zapasowe = RODO art. 32)

3. **Klucze** → *Project Settings → API*

   | Klucz | Trafia do | Uwaga |
   |---|---|---|
   | Project URL | `VITE_SUPABASE_URL` | publiczny |
   | `anon` / publishable | `VITE_SUPABASE_ANON_KEY` | publiczny, chroniony przez RLS |
   | `service_role` | **tylko sekrety Edge Functions** | ⚠️ nigdy z `VITE_`, nigdy w repo — omija całe RLS |

4. **Potwierdzanie e-maila** → *Authentication → Providers → Email* → włącz *Confirm email*

5. **Siła haseł** → *Authentication → Policies* → min. 12 znaków + *Check against HaveIBeenPwned*

6. **Google OAuth** → *Authentication → Providers → Google*
   Wymaga OAuth Client ID z https://console.cloud.google.com/apis/credentials — użyj **tego samego projektu** co Gemini. Redirect URI podaje Supabase.

7. **CLI:**
   ```bash
   npm i -g supabase
   supabase login
   supabase link --project-ref TWOJ_REF
   ```

---

## 3 · Stripe

**Klucze testowe dostępne od ręki**, bez weryfikacji firmy. Weryfikacji wymaga dopiero tryb live.

1. **Konto** → https://dashboard.stripe.com/register

2. **Zostań w *Test mode*** (przełącznik w prawym górnym rogu)

3. **Klucze** → https://dashboard.stripe.com/test/apikeys
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...     # ⚠️ tylko serwer
   ```

4. **Produkty** → https://dashboard.stripe.com/test/products
   Utwórz plan Pro (miesięczny + roczny). **Skopiuj `price_...`** — trafiają do tabeli `plans` w bazie, nie do kodu.

5. **Webhooki lokalnie** → https://stripe.com/docs/stripe-cli
   ```bash
   stripe login
   stripe listen --forward-to http://localhost:3000/api/stripe-webhook
   # wypisze whsec_... → STRIPE_WEBHOOK_SECRET
   stripe trigger checkout.session.completed
   ```

6. **Karty testowe:**
   `4242 4242 4242 4242` sukces · `4000 0000 0000 9995` odmowa · `4000 0025 0000 3155` 3D Secure
   Dowolna przyszła data, dowolne CVC.

7. **Stripe Tax** → *Settings → Tax* — włącz przy sprzedaży poza PL

8. **Tryb live** — dopiero po [kroku 6](#6--formalności). Nowy webhook endpoint na produkcyjny URL + podmiana kluczy.

---

## 4 · Domena, DNS i poczta

Bez poprawnych rekordów maile potwierdzające rejestrację lądują w spamie. To najczęściej pomijana przyczyna zerowej konwersji.

1. **Domena** — OVH / home.pl / Cloudflare Registrar. `.pl` ~50–80 zł/rok.

2. **DNS na Cloudflare** → https://dash.cloudflare.com — darmowe i wygodne w zarządzaniu.

3. **Poczta transakcyjna** — https://resend.com (3000 maili/mc za darmo) albo https://postmarkapp.com
   Panel poda trzy rekordy DNS:
   - **SPF** (`TXT` na domenie) — kto może wysyłać w Twoim imieniu
   - **DKIM** (`TXT`/`CNAME`) — podpis kryptograficzny
   - **DMARC** (`TXT` na `_dmarc`) — zacznij od `v=DMARC1; p=none; rua=mailto:ty@domena.pl`, po dwóch tygodniach obserwacji podnieś do `p=quarantine`

4. **Weryfikacja** → https://www.mail-tester.com — celuj w 10/10

5. **Podłącz w Supabase** → *Authentication → Email Templates* → własny SMTP + polskie szablony

---

## 5 · Hosting

### Stan faktyczny: Firebase Hosting, sam frontend

Dziś aplikacja stoi pod **https://cvelocity.oathcry.com** na Firebase Hosting
(projekt `skillvault-99a72`) i jest to **wyłącznie frontend**. Backendu tam nie
ma: `/api/health` oddaje stronę HTML, bo trafia w regułę przepisującą wszystko
na `index.html`. Wszystko, co wymaga serwera — Doradca AI, parsowanie ogłoszeń
przez Gemini, konta, limity — pod tym adresem nie działa.

Konfiguracja wdrożenia leży teraz w repozytorium (`firebase.json`,
`.firebaserc`), a nie na czyimś laptopie. Wdrożenie to:

```bash
firebase login          # raz, kontem z dostępem do projektu
firebase deploy --only hosting
```

`predeploy` w `firebase.json` uruchamia `npm run build:client` samo, więc nie da
się wysłać nieodświeżonego katalogu `dist/`.

> **Pamięć podręczna.** Serwowany dotąd `index.html` miał `Cache-Control:
> max-age=3600`, czyli po wdrożeniu nowa wersja pokazywała się nawet po godzinie
> — i wyglądało to jak nieudane wdrożenie. `firebase.json` ustawia na nim
> `no-cache`, a `immutable` zostawia dla `/assets/**` i `/fonts/**`, których
> nazwy zawierają skrót zawartości. Po pierwszym wdrożeniu z tą konfiguracją
> problem znika; przy sprawdzaniu tego wdrożenia odśwież stronę z pominięciem
> pamięci podręcznej.

> **Nagłówki bezpieczeństwa.** Ustawia je `helmet` w `server.ts`, ale na Firebase
> serwer nie działa, więc nie ustawiał ich nikt. `firebase.json` deklaruje ten
> sam zestaw co `vercel.json` (`X-Content-Type-Options`, `X-Frame-Options`,
> `Referrer-Policy`, `Permissions-Policy`); HSTS Firebase dokłada sam.

### Docelowo: jeden kontener na Cloud Run

Frontend i API mają iść **z jednego kontenera na Cloud Run**. Komplet komend jest
w [`docs/BACKEND-ROADMAP.md`](./BACKEND-ROADMAP.md) §6; tutaj tylko dlaczego tak.

1. **Jeden adres = zero CORS.** Front wołający `/api/...` względnie trafia tam,
   gdzie trzeba. Rozdzielenie hostingu wymagałoby `VITE_API_URL`, `ALLOWED_ORIGINS`,
   CSP `connect-src` na domenę API i sesji działającej cross-origin — czyli
   czterech miejsc, w których da się pomylić, w zamian za nic.

2. **Skalowanie do zera = 0 zł.** Cloud Run przy `--min-instances 0` nie kosztuje
   nic, gdy nikt nie korzysta. Ceną jest zimny start ~1–2 s przy pierwszym żądaniu.

3. ⚠️ **Vercel Hobby (darmowy) zabrania użytku komercyjnego.** Z chwilą
   uruchomienia Stripe'a wymagałby planu Pro (~80 zł/mc). Dlatego nie jest tu
   domyślnym wyborem, mimo że pod względem technicznym byłby wygodny.

4. **Zmienne `VITE_`** są wbudowywane w pakiet przeglądarki **w trakcie budowania
   obrazu**, nie odczytywane w czasie działania — przekazuje się je jako
   `--build-arg`, nie przez `--set-env-vars`. Wszystko z tym prefiksem jest
   publiczne; `STRIPE_SECRET_KEY` ani `service_role` nigdy tutaj.

5. **Nagłówki bezpieczeństwa** ustawia `helmet` w `server.ts` (CSP, HSTS,
   `X-Frame-Options: DENY`). Plik `vercel.json` zostaje w repozytorium na wypadek
   postawienia frontendu osobno, ale przy wdrożeniu jednokontenerowym nie jest
   używany.

6. **Alternatywa:** dowolny hosting kontenerów (Cloudflare Containers, Fly.io,
   własny mini PC za Tailscale). Obraz nie zakłada niczego specyficznego dla Google.

---

## 6 · Formalności

⚠️ **Do omówienia z księgowym.** Poniżej mapa tematów, nie porada prawna.

1. **Forma prawna** — działalność nierejestrowana (limit przychodu) / JDG (najczęstszy wybór) / sp. z o.o. (przy skali)
2. **VAT** — usługi cyfrowe dla konsumentów w UE = **VAT OSS** wg kraju nabywcy. Stripe Tax liczy, rejestracja OSS po Twojej stronie.
3. **Kasa fiskalna** — sprzedaż online z płatnością elektroniczną zwykle podlega zwolnieniu; potwierdź.
4. **Prawo odstąpienia 14 dni** — przy treści cyfrowej potrzebna zgoda na rozpoczęcie świadczenia przed terminem + pouczenie o utracie prawa odstąpienia.
5. **RODO** — jesteś administratorem danych. Potrzebne: polityka prywatności, regulamin, RoPA (rejestr czynności), lista podprocesorów, procedura naruszeń (72 h do UODO), DPIA.

---

## 7 · Mini PC

1. **System:** Ubuntu Server LTS / Debian. **Szyfrowanie LUKS przy instalacji** — później się nie da.
2. **Docker** → https://docs.docker.com/engine/install/ubuntu/
3. **Dostęp zdalny: Tailscale** → https://tailscale.com — **zero portów przychodzących**, zero przekierowań na routerze. Nie otwieraj portów.
4. **Aktualizacje:** `sudo apt install unattended-upgrades`
5. **Co tam postawić:** worker scrapera · staging (`supabase start`) · analityka bez ciasteczek (Plausible/Umami — brak banera cookie) · nocna weryfikacja odtwarzania kopii zapasowych
6. **⚠️ Czego nie stawiać:** produkcyjnej bazy danych · nie kopiować tam prawdziwych CV, nawet na staging

---

## Checklista przed pierwszym płacącym klientem

- [ ] Gemini na **płatnym** tierze + budżet z alertami
- [ ] Supabase **Pro** (kopie zapasowe), region Frankfurt
- [ ] `grep -r "service_role\|sk_live\|sk_test" dist/client/` → brak trafień (krok automatyczny w CI)
- [ ] RLS przetestowane na projekcie **zdalnym**, nie tylko lokalnym
- [ ] Powtórzone zdarzenie webhooka nie tworzy duplikatu w `subscriptions`
- [ ] SPF/DKIM/DMARC — mail-tester 10/10
- [ ] Polityka prywatności, regulamin, lista podprocesorów opublikowane
- [ ] Zgoda na AI **odrębna** od regulaminu; aplikacja działa bez niej
- [ ] Usuwanie konta czyści wszystko — potwierdzone testem automatycznym
- [ ] DPA: Google, Supabase, Stripe, dostawca poczty
- [ ] Firma założona, VAT/OSS ustalony
- [ ] `SECURITY.md` opisuje stan faktyczny, nie życzenia

## Koszty

| Pozycja | Koszt |
|---|---|
| Domena `.pl` | ~60 zł/rok |
| Supabase Pro | ~100 zł/mc (od 1. klienta) |
| Gemini API | ~5–30 zł/mc na starcie |
| Vercel, Cloudflare, Resend, Tailscale | 0 zł |
| Księgowość JDG | ~150–250 zł/mc |
| **Razem** | **~250–400 zł/mc** |

Przy planie ~39–49 zł próg rentowności to 4–6 klientów.
