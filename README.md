# CVELOCITY ⚡

Narzędzie dla osoby szukającej pracy: sprawdza, czy CV przejdzie przez polski
system ATS, dopasowuje je do konkretnego ogłoszenia i **dopytuje o to, czego
w nim brakuje** — zamiast dopisywać to za kandydata.

**Nic tu nie jest zmyślane.** Typowy generator oparty na modelu językowym dopisze
technologię, której kandydat nigdy nie widział; ten kompromituje się na pierwszym
pytaniu technicznym. Tutaj każde zdanie w dokumencie pochodzi z tego, co
użytkownik sam podał — a gdy czegoś brakuje, aplikacja o to pyta.

> **Status: przed pierwszym wydaniem produkcyjnym.** Działa: profil, import CV,
> skaner ATS, dopasowanie do ogłoszenia, ściąga na rozmowę, pytania uzupełniające,
> podpowiadacz w formularzach, konta w chmurze. Nie działa jeszcze: płatności
> i wdrożony serwer — pod adresem produkcyjnym stoi sam frontend, więc trasy
> `/api/*` są tam nieosiągalne. Uczciwa lista tego, co **nie** jest zabezpieczone:
> [`SECURITY.md`](./SECURITY.md).

Krótki opis produktu na jedną stronę: [`docs/o-projekcie.md`](./docs/o-projekcie.md).

---

## Co robi

**Ocena i dopasowanie**

- **Symulator ATS po polsku** — trójwarstwowy scoring z własnym stemmerem języka
  polskiego i zbiorem polskich stop-words rekrutacyjnych. Globalne narzędzia
  obsługują polski słabo albo wcale. Liczy się w przeglądarce, bez kosztu API.
- **Audyt kryteriów zerojedynkowych** — sprawdza to, na czym kandydat naprawdę
  odpada: SEP, UDT, F-Gaz, HACCP, kategorie prawa jazdy, poziom języka.
- **Parser ogłoszeń** — wklej link albo treść. Na portalach udostępniających dane
  strukturalne (`schema.org/JobPosting`) tytuł, firma, widełki, tryb pracy
  i umiejętności odczytują się **deterministycznie, bez udziału modelu**.
- **Parser CV** — PDF, DOCX i tekst. Gdy sekcji nie ma w dokumencie, pole zostaje
  puste; parser niczego nie dopisuje.

**Uzupełnianie treści**

- **Pytania uzupełniające** — katalog reguł wykrywa luki (osiągnięcie bez liczby,
  obowiązek bez narzędzia, slogan zamiast faktu) i zamienia je w krótkie pytania.
  Odpowiedź trafia do dokumentu **dosłownie**, a użytkownik widzi gotowy punktor,
  zanim kliknie „Zapisz". Zero tokenów.
- **Podpowiadacz w formularzach** — wartości z własnej historii, z katalogu branż
  (12 sektorów, 20 podról) i ze słowników. **Nic nie wpisuje się samo** — każda
  podpowiedź wymaga świadomego wyboru.

**Przygotowanie do rozmowy**

- **Ściąga na rozmowę** — punkty STAR zbudowane z prawdziwej historii zatrudnienia,
  mosty kompetencyjne na pytania o brakujące narzędzie, pytania do rekrutera.
- **Generator listów motywacyjnych** — struktura Hook / Proof / CTA, lokalnie
  z profilu.
- **Edytor CV** z podglądem A4 i eksportem do DOCX/PDF.

**Konto (opcjonalne)**

- **Tryb lokalny albo konto w chmurze** — do wyboru. Lokalnie dane nie opuszczają
  przeglądarki; na koncie CV przeżywa wyczyszczenie danych witryny i wraca na
  innym urządzeniu.

---

## Prywatność

