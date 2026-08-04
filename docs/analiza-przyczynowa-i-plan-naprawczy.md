# Analiza przyczynowa i plan naprawczy

Data: 2026-08-04. Branch: `fix/types-node26-webcrypto`.
Wejście: 34 zgłoszenia z audytu 10 agentów (`docs/audyt-bugi-2026-08-04.md`) + własna analiza przyczynowa.

Ten dokument nie powtarza listy objawów. Szuka **wspólnych przyczyn**, a potem tym samym tropem
sprawdza, gdzie jeszcze ta sama przyczyna zadziałała — w tym w miejscach, których agenci nie ruszyli.

---

## Streszczenie

34 zgłoszenia sprowadzają się do **czterech przyczyn źródłowych**. Podążenie za nimi ujawniło
**dodatkowy błąd krytyczny, którego nie znalazł żaden agent**: cała deklarowana warstwa szyfrowania
vaulta jest martwym kodem, a dane użytkownika trafiają do `localStorage` jawnym tekstem.

| # | Przyczyna źródłowa | Objawy z audytu | Nowe błędy znalezione tym tropem |
|---|---|---|---|
| A | Brak jednego właściciela stanu vaulta | pętla renderowania, cofane edycje, mutacje propsów | — |
| B | Dopasowanie semantyczne przez podciąg, powielone w 3 miejscach | puste CV = 82%, „aws" w „jaws" | `jdParser` ma tę samą lukę; skala gorsza niż raportowano |
| C | Walidacja po kształcie napisu zamiast po znaczeniu | bypass SSRF `[::ffff:...]` | brak kontroli przekierowań |
| D | Ścieżka błędu po cichu obniża gwarancję | obejście logowania przez `prompt` | **szyfrowanie vaulta jest atrapą** |

---

## A. Brak jednego właściciela stanu vaulta

**Istota.** `MasterVault` żyje jednocześnie w trzech miejscach: `App.vault`, `AuthContext.userVault`
i `MasterVaultEditor.draftVault`. Żadne z nich nie jest źródłem prawdy. Synchronizację robią efekty
kopiujące dane tam i z powrotem, a warunkiem stopu jest **tożsamość referencji** (`vault === userVault`).
Każda operacja tworząca nowy obiekt (sanityzacja, `updatedAt`, spread) rozspójnia tę tożsamość i
uruchamia sprzężenie zwrotne.

**Dowód.** Dokładnie dwa miejsca zamykają pętlę:
- `src/App.tsx:63` — `setVault(userVault)` (mirror)
- `src/components/MasterVaultEditor.tsx:342` — `setDraftVault(vault)` (reset draftu)

Runtime: 387 zapisów do `localStorage` w 3 s przy bezczynności, każdy z pełną serializacją vaulta.

**Dlaczego to nie jest „drobny bug".** Z tej jednej przyczyny wynikają trzy krytyczne objawy:
pętla renderowania, cofanie każdej edycji w Bazie CV i gubienie zaakceptowanych zmian w edytorze.
Łatanie ich osobno nie zadziała — wrócą pod inną postacią.

**Naprawa.** Jedno źródło prawdy. Vault trzyma **wyłącznie** `AuthContext`; `App` go czyta, nie duplikuje.
`MasterVaultEditor` pracuje na własnym draftzie, ale resetuje go **tylko** na jawny sygnał
(zmiana `user.id`), nigdy na zmianę referencji propsa. Zapis: jedna funkcja, wywoływana z debounce,
nigdy z efektu obserwującego to, co sama zapisuje.

---

## B. Dopasowanie semantyczne przez podciąg

**Istota.** Ta sama operacja — „czy fraza X występuje w tekście Y" — jest zaimplementowana
**trzy razy niezależnie**, za każdym razem przez `String.includes`, z różnym poziomem staranności:

| Miejsce | Guard na pusty string | Granice słów |
|---|---|---|
| `src/lib/atsSimulator.ts:36` | **nie** | nie |
| `src/lib/atsScorer.ts:59-61` | tak (`if (userTitle && lowerTitle)`) | nie |
| `src/lib/jdParser.ts:212, 261` | **nie** | nie |

`"cokolwiek".includes("")` zawsze zwraca `true`, więc pusty tekst pasuje do wszystkiego.

**Dowód (uruchomiony na realnych modułach).**
```
isLemmatizedMatch("react","")      → true
isLemmatizedMatch("","react")      → true
isLemmatizedMatch("aws","jaws")    → true
isLemmatizedMatch("sap","sapieha") → true
isLemmatizedMatch("go","django")   → true
isLemmatizedMatch("r","react")     → true
```

**Nowe ustalenia ponad audyt.**
1. Skala fałszywych trafień jest większa niż raportowano — pasuje nawet **pojedyncza litera** („r" ↔ „react").
2. `jdParser.ts:212` i `:261` mają **tę samą lukę pustego stringa**, a agenci jej nie testowali.
   Dotyczy to audytu dopasowania oferty do vaulta, czyli „Wynik Audytu Wymogów".
3. `atsScorer.ts` jest odporny na pusty string — co dowodzi, że autor **znał** ten problem
   i zabezpieczył jedno miejsce z trzech. To klasyczny objaw powielonej logiki.

