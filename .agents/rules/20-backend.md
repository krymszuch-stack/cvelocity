---
trigger: glob
globs: src/server/**/*.ts, server.ts
---

# Backend

Kanon: **@../../AGENTS.md**. Poniżej tylko to, co dotyczy serwera.

## Granica danych osobowych

Wszystko, co idzie do modelu, przechodzi przez `src/server/pseudonymize.ts`:

```
stripSensitiveFields(vault)   // photoUrl znika całkowicie — art. 9 RODO
identifyingValues(vault)      // imię, nazwisko, miasto — regexp ich nie złapie
pseudonymize(tekst, names)    // → [KANDYDAT], [EMAIL], [TELEFON]
assertNoPii(prompt)           // ostatnia bramka przed wysłaniem
rehydrate(wynik, map)         // użytkownik dostaje swoje dane z powrotem
```

Dowodem, że granica działa, jest `src/server/__tests__/geminiBoundary.test.ts` —
podstawia atrapę klienta i ogląda **ładunek faktycznie wysłany**. Test samej
funkcji `pseudonymize` niczego by nie dowiódł: sprawdzałby, że funkcja działa, a
nie że ktokolwiek jej używa. Dodając ścieżkę do modelu, dopisz ją do tego testu.

Wzorzec do skopiowania: `generateCoverLetterWithFlash` i
`generateInterviewCheatSheetEnrichmentWithFlash` w `src/server/gemini.ts`.

## Każde płatne wywołanie za uwierzytelnieniem i licznikiem

Trasa wołająca model idzie przez `requireAuth`, `aiEndpointsLimiter`
i `executeAiOperation` z `src/server/quota.ts`. Wzorzec: `src/server/routes/ai.routes.ts`.
Wywołanie modelu bez licznika to koszt, którego nikt nie widzi, dopóki nie
przyjdzie rachunek.

Model wołaj przez `generateWithUsage` z `geminiClient.ts`, nie przez klienta
wprost — inaczej zużycie tokenów nie trafi do ewidencji.

## Kształt odpowiedzi i tożsamość

- Odpowiedź serwera zawsze `{ success, error, requestId }` —
  `src/server/middleware/errorHandler.ts`.
- **`user_id` bierze się z tokenu, nigdy z ciała żądania.** Klient `service_role`
  omija RLS, więc pole z żądania pozwoliłoby nadpisać cudze dane
  (`src/server/routes/vault.routes.ts:36`).
- Ruch wychodzący wyłącznie przez `src/server/net/safeFetch.ts` — ma kontrolę
  SSRF, przekierowań i `robots.txt`.

Bezpieczeństwo i szyfrowanie są na czerwonej liście delegowania: testy wolno
dopisywać, zmiany zachowania wymagają decyzji właściciela repo.
