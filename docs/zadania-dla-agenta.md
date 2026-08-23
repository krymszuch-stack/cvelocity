# Zadania dla agenta autonomicznego (Jules)

Trzy briefy do wklejenia pojedynczo. Zasady, na których są oparte — zielona
i czerwona lista, reguły antykolizyjne, lista kontrolna przed zgłoszeniem —
są w [`AGENTS.md`](../AGENTS.md); briefy ich nie powtarzają, tylko się do nich
odwołują.

**Kolejność ma znaczenie.** Z-1 jest pilotem: zadanie ma znane, policzalne
rozwiązanie, więc odpowiedź agenta da się porównać z liczbą, a nie z wrażeniem.
Dopiero po jego ocenie warto puszczać Z-2 i Z-3 (można je wtedy puścić równolegle
— dotykają rozłącznych plików).

Każdy brief kończy się sekcją „Czego **nie** robić". To nie jest ozdobnik:
model o mniejszej pojemności rozszerza zakres zadania częściej, niż go zawęża,
a zakres jest tu jedyną rzeczą, której CI nie obali.

---

## Z-1 · Wyprowadź `mammoth` z głównej paczki (pilot)

**Problem.** Każdy odwiedzający stronę główną pobiera bibliotekę do czytania
plików DOCX, choć korzysta z niej dopiero ten, kto wgra CV w tym formacie.
Ścieżka zależności: `src/views/HomeView.tsx` → `src/features/quickcheck/QuickAtsCheck.tsx`
→ `src/lib/cvUniversalParser.ts` → `import * as mammoth from 'mammoth'` (linia 3).
Import statyczny wciąga bibliotekę do paczki wejściowej.

**Stan przed zmianą** (`npm run build`, wyjście Vite):

| Paczka | Rozmiar | gzip |
| --- | --- | --- |
| `assets/index-*.js` (wejściowa) | 1 211,26 kB | 344,47 kB |
| `assets/pdf-*.js` (już leniwa) | 479,34 kB | 142,68 kB |

**Zadanie.** Zamień statyczny import `mammoth` na `await import('mammoth')`
wewnątrz gałęzi obsługującej `.docx`/`.doc` w `extractTextFromAnyFile`.

**Wzorzec jest w tym samym pliku.** Funkcja `loadPdfJs()` (`cvUniversalParser.ts:9`)
robi dokładnie to samo dla `pdfjs-dist`, a komentarz nad nią tłumaczy, dlaczego.
Zrób to tak samo — nie wymyślaj własnej konwencji.

**Pliki w zakresie:** `src/lib/cvUniversalParser.ts` — wyłącznie ten jeden.

**Kryteria akceptacji**
- [ ] `npm run build` przechodzi, a w wyjściu Vite pojawia się nowa, osobna paczka z `mammoth`
- [ ] paczka `assets/index-*.js` jest mniejsza niż 1 211,26 kB
- [ ] `npm test` na zielono — `src/lib/__tests__/cv_parser.test.ts` nie może się ruszyć
- [ ] `npm run lint` bez błędów
- [ ] opis PR-a zawiera **wklejone wyjście Vite przed i po**, nie samo zdanie „bundle mniejszy"

**Czego nie robić**
- nie ruszaj `loadPdfJs()` ani obsługi PDF — działa
- nie dodawaj `manualChunks` do `vite.config.ts`; zadanie dotyczy jednego importu
- nie zmieniaj `package.json`, nie podmieniaj `mammoth` na inną bibliotekę
- nie „przy okazji" refaktoryzuj `extractTextFromAnyFile`

---

## Z-2 · Zmierz koszt rankingu trafności, nie zmieniając go

**Problem.** `src/lib/relevanceRanking.ts` porównuje każdy punkt doświadczenia
z każdym słowem kluczowym ogłoszenia przez `text.includes(kw)` — złożoność rośnie
jak iloczyn liczby doświadczeń, punktów i słów kluczowych. Nie wiadomo jednak,
przy jakim rozmiarze profilu to zaczyna być odczuwalne, a bez tej liczby każda
optymalizacja jest strzelaniem.

**Zadanie ma dwie części i żadna z nich nie polega na zmianie algorytmu.**

**Część 1 — testy charakteryzujące.** Moduł ma dziś 4 testy w
`src/lib/__tests__/relevance_ranking.test.ts`. Dopisz przypadki na to, co obecna
implementacja robi, żeby przyszła optymalizacja miała co złamać:
- pusta lista słów kluczowych (`toKeywordSet` daje zbiór pusty → wynik 0)
- puste `history` i puste `highlights`
- punkt podany jako `string` zamiast obiektu (`highlightText` obsługuje oba)
- duplikaty i różnice wielkości liter w słowach kluczowych ogłoszenia
- `matchedKeywords` bez powtórzeń przy doświadczeniu z kilkoma punktami
- premia za świeżość: `recencyBonus` zeruje się od szóstego doświadczenia
  (`Math.max(0, 0.1 - originalIndex * 0.02)`) — przypnij to testem
- `titleSimilarity`: zgodność dokładna, zawieranie się, część wspólna słów, brak

