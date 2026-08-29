-- Gamifikacja została wycofana z produktu. Historyczną tabelę zachowujemy na
-- czas kontrolowanego wdrożenia, ale przeglądarka nie powinna już móc jej
-- odczytać przez Data API. Fizyczne usunięcie danych wymaga osobnej decyzji
-- i kopii zapasowej.

revoke all privileges on table public.user_gamification from anon, authenticated;

drop policy if exists "Wlasna gamifikacja - odczyt"
  on public.user_gamification;
