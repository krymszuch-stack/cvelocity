# Polityka prywatności CVELOCITY

> **Status: szkic do przeglądu prawnego.** Opisuje stan faktyczny kodu, nie stan docelowy. Przed opublikowaniem na stronie wymaga weryfikacji przez prawnika i uzupełnienia danych rejestrowych.
>
> Obowiązuje ta sama zasada co w `SECURITY.md`: **żadnego twierdzenia, którego nie da się wskazać palcem w kodzie.**

**Ostatnia aktualizacja:** do uzupełnienia przy publikacji

---

## 1. Kto jest administratorem

Administratorem Twoich danych jest Adrian Koziński (dane rejestrowe do uzupełnienia po założeniu działalności).

Kontakt w sprawach danych osobowych: `krymszuch00@outlook.com`

Nie wyznaczono inspektora ochrony danych — przy tej skali przetwarzania nie jest to wymagane.

---

## 2. Najważniejsze w trzech zdaniach

CVELOCITY działa dziś **w Twojej przeglądarce**. Twoje CV, profil i wyniki analizy ATS zostają na Twoim urządzeniu i nie są wysyłane na żaden serwer. Jedyne, co opuszcza przeglądarkę, to **treść ogłoszenia o pracę**, które sam wskażesz — i tylko wtedy, gdy poprosisz o jego analizę.

---

## 3. Jakie dane przetwarzamy i po co

### 3.1 Dane, które zostają na Twoim urządzeniu

| Dane | Gdzie | Po co |
|---|---|---|
| Imię, e-mail (opcjonalny), treść CV, doświadczenie, wykształcenie, umiejętności | `localStorage` Twojej przeglądarki | Żebyś nie musiał wpisywać wszystkiego od nowa przy każdej wizycie |
| Wynik oceny ATS, historia aplikacji | `localStorage` | Działanie funkcji aplikacji |
| Wybrany motyw interfejsu | `localStorage` | Zapamiętanie ustawienia |

**Nie mamy do tych danych dostępu.** Nie ma serwera, na który byłyby wysyłane, ani konta, przez które moglibyśmy je odczytać. Wyczyszczenie danych przeglądarki usuwa je bezpowrotnie — również dla Ciebie.

Podstawa prawna: art. 6 ust. 1 lit. b RODO (wykonanie usługi, o którą prosisz).

### 3.2 Dane wysyłane do analizy AI

Gdy wkleisz link do ogłoszenia albo jego treść i poprosisz o analizę, **treść tego ogłoszenia** trafia do Google Gemini w celu odczytania wymagań i obowiązków.

Przed wysłaniem usuwamy z niej dane identyfikujące: adresy e-mail, numery telefonu, numery PESEL i odnośniki są zastępowane symbolami (`[EMAIL]`, `[TELEFON]`, `[ID]`, `[LINK]`). Odpowiada za to `src/server/pseudonymize.ts`, a bramka `assertNoPii` przerywa wysyłkę, gdyby jakaś ścieżka to pominęła.

**Twoje CV nie jest wysyłane do modelu.** Funkcje, które by go używały (list motywacyjny, przeformułowanie punktorów), nie są obecnie dostępne w aplikacji. Gdy zostaną uruchomione, zaktualizujemy ten dokument **przed** ich udostępnieniem, a zgoda na przetwarzanie przez AI będzie odrębna od regulaminu — aplikacja ma działać także bez niej, bo ocena ATS liczy się lokalnie.

Podstawa prawna: art. 6 ust. 1 lit. b RODO.

### 3.3 Dane techniczne serwera

Przy pobraniu ogłoszenia z adresu URL serwer zapisuje w logach: czas żądania, adres IP (na potrzeby limitowania liczby zapytań), identyfikator błędu jeśli wystąpił, oraz liczbę tokenów zużytych przez model.

**W logach nie ma treści CV, treści ogłoszeń ani odpowiedzi modelu** — zapisywane są wyłącznie liczby i nazwy operacji (`src/server/usageLedger.ts`).