| | |
|---|---|
| **Ciasteczka** | Brak. Nie ma też banera zgody, bo nie ma na co się zgadzać |
| **Analityka, reklamy, śledzenie** | Brak. Żaden skrypt firmy trzeciej nie jest ładowany |
| **Fonty** | Hostowane lokalnie (`public/fonts`). Nie z Google Fonts, bo tamto wysyła adres IP odwiedzającego na serwery Google |
| **CV** | W trybie lokalnym zostaje w przeglądarce. Na koncie trafia do bazy w regionie Frankfurt — i wyłącznie Ty je widzisz, czego pilnuje mechanizm bazy (RLS), a nie kod aplikacji |
| **Zdjęcie z CV** | Nie trafia do modelu w żadnej postaci — wizerunek to dane szczególnej kategorii (art. 9 RODO) |
| **Co idzie do modelu** | Treść ogłoszenia oraz — przy generowaniu ściągi na rozmowę — profil kandydata. Obie ścieżki przechodzą przez pseudonimizację: e-maile, telefony, nazwiska i odnośniki zamieniane są na symbole, a `photoUrl` usuwany całkowicie |
| **Hasło** | Nie znamy go. Liczy je i przechowuje w postaci skrótu Supabase Auth |

Szczegóły: [polityka prywatności](./docs/polityka-prywatnosci.md) ·
[lista podprocesorów](./docs/podprocesorzy.md) ·
[rejestr czynności (RoPA)](./docs/rejestr-czynnosci.md)

---

## Uruchomienie

```bash
git clone https://github.com/krymszuch-stack/cvelocity.git
cd cvelocity
npm install
cp .env.example .env      # uzupełnij GEMINI_API_KEY
npm run dev               # http://localhost:3000
```

Serwer nie wystartuje bez `GEMINI_API_KEY` — to celowe. Wcześniej brak klucza
ujawniał się dopiero błędem 500 przy pierwszym żądaniu.

Aplikacja działa wtedy w trybie lokalnym. Żeby włączyć konta, dopisz do `.env`
dwie linijki i podepnij własny SMTP w panelu Supabase
([`docs/SETUP.md`](./docs/SETUP.md)):

```env
VITE_SUPABASE_URL=https://TWOJ_REF.supabase.co
VITE_SUPABASE_ANON_KEY=...      # publiczny z definicji — chroni go RLS
```

### Polecenia

| Komenda | Działanie |
|---|---|
| `npm run dev` | Tryb deweloperski (Vite + Express w jednym procesie) |
| `npm run build` | Frontend do `dist/client/`, serwer do `dist/server.mjs` |
| `npm start` | Uruchomienie zbudowanej aplikacji |
| `npm run lint` | ESLint **i** sprawdzenie typów (`tsc --noEmit`) — to jest bramka CI |
| `npm test` | Testy jednostkowe (Vitest, w Node) |
| `npm run test:rls` | Sprawdzenie, że użytkownik nie widzi cudzych danych (wymaga kluczy Supabase) |

---

## Architektura

```
Przeglądarka (React 19 + Vite)        Serwer (Express na Node 22)
├─ ocena ATS          ← lokalnie      ├─ /api/fetch-jd-url        → pobranie ogłoszenia
├─ parsowanie CV      ← lokalnie      ├─ /api/parse-jd            → analiza ogłoszenia  ⟨auth⟩
├─ pytania uzup.      ← lokalnie      ├─ /api/generate-cheat-sheet→ wzbogacenie ściągi  ⟨auth⟩
├─ podpowiedzi        ← lokalnie      ├─ /api/me                  → profil i uprawnienia
├─ edytor i eksport   ← lokalnie      ├─ /api/vault               → CV zapisane na koncie
│                                     ├─ /api/applications        → historia aplikacji
├─ logowanie          → Supabase Auth ├─ /api/billing/*           → sesje Stripe
└─ CV na koncie       → Supabase RLS  └─ /api/stripe-webhook      → potwierdzenie płatności

                    Funkcje brzegowe (Deno, w Supabase)
                    ├─ sprawdz-haslo → odrzucanie haseł z wycieków (HIBP)
                    └─ usun-konto    → usunięcie konta i danych (RODO art. 17)
```

