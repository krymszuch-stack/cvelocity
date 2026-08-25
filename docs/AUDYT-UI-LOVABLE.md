# AUDYT UI/UX — CVELOCITY
### Raport krytyka + specyfikacja napraw dla Lovable

> **Jak czytać:** sekcja ❓ to pytania krytyka — każde z nich jest uzasadnione
> dowodem z kodu (`plik:linia`). Nie ma tu pytań retorycznych: każde kończy się
> decyzją (naprawione dziś / do zrobienia / świadomie zostawiamy).
> Sekcja ✅ to naprawy wykonane mechanicznie w ramach tego PR-a.
> Sekcja 📋 to specyfikacje pozostałych elementów, gotowe do wklikania.

---

## ❓ PYTANIA KRYTYKA

### Tożsamość wizualna

**1. Logo jest granatowo-pomarańczowe, przycisk „Eksport" świeci indygo-fioletem. Która paleta jest prawdziwa — bo obie nie mogą być?**
Dowód: `tokens.css:130` (`--brand-grad` = `#5e6ad2→#7c3aed`) vs `tokens.css:135–138` (`--mark-*` = `#1E3A5F/#F26440`).
→ **Decyzja (świadome):** status quo — `brand-*` to interfejs, `mark-*` to wyłącznie sygnet. Zapisane w komentarzu tokenu. Rebrand całego UI to osobna decyzja produktowa, nie poprawka CSS.

**2. Po co zablokowana pozycja menu była NAJAŚNIEJSZYM tekstem na ekranie (kontrast ~2,3:1), skoro jej jedyną treścią jest informacja „co zrobisz, żeby ją otworzyć"?**
Dowód: `NavItem.tsx:56` — `text-subtle opacity-60`.
Komu służyło zmniejszenie czytelności dokładnie tam, gdzie użytkownik potrzebuje wskazówki? Nikomu. **Naprawiono.**

