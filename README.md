# SkillVault ⚡

**SkillVault** to zaawansowany, niezależny system automatyzacji CV, generowania listów motywacyjnych oraz symulacji audytów ATS (Applicant Tracking Systems). 

Aplikacja oferuje bez-tokenowy silnik lokalnej podmiany fraz (**0-Token Local Slot Filling**) połączony z ultrawydajnym modelem **Gemini 3.6 Flash** do szybkiej analizy i dopasowywania aplikacji pod oferty pracy.

---

## 🚀 Kluczowe Funkcjonalności

- **Dopasowanie do Ofert (URL Job Scraper)**: Automatyczne pobieranie i czyszczenie szumu ze stron ogłoszeń o pracę (np. Pracuj.pl, NoFluffJobs, JustJoin.it, LinkedIn, OLX).
- **Tryb Word & Track Changes**: Ręczna edycja treści na żywym arkuszu A4 z propozycjami podmian wyrazów i slangu w czasie rzeczywistym.
- **Audytor Symulatora ATS**: 3-warstwowa weryfikacja lematyczna, algebraiczna ocena świeżości (*Recency Bias*) oraz analiza zagęszczenia słów kluczowych.
- **Generator Listów Motywacyjnych (Anti-Template)**: 3-sekcyjne biznesowe listy (Hook, Proof, CTA) tworzone lokalnie z profilu CV (0 tokenów) lub przez model **Gemini Flash**.
- **Doradca Gemini AI 💡**: Edukacyjne okienko samouczka tlumaczące powody zmian słownictwa i zasady ATS.
- **Lokalny Master Vault**: Dane profilu zostają w Twojej przeglądarce i nigdy nie trafiają na serwer, z obsługą kont użytkowników. ⚠️ Zapis w `localStorage` jest **nieszyfrowany** — patrz „Bezpieczeństwo danych" poniżej.

---

## 🛠️ Wymagania i Instalacja

### 1. Klonowanie Repozytorium
```bash
git clone https://github.com/twoj-login/skillvault.git
cd skillvault
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

Zawartość pliku `.env`:
```env
# Klucz API Google Gemini (Wymagany)
GEMINI_API_KEY=twoj_klucz_gemini

# Firebase (Wymagane do logowania Google + kont użytkowników)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```
Pełną listę zmiennych Firebase znajdziesz w `.env.example`.

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

W aplikacji skonfigurowano 2 równoległe ścieżki autentykacji, plus opcjonalne 2FA:

1. **Rejestracja/Logowanie E-mail & Hasło**:
   - Hasła są bezpiecznie hashowane za pomocą algorytmu PBKDF2 z solą (przy użyciu biblioteki CryptoJS). Każdy nowy użytkownik startuje z czystą bazą (bez placeholderów).
2. **Google OAuth (Firebase Auth)**:
   - Logowanie przez Firebase Identity (popup Google). Wymaga zmiennych `VITE_FIREBASE_*`.
3. **TOTP 2FA (opcjonalne)**:
   - Weryfikacja dwuetapowa kompatybilna z aplikacjami typu Google Authenticator/Authy (`otpauth` + QR kod), obsługiwana w pełni po stronie klienta.

---

## 🌐 Integracja jako Aplikacja Podrzędna w Portfolio

Jeśli dodajesz `SkillVault` do swojego głównego serwisu portfolio:

### Opcja A: Podpięcie w IFRAME lub Subdomenie
1. Wdrożenie `SkillVault` na osobnej usłudze (np. Render / Cloud Run / Vercel / Railway).
2. Wklejenie komponentu `<iframe>` w swoim głównym portfolio:
   ```html
   <iframe src="https://skillvault.twojadomena.pl" width="100%" height="800px" style="border:none;"></iframe>
   ```

### Opcja B: Przycisk / Link w Portfolio z automatycznym przekierowaniem
Przekieruj rekrutera bezpośrednio ze swojego portfolio do aplikacji `SkillVault` z parametrem demo lub z własnym profilowanym CV.

---

## 🌐 Wdrożenie (Deployment)

Aplikacja SkillVault została zaprojektowana z jasnym podziałem na część frontendową (SPA) oraz backendową (Express API), które są wdrażane jako dwa osobne środowiska:

1. **Frontend (SPA)**:
   - Hostowany na platformie **Firebase Hosting** (zgodnie z konfiguracją w `firebase.json` i workflow `.github/workflows/deploy-frontend.yml`).
   - Wdrożenie odbywa się automatycznie po każdym pushu do gałęzi `main`. Podczas budowania frontendu zmienna `VITE_API_BASE_URL` musi wskazywać na serwer API na platformie Render.

2. **Backend API**:
   - Hostowany na platformie **Render** (jako usługa Web Service, zgodnie z konfiguracją w `render.yaml`).
   - Podczas budowania na platformie Render kompilowany jest wyłącznie serwer Express (`npm run build:server`), a proces startuje z polecenia `npm run start`.
   - Na serwerze Render nie jest serwowany front (brak fallbacku do `index.html`), co zapewnia bezpieczeństwo przed przypadkowym serwowaniem błędnego kodu HTML pod ścieżkami API.
   - Wdrożenie wykorzystuje mechanizm keep-alive realizowany przez GitHub Actions (`.github/workflows/keepalive.yml`), który regularnie odpytuje endpoint `/api/health` w dni robocze, aby zapobiec usypianiu darmowej instancji na Renderze.

---

## ⚙️ CI/CD Pipeline

W repozytorium znajdują się automatyczne przepływy pracy (Workflows) w katalogu `.github/workflows/`:
- **CI Pipeline (`ci.yml`)**: Wyzwalany przy każdym `push` i `pull_request` na gałęziach `main` i `master`. Sprawdza typowanie TypeScript (`npm run lint`), uruchamia testy jednostkowe (`npm test`) i testuje poprawność budowania aplikacji produkcyjnej (`npm run build`).
- **Wdrożenie Frontendu (`deploy-frontend.yml`)**: Buduje wyłącznie klienta (`npm run build:client`) i publikuje go w Firebase Hosting po udanej integracji na gałęzi `main`.
- **Utrzymanie aktywności API (`keepalive.yml`)**: Cyklicznie odpytuje endpoint `/api/health` na Renderze, aby zapobiec cold startom w godzinach pracy.

---

## 🔒 Bezpieczeństwo danych

Bądźmy precyzyjni, bo wcześniejsze wersje tego pliku obiecywały więcej, niż kod robił:

- **Dane profilu NIE są szyfrowane.** Master Vault trafia do `localStorage` przeglądarki jako zwykły JSON. Każdy z dostępem do tego komputera i profilu przeglądarki może go odczytać.
- **Dane nie opuszczają przeglądarki** — poza treścią, którą sam wysyłasz do API Gemini w celu analizy (parsowanie CV, generowanie listu).
- Hasła kont są solone i hashowane (PBKDF2), a 2FA (TOTP) działa niezależnie od wybranej metody logowania.

Historycznie plik `vaultCrypto.ts` deklarował „zero-knowledge AES-256", ale funkcja szyfrująca ignorowała podane hasło i zapisywała jawny tekst. Atrapy zostały usunięte zamiast utrwalać nieprawdziwą deklarację. Prawdziwe szyfrowanie wymagałoby klucza wyprowadzanego z hasła użytkownika — klucz zaszyty w bundlu JS niczego nie chroni.

---

## 📄 Licencja
MIT © 2026 SkillVault