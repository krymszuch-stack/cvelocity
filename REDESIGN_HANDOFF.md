# CVELOCITY — Redesign Handoff

Stan na: 2026-08-03. Branch: `chore/cleanup-dead-code-docs`.
Ten dokument opisuje **niedokończony redesign UI**. Czytaj go w całości przed pierwszą zmianą.

---

## 1. Cel i decyzje projektowe (zatwierdzone przez właściciela)

| Decyzja | Wybór |
|---|---|
| Motyw | **Dual light + dark z przełącznikiem** (nie tylko dark) |
| Nawigacja | **Lewy sidebar + topbar** (zamiast dawnego górnego paska z zakładkami) |
| Zakres | **Całość** — wszystkie widoki i modale, etapami |

Inspiracja stylistyczna: Linear / Vercel (dark), Stripe / Notion (light).

---

## 2. Co jest JUŻ ZROBIONE (nie rób tego drugi raz)

### Design system — gotowy, jest kontraktem dla reszty pracy
- **`src/index.css`** — pełny system tokenów. Dwie warstwy:
  1. `--sv-*` = surowa paleta, przełączana przez `[data-theme='light'|'dark']`
  2. `@theme --color-*` = tokeny Tailwinda wskazujące na warstwę 1 → każda klasa (`bg-surface`, `text-muted`) jest automatycznie reaktywna na motyw.
  Zawiera też: cienie, animacje (`animate-fade-in`, `animate-scale-in`, `.stagger`), `.sv-glass`, `.sv-skeleton`, `.sv-tnum`, scrollbar, focus-visible, `prefers-reduced-motion`.
- **`src/context/ThemeContext.tsx`** — `ThemeProvider` + `useTheme()`. Zapis w `localStorage['cvelocity_theme']`, fallback do preferencji systemu.
- **`index.html`** — inline script ustawiający `data-theme` **przed pierwszym malowaniem** (brak mignięcia złym motywem). Nie usuwaj.

### Komponenty bazowe (`src/components/ui/`) — używaj ich, nie pisz nowych wariantów
| Plik | Eksporty |
|---|---|
| `Button.tsx` | `Button` (variant: primary/secondary/ghost/outline/danger/success/warning; size xs–lg; `icon`, `loading`, `fullWidth`), `IconButton` |
| `Card.tsx` | `Card` (tone raised/flat/glass), `CardHeader`, `PageHeader` |
| `Field.tsx` | `Input`, `Textarea`, `Select`, `Toggle`, `FieldWrap` |
| `Modal.tsx` | `Modal` (portal, Esc, scroll-lock, focus, `size`, `footer`, `dismissable`) |
| `Feedback.tsx` | `EmptyState`, `Alert`, `ProgressBar`, `ScoreRing`, `StatTile`, `Skeleton` |
| `StatusBadge.tsx` | `StatusBadge`, `Chip` |
| `Tabs.tsx` | `Tabs` (variant pill / underline) |
| `ThemeToggle.tsx` | `ThemeToggle` |
| `AdvisorButton.tsx` | `AdvisorButton` (istniał wcześniej) |

### Powłoka aplikacji
- **`src/components/shell/Sidebar.tsx`** — sidebar, zwijany, drawer na mobile, `NAV_ITEMS` (źródło prawdy o sekcjach).
- **`src/components/shell/Topbar.tsx`** — kontekst sekcji, licznik tokenów, `ThemeToggle`, profil/logowanie.
- **`src/App.tsx`** — przepięty na `flex` shell; owinięty w `ThemeProvider`; `key={activeTab}` na `<main>` (animacja wejścia + reset stanu widoku).
- Usunięty `src/components/Header.tsx` (zastąpiony) i `src/components/ui/PanelHeader.tsx` (był martwy).
- Dodany typ `AppTab` w `src/types/index.ts`.

### Widoki już przestylowane (0 zaszytych kolorów)
- `JobMatcher.tsx` — **przepisany**, patrz też §3.
- `RealtimeLivePreview.tsx` — pasek statusu + `Tabs`.
- `AutocompleteInput.tsx` — przepisany, **prop `darkTheme` usunięty** (tokeny załatwiają motyw).

### Naprawione błędy
- **Skaczący wynik ATS** (`src/lib/slotFillingEngine.ts`) — `fillSlotSentence` losowało synonim przez `Math.random()` przy każdym wywołaniu. Ponieważ jego wynik karmi `simulateAtsCheck`, wynik ATS skakał (30 → 100 → 1) przy każdym re-renderze bez akcji użytkownika. Zastąpione deterministycznym hashem FNV-1a (`stableIndex`). Test regresyjny: `src/lib/__tests__/slot_filling_determinism.test.ts`.
- **Martwy kod w `JobMatcher`** — `isLivePreviewMode` było zawsze `true`, więc ~300 linii (zakładki, `runHybridPipeline`, `tailoredResume`, `atsResult`, `coverLetter`, `logs`) było nieosiągalne. Usunięte. Realny UI renderuje `RealtimeLivePreview`.
- **Sekcja „Profiler” była nieosiągalna** — `App.tsx` ją obsługiwał, ale stary Header nie miał przycisku. Sidebar to naprawia.
- `onUpdateStats` było martwym drutem → teraz wywoływane po udanym pobraniu oferty z URL, więc licznik tokenów faktycznie się odświeża.

---

## 3. CO ZOSTAŁO DO ZROBIENIA

