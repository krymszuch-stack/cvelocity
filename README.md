# CVELOCITY ⚡

Narzędzie do sprawdzania, czy Twoje CV przejdzie przez polski system ATS — i do dopasowania go do konkretnego ogłoszenia.

**Ocena ATS liczy się w przeglądarce.** Twoje CV nie jest nigdzie wysyłane: ani na nasz serwer, ani do modelu językowego. Do AI trafia wyłącznie treść ogłoszenia, które sam wskażesz, i to po usunięciu z niej danych kontaktowych.

> **Status: prototyp przed pierwszym wydaniem produkcyjnym.** Nie ma jeszcze kont użytkowników ani bazy danych — profil zapisuje się w przeglądarce. Pełna, uczciwa lista tego, co **nie** jest zabezpieczone, znajduje się w [`SECURITY.md`](./SECURITY.md).

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
Przeglądarka (React 19 + Vite)          Serwer (Express na Node 22)
├─ ocena ATS            ← lokalnie      ├─ /api/fetch-jd-url  → pobranie ogłoszenia
├─ parsowanie CV        ← lokalnie      ├─ /api/parse-jd      → analiza przez Gemini
├─ edytor i eksport     ← lokalnie      └─ /api/usage/stats   → zużycie tokenów
└─ profil w localStorage
```

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
ALLOWED_ORIGINS=                # puste = tylko to samo pochodzenie, nigdy gwiazdka
TRUST_PROXY=false               # true WYŁĄCZNIE za reverse proxy
```

⚠️ Subskrypcja „Google AI Pro" **nie obejmuje** Gemini API — potrzebny jest osobny projekt Google Cloud z płatnym rozliczaniem. Darmowy tier API wykorzystuje przesłane dane do trenowania modeli, co przy CV dyskwalifikuje go dla produktu komercyjnego. Instrukcja krok po kroku: [`docs/SETUP.md`](./docs/SETUP.md).

---

## Wdrożenie

Frontend to statyczny build (Vercel lub dowolny CDN), backend to kontener (`Dockerfile`, przeznaczony na Google Cloud Run). Łączy je `VITE_API_URL` po stronie frontendu i `ALLOWED_ORIGINS` po stronie serwera.

⚠️ Endpointy nie wymagają jeszcze uwierzytelnienia. Wystawiając usługę publicznie, ogranicz liczbę instancji i ustaw budżet z alertami u dostawcy — inaczej wywołania modelu opłaca Twoja karta.

---

## Testy i CI

`npm test` uruchamia zestaw pokrywający m.in. tablicę złośliwych adresów URL (metadane chmury, adresy w zapisie ósemkowym, IPv4-mapped IPv6), parser `robots.txt`, pseudonimizację na granicy modelu i kontrakt danych ogłoszenia.

CI sprawdza typy, testy, build, **uruchamia zbudowany serwer i odpytuje `/api/health`** oraz buduje obraz kontenera. Ten przedostatni krok istnieje dlatego, że raz już się zdarzyło, że aplikacja kompilowała się czysto i nie startowała.

---

## Licencja

Nie ustalona — repozytorium nie zawiera pliku `LICENSE`. Do uzupełnienia przed publicznym udostępnieniem kodu.

Fonty Geist i Geist Mono: SIL Open Font License 1.1.