**Naprawa.** Jedna funkcja `matchesKeyword(haystack, needle)` w `src/lib/` — z odrzuceniem pustych
wejść, minimalną długością frazy i dopasowaniem po granicach słów (`\b`). Wszystkie trzy miejsca
przepięte na nią. Testy jednostkowe z powyższymi przypadkami jako regresja.

---

## C. Walidacja po kształcie napisu zamiast po znaczeniu

**Istota.** `validateOutboundUrl` w `server.ts` porównuje `hostname` z listą **wzorców tekstowych**
(`/^127\./`, `=== '::1'`). Ale ten sam adres da się zapisać na wiele sposobów, a walidacja rozpoznaje
tylko te zapisy, które ktoś przewidział. Kontrola dotyczy napisu, nie adresu, który on oznacza.

**Dowód.** `http://[::ffff:127.0.0.1]/` przechodzi walidację — agent realnie pobrał przez ten endpoint
lokalny plik `AGENTS.md`. Wersje dziesiętna (`http://2130706433/`) i ósemkowa (`http://0177.0.0.1/`)
są łapane, IPv4-mapped IPv6 — nie.

**Nowe ustalenie ponad audyt.** Nawet po naprawie zapisu adresu pozostaje druga dziura tej samej natury:
`fetch` domyślnie **podąża za przekierowaniami**, więc dozwolony host publiczny może przekierować na
`127.0.0.1`, a walidacja sprawdziła tylko adres wejściowy. To ta sama przyczyna — sprawdzamy deklarację,
nie rzeczywisty cel.

**Naprawa.** Normalizacja adresu przed oceną (zdjęcie prefiksu `::ffff:`, kanoniczna postać IP),
plus `redirect: 'manual'` i ponowna walidacja każdego `Location`. Docelowo: walidacja po rozwiązaniu DNS.

---

## D. Ścieżka błędu po cichu obniża gwarancję

**Istota — najgroźniejszy wzorzec w tym kodzie.** W kilku miejscach `catch` nie zgłasza awarii,
tylko **podstawia słabszy wariant tej samej operacji** i raportuje sukces. Użytkownik widzi
„udało się", a otrzymał coś istotnie gorszego niż obiecano.

### D1. Obejście logowania (znalezione przez agenta, potwierdzone)

`src/components/AuthModal.tsx:458-462`: gdy Firebase rzuci wyjątkiem, aplikacja pokazuje
`prompt('Wprowadź swój adres e-mail Google:')` i wywołuje `loginOAuth(googleEmail, ...)`.
**Zero weryfikacji.** Wpisanie cudzego adresu daje dostęp do jego vaulta.

### D2. Szyfrowanie vaulta jest atrapą — NIE ZNALAZŁ TEGO ŻADEN AGENT

Ten sam tok myślenia zaprowadził do znacznie poważniejszego przypadku.

`src/lib/vaultCrypto.ts` deklaruje w nagłówku:
> „FINTECH-GRADE ZERO-KNOWLEDGE ENCRYPTION ENGINE … AES-256-GCM + PBKDF2-SHA256 (600 000 iteracji).
> Server and Storage NEVER learn the raw passkey or decrypted vault."

Rzeczywistość:
```ts
// vaultCrypto.ts:152
export function encryptVault(vault: MasterVault, passkey: string = DEFAULT_PASSKEY): string {
  return JSON.stringify({ v: 1, raw: JSON.stringify(vault) });   // passkey ignorowany
}

// vaultCrypto.ts:177
export function saveVaultToLocalStorage(vault, passkey?) {
  const enc = encryptVault(vault, passkey);   // ← atrapa
  localStorage.setItem(STORAGE_KEY, enc);
}
```

Kto tego używa:
- `src/App.tsx:90` i `:94` — **główna ścieżka autozapisu**
- `src/components/MasterVaultEditor.tsx:788` — przycisk „Zapisz Zmiany w Profilu"
- `src/components/MasterVaultEditor.tsx:771` — **eksport do pliku z hasłem podanym przez użytkownika**

Prawdziwa implementacja AES-256 (`encryptVaultWebCrypto`) istnieje i działa, ale wywołuje ją wyłącznie
`saveVaultToLocalStorageAsync`, **której nie woła nikt**. Cała warstwa kryptograficzna jest martwym kodem.

Dodatkowo `encryptVaultWebCrypto` ma własny wariant tego samego wzorca: przy błędzie szyfrowania
(`:103-105`) zwraca `{v:1, raw: <jawny JSON>}`, a `decryptVaultWebCrypto:121` odczytuje to bez zastrzeżeń.

**Konsekwencje.**
1. Każdy vault (dane osobowe, historia zatrudnienia, kontakt) leży w `localStorage` **jawnym tekstem**.
2. Funkcja „eksportuj zaszyfrowane" **okłamuje użytkownika** — prosi o hasło, ignoruje je i zapisuje jawny plik.
3. `README.md` i opis w portfolio reklamują „Szyfrowany Master Vault (AES-256)" — to twierdzenie jest nieprawdziwe.

