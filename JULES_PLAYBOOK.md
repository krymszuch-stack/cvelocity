# JULES_PLAYBOOK.md — podział pracy między agentami

Kto co robi w tym repo i dlaczego. Dotyczy Julesa (Google), Claude Code i każdego innego
agenta autonomicznego. Zasady ogólne są w `AGENTS.md` — ten plik mówi **komu przypisać zadanie**.

---

## 1. Zasada podziału

> **Deleguj to, co CI potrafi obalić. Resztę albo najpierw obłóż testem, albo zatrzymaj.**

Agent autonomiczny udowadnia dokładnie jedno: „testy przechodzą, build zielony".
CI (`.github/workflows/ci.yml`) uruchamia `tsc --noEmit` → `vitest run` → `build` i jest realną bramką.

Ale są zmiany, których **CI nie potrafi obalić**. Sztandarowy przykład: kartka A4 w
`DocumentRenderer.tsx` i `CVWordBuilder.tsx` musi zostać biała w trybie ciemnym
(`AGENTS.md` §5). Podmiana kolorów wewnątrz kartki na tokeny motywu przechodzi build
i wszystkie testy, a psuje eksport PDF. Takie obszary zostają przy człowieku albo przy
agencie prowadzonym przez człowieka.

## 2. Prawdziwe wąskie gardło

Nie limit zadań agenta, tylko **zdolność właściciela repo do recenzowania PR-ów** —
często z telefonu. Dlatego obowiązuje twardy cap na liczbę otwartych PR-ów, a nie
maksymalizacja przepustowości agenta.

---

## 3. 🟢 Zielona lista — deleguj Julesowi

Praca mechaniczna, o wąskim zakresie, w całości weryfikowalna przez CI.

| Typ zadania | Dlaczego bezpieczne |
|---|---|
| Migracja zaszytych klas palety na tokeny (`AGENTS.md` §4) | Czysto mechaniczne, jest tabela mapowania, `tsc` łapie literówki |
| Przepięcie ręcznie pisanych modali na `src/components/ui/Modal.tsx` | Istniejący komponent bazowy, jasny cel |
| Dopisanie testów do istniejących modułów `src/lib/` | Nowy przechodzący test sam siebie dowodzi |
| Dynamiczny `import()` dla ciężkich bibliotek (code splitting) | Weryfikowalne rozmiarem bundla w wyjściu builda |
| Usuwanie nieużywanych importów i martwego kodu | Pilnuje `tsc --noEmit` |

## 4. 🔴 Czerwona lista — nigdy nie deleguj

| Obszar | Powód |
|---|---|
| `server.ts` — walidacja SSRF, rate limiting | Publiczne, płatne endpointy. Kod generowany przez modele często zawiera podatności |
| `src/lib/auth.ts`, `twoFactorAuth.ts`, `vaultCrypto.ts` — **logika** | To repo ma historię fałszywej deklaracji „AES-256", która zapisywała jawny tekst. Testy do tych modułów wolno delegować, zmiany zachowania nie |
| `src/lib/jdParser.ts`, `atsSimulator.ts` — poprawność wyników | Zasada 0-Halucynacji wymaga osądu. Błąd z klauzulą RODO wyszedł dopiero po sprawdzeniu **prawdziwych** ogłoszeń — agent nie wpadnie na to, że trzeba to zrobić |
| Ciało dokumentu A4 w `DocumentRenderer.tsx` i `CVWordBuilder.tsx` | Pułapka `AGENTS.md` §5 — CI tego nie obali |
| Decyzje architektoniczne (np. routing danych z Gemini do konsumentów) | Przekrojowe, wymagają projektu |
| `semantic-work-graph/`, `.github/workflows/**`, `render.yaml`, `firebase.json`, `.env*` | Zakazy `AGENTS.md` §5 |

## 5. ⏰ Zadania cykliczne (Jules Scheduled Tasks)

Jules obsługuje harmonogram dzienny/tygodniowy (bez dowolnego crona i bez webhooków).

> **Żelazna zasada: zadania cykliczne RAPORTUJĄ, nie commitują kodu.**
> Bezobsługowe zmiany w kodzie według harmonogramu maksymalizują obciążenie recenzją i ryzyko.

| Cykl | Zadanie | Uzasadnienie |
|---|---|---|
| Pon. 07:00 | `npm audit` → otwórz issue z wynikiem | `ci.yml` uruchamia audit z `continue-on-error: true`, więc dziś podatności nie widzi nikt |
| Śr. 09:00 | Raport modułów `src/lib/` bez testów | Utrzymuje kolejkę zadań testowych zasiloną |
| Pt. 16:00 | Rozmiar głównego chunka → issue, gdy urośnie o >5% | Bundle waży ~2,85 MB i nie ma nad nim żadnego nadzoru |

**Godziny rozstrzelone celowo.** Trzy issues w jeden poranek to ściana; po jednym co drugi
dzień mieści się w ograniczeniu z §2. Audit w poniedziałek daje pięć dni na reakcję.
Bundle w piątek łapie tycie wprowadzone przez PR-y migracyjne z danego tygodnia.