Pozostałe pliki wciąż mają **zaszyte klasy** (`bg-white`, `text-slate-600`, `indigo-*`…), więc **w trybie dark wyglądają źle**. To jest główna reszta pracy.

Liczba zaszytych klas na plik (stan wyjściowy):

| Plik | ~klas | Uwagi |
|---|---|---|
| `MasterVaultEditor.tsx` | 613 | Największy (2943 linie). Rozbij przy okazji na podkomponenty sekcji. |
| `DocumentRenderer.tsx` | 263 | ⚠️ **UWAGA** — patrz §4 |
| `CVWordBuilder.tsx` | 191 | ⚠️ **UWAGA** — patrz §4 |
| `GeminiAdvisorModal.tsx` | 157 | Przepnij na `Modal` |
| `JDParserModal.tsx` | 112 | Przepnij na `Modal` |
| `AuthModal.tsx` | 107 | Przepnij na `Modal`; ma ekran 2FA (`dismissable={false}`) |
| `CVParserModal.tsx` | 97 | Mimo nazwy renderuje się jako **strona** (zakładka „Wczytaj Plik”), nie modal |
| `AtsSimulatorView.tsx` | 96 | Użyj `ScoreRing` + `ProgressBar` + `StatTile` |
| `CoverLetterView.tsx` | 84 | |
| `ProfilerSection.tsx` | 74 | Użyj `Toggle`, `Select`, `Card` |
| `TokenStatsWidget.tsx` | 44 | Przepnij na `Modal` + `StatTile` |

### Kolejność rekomendowana
1. `TokenStatsWidget`, `ProfilerSection`, `AtsSimulatorView`, `CoverLetterView` (małe, szybkie wygrane)
2. `AuthModal`, `JDParserModal`, `GeminiAdvisorModal`, `CVParserModal` (przepięcie na `Modal`)
3. `CVWordBuilder`, `DocumentRenderer` (ostrożnie — §4)
4. `MasterVaultEditor` (największy; zrób na końcu, rozbijając na pliki)

---

## 4. ⚠️ PUŁAPKI — przeczytaj zanim ruszysz te pliki

### Kartka CV MUSI zostać biała w obu motywach
`DocumentRenderer.tsx` i `CVWordBuilder.tsx` renderują podgląd **dokumentu A4** (`w-[210mm] min-h-[297mm]`, klasa `printable-area`, drukowany przez `window.print()` i eksportowany do PDF).

- `DocumentRenderer.tsx:740` — kontener kartki; tło pochodzi z **wybieranej przez użytkownika palety papieru** (`PAPER_BACKGROUNDS`).
- `CVWordBuilder.tsx:652` — kontener kartki (`bg-white`).

**Nie zamieniaj kolorów wewnątrz kartki na tokeny motywu.** Inaczej w trybie dark tekst zrobi się jasny na białym papierze = nieczytelne CV i zepsuty PDF. Zamieniaj **wyłącznie chrome** dookoła (toolbary, modale, panele boczne).

W `DocumentRenderer.tsx` chrome to m.in. linie ~484, ~616, ~688, ~1233, ~1290, ~1361. Reszta (~740–1220) to treść dokumentu — zostaw.

### Inne
- `text-white` na kolorowych przyciskach/gradientach jest **poprawne** — nie zamieniaj go na `text-ink`.
- Nie używaj `bg-slate-*` / `indigo-*` w nowym kodzie. Jeśli brakuje Ci tokena — dodaj go do `index.css`, nie obchodź systemu.
- `emerald` = wyłącznie sukces/status, **nigdy** jako kolor marki. Marka to indigo (`brand-*`).

### Mapowanie klas → tokeny (ściąga)
```
bg-white → bg-surface          bg-slate-50/100 → bg-sunken
bg-slate-900 → bg-surface      bg-slate-800 → bg-raised     bg-slate-950 → bg-canvas
text-slate-900/800 → text-ink  text-slate-700/600 → text-muted   text-slate-500/400 → text-subtle
border-slate-200/700/800 → border-line    border-slate-300 → border-line-strong
indigo|blue|cyan|violet-* → brand-*
emerald|green-* → success-*    amber|yellow-* → warning-*   red|rose-* → danger-*
tła miękkie: bg-{brand,success,warning,danger}-soft
tekst na tłach miękkich: text-{brand,success,warning,danger}-fg
liczby/wyniki: dodaj klasę sv-tnum (tabular numerals)
```

---

## 5. Weryfikacja przed zakończeniem

```bash
npm run lint && npm run build && npx vitest run
```

Wszystkie trzy muszą przechodzić (obecnie: ✅ 0 błędów, 20/20 testów).

Wizualnie sprawdź **oba motywy** — przełącznik jest w topbarze po prawej. Serwer dev: `npm run dev` → http://localhost:3000.
Zwróć uwagę na: kontrast tekstu, obramowania kart, modale, oraz czy podgląd CV nadal jest białą kartką w trybie dark.

## 6. Zaległości spoza redesignu (niższy priorytet)
- Bundle `index-*.js` waży 2.8 MB (799 kB gzip) — brak code-splittingu. Warto `dynamic import()` dla `pdfjs-dist`, `docx`, `jspdf`, `html2canvas`.
- `firebase.json` konfiguruje tylko hosting statyczny — endpointy `/api/*` (`server.ts`) wymagają osobnego hosta Node (Render/Cloud Run/Railway). Albo dodaj Cloud Functions, albo zostaw jak jest (README już to opisuje poprawnie).