**Logowanie i zapis CV na koncie nie przechodzą przez nasz serwer.** Przeglądarka
rozmawia z Supabase bezpośrednio, a granicą jest **RLS**: polityki przepuszczają
wyłącznie wiersz, w którym `auth.uid() = user_id`. Dzięki temu konta działają na
wdrożeniu bez backendu — a `npm run test:rls` sprawdza tę granicę wprost.

Trasy `/api/*` obsługują to samo kluczem `service_role`, który RLS omija i dlatego
sam pilnuje `user_id` (zawsze z tokenu, nigdy z ciała żądania). Docelowo frontend
i API idą **z jednego kontenera** (`Dockerfile`) — jeden adres, brak CORS, jeden
rachunek. Dziś pod adresem produkcyjnym stoi sam frontend na Firebase Hosting,
więc `/api/*` jest tam nieosiągalne.

**Kto podejmuje decyzje o uprawnieniach:** wyłącznie serwer. Licznik limitów
w przeglądarce (`src/store/useEntitlements.ts`) jest podpowiedzią dla interfejsu
i leży w `localStorage`, więc da się go przestawić z konsoli. Nic z tego nie
wynika — realny limit pobiera funkcja w bazie, a status subskrypcji zmienia
wyłącznie webhook Stripe'a.

**Klucz Gemini żyje wyłącznie po stronie serwera** i nigdy nie trafia do pakietu
przeglądarki. Pilnuje tego osobny krok CI.

### Pobieranie ogłoszeń

Drabina ekstrakcji schodzi w dół tylko wtedy, gdy wyższy szczebel zawiódł — trzy
pierwsze są darmowe i deterministyczne:

1. **JSON-LD `schema.org/JobPosting`** — komplet metadanych bez udziału modelu
2. **OpenGraph**
3. **Treść główna dokumentu**
4. Model — dopiero gdy 1–3 nie dały treści, i tylko do rozbicia opisu

Zabezpieczenia pobierania: walidacja adresu i blokada zasobów wewnętrznych,
**przypięcie zwalidowanego IP** (ochrona przed DNS rebinding), rewalidacja każdego
przekierowania, limit 2 MB, timeout, **egzekwowanie `robots.txt`**.

**Co działa, a co nie:** automatyczne pobieranie sprawdzone na **justjoin.it**.
NoFluffJobs, Pracuj.pl, theprotocol.it i bulldogjob.pl odrzucają żądania spoza
przeglądarki — obchodzenie tych zabezpieczeń jest poza zakresem projektu, więc dla
nich służy wklejenie treści ręcznie.

---

## Konfiguracja

Pełna lista zmiennych w [`.env.example`](./.env.example). Minimum do uruchomienia:

```env
GEMINI_API_KEY=...              # wymagany
GEMINI_MODEL=gemini-2.5-flash-lite
PORT=3000
BACKEND_MODE=local              # cloud = trasy kont po stronie serwera
ALLOWED_ORIGINS=                # puste = tylko to samo pochodzenie, nigdy gwiazdka
TRUST_PROXY=false               # true WYŁĄCZNIE za reverse proxy (na Cloud Run: true)
```

Do logowania wystarczą `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` — zmienne
z prefiksem `VITE_` są **wbudowywane w pakiet podczas budowania**, a nie
odczytywane w czasie działania. `BACKEND_MODE=cloud` dokłada `SUPABASE_URL`
i `SUPABASE_SERVICE_ROLE_KEY`; serwer nie wystartuje bez nich.

⚠️ Subskrypcja „Google AI Pro" **nie obejmuje** Gemini API — potrzebny jest osobny
projekt Google Cloud z płatnym rozliczaniem. Darmowy tier API wykorzystuje
przesłane dane do trenowania modeli, co przy CV dyskwalifikuje go dla produktu
komercyjnego. Instrukcja krok po kroku: [`docs/SETUP.md`](./docs/SETUP.md).

