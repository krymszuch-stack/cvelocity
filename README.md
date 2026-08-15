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

Zawartość pliku `.env`:
```env
# Klucz API Google Gemini (Wymagany)
GEMINI_API_KEY=twoj_klucz_gemini

# Google OAuth (Opcjonalnie)
VITE_GOOGLE_CLIENT_ID=twoj_google_client_id
GOOGLE_CLIENT_SECRET=twoj_google_client_secret

# Azure Entra ID / Microsoft OAuth (Opcjonalnie)
VITE_AZURE_CLIENT_ID=twoj_azure_client_id
VITE_AZURE_TENANT_ID=common
AZURE_CLIENT_SECRET=twoj_azure_client_secret
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

W aplikacji skonfigurowano 3 równoległe ścieżki autentykacji:

1. **Rejestracja/Logowanie E-mail & Hasło**:
   - Wykorzystuje natywne szyfrowanie **AES-256** (CryptoJS) dla danych użytkownika. Każdy nowy użytkownik startuje z czystą bazą (bez placeholderów).
2. **Google OAuth 2.0**:
   - Integracja z Google Identity Services. Token ID jest weryfikowany backendowo.
3. **Microsoft Azure Entra ID**:
   - Integracja z MSAL (`@azure/msal-browser` i `@azure/msal-node`).

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