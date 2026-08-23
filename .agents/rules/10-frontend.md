---
trigger: glob
globs: src/features/**/*.tsx, src/components/**/*.tsx, src/views/**/*.tsx
---

# Warstwa wizualna

Kanon: **@../../AGENTS.md**, sekcja „Konwencje, które łatwo złamać nieświadomie".
Poniżej tylko to, co dotyczy wyłącznie tego katalogu.

## Kolory biorą się z tokenów

Palety są w `src/styles/tokens.css` (`ink`, `muted`, `subtle`, `line`, `surface`,
`elevated`, `sunken`, `brand-*`, `success-*`, `warning-*`, `violet`). Nie wpisuj
wartości koloru do komponentu — token nieobecny w `tokens.css` dopisuje się tam,
a nie obchodzi klasą z konkretnym odcieniem.

Komponenty bazowe są w `src/components/ui/` (`Card`, `Chip`, `Button`, `Alert`,
`EmptyState`, `Modal`, `Tabs`). Zanim napiszesz własny modal albo własną odznakę,
sprawdź, czy nie ma jej tam — reguła 3.

## Pułapka: kartka A4 musi zostać biała

Renderery CV rysują dokument do druku i eksportu PDF. **Ciało kartki zostaje
białe także w trybie ciemnym.** Podmiana jego kolorów na tokeny motywu przechodzi
lint, przechodzi build i psuje eksport — CI tego nie wyłapie, bo nie renderuje
PDF-a. To jedna z pozycji czerwonej listy w
[`docs/agents/delegowanie.md`](../../docs/agents/delegowanie.md).

## Dane do widoku

Widok nie zmyśla treści. Jeśli nie ma czego pokazać, idzie `EmptyState`, a nie
przykładowy rekord — reguła 1. W tym pliku historia jest świeża: widok ściągi na
rozmowę pokazywał zahardkodowane pola STAR jako doświadczenie kandydata, dopóki
PR #87 nie podpiął go pod prawdziwy silnik.

Zapytania do API wyłącznie przez `src/lib/apiClient.ts` — żadnego `fetch`
w komponencie.
