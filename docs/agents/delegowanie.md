# Co wolno delegować agentowi autonomicznemu

> Wydzielone z [`AGENTS.md`](../../AGENTS.md), żeby kontrakt mieścił się w limicie
> 12 000 znaków na plik reguł, który narzuca Antigravity. To poradnik dla
> właściciela repo — *co* zlecać — a nie reguła stosowana w trakcie pisania kodu.

> **Deleguj to, co CI potrafi obalić. Resztę albo najpierw obłóż testem, albo zatrzymaj.**

Agent autonomiczny udowadnia dokładnie jedno: „testy przechodzą, build zielony".
Bramką jest `npm run lint` → `npm test` → `npm run build` w `.github/workflows/ci.yml`.

Są jednak zmiany, **których CI nie obali** — i to one wyznaczają granicę.

### Zielona lista

Praca mechaniczna, o wąskim zakresie, w całości weryfikowalna przez CI.

| Typ zadania | Dlaczego bezpieczne |
| --- | --- |
| Dopisanie testów do istniejących modułów `src/lib/` | Nowy przechodzący test sam siebie dowodzi |
| Usuwanie nieużywanych importów i martwego kodu | Pilnuje `tsc --noEmit` |
| Dynamiczny `import()` dla ciężkich bibliotek | Weryfikowalne rozmiarem bundla w wyjściu builda |
| Przepięcie ręcznie pisanych modali na `src/components/ui/Modal.tsx` | Istniejący komponent bazowy, jasny cel |
| Uzupełnienie komentarzy „dlaczego" tam, gdzie ich brak | Nie zmienia zachowania |

### Czerwona lista

| Obszar | Powód |
| --- | --- |
| `src/server/net/safeFetch.ts`, walidacja SSRF, rate limiting | Publiczne, płatne endpointy; kod generowany przez modele często zawiera podatności |
| Logika uwierzytelniania i szyfrowania | To repo ma historię deklaracji „AES-256" przy zapisie jawnym tekstem (`localProfile.ts:103`). Testy wolno delegować, zmiany zachowania nie |
| `src/lib/jdParser.ts`, `atsSimulator.ts`, `knockouts.ts` — poprawność wyników | Zasada zera wymyślonych danych wymaga osądu i konfrontacji z prawdziwymi ogłoszeniami |
| Ciało dokumentu A4 w rendererach CV | Kartka musi zostać biała w trybie ciemnym; podmiana kolorów na tokeny motywu przechodzi build i psuje eksport PDF — CI tego nie obali |
| `semantic-work-graph/` | Poza zasięgiem CI; nikt nie zweryfikuje zmiany automatycznie |
| `.github/workflows/**`, `Dockerfile`, `vercel.json`, `.env*` | Konfiguracja wdrożeniowa |
| Decyzje architektoniczne | Przekrojowe, wymagają projektu, nie wykonania |

### Zadania cykliczne raportują, nie commitują

Bezobsługowe zmiany w kodzie według harmonogramu maksymalizują obciążenie
recenzją i ryzyko. Wąskim gardłem nie jest limit zadań agenta, tylko zdolność
właściciela repo do recenzowania PR-ów.

Zadanie cykliczne ma wbudowaną zasadę: **gdy nie ma co zgłosić, nie otwiera
issue**. Bez tego w kolejce lądują śmieciowe zgłoszenia w nieskończoność.

### Reguły antykolizyjne

1. **Jeden plik = jeden otwarty PR.** Partycjonuj po plikach, nie po limicie agenta.
2. **Pliki współdzielone są poza zasięgiem agenta:** `src/index.css`,
   `src/types/index.ts`, `AGENTS.md`. Jeśli zadanie wymaga nowego tokena
   w `index.css` — zatrzymaj się i napisz o tym w PR, nie zaszywaj koloru
   w komponencie.
3. **Najwyżej cztery otwarte PR-y od agentów naraz.** Limit wynika z recenzji.
4. **Pilot przed skalowaniem.** Pierwsze zadanie danego typu idzie pojedynczo.

Gotowe briefy, napisane według tych reguł: [`docs/zadania-dla-agenta.md`](../zadania-dla-agenta.md).

