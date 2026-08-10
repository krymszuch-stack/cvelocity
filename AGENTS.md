# AGENTS.md — kontrakt dla agentów pracujących nad SkillVault

Ten plik czytają agenci automatyczni (Jules, Claude Code i inne) **przed** pierwszą zmianą w repo.
Jeśli coś tutaj kłóci się z Twoim domyślnym zachowaniem — wygrywa ten plik.

---

## 0. `NOTATKI.md` — czytaj przed każdą zmianą

`NOTATKI.md` w katalogu głównym to bieżący notatnik uwag właściciela repo. Uwagi trafiają tam
z telefonu (Obsidian + Obsidian Git), więc bywają krótkie i nieformalne — to nie zmniejsza ich wagi.

**Przed rozpoczęciem pracy** przeczytaj sekcję „🆕 Nowe" i uwzględnij te uwagi w tym, co robisz.

**Po wykonaniu — lub po świadomym uwzględnieniu — uwagi:**

1. Przenieś ją z „🆕 Nowe" do „✅ Załatwione".
2. Przekreśl treść: `~~uwaga~~`.
3. Dopisz pod spodem jedną–dwie linijki: co zrobiłeś albo dlaczego zdecydowałeś inaczej,
   z datą i numerem PR-a.

```markdown
- ~~Popraw wykrywanie widełek płacowych~~
  - **Claude 2026-08-10:** dodana obsługa „net/brutto/gross" między kwotą a walutą. PR #16.
```

**Czego nie robić:** nie usuwaj uwag, nie przepisuj ich treści i nie przekreślaj czegoś, czego
realnie nie zrobiłeś. Jeśli uwagi nie da się wykonać albo się z nią nie zgadzasz — zostaw ją
w „🆕 Nowe" i dopisz pod spodem swoje zastrzeżenie. Decyzję podejmuje człowiek.

Zmiany w `NOTATKI.md` dołączaj do PR-a, którego dotyczą — nie rób z tego osobnego PR-a.

---

## 1. Czym jest ten projekt

SkillVault dopasowuje CV do konkretnej oferty pracy: parsuje ogłoszenie, przestawia i przeformułowuje
treść CV, symuluje ocenę ATS i generuje list motywacyjny. Znaczna część logiki jest **lokalna i bez-tokenowa**
(slot filling, ranking trafności, symulator ATS) — Gemini jest wołane tylko tam, gdzie lokalny algorytm nie wystarcza.

**Stack:** Vite + React 19 + TypeScript + Tailwind 4 (frontend), Express (backend `server.ts`), Vitest.
**Deploy:** frontend → Firebase Hosting; API → Render. To dwa osobne środowiska (patrz §6).

## 2. Układ repo

```
server.ts                 backend Express — WSZYSTKIE endpointy /api/*
src/server/gemini.ts      integracja z Gemini (klucz z process.env)
src/lib/                  logika domenowa (ats, slot filling, ranking, crypto, auth)
src/lib/apiClient.ts      JEDYNE miejsce, przez które front woła backend
src/components/ui/        komponenty bazowe design systemu
src/components/shell/     Sidebar + Topbar
src/index.css             tokeny design systemu (light/dark)
```

## 3. Weryfikacja — obowiązkowa przed każdym PR

```bash
npm run lint    # tsc --noEmit
npm test        # vitest run
npm run build   # klient + serwer
```

Wszystkie trzy muszą być zielone. **Nie otwieraj PR-a z czerwonym którymkolwiek z nich.**
Jeśli zmiana dotyczy UI — sprawdź **oba motywy** (przełącznik w topbarze), nie tylko jeden.

## 4. Design system — kontrakt

`src/index.css` definiuje dwie warstwy tokenów: surową paletę `--sv-*` przełączaną przez `[data-theme]`
oraz tokeny Tailwinda `@theme` wskazujące na nią. Dzięki temu `bg-surface`, `text-muted`, `border-line` itd.
są **automatycznie reaktywne na motyw**.

- Używaj komponentów z `src/components/ui/` (`Button`, `Card`, `Field`, `Modal`, `Tabs`, `Feedback`, `StatusBadge`).
  Nie twórz równoległych wariantów tego, co już istnieje.
- **Zakaz zaszytych klas palety** (`bg-white`, `text-slate-600`, `indigo-*`, `emerald-*`…) w kodzie UI.
  Brakuje tokena? Dodaj go do `index.css` — nie obchodź systemu.
- `emerald`/`success` = wyłącznie status powodzenia. Kolor marki to indigo (`brand-*`). Nigdy odwrotnie.
- `text-white` na kolorowym przycisku lub gradiencie jest poprawne — tego nie zamieniaj.

Kontekst i ściągę mapowania klas → tokeny znajdziesz w `REDESIGN_HANDOFF.md`.

## 5. ⚠️ Twarde zakazy

**Kartka CV musi zostać biała w obu motywach.**
`DocumentRenderer.tsx` i `CVWordBuilder.tsx` renderują dokument A4 (`w-[210mm] min-h-[297mm]`, klasa
`printable-area`), który jest **drukowany przez `window.print()` i eksportowany do PDF**. Zamiana kolorów
wewnątrz kartki na tokeny motywu da w trybie ciemnym jasny tekst na białym papierze — nieczytelne CV
i zepsuty eksport. Zmieniaj wyłącznie *chrome* dookoła kartki (toolbary, panele, modale).

**Nie dotykaj bez wyraźnego polecenia człowieka:**
`render.yaml`, `firebase.json`, `.github/workflows/**`, `.firebaserc`, `.env*` (poza `.env.example`),
oraz czegokolwiek związanego z sekretami i kluczami.

**Nigdy nie commituj sekretów.** `GEMINI_API_KEY` i klucze Firebase pochodzą ze zmiennych środowiskowych.
Jeśli potrzebujesz nowej zmiennej — dopisz ją do `.env.example` z pustą wartością i opisem.

**Nie merge'uj własnych PR-ów.** Każdą zmianę zatwierdza człowiek.

## 6. Backend i granica front–backend

- Front woła backend **wyłącznie** przez `apiFetch` z `src/lib/apiClient.ts`. Nie pisz `fetch('/api/...')`
  bezpośrednio — produkcja ma API na innej domenie i takie wywołanie tam nie zadziała.
- `VITE_API_BASE_URL` jest wstawiane przez Vite **w czasie builda** — nie da się go zmienić po deployu.
- W produkcji backend serwuje **tylko API**. Nie dodawaj tam fallbacku SPA (`app.get("*") → index.html`) —
  to dokładnie ta pomyłka, przez którą `/api/*` zwracało HTML 200 i cicho psuło wszystkie funkcje AI.
- Endpointy AI są publiczne i kosztują pieniądze. Zachowaj rate limit i walidację URL (SSRF) w `server.ts`.
  Każdy nowy outbound `fetch` musi mieć `AbortSignal.timeout(...)`.

## 7. Styl pracy

- **Jeden PR = jeden wąski zakres.** Migracja 11 komponentów to 11 PR-ów, nie jeden.
- Opis PR-a po polsku: co, dlaczego, jak zweryfikowane.
- Trzymaj się konwencji sąsiadującego kodu (importy względne, nazewnictwo, gęstość komentarzy).
- Komentarze pisz tylko tam, gdzie wyjaśniają *dlaczego*, nie *co*.
- Nie zostawiaj martwego kodu „na przyszłość" — usuwaj.
