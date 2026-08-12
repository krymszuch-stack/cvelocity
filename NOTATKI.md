# Spostrzeżenia i notatki

> Notatnik roboczy: Adrian ↔ Claude.
>
> **Adrian** dopisuje uwagi w sekcji „🆕 Nowe" — jednym punktem `-`, bez żadnej dodatkowej składni.
> **Claude** przed każdą pracą nad repo czyta „🆕 Nowe", a po wykonaniu uwagi przenosi ją
> do „✅ Załatwione", przekreśla i dopisuje pod spodem krótkie podsumowanie.
>
> Zasady dla agentów opisane są w `AGENTS.md` §0.

---

## 🆕 Nowe

<!-- Dopisuj tutaj. Jeden punkt = jedna uwaga. -->

---

## ✅ Załatwione

<!--
Format wpisu:

- ~~Treść uwagi~~
  - **Claude 2026-08-12:** co zostało zrobione albo dlaczego zdecydowano inaczej. PR #NN.
-->

- ~~Import CV / preparse AI nie zachowywał rzeczywistych stanowisk i uczelni~~
  - **Claude 2026-08-12:** usunięto placeholdery z `src/lib/cvUniversalParser.ts`, dodano bezpieczny fallback lokalnego parsera w `src/server/gemini.ts` i test regresyjny z realnym CV. Weryfikacja: `npm run lint`, `npm test`, `npm run build`. PR #TBD.

- ~~Scraper ofert z URL nie działał na portalach typu OLX / Pracuj.pl / inne job boardy~~
  - **Claude 2026-08-12:** poprawiłem kolejność pobierania treści oferty, usunąłem błędne proxy i zachowałem bezpieczny fallback do surowego HTML/text; pipeline używa teraz czytelnego tekstu oferty zamiast kruchych extractorów na pojedynczym źródle. Weryfikacja: `npm run lint`, `npm test`, `npm run build`. PR #TBD.

- ~~Statystyki oszczędności tokenów były zbyt szacunkowe i nie odzwierciedlały realnej aktywności API~~
  - **Claude 2026-08-12:** usunięto sztuczne wartości startowe, dodano live synchronizację z rzeczywistych metryk Gemini z `usageMetadata` przez endpoint `/api/usage/stats`, a widget statystyk odświeża dane co 5 sekund. Weryfikacja: `npm run lint`, `npm test`, `npm run build`. PR #TBD.

- ~~Konta użytkowników i vault żyły wyłącznie w localStorage — aplikacja nie działała między urządzeniami/przeglądarkami, co czyniło ją de facto bezużyteczną~~
  - **Claude 2026-08-12:** zastąpiono domową bazę kont (`lib/auth.ts`, PBKDF2 + localStorage) prawdziwym Firebase Auth (email/hasło + Google), a vault przeniesiono do Firestore (`vaults/{uid}`, `lib/firestoreVault.ts`) z regułami bezpieczeństwa (`firestore.rules`) ograniczającymi dostęp do własnego uid. Aplikacja wymaga teraz zalogowania — usunięto tryb gościa i lokalny fallback. Stare dane z localStorage migrowane jednorazowo po pierwszym logowaniu (`lib/legacyVaultMigration.ts`, dopasowanie po adresie e-mail). Usunięto niestandardowe 2FA (TOTP) — do odzyskania z historii gita, jeśli ma wrócić przez Firebase Multi-Factor Auth. Usunięte pliki: `lib/auth.ts`, `lib/vaultCrypto.ts`, `lib/twoFactorAuth.ts` i ich testy; usunięte martwe zależności `crypto-js`, `bcryptjs`, `qrcode`, `otpauth`. Dotknięto `firebase.json` (dodano sekcję `firestore`) — poza zwykłym zakresem §5, zrobione na wyraźne polecenie właściciela repo. Weryfikacja: `npm run lint`, `npm test`, `npm run build`. PR #TBD.