⚠️ Sprawdź strefę czasową w ustawieniach Julesa. Jeśli domyślnie jest UTC, w czasie letnim
(CEST) wpisz **05:00 / 07:00 / 14:00**, żeby wyszło 07:00 / 09:00 / 16:00 lokalnie.

### Treści do wklejenia w Jules → Scheduled tasks

Każde zadanie ma wbudowaną zasadę: **gdy nie ma co zgłosić, nie otwiera issue.**
Bez tego dostawałbyś trzy śmieciowe issues tygodniowo w nieskończoność.

**1 — poniedziałek 07:00**

```text
Repozytorium: krymszuch-stack/skillvault, gałąź main.

ZADANIE TYLKO RAPORTUJĄCE. Nie zmieniaj żadnego pliku. Nie twórz brancha.
Nie otwieraj pull requesta.

1. Uruchom `npm ci`, potem `npm audit --audit-level=high`.
2. Jeśli nie ma podatności high ani critical — zakończ bez żadnej akcji.
   Nie otwieraj issue.
3. Jeśli są — otwórz JEDNO issue "[Audit] Podatności high/critical" zawierające:
   - nazwę pakietu, wersję, poziom, ścieżkę zależności
   - czy `npm audit fix` rozwiązuje to bez breaking changes
   - nic poza tym; nie proponuj kodu

Kontekst: .github/workflows/ci.yml uruchamia audit z continue-on-error: true,
więc wyniki nie blokują CI i nikt ich nie ogląda. To zadanie jest jedynym
miejscem, gdzie te podatności wypływają.
```

**2 — środa 09:00**

```text
Repozytorium: krymszuch-stack/skillvault, gałąź main.

ZADANIE TYLKO RAPORTUJĄCE. Nie zmieniaj żadnego pliku. Nie pisz testów.
Nie twórz brancha. Nie otwieraj pull requesta.

1. Wypisz pliki .ts w src/lib/ (pomiń src/lib/__tests__/).
2. Dla każdego sprawdź, czy w src/lib/__tests__/ istnieje test, który go importuje.
3. Jeśli wszystkie mają testy — zakończ bez akcji.
4. W przeciwnym razie otwórz JEDNO issue "[Coverage] Moduły src/lib bez testów"
   z tabelą: moduł, liczba linii, czy importuje I/O (sieć, DOM, localStorage, Firebase).
5. Posortuj od modułów bez zależności I/O — to najbezpieczniejsze cele do testowania.
```

**3 — piątek 16:00**

```text
Repozytorium: krymszuch-stack/skillvault, gałąź main.

ZADANIE TYLKO RAPORTUJĄCE. Nie zmieniaj żadnego pliku. Nie twórz brancha.
Nie otwieraj pull requesta.

1. Uruchom `npm ci`, potem `npm run build`.
2. Odczytaj rozmiar głównego chunka dist/assets/index-*.js.
3. Wartość odniesienia: 2 853 000 bajtów.
4. Jeśli chunk jest większy o ponad 5% od odniesienia — otwórz JEDNO issue
   "[Bundle] Główny chunk urósł" z: rozmiarem obecnym, odniesieniem, różnicą
   procentową oraz listą commitów z ostatnich 7 dni dotykających src/ lub package.json.
5. Jeśli nie przekroczył progu — zakończ bez akcji.
```

---

## 6. Reguły antykolizyjne

Bez nich równoległe zadania zderzają się w merge'u.

1. **Jeden plik = jeden otwarty PR.** Partycjonuj po plikach, nie po limicie agenta.
2. **Pliki współdzielone są poza zasięgiem Julesa:** `src/index.css`, `src/types/index.ts`,
   `AGENTS.md`, `NOTATKI.md`, `JULES_PLAYBOOK.md`.
   Jeśli zadanie wymaga nowego tokena w `index.css` — **zatrzymaj się i napisz o tym w PR**.
   Nie dodawaj tokena samodzielnie i nie zaszywaj koloru w komponencie.
3. **Maksymalnie 4 otwarte PR-y od agentów naraz.** Limit wynika z recenzji, nie z tiera.
4. **Pilot przed skalowaniem.** Pierwsze zadanie danego typu idzie pojedynczo. Równoległość
   dopiero po zmergowaniu pierwszego PR-a tego typu.

---

## 7. Szablon briefu

Główny udokumentowany tryb awarii Julesa to **zgadywanie przy niejednoznacznym poleceniu**.
„Popraw stylowanie" da losowy wynik. Każde issue kierowane do Julesa musi mieć:

```markdown
## Cel
Jedno zdanie.

## Pliki w zakresie
- ścieżka/do/pliku.tsx

## Pliki zabronione
- src/index.css, src/types/index.ts, AGENTS.md, NOTATKI.md
- (plus wszystko z czerwonej listy §4 tego pliku)

## Kroki
1. Konkretny krok.
2. Konkretny krok.

## Kryteria akceptacji
- [ ] `npm run lint && npm test && npm run build` zielone
- [ ] (weryfikacja specyficzna dla zadania)

## Czego NIE robić
- Nie refaktoryzować poza zakres.
- Nie dodawać tokenów do `src/index.css` — zgłoś brak w PR.

## Odnośniki
- `AGENTS.md` §4 — tabela mapowania klas na tokeny
- `AGENTS.md` §8 — definicja ukończenia
```

