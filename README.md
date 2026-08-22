# CVELOCITY ⚡

Narzędzie do sprawdzania, czy Twoje CV przejdzie przez polski system ATS — i do dopasowania go do konkretnego ogłoszenia.

**Ocena ATS liczy się w przeglądarce.** Twoje CV nie jest nigdzie wysyłane: ani na nasz serwer, ani do modelu językowego. Do AI trafia wyłącznie treść ogłoszenia, które sam wskażesz, i to po usunięciu z niej danych kontaktowych.

> **Status: prototyp przed pierwszym wydaniem produkcyjnym.** Domyślnie profil zapisuje się w przeglądarce (`BACKEND_MODE=local`). Warstwa kont, trwałych danych i płatności (`BACKEND_MODE=cloud`) jest zbudowana po stronie serwera, ale nie jest jeszcze podpięta do interfejsu. Pełna, uczciwa lista tego, co **nie** jest zabezpieczone, znajduje się w [`SECURITY.md`](./SECURITY.md).

---

## Co robi

- **Symulator ATS po polsku** — trójwarstwowy scoring z własnym stemmerem języka polskiego i zbiorem polskich stop-words rekrutacyjnych. Globalne narzędzia obsługują polski słabo albo wcale. Działa lokalnie, bez kosztu API.
- **Parser ogłoszeń** — wklej link albo treść. Na portalach udostępniających dane strukturalne (`schema.org/JobPosting`) tytuł, firma, widełki z walutą, tryb pracy i lista umiejętności odczytują się **deterministycznie i bez udziału AI**.
- **Parser CV** — PDF, DOCX i tekst. Gdy sekcji nie ma w dokumencie, pole zostaje puste; parser niczego nie dopisuje.
- **Generator listów motywacyjnych** — trójczęściowa struktura (Hook, Proof, CTA), lokalnie z profilu.
- **Edytor CV** z podglądem A4 i eksportem do DOCX/PDF.

---

## Prywatność

| | |
|---|---|
| **Ciasteczka** | Brak. Nie ma też banera zgody, bo nie ma na co się zgadzać |
| **Analityka, reklamy, śledzenie** | Brak. Żaden skrypt firmy trzeciej nie jest ładowany |
| **Fonty** | Hostowane lokalnie (`public/fonts`). Nie z Google Fonts, bo tamto wysyła adres IP odwiedzającego na serwery Google |
| **CV** | Zostaje w Twojej przeglądarce |
| **Zdjęcie z CV** | Nie trafia do modelu w żadnej postaci — wizerunek to dane szczególnej kategorii (art. 9 RODO) |
| **Co idzie do AI** | Wyłącznie treść ogłoszenia, po zamianie e-maili, telefonów i odnośników na symbole |

Szczegóły: [polityka prywatności](./docs/polityka-prywatnosci.md) · [lista podprocesorów](./docs/podprocesorzy.md) · [rejestr czynności (RoPA)](./docs/rejestr-czynnosci.md)

Instrukcja wdrożenia backendu: [`docs/BACKEND-ROADMAP.md`](./docs/BACKEND-ROADMAP.md)

---

## Uruchomienie

```bash
git clone https://github.com/krymszuch-stack/cvelocity.git
cd cvelocity
npm install
cp .env.example .env      # uzupełnij GEMINI_API_KEY
npm run dev               # http://localhost:3000
```

Serwer nie wystartuje bez `GEMINI_API_KEY` — to celowe. Wcześniej brak klucza ujawniał się dopiero błędem 500 przy pierwszym żądaniu.

### Polecenia

| Komenda | Działanie |
|---|---|
| `npm run dev` | Tryb deweloperski (Vite + Express w jednym procesie) |
| `npm run build` | Frontend do `dist/client/`, serwer do `dist/server.mjs` |
| `npm start` | Uruchomienie zbudowanej aplikacji |
| `npm run lint` | Sprawdzenie typów (`tsc --noEmit`) |
| `npm test` | Testy jednostkowe (Vitest) |

---

## Architektura

```
Przeglądarka (React 19 + Vite)       Serwer (Express na Node 22)
├─ ocena ATS         ← lokalnie      ├─ /api/fetch-jd-url   → pobranie ogłoszenia
├─ parsowanie CV     ← lokalnie      ├─ /api/parse-jd       → analiza przez Gemini
├─ edytor i eksport  ← lokalnie      ├─ /api/usage/stats    → zużycie tokenów
└─ profil            ← localStorage  │
                       lub konto     │  poniżej tylko przy BACKEND_MODE=cloud
                                     ├─ /api/me             → profil i uprawnienia
                                     ├─ /api/vault          → CV zapisane na koncie
                                     ├─ /api/applications   → historia aplikacji
                                     ├─ /api/billing/*      → sesje Stripe
                                     └─ /api/stripe-webhook → potwierdzenie płatności
```

Frontend i API są serwowane **z jednego kontenera**. Jeden adres oznacza brak ruchu
cross-origin, brak CORS do skonfigurowania i brak osobnego rachunku za hosting
frontendu. `server.ts` serwuje `dist/client/` warunkowo, więc ten sam obraz
zbudowany bez frontendu działa dalej jako samo API.

