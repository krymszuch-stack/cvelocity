# CVelocity ⚡

**CVelocity** to zaawansowany, niezależny system automatyzacji CV, generowania listów motywacyjnych oraz symulacji audytów ATS (Applicant Tracking Systems). 

Aplikacja oferuje bez-tokenowy silnik lokalnej podmiany fraz (**0-Token Local Slot Filling**) połączony z ultrawydajnym modelem **Gemini 3.6 Flash** do szybkiej analizy i dopasowywania aplikacji pod oferty pracy.

---

## 🚀 Kluczowe Funkcjonalności

- **Dopasowanie do Ofert (URL Job Scraper)**: Automatyczne pobieranie i czyszczenie szumu ze stron ogłoszeń o pracę (np. Pracuj.pl, NoFluffJobs, JustJoin.it, LinkedIn, OLX).
- **Tryb Word & Track Changes**: Ręczna edycja treści na żywym arkuszu A4 z propozycjami podmian wyrazów i slangu w czasie rzeczywistym.
- **Audytor Symulatora ATS**: 3-warstwowa weryfikacja lematyczna, algebraiczna ocena świeżości (*Recency Bias*) oraz analiza zagęszczenia słów kluczowych.
- **Generator Listów Motywacyjnych (Anti-Template)**: 3-sekcyjne biznesowe listy (Hook, Proof, CTA) tworzone lokalnie z profilu CV (0 tokenów) lub przez model **Gemini Flash**.
- **Doradca Gemini AI 💡**: Edukacyjne okienko samouczka tlumaczące powody zmian słownictwa i zasady ATS.
- **Szyfrowany Master Vault**: Bezpieczne przechowywanie danych profilu lokalnie w przeglądarce (AES-256) z obsługą kont użytkowników.

---

## 🛠️ Wymagania i Instalacja

### 1. Klonowanie Repozytorium
```bash
git clone https://github.com/krymszuch-stack/cvelocity.git
cd cvelocity
```

### 2. Instalacja Zależności
```bash
npm install
```

### 3. Konfiguracja Zmiennych Środowiskowych (`.env`)
Skopiuj plik `.env.example` do `.env` i uzupełnij klucze API:
```bash
cp .env.example .env
```

Zawartość pliku `.env` — pełna lista zmiennych znajduje się w `.env.example`:
```env
# Klucz API Google Gemini (Wymagany — bez niego wszystkie funkcje AI zwracają błąd)
GEMINI_API_KEY=twoj_klucz_gemini

# Logowanie Google przez Firebase Authentication (Opcjonalnie)
VITE_FIREBASE_API_KEY=twoj_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=twoj-projekt.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=twoj-projekt
```

---

## 💻 Uruchamianie

- **Tryb Deweloperski**:
  ```bash
  npm run dev
  ```
  Aplikacja wystartuje na `http://localhost:3000`.

- **Kompilacja Produkcyjna**:
  ```bash
  npm run build
  ```

- **Uruchomienie Produkcyjne**:
  ```bash
  npm start
  ```

---

## 🔑 Integracja OAuth & Logowanie

W aplikacji dostępne są 2 ścieżki autentykacji:

1. **Rejestracja/Logowanie E-mail & Hasło**:
   - Konta przechowywane lokalnie w przeglądarce (`localStorage`), hasła hashowane PBKDF2 (CryptoJS). Każdy nowy użytkownik startuje z czystym profilem, bez danych przykładowych.
2. **Google OAuth 2.0 (Firebase Authentication)**:
   - Wymaga skonfigurowania zmiennych `VITE_FIREBASE_*`. Bez nich dostępne jest wyłącznie logowanie e-mail/hasło.

> **Uwaga:** obecna warstwa uwierzytelniania działa w całości po stronie przeglądarki i nie zapewnia synchronizacji między urządzeniami ani weryfikacji serwerowej. Migracja na Supabase Auth (realne sesje serwerowe, baza Postgres) jest w trakcie — patrz plan przebudowy.

---

## 🌐 Integracja jako Aplikacja Podrzędna w Portfolio

Jeśli dodajesz `CVelocity` do swojego głównego serwisu portfolio:

### Opcja A: Podpięcie w IFRAME lub Subdomenie
1. Wdrożenie `CVelocity` na osobnej usłudze (np. Render / Cloud Run / Vercel / Railway).
2. Wklejenie komponentu `<iframe>` w swoim głównym portfolio:
   ```html
   <iframe src="https://cvelocity.twojadomena.pl" width="100%" height="800px" style="border:none;"></iframe>
   ```

### Opcja B: Przycisk / Link w Portfolio z automatycznym przekierowaniem
Przekieruj rekrutera bezpośrednio ze swojego portfolio do aplikacji `CVelocity` z parametrem demo lub z własnym profilowanym CV.

---

## ⚙️ CI/CD Pipeline

W repozytorium znajduje się automatyczny workflow GitHub Actions w `.github/workflows/ci.yml`, który przy każdym `push` i `pull_request` sprawdza typowanie TypeScript (`npm run lint`) oraz buduje aplikację produkcyjną (`npm run build`).

---

## 📄 Licencja
MIT © 2026 CVelocity