### Tabela mapowania (kopia z `REDESIGN_HANDOFF.md` §4, do wklejania w briefy)

```
bg-white → bg-surface          bg-slate-50/100 → bg-sunken
bg-slate-900 → bg-surface      bg-slate-800 → bg-raised     bg-slate-950 → bg-canvas
text-slate-900/800 → text-ink  text-slate-700/600 → text-muted   text-slate-500/400 → text-subtle
border-slate-200/700/800 → border-line    border-slate-300 → border-line-strong
indigo|blue|cyan|violet-* → brand-*
emerald|green-* → success-*    amber|yellow-* → warning-*   red|rose-* → danger-*
tła miękkie: bg-{brand,success,warning,danger}-soft
tekst na tłach miękkich: text-{brand,success,warning,danger}-fg
liczby/wyniki: dodaj klasę sv-tnum
```

`text-white` na kolorowym przycisku lub gradiencie jest **poprawne** — nie zamieniaj go.

---

## 8. Kolejność fal

Zadania są otwarte jako GitHub Issues. Uruchomienie: nadaj issue etykietę **`jules`**.

| Fala | Zakres | Równolegle? |
|---|---|---|
| 1 | `TokenStatsWidget.tsx` — pilot | Nie, pojedynczo |
| 2 | `ProfilerSection`, `CoverLetterView`, `AtsSimulatorView`, `JDParserModal`, `CVParserModal` | Tak, do 4 naraz |
| 3 | `GeminiAdvisorModal`, `AuthModal` | Tak |
| 4 | Testy modułów `src/lib/` bez pokrycia | Tak, niezależnie od fal 1–3 |
| 5 | Code splitting ciężkich bibliotek | Nie, pojedynczo |
| 6 | `MasterVaultEditor.tsx` (2938 linii) — rozbić na sekcje | Nie, sekwencyjnie |

Fala 1 jest pilotem procesu, nie techniki: sprawdzamy, czy Jules respektuje `AGENTS.md`,
czy PR jest recenzowalny i czy przechodzi CI. Dopiero potem skalujemy.

---

## 9. Przekazywanie przerwanej pracy (handoff)

Zarówno Jules, jak i Claude Code mogą nie dokończyć zadania w jednej sesji — zbyt szeroki
zakres, limit czasu, zwykłe zakończenie rozmowy przez człowieka. Zasada z `AGENTS.md` §8.4
(„wąski, domknięty kawałek jest lepszy niż szeroki i połowiczny") obowiązuje zawsze, ale
potrzebuje konkretnej mechaniki: **gdzie zostawić ślad, żeby ktoś — człowiek, Jules albo
kolejna sesja Claude — mógł podjąć pracę bez odgadywania stanu.**

### Zastrzeżenie o „liczeniu tokenów"

Claude Code nie ma dostępu do dokładnego licznika własnego zużycia kontekstu w procentach —
nie da się tu wdrożyć dosłownego „przy 95% oddaj zadanie". Kontekst rozmowy jest automatycznie
kompresowany w miarę potrzeby, więc typowa sesja nie urywa się w pół zdania z powodu limitu
tokenów. Realne ryzyko przerwania pracy to zbyt szeroki zakres zadania albo koniec sesji z
inicjatywy człowieka — ten mechanizm adresuje właśnie to, zamiast opierać się na metryce,
do której nie ma dostępu.

### Mechanizm

1. **Przed zadaniem szerszym niż jeden plik / jedna wąska zmiana** — rozbij je na kroki, z
   których każdy da się domknąć osobno (build + testy zielone, stan nadający się do commitu).
2. **Gdy nie zdążysz dokończyć bieżącego kroku** — nie zostawiaj kodu w stanie, który nie
   buduje się lub nie przechodzi testów. Cofnij niedokończony fragment albo domknij go do
   najbliższego stabilnego punktu.
3. **Zostaw ślad kontynuacji, dopasowany do tego, kto ma podjąć pracę:**
   - Zadanie z zielonej listy (§3), które nadaje się dla Jules → otwórz albo zaktualizuj
     GitHub Issue z etykietą `jules`, wg szablonu z §7, z dodaną sekcją „Stan na teraz"
     opisującą dokładnie co zrobione, co zostało, i który plik/linia jest granicą.
   - Zadanie wymagające ludzkiego osądu (czerwona lista §4, albo zwykła niejednoznaczność) →
     wpis w `NOTATKI.md` §0, w istniejącym formacie.
4. **Nigdy nie zostawiaj samego kodu jako jedynego śladu.** Diff bez opisu w issue/PR/
   `NOTATKI.md` nie mówi kolejnej sesji, co jest zamierzone, a co przerwane w pół zdania.

To rozszerza `AGENTS.md` §8.4 o konkretną mechanikę — **gdzie** zostawić ślad i **w jakim
formacie** — zamiast tylko stwierdzać, że trzeba go zostawić.