**Kto podejmuje decyzje o uprawnieniach:** wyłącznie serwer. Licznik limitów
w przeglądarce (`src/store/useEntitlements.ts`) jest podpowiedzią dla interfejsu
i leży w `localStorage`, więc da się go przestawić z konsoli. Nic z tego nie
wynika — realny limit pobiera funkcja `consume_quota` w bazie, a status
subskrypcji zmienia wyłącznie webhook Stripe'a.

**Klucz Gemini żyje wyłącznie po stronie serwera** i nigdy nie trafia do pakietu przeglądarki.

### Pobieranie ogłoszeń

Drabina ekstrakcji schodzi w dół tylko wtedy, gdy wyższy szczebel zawiódł — trzy pierwsze są darmowe i deterministyczne:

1. **JSON-LD `schema.org/JobPosting`** — komplet metadanych bez udziału modelu
2. **OpenGraph**
3. **Treść główna dokumentu**
4. Model — dopiero gdy 1–3 nie dały treści, i tylko do rozbicia opisu

Zabezpieczenia pobierania: walidacja adresu i blokada zasobów wewnętrznych, **przypięcie zwalidowanego IP** (ochrona przed DNS rebinding), rewalidacja każdego przekierowania, limit 2 MB, timeout, **egzekwowanie `robots.txt`**.

**Co działa, a co nie:** automatyczne pobieranie sprawdzone na **justjoin.it**. NoFluffJobs, Pracuj.pl, theprotocol.it i bulldogjob.pl odrzucają żądania spoza przeglądarki — obchodzenie tych zabezpieczeń jest poza zakresem projektu, więc dla nich służy wklejenie treści ręcznie.

---

## Konfiguracja

Pełna lista zmiennych w [`.env.example`](./.env.example). Minimum do uruchomienia:

```env
GEMINI_API_KEY=...              # wymagany
GEMINI_MODEL=gemini-2.5-flash-lite
PORT=3000
BACKEND_MODE=local              # cloud = konta, baza i limity po stronie serwera
ALLOWED_ORIGINS=                # puste = tylko to samo pochodzenie, nigdy gwiazdka
TRUST_PROXY=false               # true WYŁĄCZNIE za reverse proxy (na Cloud Run: true)
```

W trybie `cloud` dochodzą `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` oraz
klucze Stripe'a. Serwer nie wystartuje bez nich — tak samo jak bez klucza
Gemini.

⚠️ Subskrypcja „Google AI Pro" **nie obejmuje** Gemini API — potrzebny jest osobny projekt Google Cloud z płatnym rozliczaniem. Darmowy tier API wykorzystuje przesłane dane do trenowania modeli, co przy CV dyskwalifikuje go dla produktu komercyjnego. Instrukcja krok po kroku: [`docs/SETUP.md`](./docs/SETUP.md).

---

## Wdrożenie

Jeden obraz kontenera (`Dockerfile`) na Google Cloud Run — serwuje frontend i API
pod jednym adresem. Komplet komend, sekretów i weryfikacji:
[`docs/BACKEND-ROADMAP.md`](./docs/BACKEND-ROADMAP.md).

Koszt przy skalowaniu do zera i Supabase Free: **0 zł do pierwszego płacącego
klienta**. Od pierwszej płatności Supabase Pro przestaje być opcjonalne — plan
Free nie ma kopii zapasowych, a te wymaga art. 32 RODO.

⚠️ Trasy AI nie wymagają jeszcze uwierzytelnienia (patrz `SECURITY.md`).
Wystawiając usługę publicznie, ogranicz liczbę instancji (`--max-instances`)
i ustaw budżet z alertami — inaczej wywołania modelu opłaca Twoja karta.

---

## Testy i CI

`npm test` uruchamia zestaw pokrywający m.in. tablicę złośliwych adresów URL (metadane chmury, adresy w zapisie ósemkowym, IPv4-mapped IPv6), parser `robots.txt`, pseudonimizację na granicy modelu i kontrakt danych ogłoszenia.

CI sprawdza typy, testy, build, **uruchamia zbudowany serwer i odpytuje `/api/health`** oraz buduje obraz kontenera. Ten przedostatni krok istnieje dlatego, że raz już się zdarzyło, że aplikacja kompilowała się czysto i nie startowała.

Dwa kroki pilnują granic, których nie widać w testach jednostkowych:

- **granica uwierzytelnienia** — serwer podnoszony z `BACKEND_MODE=cloud`, a `/api/me`, `/api/vault` i `/api/applications` bez tokenu muszą zwrócić `401`. Gdyby `requireAuth` kiedykolwiek przepuścił żądanie bez nagłówka `Authorization`, te trasy wystawiłyby cudze dane;
- **sekrety poza pakietem** — `grep` po `dist/client/` za `service_role` i kluczami Stripe'a. Klucz `service_role` omija całe RLS, więc w pakiecie przeglądarki oznaczałby pełny dostęp do bazy dla każdego odwiedzającego.

---

## Licencja

Nie ustalona — repozytorium nie zawiera pliku `LICENSE`. Do uzupełnienia przed publicznym udostępnieniem kodu.

Fonty Geist i Geist Mono: SIL Open Font License 1.1.
