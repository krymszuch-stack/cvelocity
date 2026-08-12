# Specyfikacja: agregator ofert pracy i tracker aplikacji

## 1. Cel produktu

SkillVault ma działać jak wyszukiwarka i filtr ofert pracy, a nie jak klasyczny ATS z agresywnymi popupami aplikacji. Główny model działa w trzech warstwach:

1. zbieranie ofert z wielu portali (OLX, Pracuj.pl, No Fluff Jobs i inne),
2. normalizacja danych i usuwanie duplikatów,
3. dopasowanie profilu użytkownika do realnych wymagań i odrzucanie oferty, gdy nie spełnia warunków koniecznych.

To daje lepszy UX niż Indeed, bo użytkownik nie jest bombardowany modalami i ma własny tracker aplikacji z osobną stroną, datą i godziną wysłania.

## 2. Model danych oferty

Każda oferta jest mapowana do wspólnego modelu:

```ts
interface NormalizedJobOffer {
  id: string;
  source: 'OLX' | 'PRACUJ' | 'NOFLUFF' | 'OTHER';
  url: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  hybrid: boolean;
  salaryMin?: number;
  salaryMax?: number;
  currency?: 'PLN' | 'EUR' | 'USD';
  jobType?: 'full-time' | 'contract' | 'b2b';
  requireDrivingLicense?: boolean;
  requiredCategory?: 'B' | 'C' | 'A';
  requiresCar?: boolean;
  commuteMinutesMax?: number;
  commuteMinutesEstimated?: number;
  requirements: string[];
  niceToHave: string[];
  publishedAt: string;
  lastSeenAt: string;
}
```

## 3. Mechanizm dojazdu (commute)

Dojazd jest niebagatelny i musi być traktowany jako część oceny oferty, nie jako „dodatkowe info”.

### Polecenia biznesowe

- `commuteMinutesMax`: maksymalny dopuszczalny czas dojazdu z domu / miejsca zamieszkania do pracy.
- `commuteMinutesEstimated`: przewidywany czas dojazdu na podstawie lokalizacji i trybu dojazdu.
- `isDisqualifying`: dla wymagań takich jak: kat. B, auto, dostępność w terenie, ograniczenie do X km.
- `scorePenalty`: kara za przekroczenie limitu dojazdu.

### Przykład logiki

```ts
const commutePenalty = (offer: NormalizedJobOffer, userProfile: UserProfile) => {
  if (!offer.commuteMinutesEstimated) return 0;
  if (userProfile.maxCommuteMinutes && offer.commuteMinutesEstimated > userProfile.maxCommuteMinutes) {
    return 25;
  }
  if (offer.commuteMinutesEstimated > 60) return 10;
  return 0;
};
```

### Reguła odrzucania

Jeżeli wymaganie jest formalne, np.:

- `prawo jazdy kat. B`,
- `własny samochód`,
- `jazda w terenie`,
- `dojazd do klienta do 40 minut`,

to oferta jest odrzucana, gdy użytkownik nie spełnia warunku, nawet jeśli reszta dopasowania jest wysoka.

```ts
if (offer.requiredCategory === 'B' && !userProfile.hasDrivingLicenseCategoryB) {
  return { rejected: true, reason: 'Brak prawa jazdy kat. B wymagane przez ofertę' };
}
```

## 4. Zaawansowane filtry i priorytety

### Filtry obowiązkowe

- lokalizacja + promień od miejsca zamieszkania,
- tryb pracy: remote / hybrid / onsite,
- czas dojazdu,
- wymagania prawne: prawo jazdy, kategoria, dowód osobisty, bezpieczeństwo,
- poziom doświadczenia,
- staż,
- języki,
- stack technologiczny,
- budżet wynagrodzenia,
- data publikacji i świeżość oferty.

### Filtry „nice to have”

- certyfikaty,
- specjalizacje,
- typ pracodawcy,
- branża.

## 5. Mechanizm odrzucania ofert

Każda oferta ma status:

- `accepted`: dobre dopasowanie,
- `low_match`: możliwe, wymaga ręcznej oceny,
- `rejected`: nie spełnia wymagań koniecznych,
- `saved`: zapisano, ale nie wysłano jeszcze aplikacji.

Zasada:

- `rejected` nie przechodzi do głównego feedu,
- `low_match` trafia do sekcji do przeglądu,
- `accepted` trafia na priorytetowy ranking.

## 6. Tracker aplikacji

Aplikacja musi mieć osobną podstronę z następującymi polami:

- nazwa stanowiska,
- firma,
- źródło oferty,
- data aplikacji,
- godzina aplikacji,
- status aplikacji,
- wynik dopasowania w %,
- link do oferty,
- notatka / kolejny krok.

Ta strona jest centralnym miejscem do śledzenia procesu rekrutacyjnego i nie powinna być mieszaną z agresywnym modalnym flow aplikowania.

## 7. Zabezpieczenia i prywatność

Warto znać realne ograniczenia projektu. W tej wersji repo nie ma prawdziwego szyfrowania end-to-end; dane użytkownika są przechowywane lokalnie w przeglądarce i wymagają prawdziwego, użytkownikowo-zależnego klucza w przyszłej implementacji. W produkcji należy dążyć do:

- szyfrowania profilu użytkownika kluczem pochodzącym z hasła lub master key,
- segregacji danych CV / profili / aplikacji,
- SSRF guard w scraperach,
- rate limit i timeout dla outbound `fetch`,
- walidacji URL i hostów, aby nie pobierać z private / localhost / wewnętrznych adresów,
- bezpiecznych polityk CORS i kontroli uprawnień.

## 8. Strategia monetizacji i marketingu

Model reklamowy powinien wspierać produkt, a nie zabijać UX:

- Google Ads na frazy typu: „oferty pracy it”, „praca react”, „pozycje z kat. B”, „job matching”, „agregator ofert pracy”,
- kampanie na potrzeby segmentów: junior / mid / senior,
- premium za zaawansowane filtry, alerty i tracker aplikacji,
- partnerstwa z portalami, rekruterami i narzędziami do HR,
- płatne profile premium dla użytkowników aktywnie szukających pracy.

## 9. Priorytet wdrożenia

1. model danych oferty + profil użytkownika,
2. scraper / normalizacja / deduplication,
3. hard filters + commute rules,
4. tracker aplikacji z osobną kartą,
5. premium filters + alerting,
6. Google Ads + monetization layer.

## 10. Podsumowanie

Największa przewaga nad portalami typu Indeed nie leży w samej liczbie ofert, ale w jakości dopasowania i przejrzystości. Użytkownik powinien widzieć:

- co zostało znalezione,
- czy spełnia wymagania,
- ile trwa dojazd,
- czy ofertę odrzucić z automatu,
- kiedy i o której wysłał aplikację,
- co jest warte dalszego działania.

To jest produkt, który nie tylko „przeszukuje oferty”, ale naprawdę wspiera decyzję o pracy.