**Naprawa.** Usunąć atrapy `encryptVault`/`decryptVault`. Przestawić wszystkie ścieżki zapisu na
asynchroniczne `*WebCrypto`. Usunąć fallback do `v:1` przy zapisie (odczyt `v:1` zostawić na czas migracji
istniejących danych). Jeżeli szyfrowanie zawiedzie — **zgłosić błąd użytkownikowi**, nie zapisywać jawnie.

---

## Plan naprawczy

Kolejność wynika z ryzyka, nie z wygody. Etapy 1–2 to sprawy bezpieczeństwa danych i muszą wyprzedzić deploy.

### Etap 1 — Bezpieczeństwo (blokuje merge PR #10)

| # | Zadanie | Pliki |
|---|---|---|
| 1.1 | Usunąć fallback `prompt` z logowania Google — przy błędzie pokazać komunikat, nie logować | `AuthModal.tsx:458-462` |
| 1.2 | Przestawić zapis vaulta na realne AES-256; usunąć atrapy; brak cichego fallbacku do jawnego tekstu | `vaultCrypto.ts`, `App.tsx`, `MasterVaultEditor.tsx:771,788` |
| 1.3 | Doprowadzić eksport z hasłem do faktycznego szyfrowania (albo usunąć obietnicę hasła z UI) | `MasterVaultEditor.tsx:771` |
| 1.4 | SSRF: normalizacja `::ffff:`, `redirect: 'manual'` + walidacja `Location` | `server.ts` (`validateOutboundUrl`) |
| 1.5 | 2FA nie może być pomijane na ścieżce OAuth | `auth.ts`, `AuthContext.tsx` |
| 1.6 | Sprostować `README.md` i opis w portfolio, jeśli 1.2 nie zostanie wdrożone od razu | `README.md` |

### Etap 2 — Poprawność stanu (naprawia 3 objawy krytyczne naraz)

| # | Zadanie | Pliki |
|---|---|---|
| 2.1 | Jedno źródło prawdy dla vaulta; usunąć efekt mirror | `App.tsx:61-96`, `AuthContext.tsx` |
| 2.2 | Draft resetowany tylko na zmianę `user.id`, nie na referencję propsa | `MasterVaultEditor.tsx:341-344` |
| 2.3 | Zapis z debounce, bez sprzężenia z efektem obserwującym | `App.tsx` |
| 2.4 | Usunąć mutacje in-place obiektów z propsów | `CVWordBuilder.tsx:361-404` |
| 2.5 | Track Changes: liczniki liczone ze stanu, nie trzymane osobno | `CVWordBuilder.tsx` |

### Etap 3 — Logika dopasowania

| # | Zadanie | Pliki |
|---|---|---|
| 3.1 | Jedna funkcja `matchesKeyword` (granice słów, odrzucenie pustych, min. długość) | nowy plik w `src/lib/` |
| 3.2 | Przepiąć na nią trzy miejsca | `atsSimulator.ts:36`, `atsScorer.ts:61`, `jdParser.ts:212,261` |
| 3.3 | Testy regresji: pusty string, „aws"/„jaws", „r"/„react", puste CV, puste ogłoszenie | `src/lib/__tests__/` |
| 3.4 | Oczyścić ekstrakcję słów kluczowych (ucięte śmieci: „ksi", „prywatn", „excel. wykszta") | `atsSimulator.ts` |

### Etap 4 — Eksport i dostępność

Eksport TXT gubiący doświadczenie, DOCX bez wykształcenia, brak `@media print`, PDF ucinający treść
poza pierwszą stroną, modale bez obsługi Escape i `role="dialog"`.

> Uwaga: **cały etap 4 opiera się na analizie kodu, nie na testach runtime** — serwer dev nie działał
> podczas pracy tych agentów. Zweryfikować ręcznie przed naprawą.

### Etap 5 — Dług operacyjny

Rate limit po `req.ip` bez `trust proxy` (za reverse proxy Rendera wszyscy dzielą jeden licznik),
brak middleware błędów (413/400 wracają HTML-em zamiast JSON), kontrast `text-subtle` 2,85:1.

---

## Wnioski dla dalszej pracy

1. **Jedna operacja = jedna implementacja.** Trzy kopie dopasowania fraz i dwie kopie „szyfrowania"
   to nie przypadek — to mechanizm, który wyprodukował połowę tych błędów.
2. **`catch` nie może po cichu podstawiać słabszej ścieżki.** Jeśli operacja miała dać gwarancję
   (uwierzytelnienie, szyfrowanie), jej niepowodzenie musi być widoczne, a nie zamienione w sukces.
3. **Nazwa funkcji jest obietnicą.** `encryptVault(vault, passkey)`, które nic nie szyfruje i ignoruje
   hasło, przeszło przez cały cykl życia projektu, bo nikt nie sprawdził, czy robi to, co deklaruje.
4. **Audyt automatyczny znajduje objawy, nie przyczyny.** 10 agentów zgłosiło 34 objawy i przeoczyło
   fakt, że szyfrowanie w ogóle nie działa. Analiza przyczynowa znalazła to w kilka kroków.
