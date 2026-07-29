# Semantic Work Graph (`semantic-work-graph`)

Niezależny silnik semantyczny i graf wiedzy o profesjach, kompetencjach, narzędziach, urządzeniach, markach, technologiach i branżach.

## Cechy Systemu
- **Brak zgadywania kwalifikacji:** Pozwala odkrywać semantyczne powiązania relacyjne i stopień pewności (`confidence`), bez automatycznego przydzielania uprawnień użytkownikowi.
- **Weryfikowana propozycja Gemini:** Wszystkie sugestie pochodzące z Gemini API są niezweryfikowane (`status: 'proposed'`), dopóki nie zostaną zaakceptowane przez moderatora/właściciela.
- **Trwałość danych:** SQLite (`data/swg.db`) + Zod do walidacji danych i odpowiedzi modeli AI.
- **Auto-generowanie dokumentacji:** Automatyczna konwersja danych z bazy/JSON do czytelnej dokumentacji Markdown (`data/generated/knowledge-map.md` oraz `data/seed/professions-top-100.pl.md`).

## Szybki Start

```bash
# Instalacja zależności
npm install

# Import danych początkowych (Seed TOP 100 Profesji)
npm run seed:import

# Wygenerowanie dokumentów Markdown
npm run seed:export-md

# Uruchomienie testów jednostkowych
npm test
```

## Przykłady Użycia CLI

```bash
# Szukanie terminu / aliasu / pojęcia
npx swg search "piecyk gazowy"

# Szukanie ścieżki powiązań w grafie (pathfinding)
npx swg path "monter instalacji grzewczych" "Junkers"

# Generowanie propozycji wzbogacenia grafu przez Gemini API
npx swg enrich "serwisant kotłów gazowych"

# Przegląd i zatwierdzanie propozycji
npx swg proposal:list
npx swg proposal:approve <id>
```