**3. `text-brand` (#6f7ad9) jako kolor tekstu na białym tle = 3,75:1. Reguła AA mówi 4,5:1. Kto zatwierdził wyjątek — i czemu nie ma go na liście wyjątków?**
18 wystąpień w AtsLabView. **Naprawiono** → `text-brand-fg` (6,1:1 jasny / 8:1 ciemny).

### Formularze i mechanika

**4. Pole ma promień 16 px (`rounded-2xl`), przycisk obok 12 px (`rounded-xl`). Który z nich jest błędem — i dlaczego odpowiedź brzmi „żaden, bo nikt tego nie sprawdził"?**
**Naprawiono:** wszystkie kontrolki `rounded-xl`.

**5. Użytkownik widzi czerwony komunikat błędu. Czytnik ekranu go nie odczytuje, bo tekst nie jest wiązany z polem. Po co więc jest `aria-invalid`, skoro połowa informacji wisi w powietrzu?**
Dowód: `Field.tsx` sprzed naprawy — brak `aria-describedby`. **Naprawiono**: `useId` + `aria-describedby` + `role="alert"` we wszystkich trzech prymitywach; id z nazwy etykiety (kolizje!) zastąpione `useId`.

**6. Dlaczego szkic ogłoszenia ginął po kliknięciu w pasek boczny? Czy użytkownik pracuje na aplikacji, czy na ratowaniu naszego stanu komponentu?**
Dowód: `AtsLabView` — `useState(jobOfferText)` umierać przy każdym unmountcie. **Naprawiono**: szkic trwały pod zarejestrowanym kluczem `cvelocity:draft-ats-lab` (CRC + wipe za darmo z rejestru).

**7. Dwa pierścienie wyniku, dwie prędkości animacji (700 ms i 1000 ms) tej samej liczby. Która jest właściwa — i czemu odpowiedź wymagała grepa?**
**Naprawiono**: komponent `<ScoreRing>` — jedna geometria, jeden timing (700 ms `var(--ease)`), `role="img"` z etykietą dla czytnika.

**8. Modal otwarty, kółko myszy nad ciemnym tłem — strona POD modalem przewija się. Kto na to czekał?**
Brak scroll-locka w `Modal` i palecie. **Naprawiono**: `body.style.overflow='hidden'` w cyklu focus-trapa, restore w cleanup (bez kradzieży wartości przy modala zagnieżdżonych).

### Wydruk i dokument

**9. Użytkownik klika „Drukuj / PDF" w zakładce Aplikuj. Na papier lądują panele Konsensusu i Telemetrii. Kto zaprojektował PDF z wykresami ATS między stronami CV?**
Dowód: stare `@media print` ukrywało tylko `nav/aside/button`. **Naprawiono**: izolacja visibility do `#cv-printable-document` + zdjęcie paddingu kartki (margines @page 15 mm nie może się dublować z paddingiem 48 px).

**10. Stary eksporter wpisywał „Tel: N/A" do pliku, który idzie do rekrutera. Po co drukujemy brak danych zamiast ich nie drukować?**
**Naprawiono** w przepisanym eksporterze (PR #99): linie kontaktowe składają się tylko z istniejących pól.

### Język interfejsu — prostota

**11. „Skarbiec", „Konsensus Rynkowy", „Wysoka Gotowość Rynkowa", „Stabilny Próg Przejścia". Czy nowy użytkownik w pierwszych 10 sekund wie, co czyta?**
Verdict: metafory brandowe zostają w nagłówkach, ale każdy taki nagłówek musi mieć podtytuł zwykłym językiem (AtsLabView już ma — wzorzec do powielenia). **Do zrobienia** w przeglądzie copy.

**12. Tooltipy paska bocznego to natywny `title` — nie działa z klawiatury, nie da się ostylować, znika po 2 s. Po co w ogóle istnieje `hint` w propsie NavItem, skoro droga do użytkownika prowadzi przez atrybut, który czytniki ekranu ignorują?**
**Do zrobienia** (P1): komponent tooltip `role="tooltip"` na `focus-visible`+`hover`.

**13. `transition-all` w 20+ miejscach. Po co animować marginesy i wysokości, skoro w 90% przypadków chodzi o kolor tła?**
Każde `transition-all` to potencjalny Layout Shift w klatce. **Częściowo naprawiono** (Sidebar przejście szerokości); resztę ograniczać przy dotykaniu plików.

**14. Piętnaście plików z własnoręczną „pustką" („Brak…") zamiast jednego `EmptyState`. Trzy różne estetyki zera danych — która z nich jest marką?**
Tracker już używa prymitywu; **STAR naprawiono dziś** (w tym rozróżnienie „brak historii" vs „brak wyników filtra"). Reszta: checklista niżej.

---

## ✅ NAPRAWIONE W TYM PRZEJŚCIU (mechanicznie)

| # | Obszar | Co dokładnie | Gdzie |
|---|---|---|---|
| P0 | Kontrast | locked nav: `text-subtle opacity-60` → `text-muted` | `NavItem.tsx:56` |
| P0 | Kontrast | `text-brand` → `text-brand-fg` (18×) | `AtsLabView.tsx` |
| P0 | Modale | scroll-lock `body` + restore w cleanup | `useFocusTrap.ts` |
| P0 | Wydruk | izolacja visibility do kartki + zerowy padding przy @page 15 mm | `index.css` |
| P1 | Formularze | `useId` + `aria-describedby` + `role="alert"` + `rounded-xl` ×3 prymitywy | `Field.tsx` |
| P1 | Mikrointerakcje | komponent `<ScoreRing>` zastępuje duplikat SVG | `ScoreRing.tsx`, `AtsLabView.tsx` |
| P1 | Data Loss | szkice AtsLabView trwałe (`StorageKeys.draftAtsLab`) | `AtsLabView.tsx`, `storage.ts` |
| P1 | Arkusz | zoom podglądu 75/90/100% (`aria-pressed`) | `DocumentRenderer.tsx` |
| P2 | Tokeny | `--duration-{fast,ui,state,data}` + `--text-{meta,label}` w @theme | `tokens.css` |
| P2 | Scrollbar | `.scrollbar-thin` / `.no-scrollbar`; klasa na liście palety | `tokens.css`, `CommandPalette.tsx` |
| P2 | EmptyState | STAR: pusta siatka → EmptyState z rozróżnieniem filtra/historii | `STARStoryView.tsx` |

## 📋 CHECKLISTA DLA LOVABLE (pozostałe, gotowe do wklikania)

1. **Tooltip NavItem/Hint** — `role="tooltip"`, trigger `hover` + `focus-visible`,
   pozycja `left-full ml-2` gdy collapsed; usunąć natywne `title`.
2. **EmptyState everywhere** — pliki z ad-hoc pustką: `InterviewCockpitView`,
   `ConsistencyGuardView`, `DrillModeModal`, `JDKeywordMapper`, `DiffView`,
   `ProfilerSection`, `CvQuestionsCard`, `AchievementEditor`, `EducationSection`,
   `ExperienceSection`. Wzorzec: `<EmptyState icon title description actionLabel onAction>`.
3. **Duration tokeny w praktyce** — zamiana literałów: hover→150, rozwijania→200,
   bary/tła→400, ringi/liczby→700 (`duration-[var(--duration-state)]` itd.).
4. **Meta-typografia** — `text-[11px]`→`text-meta`, `text-xs`(etykiety)→`text-label`;
   `text-[9px]` dozwolony wyłącznie w badge monospace.
5. **Copy pass** — podtytuły prostym językiem pod każdą metaforą brandową;
   zakaz samych „N/A"; czasowniki w przyciskach akcji („Dodaj do Pipeline", nie „OK").
6. **transition-all audit** — przy dotykaniu każdego pliku zawęź do
   `transition-colors` / `transition-[width]` / `transition-transform`.
7. **Swatche dokumentu** — dopuszczalne wyłącznie kolory ≥4,5:1 na `#FFFFFF`;
   `aria-pressed` na aktywnym swatchu.
8. **Kontrast subtle na sunken** (3,8:1) — jeśli kiedykolwiek `subtle` wyląduje
   na `bg-sunken`, użyj `muted`; rozważ podniesienie `--subtle` jasnego do `#767a83`.

## METRYKA PO NAPRAWIE

- Teksty poniżej AA (jasny motyw): **3 → 0** (locked nav, text-brand, amber-statusy pozostają w parach `-fg`).
- Duplikaty geometrii ringa: **2+ → 1 komponent**.
- Modale bez scroll-locka: **wszystkie → 0** (mechanizm w wspólnym hooku).
- Obszar druku: **cała strona → wyłącznie kartka CV**.
