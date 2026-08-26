# Plan: odporność i dostępność Doradcy AI

## Cel
Doradca AI ma otwierać się bez pustego ekranu przy chwilowych awariach chunka, raportować incydenty do Sentry, zachowywać rozmowę w obrębie sesji i działać w pełni z klawiatury oraz czytnikiem ekranu.

## Zakres zmian

1. **Monitoring błędów chunka w Sentry**
   - Dodać przeglądarkowe SDK Sentry i uruchamiać je tylko wtedy, gdy skonfigurowano publiczny `VITE_SENTRY_DSN`.
   - Wydzielić klienta monitoringu, aby `ChunkErrorBoundary` nie zależał bezpośrednio od dostawcy.
   - Raportować błąd z nazwą modułu/chunka, komunikatem, stack trace oraz React `componentStack`; oznaczyć próbę i typ błędu tagami.
   - Nie wysyłać treści rozmowy ani danych z vaulta.

2. **Ponawianie dynamicznego importu**
   - Zastąpić pojedynczy import współdzielonym loaderem obsługującym preload i render.
   - Dodać ograniczone ponawianie tylko dla błędów ładowania modułu: maksymalnie 3 próby, opóźnienia wykładnicze 500 ms i 1000 ms z niewielkim jitterem.
   - Po wyczerpaniu prób przekazać błąd do `ChunkErrorBoundary`; ręczne „Spróbuj ponownie” wyzeruje odrzucony cache i uruchomi nowy cykl prób.
   - Pokazać użytkownikowi numer próby/status ponawiania bez blokowania możliwości zamknięcia.

3. **Focus i ARIA hosta, loadera i błędu**
   - Nadać skeletonowi semantykę modala (`role="dialog"`, `aria-modal`, własny tytuł/opis, `aria-busy` i żywy status dla czytnika).
   - Użyć istniejącego mechanizmu focus trap również podczas ładowania i w ekranie błędu; Escape zamknie host.
   - Zachować element wywołujący przed rozpoczęciem ładowania i przywrócić na niego fokus po zamknięciu, bez podwójnego przejmowania fokusu po przejściu skeleton → modal.
   - Uzupełnić widoczne focus ringi i dostępne nazwy kontrolek Doradcy.

4. **Cache historii rozmowy**
   - Dodać klucz do centralnego rejestru `src/lib/storage.ts`; cache będzie objęty „usuń moje dane”.
   - Wydzielić serializację i walidację cache: wiadomości, szkic pola oraz czas zapisu; bez vaulta i bez danych konfiguracyjnych.
   - Odtwarzać historię po ponownym otwarciu w tej samej sesji i zapisywać ją po zmianach; ustawić limit liczby wiadomości/rozmiaru, aby cache nie rósł bez końca.
   - Dodać w modalu jawną akcję rozpoczęcia nowej rozmowy, która czyści cache.

5. **Testy i weryfikacja**
   - Testy jednostkowe loadera: sukces po chwilowej awarii, limit prób, reset po ręcznym ponowieniu.
   - Testy cache: poprawny odczyt/zapis, odrzucenie uszkodzonego kształtu i czyszczenie wraz z profilem.
   - Rozszerzyć E2E Doradcy o: focus trap, Escape i powrót fokusu, semantykę loadera oraz zachowanie historii po zamknięciu i ponownym otwarciu; nadal failować na błędach konsoli/chunka.
   - Uruchomić bramkę `npm run lint`, testy celowane, pełne `npm test` i E2E na działającym podglądzie.

## Konfiguracja
- Dodać do `.env.example` opcjonalny `VITE_SENTRY_DSN` (DSN Sentry jest identyfikatorem publicznym dla klienta, nie prywatnym kluczem).
- Bez tej zmiennej monitoring pozostaje bezpiecznym no-opem i aplikacja działa lokalnie bez ostrych błędów.

## Założenia
- „Ostatnie pobrane dane” oznaczają zgodnie z wyborem historię rozmowy i szkic pola; obecny modal nie wykonuje requestów do API i nie będę w tym zadaniu dodawać fikcyjnego ani nowego backendu.
- Cache obowiązuje w obrębie sesji przeglądarki i nie synchronizuje rozmów między urządzeniami.
