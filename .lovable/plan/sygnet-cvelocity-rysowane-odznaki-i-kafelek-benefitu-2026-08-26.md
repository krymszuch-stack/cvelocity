# Sygnet CVelocity, rysowane odznaki i kafelek benefitu

## Stan faktyczny (sprawdzony w kodzie)

- Logo istnieje już jako `src/components/CVelocityLogo.tsx` (uproszczona geometria: jedna pętla C, jeden chevron V, bez linii pędu). Używają go `Sidebar.tsx` (warianty pełny i `collapsed`) oraz `MobileSidebar.tsx`. Kolory bierze z tokenów `--mark-ink` / `--mark-accent` / `--mark-tile-grad` w `src/styles/tokens.css` (osobne wartości dla jasnego i ciemnego motywu).
- Rysowane odznaki istnieją jako `src/components/icons/HandDrawnBadges.tsx` (`BadgeMultiSport`, `BadgeLuxmed`, `BadgeDrivingLicense`, `BadgeCommute`, `BadgeFood`, `BadgeEquipment`, mapa `BADGE_ICONS`), `strokeWidth 1.8`, akcent `#F26440`.
- Kafelek benefitu nie jest osobnym komponentem — jest wpleciony w `JobFeasibilityAdvisor.tsx` (siatka `grid-cols-3`, `min-h-[6.5rem]`, stany PROVIDED / brak).

Czyli: nie tworzymy tych rzeczy od zera, tylko podnosimy je do poziomu ze specyfikacji.

## Co zrobię

### 1. Sygnet w nowej geometrii
- Nowy `src/components/brand/CVelocityMark.tsx` — czysty sygnet z pełną geometrią ze specyfikacji: podwójna pętla C pod maską przeplotu, podwójny chevron V (drugi `opacity 0.85`), trzy linie pędu, `skewX(-10)`, `strokeWidth 17`.
- `id` maski przez `useId()` (nie statyczne `cvel-mask-prod`) — dwa egzemplarze na stronie (pasek boczny + mobilny) kolidowałyby maskami; ten błąd jest już opisany w komentarzu obecnego logo.
- Kolory z tokenów `--mark-ink` / `--mark-accent` zamiast zaszytego `onDark` na sztywno: motyw już steruje tymi wartościami, a druga równoległa definicja kolorów łamałaby zasadę jednego źródła prawdy. Prop `onDark` zostawię jako opcjonalne nadpisanie dla powierzchni, które zawsze są ciemne.
- `src/components/brand/CVelocityLogo.tsx` — kafelek (gradient, `border-slate-700/60`, `rounded-xl`, poświata koralowa), sygnet, typografia `CVELOCITY` i odznaka `v2.0` (`font-mono`, `text-[9px]`). Obsługa `collapsed` (sam kafelek) i `showBadge`.
- Stary `src/components/CVelocityLogo.tsx` zostaje jako re-eksport z nowej ścieżki albo znika, a `Sidebar.tsx` i `MobileSidebar.tsx` importują z `brand/` — bez dwóch kopii znaku.
- W pasku bocznym potwierdzę, że przejście rozwinięty → zwinięty nie przeskakuje: kafelek ma stałą wysokość, napis znika, a nie zwęża się.

### 2. Rozbudowa rysowanych odznak
W `HandDrawnBadges.tsx`, bez zmiany nazw eksportów i mapy `BADGE_ICONS` (używa jej kokpit):
- MultiSport: do hantla dochodzi gwiazdka energii w koralu.
- LuxMed: tarcza dostaje serce, linie w morskim `#38BDF8` obok granatu.
- Prawo jazdy: wyraźniejsza kierownica + plakietka z literą kategorii, sterowana nowym opcjonalnym propem `category` (`B` domyślnie, także `C` / `UDT` / `SEP`) — domena to prace fizyczne, nie tylko kierowcy.
- Dojazd: korek i chmurka spalin przy zegarze.
- Wyżywienie: sztućce i para w kształcie serca nad miską.
- Sprzęt: monitor + krzesło + kubek.
Grubość kreski trzymam w paśmie 1.8–2.2, `strokeLinecap`/`strokeLinejoin` na `round`.

### 3. `BenefitBadgeCard.tsx`
Nowy reużywalny komponent (`src/components/benefits/BenefitBadgeCard.tsx`): `p-3 rounded-xl border transition-all duration-200 flex items-center gap-3`, ikona w stałym `w-10 h-10`, stan „zapewnione” (koralowa ramka + poświata + wskaźnik statusu) i „brak / do negocjacji” (`opacity-60 grayscale hover:grayscale-0`). Tooltip i treść opisu wchodzą propsami, żeby logika wykrywania benefitów została w `commuteCalculator.ts`.

### 4. Integracja
- `JobFeasibilityAdvisor.tsx`: siatka benefitów przechodzi na `BenefitBadgeCard` — te same dane z `detectBenefits`, zero zmian w logice liczenia.
- Przegląd `JobMatcher.tsx` i sąsiadujących nagłówków pod kątem ikon zastępczych; wymieniam tylko te, które faktycznie tam są, i wypiszę je w podsumowaniu.
- Kolory kart trzymam na tokenach/klasach semantycznych tam, gdzie już są; wartości z briefu (`#F26440`, `#1E3A5F`) wchodzą przez istniejące tokeny marki.

### 5. Weryfikacja
- `npm run lint` (to jednocześnie kontrola typów) i `npm test`.
- Zrzuty z Playwright: pasek boczny rozwinięty i zwinięty, jasny i ciemny motyw, siatka benefitów ze stanem mieszanym.

## Poza zakresem
Bez zmian w `src/lib/*`, bez zmian w wykrywaniu benefitów, bez ruszania stanu Zustand i backendu.
