---
name: steward
description: Konwencje pracy nad pull requestem w CVelocity — bramka weryfikacji przed pushem, forma opisu PR, reakcja na CI i recenzje, higiena gałęzi po merge'u.
---

# Prowadzenie pull requesta w CVelocity

## Zanim wypchniesz cokolwiek

```bash
npm run lint && npm test && npm run build
```

To ta sama bramka co w `.github/workflows/ci.yml`, więc push bez niej to
zgadywanie. `lint` obejmuje `tsc --noEmit` i **musi kończyć się zerem błędów** —
ostrzeżenia w plikach, których nie ruszałeś, są zastane i nie blokują.
Ruszałeś `semantic-work-graph/`? Odpal jego testy osobno, z jego katalogu; CI
ich nie uruchamia i nikt inny tego nie zrobi.

Przy zmianie wydajnościowej podaj liczbę przed i po. Pomiar ma przejść przez
prawdziwy mechanizm, nie przez wzór szacujący wynik (reguła 6).

## Opis PR-a

Po polsku. Ma mówić **dlaczego**, nie tylko **co**:

- co było źle i skąd to wiadomo — najlepiej z odwołaniem do pliku i linii;
- co się zmienia i dlaczego akurat tak;
- czego świadomie **nie** ruszasz i dlaczego (to często najcenniejsza część);
- wynik bramki: lint, liczba testów, build.

Jeśli odszedłeś od treści zadania, uzasadnij to dowodem z kodu. Nie wpisuj do
repozytorium identyfikatorów modelu ani nazw marketingowych — to zostaje w czacie.

## Reakcja na CI i recenzje

Czerwone CI na PR-ze, który prowadzisz, to praca teraz, niezależnie od stanu
recenzji. Zdiagnozuj przyczynę, zanim cokolwiek wypchniesz — „flake" nie jest
przyczyną. **Nigdy nie wyłączaj ani nie pomijaj testu, żeby zazielenić build**;
w tym repo istnieje osobny commit nazwany „fałszywe 100% ATS" i to jest dokładnie
ten gatunek błędu.

Uwagi recenzenta: drobne i lokalne wdrażaj i wypychaj. Przy większych — opisz
propozycję, decyzję zostaw autorowi. Znaleziska botów recenzujących traktuj jak
zgłoszenia błędów: zweryfikuj, popraw drobne, o większych napisz raz z propozycją.

## Po merge'u

Skasuj gałąź. Nie zostawiaj jej „na wszelki wypadek" — repozytorium ma za sobą
37 gałęzi, z których najstarsza była 104 commity w tyle, i właśnie z tego wzięła
się reguła 10. Stan gałęzi raportuje cotygodniowo
`.github/workflows/higiena-galezi.yml`.

Jeśli PR wprowadził obserwację wartą zapamiętania, ale nienaprawioną — dopisz ją
do sekcji „🆕 Nowe" w `NOTATKI.md`, zamiast zostawiać w opisie PR-a, gdzie nikt
do niej nie wróci.