**Część 2 — pomiar.** Dodaj `src/lib/__tests__/relevanceRanking.bench.test.ts`
wzorowany na `src/lib/__tests__/vaultPersistence.bench.test.ts`. Wymagania stamtąd:
**żadnych progów czasowych w asercjach** — test wypisuje liczby przez `console.log`,
a asercje pilnują wyłącznie tego, że dane wejściowe mają zakładany rozmiar.
Zmierz `rankExperienceByRelevance` dla siatki: 10 / 50 / 200 doświadczeń
× 20 / 100 słów kluczowych, po 8 punktów na doświadczenie.

**Pliki w zakresie:** `src/lib/__tests__/relevance_ranking.test.ts` (dopisanie),
`src/lib/__tests__/relevanceRanking.bench.test.ts` (nowy).

**Kryteria akceptacji**
- [ ] `src/lib/relevanceRanking.ts` **niezmieniony** — `git diff` na tym pliku musi być pusty
- [ ] wszystkie nowe testy przechodzą przy obecnej implementacji
- [ ] `npm test` i `npm run lint` na zielono
- [ ] opis PR-a zawiera **tabelę z wynikami pomiaru** dla całej siatki

**Czego nie robić**
- nie optymalizuj, nie zamieniaj `includes` na wyrażenie regularne ani na indeks
  odwrócony, nie dodawaj pamięci podręcznej — to jest osobna decyzja i zapada
  po zobaczeniu liczb z tego zadania
- nie zmieniaj wag (`0.5 / 0.3 / 0.15`) ani progów w `titleSimilarity`
- jeśli któryś test charakteryzujący wyjdzie na czerwono, **nie poprawiaj kodu
  produkcyjnego, żeby test przeszedł** — opisz rozbieżność w PR i zostaw ten
  przypadek zakomentowany z wyjaśnieniem. Czerwony test tutaj to znalezisko,
  nie usterka do zamiecenia

---

## Z-3 · Obłóż testem warstwę schowka przeglądarki

**Problem.** `src/lib/storage.ts` (168 linii) nie ma ani jednego testu, a odpowiada
za dwie operacje, których błąd oznacza utratę danych użytkownika:
`migrateLegacyKeys()` przenosi dane spod starych kluczy pod nowe, a `wipeAppStorage()`
realizuje „usuń moje dane". Komentarz w pliku odnotowuje, że raz już się to
nie udało — usuwanie zostawiało za sobą stan subskrypcji.

**Zadanie.**

**Część 1 — wydziel atrapę.** Klasa `MemoryStorage` istnieje dziś w
`src/lib/__tests__/localProfile.test.ts:15`. Przenieś ją do
`src/lib/__tests__/helpers/memoryStorage.ts` i podepnij w obu miejscach.
Dwie kopie tej samej atrapy rozjadą się przy pierwszej zmianie.

**Część 2 — testy.** Nowy plik `src/lib/__tests__/storage.test.ts`:
- `vaultKeyFor` — klucz zawiera identyfikator profilu i wspólny przedrostek
- `readJson` — uszkodzony JSON zwraca wartość zapasową, nie wyjątek
- `writeJson` — struktura z cyklem nie wywraca wywołania
- `readRaw`/`writeRaw` — `localStorage` rzucający wyjątkiem (tryb prywatny)
  nie wywraca wywołania; ustaw atrapę tak, żeby `setItem` rzucał
- `migrateLegacyKeys` — dane spod starego klucza trafiają pod nowy, stary znika
- `migrateLegacyKeys` — **idempotencja**: istniejący klucz docelowy nie zostaje
  nadpisany przy powtórnym wywołaniu
- `migrateLegacyKeys` — vault profilowy spod `skillvault_vault_active_<id>`
  ląduje pod `vaultKeyFor(<id>)`
- `migrateLegacyKeys` — pozostałości `skillvault_users_db_v1`
  i `skillvault_master_vault_enc_v2` są usuwane bezwarunkowo
- `wipeAppStorage` — usuwa klucze `cvelocity:*` i `skillvault*`, **zachowuje**
  `StorageKeys.theme`, **nie rusza** klucza obcego (np. `inna-apka:coś`)

**Pliki w zakresie:** `src/lib/__tests__/helpers/memoryStorage.ts` (nowy),
`src/lib/__tests__/storage.test.ts` (nowy),
`src/lib/__tests__/localProfile.test.ts` (tylko podmiana atrapy na import).

**Kryteria akceptacji**
- [ ] `src/lib/storage.ts` **niezmieniony**
- [ ] `src/lib/__tests__/localProfile.test.ts` dalej przechodzi w całości
- [ ] `npm test` i `npm run lint` na zielono

**Czego nie robić**
- nie zmieniaj `storage.ts` ani `localProfile.ts` — to zadanie dokłada testy do
  istniejącego zachowania, a nie poprawia je
- nie dopisuj nowych kluczy do `StorageKeys` ani wpisów do `LEGACY_KEY_MAP`
- nie instaluj `jsdom` ani `@testing-library` — testy w tym repozytorium biegną
  w Node z ręcznymi atrapami i tak ma zostać
- nie ruszaj `src/types/index.ts` (plik współdzielony, `AGENTS.md`, reguła antykolizyjna 2)
