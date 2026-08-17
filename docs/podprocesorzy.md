# Lista podprocesorów

> **Status: szkic do przeglądu prawnego.** Dokument opisuje stan faktyczny kodu na dzień ostatniej aktualizacji. Przed publikacją wymaga weryfikacji przez prawnika — zwłaszcza w zakresie podstaw przekazywania danych poza EOG.

**Administrator danych:** Adrian Koziński (dane rejestrowe do uzupełnienia po założeniu działalności)
**Kontakt:** `krymszuch00@outlook.com`

---

## Podprocesorzy aktywni

Podmioty, które **dziś** faktycznie przetwarzają dane w związku z działaniem aplikacji.

| Podmiot | Rola | Jakie dane | Lokalizacja przetwarzania | Podstawa transferu |
|---|---|---|---|---|
| **Google (Gemini API)** | Analiza treści ogłoszeń o pracę | Treść ogłoszenia wskazanego przez użytkownika. **Nie CV** — patrz uwaga niżej. Dane identyfikujące są pseudonimizowane przed wysłaniem | USA / globalnie | Do ustalenia: SCC albo DPF |

**Uwaga o zakresie:** funkcje przetwarzające profil kandydata (list motywacyjny, przeformułowanie punktorów, doradca) **nie są dziś wystawione** jako endpointy. Jedyną trasą sięgającą modelu jest `POST /api/parse-jd`, która otrzymuje treść ogłoszenia o pracę. Weryfikowalne w kodzie: `src/server/routes/ai.routes.ts`.

---

## Podprocesorzy planowani

Podmioty, które wejdą wraz z kolejnymi etapami. **Nie przetwarzają jeszcze żadnych danych.**

| Podmiot | Rola | Kiedy | Lokalizacja |
|---|---|---|---|
| **Supabase** | Baza danych i uwierzytelnianie | Wraz z wprowadzeniem kont użytkowników | Frankfurt (EOG) |
| **Google Cloud Run** | Hosting API | Wraz z wdrożeniem backendu | `europe-central2` (Warszawa) lub `europe-west1` |
| **Vercel** | Hosting frontendu (pliki statyczne) | Wraz z wdrożeniem publicznym | CDN globalny; treść statyczna, bez danych osobowych |
| **Stripe** | Obsługa płatności | Wraz z uruchomieniem płatności | Irlandia / USA |
| **Dostawca poczty transakcyjnej** | Potwierdzenia rejestracji, reset hasła | Wraz z kontami użytkowników | Do wyboru — preferowany podmiot z EOG |

---

## Podmioty usunięte

| Podmiot | Kiedy i dlaczego |
|---|---|
| **Firebase (Google)** | Usunięty w całości. Był skonfigurowany w kodzie, ale **nigdy nie przetwarzał żadnych danych** — funkcja logowania przez Google nie miała ani jednego wywołania. Usunięto pliki konfiguracyjne, zależność i zmienne środowiskowe, żeby nie figurował jako podprocesor, którym nie był |
| **Google Fonts** | Usunięty. Aplikacja ładowała fonty z `fonts.googleapis.com` i `fonts.gstatic.com`, przez co przeglądarka **każdego odwiedzającego wysyłała swój adres IP do Google** przed jakąkolwiek interakcją — to znany problem pod RODO. Fonty są teraz hostowane lokalnie (`public/fonts`), a dyrektywa CSP `font-src` została zawężona do `'self'` |

---

## Gdzie dane NIE trafiają

Wymienione wprost, bo cisza w tej sprawie bywa myląca:

- **Ocena ATS i parsowanie CV liczą się w przeglądarce.** Dokument nie opuszcza urządzenia — `src/lib/atsSimulator.ts`, `src/lib/cvUniversalParser.ts`.
- **Profil i CV są zapisywane wyłącznie lokalnie**, w `localStorage` przeglądarki. Nie ma serwera, na który byłyby wysyłane — `src/lib/localProfile.ts`.
- **Nie ma analityki, reklam ani śledzenia.** Żaden skrypt firm trzecich nie jest ładowany.
- **Zdjęcie z CV (`photoUrl`) nie jest wysyłane do modelu w żadnej postaci** — usuwane przed wywołaniem, nie zastępowane symbolem. Wizerunek to dane szczególnej kategorii (art. 9 RODO) — `src/server/pseudonymize.ts`.

---

## Zasady zmiany listy

1. Nowy podprocesor trafia na tę listę **przed** pierwszym przetworzeniem danych, nie po.
2. Podmiot, z którym nie ma podpisanej umowy powierzenia, nie może przetwarzać danych użytkowników.
3. Wpis usuwamy dopiero wtedy, gdy podmiot faktycznie przestał mieć dostęp do danych — nie w momencie wyłączenia funkcji.

## Do uzupełnienia przed publikacją

- [ ] Dane rejestrowe administratora (NIP, adres) po założeniu działalności
- [ ] Umowy powierzenia (DPA) z każdym aktywnym podprocesorem
- [ ] Ustalenie i udokumentowanie podstawy transferu do USA dla Google
- [ ] Przegląd prawnika
