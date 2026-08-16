# Polityka bezpieczeństwa

## Zasada tego dokumentu

**Nie ma tu żadnego twierdzenia, którego nie da się wskazać palcem w kodzie.**

Poprzednia wersja tego pliku deklarowała model „Zero-Knowledge, Client-Side Encryption (AES-256-GCM z PBKDF2, 600 000 iteracji)" i dane „encrypted at all times". Żadne z tych zdań nie było prawdziwe dla ścieżki, która faktycznie się wykonywała. Deklarowanie ochrony, której nie ma, przy danych osobowych jest gorsze niż milczenie — użytkownik podejmuje wtedy decyzje na fałszywej przesłance.

Dokument opisuje stan na dziś. Sekcja „Znane ograniczenia" jest jego obowiązkową częścią i nie zniknie, gdy zrobi się niewygodna — będzie się skracać w miarę, jak kolejne pozycje faktycznie znikną z kodu.

---

## Stan obecny: prototyp działający w przeglądarce

CVELOCITY nie ma jeszcze backendu z bazą danych ani kont użytkowników. Cała praca odbywa się lokalnie, poza wyraźnie wskazanymi wywołaniami AI.

### Co jest chronione i gdzie to sprawdzić

| Kontrola | Gdzie w kodzie |
|---|---|
| **Klucz Gemini wyłącznie po stronie serwera** — nigdy nie trafia do przeglądarki ani do repozytorium | `src/server/config.ts`, `src/server/geminiClient.ts`; `.env` w `.gitignore` |
| **Ochrona przed SSRF** przy pobieraniu ogłoszeń z URL: walidacja adresu, blokada zakresów prywatnych, loopback, link-local (w tym metadanych chmury `169.254.169.254`) i CGNAT, **przypięcie zwalidowanego IP** (bez tego walidacja DNS jest podatna na rebinding), rewalidacja każdego przekierowania, timeout 8 s, limit 2 MB | `src/server/net/ipGuard.ts`, `src/server/net/safeFetch.ts` + testy |
| **Endpoint nie zwraca surowej treści pobranej strony** — wyłącznie wyekstrahowane pola. Degraduje ewentualny SSRF do „blind" | `src/server/routes/jobs.routes.ts` |
| **Allowlista CORS** z `Vary: Origin` zamiast gwiazdki | `server.ts` |
| **Nagłówki bezpieczeństwa** (helmet + jawne CSP, `X-Frame-Options: DENY`, wyłączony `x-powered-by`) | `server.ts`; dla frontendu `vercel.json` |
| **Limity zapytań** osobne dla endpointów AI i pobierania URL-i | `src/server/middleware/rateLimiter.ts` |
| **Błędy nie wyciekają na zewnątrz** — klient dostaje identyfikator żądania, pełny błąd zostaje w logach serwera | `src/server/middleware/errorHandler.ts` |
| **Walidacja konfiguracji przy starcie** — brak wymaganego klucza przerywa uruchomienie, zamiast ujawniać się błędem przy pierwszym żądaniu | `src/server/config.ts` |
| **Kontener nie działa jako root** | `Dockerfile` |
| **Ocena ATS i parsowanie CV liczą się lokalnie** — te funkcje nie wysyłają dokumentu nigdzie | `src/lib/atsSimulator.ts`, `src/lib/cvUniversalParser.ts` |

### Znane ograniczenia

To są rzeczy, które **nie** są chronione. Każda jest świadoma i każda ma przypisaną fazę naprawy.

1. **Nie ma uwierzytelniania.** „Profil" to wpis w `localStorage` tej przeglądarki — bez hasła, bez konta, bez serwera (`src/lib/localProfile.ts`). Interfejs mówi to użytkownikowi wprost przy zakładaniu profilu. Prawdziwe logowanie wchodzi razem z Supabase Auth.

2. **Dane są zapisywane czystym tekstem.** CV i profil leżą w `localStorage` bez szyfrowania. Wcześniejsza wersja zapisywała obok kopię „zaszyfrowaną" kluczem `'default_key'` zaszytym w kodzie aplikacji — przy modelu zagrożeń „XSS czyta `localStorage`" nie chroni to przed niczym, bo atakujący wykonujący skrypt na stronie odczyta ten klucz z tego samego pakietu. Usunęliśmy pozorne szyfrowanie zamiast utrzymywać wrażenie ochrony. Realne szyfrowanie w spoczynku (kopertowe, z kluczem poza bazą) przychodzi razem z przeniesieniem danych na serwer.

3. **Endpointy API nie wymagają uwierzytelnienia.** Dlatego funkcje AI bez ekranu w interfejsie zostały **zdjęte** z serwera — nieużywany endpoint wołający model to otwarte proxy opłacane przez właściciela projektu. Działa wyłącznie to, co ma odpowiednik w UI. Wystawiając usługę publicznie, ogranicz liczbę instancji i ustaw budżet z alertami u dostawcy.

4. **Treść CV trafia do Google Gemini** przy funkcjach AI. Dane nie są jeszcze pseudonimizowane przed wysłaniem — usunięcie danych identyfikujących na granicy modelu jest zaplanowane i nie zostało wdrożone. **Do tego czasu nie wgrywaj do aplikacji prawdziwych danych osobowych innych osób.**

5. **Status subskrypcji jest zapisywalny po stronie klienta.** Trzyma go `localStorage`, więc nie stanowi kontroli dostępu — jest wyłącznie etykietą w interfejsie. Uprawnienia będą liczone w bazie danych.

6. **Brak kopii zapasowych i odtwarzania.** Wyczyszczenie danych przeglądarki kasuje wszystko bezpowrotnie.

---

## Zgłaszanie podatności

Jeśli znajdziesz podatność (np. wektor XSS, obejście walidacji adresów, wyciek danych), **nie zakładaj publicznego zgłoszenia w GitHubie**.

* **Kontakt:** Adrian Koziński
* **E-mail:** `krymszuch00@outlook.com`
* **Temat:** `[SECURITY] CVELOCITY — <krótki opis>`

### Co warto dołączyć

1. Opis podatności i jej możliwego wpływu.
2. Kroki odtworzenia lub proof of concept.
3. Wskazanie komponentu, pliku lub endpointu.
4. Propozycję naprawy, jeśli ją masz.

### Czego możesz się spodziewać

Projekt prowadzi jedna osoba, więc terminy są realistyczne, a nie korporacyjne:

1. **Potwierdzenie odbioru** — do 72 godzin.
2. **Wstępna ocena** — do 14 dni.
3. **Naprawa** — zależnie od wagi; przy poważnych podatnościach priorytetowo, przy pozostałych w kolejnym cyklu prac. Poinformuję Cię o terminie po ocenie.
4. **Ujawnienie** — po wdrożeniu poprawki, z podziękowaniem dla zgłaszającego, jeśli wyrazi na to zgodę.

Powyższe to deklaracja dobrej woli, nie umowa SLA.

### Zasady odpowiedzialnego ujawniania

* Daj czas na naprawę przed publicznym ujawnieniem.
* Nie uzyskuj dostępu do cudzych danych, nie modyfikuj ich i nie niszcz.
* Nie zakłócaj działania usługi.

---

## Wersje objęte wsparciem

| Wersja | Wsparcie | Uwagi |
|---|---|---|
| `main` | ✅ | Aktywnie rozwijana; prototyp przed pierwszym wydaniem produkcyjnym |
| < 1.0 | ❌ | Wersje rozwojowe, bez wsparcia |