Podstawa prawna: art. 6 ust. 1 lit. f RODO (ochrona usługi przed nadużyciami i kontrola kosztów).

---

## 4. Czego nie robimy

- **Nie stosujemy plików cookies** do śledzenia. `localStorage` służy wyłącznie przechowywaniu Twoich danych na Twoim urządzeniu.
- **Nie ma analityki ani reklam.** Żaden skrypt firm trzecich nie jest ładowany.
- **Nie sprzedajemy i nie udostępniamy danych** nikomu poza podmiotami z listy podprocesorów.
- **Nie profilujemy Cię** i nie podejmujemy wobec Ciebie decyzji w sposób zautomatyzowany. Ocena ATS to narzędzie, którego wynik widzisz tylko Ty — nie trafia do żadnego pracodawcy.
- **Nie przechowujemy zdjęcia z CV** poza Twoim urządzeniem. Do modelu nie trafia w żadnej postaci.

---

## 5. Komu przekazujemy dane

Aktualna lista znajduje się w [`docs/podprocesorzy.md`](./podprocesorzy.md). Dziś jest na niej jeden podmiot aktywny: **Google (Gemini API)** — otrzymuje treść ogłoszenia po pseudonimizacji.

---

## 6. Jak długo przechowujemy dane

| Dane | Okres |
|---|---|
| Profil i CV w przeglądarce | Do momentu ich usunięcia przez Ciebie |
| Cache pobranych ogłoszeń na serwerze | 1 godzina, po czym wpis wygasa |
| Logi techniczne | Zgodnie z domyślną retencją dostawcy hostingu — do ustalenia i uzupełnienia przy wdrożeniu |

---

## 7. Twoje prawa

Przysługuje Ci prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia oraz sprzeciwu.

**W praktyce, przy obecnym kształcie aplikacji:**

- **Dostęp i przenoszenie** — Twoje dane są w Twojej przeglądarce; aplikacja pozwala wyeksportować CV do pliku.
- **Usunięcie** — funkcja usunięcia profilu czyści **wszystkie** dane aplikacji z przeglądarki. Działa przez przeglądanie zapisanych kluczy, a nie po zapisanej z góry liście, więc nie zostawia niczego za sobą (`src/lib/localProfile.ts`, test regresyjny w `src/lib/__tests__/localProfile.test.ts`).
- **Sprzeciw wobec analizy AI** — po prostu z niej nie korzystaj; ocena ATS i parsowanie CV działają bez niej.

Masz też prawo wnieść skargę do **Prezesa Urzędu Ochrony Danych Osobowych** (ul. Stawki 2, 00-193 Warszawa).

---

## 8. Bezpieczeństwo — i jego obecne granice

Stosowane zabezpieczenia oraz **jawna lista tego, co nie jest chronione**, znajdują się w [`SECURITY.md`](../SECURITY.md). Najważniejsze na dziś:

- Dane w przeglądarce **nie są szyfrowane**. Wcześniejsza wersja szyfrowała je kluczem zapisanym w kodzie aplikacji, co nie chroniło przed niczym — usunęliśmy pozorne zabezpieczenie zamiast utrzymywać wrażenie ochrony.
- **Nie ma uwierzytelniania.** „Profil" to wpis w tej przeglądarce, bez hasła i bez konta.
- Realne szyfrowanie i konta pojawią się wraz z przeniesieniem danych na serwer. Ten dokument zostanie wtedy zaktualizowany.

---

## 9. Zmiany polityki

O istotnych zmianach poinformujemy w aplikacji. Zmiana rozszerzająca zakres przetwarzania — zwłaszcza wysyłanie CV do modelu — zostanie ogłoszona **przed** jej wprowadzeniem, a nie po.

---

## Do uzupełnienia przed publikacją

- [ ] Dane rejestrowe administratora
- [ ] Okres retencji logów u wybranego dostawcy hostingu
- [ ] Podstawa transferu danych do USA (Google)
- [ ] Przegląd prawnika