---

## Wdrożenie

Jeden obraz kontenera (`Dockerfile`) na Google Cloud Run — serwuje frontend i API
pod jednym adresem. Komplet komend, sekretów i weryfikacji:
[`docs/BACKEND-ROADMAP.md`](./docs/BACKEND-ROADMAP.md).

Koszt przy skalowaniu do zera i Supabase Free: **0 zł do pierwszego płacącego
klienta**. Od pierwszej płatności Supabase Pro przestaje być opcjonalne — plan
Free nie ma kopii zapasowych, a te wymaga art. 32 RODO.

⚠️ Wystawiając usługę publicznie, ogranicz liczbę instancji (`--max-instances`)
i ustaw budżet z alertami — inaczej wywołania modelu opłaca Twoja karta. Trasy
sięgające modelu wymagają zalogowania i mają limit kwotowy w bazie, ale limiter
adresów IP jest liczony per instancja procesu.

---

## Testy i CI

`npm test` uruchamia zestaw pokrywający m.in. tablicę złośliwych adresów URL
(metadane chmury, adresy w zapisie ósemkowym, IPv4-mapped IPv6), parser
`robots.txt`, pseudonimizację na granicy modelu, kontrakt danych ogłoszenia,
politykę haseł i rozstrzyganie konfliktu CV przy pierwszym logowaniu.

CI sprawdza typy, testy, build, **uruchamia zbudowany serwer i odpytuje
`/api/health`** oraz buduje obraz kontenera. Ten przedostatni krok istnieje
dlatego, że raz już się zdarzyło, że aplikacja kompilowała się czysto
i nie startowała.

Trzy kroki pilnują granic, których nie widać w testach jednostkowych:

- **granica uwierzytelnienia** — serwer podnoszony z `BACKEND_MODE=cloud`,
  a `/api/me`, `/api/vault` i `/api/applications` bez tokenu muszą zwrócić `401`.
  Gdyby `requireAuth` kiedykolwiek przepuścił żądanie bez nagłówka
  `Authorization`, te trasy wystawiłyby cudze dane;
- **sekrety poza pakietem** — `grep` po `dist/client/` za `service_role`
  i kluczami Stripe'a. Klucz `service_role` omija całe RLS, więc w pakiecie
  przeglądarki oznaczałby pełny dostęp do bazy dla każdego odwiedzającego;
- **limity plików reguł** — Antigravity przycina plik reguł powyżej 12 000 znaków
  i nie zgłasza tego błędem, więc kontrakt urywałby się w połowie.

`npm run test:rls` sprawdza polityki bazy na żywym projekcie: zakłada dwa konta
i potwierdza, że jedno nie widzi danych drugiego. **Nie jest uruchamiany w CI** —
wymaga prawdziwych kluczy, więc odpalasz go ręcznie przed wdrożeniem.

---

## Dokumentacja

| Plik | Odpowiada na pytanie |
|---|---|
| [`docs/o-projekcie.md`](./docs/o-projekcie.md) | Czym to jest, na jedną stronę |
| [`AGENTS.md`](./AGENTS.md) | Jak pisać kod, żeby pasował do tego repozytorium |
| [`SECURITY.md`](./SECURITY.md) | Co jest, a co **nie** jest zabezpieczone dzisiaj |
| [`docs/SETUP.md`](./docs/SETUP.md) | Jakie konta założyć i skąd wziąć klucze |
| [`docs/BACKEND-ROADMAP.md`](./docs/BACKEND-ROADMAP.md) | Co wpisać w terminal, żeby wdrożyć |
| [`NOTATKI.md`](./NOTATKI.md) | Co zauważone, ale jeszcze nienaprawione |

---

## Licencja

Nie ustalona — repozytorium nie zawiera pliku `LICENSE`. Do uzupełnienia przed
publicznym udostępnieniem kodu.

Fonty Geist i Geist Mono: SIL Open Font License 1.1.
