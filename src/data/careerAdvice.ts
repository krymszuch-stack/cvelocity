/**
 * Content for the public landing page: short "quick tips" for the left panel and
 * longer mikroblog posts for the main feed. This is genuine editorial content (no
 * fabricated statistics or unverifiable claims) — advice is phrased as reasoned
 * recommendations, not as citations of studies we haven't verified.
 */

export interface QuickTip {
  id: string;
  question: string;
  answer: string;
}

export const QUICK_TIPS: QuickTip[] = [
  {
    id: 'zdjecie-na-cv',
    question: 'Czy warto mieć zdjęcie na CV?',
    answer:
      'W Polsce to wciąż powszechne, ale nieobowiązkowe. W korporacjach i firmach międzynarodowych częściej stawia się na neutralność rekrutacji i zdjęcie bywa pomijane. Jeśli je dodajesz — profesjonalne, neutralne tło, strój adekwatny do branży.',
  },
  {
    id: 'dlugosc-cv',
    question: 'Jedna strona czy dwie?',
    answer:
      'Do ok. 5-7 lat doświadczenia — jedna strona. Dłuższy staż lub bardzo techniczne stanowisko usprawiedliwia dwie. Trzy strony to już z reguły znak, że trzeba coś wyciąć, nie że masz więcej do pokazania.',
  },
  {
    id: 'list-motywacyjny',
    question: 'Czy list motywacyjny to strata czasu?',
    answer:
      'Zależy od oferty. Jeśli ogłoszenie go wymaga — pomiń go na własne ryzyko. Jeśli nie — dobrze napisany list ma sens tylko wtedy, gdy mówi coś, czego nie widać w CV (np. dlaczego akurat ta firma). Ogólnikowy list nie wnosi nic.',
  },
  {
    id: 'luka-w-cv',
    question: 'Jak wytłumaczyć lukę w CV?',
    answer:
      'Krótko i rzeczowo, jednym zdaniem w opisie okresu (np. "przerwa zdrowotna", "opieka nad dzieckiem", "nauka własna — kurs X"). Próba ukrycia luki przez naciąganie dat zwykle wychodzi na jaw na rozmowie i wygląda gorzej niż sama luka.',
  },
  {
    id: 'ats-slowa-kluczowe',
    question: 'Czy system ATS naprawdę odrzuca CV?',
    answer:
      'Rzadziej "odrzuca", częściej źle ocenia dopasowanie, jeśli CV nie zawiera słów z ogłoszenia w tej samej formie. Nie chodzi o upychanie słów kluczowych na siłę — chodzi o nazywanie swoich realnych umiejętności tak, jak nazywa je ogłoszenie.',
  },
  {
    id: 'referencje',
    question: 'Czy podawać referencje w CV?',
    answer:
      'Nie w samym CV. Formuła "referencje dostępne na życzenie" jest przestarzała i zajmuje miejsce bez wartości — pracodawca i tak poprosi o nie osobno, jeśli będzie potrzebował.',
  },
];

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  publishedAt: string;
  tags: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'zdjecie-na-cv-rozwiniecie',
    slug: 'zdjecie-na-cv',
    title: 'Zdjęcie na CV: dodać czy nie?',
    excerpt:
      'Krótka odpowiedź: to zależy od rynku i branży. Długa odpowiedź — poniżej, razem z tym, na co zwrócić uwagę, jeśli decydujesz się je dodać.',
    body: [
      'W Polsce zdjęcie na CV wciąż jest częste, ale to praktyka odziedziczona po wzorcach, które w wielu miejscach na świecie już wyszły z użycia. W USA i Wielkiej Brytanii zdjęcie na CV bywa wręcz odradzane — część firm celowo je pomija ze względu na politykę równych szans w rekrutacji, żeby ocena nie zależała (świadomie czy nie) od wyglądu.',
      'W Polsce nadal spotkasz oba podejścia. Korporacje i firmy z kapitałem zagranicznym częściej nie oczekują zdjęcia. Mniejsze, lokalne firmy — częściej tak, choć to się zmienia.',
      'Jeśli zdecydujesz się dodać zdjęcie: neutralne tło, strój adekwatny do branży (garnitur do korpo, casualowy strój do startupu), bez filtrów i bez zdjęcia wakacyjnego przyciętego z większego kadru — to widać.',
      'Jeśli wahasz się, a ogłoszenie niczego nie sugeruje — bezpieczniej pominąć. CV bez zdjęcia nigdy nie zostanie odrzucone z tego powodu; CV ze złym zdjęciem czasem tak.',
    ],
    publishedAt: '2026-08-01',
    tags: ['CV', 'podstawy'],
  },
  {
    id: 'ats-jak-dziala',
    slug: 'jak-dziala-ats',
    title: 'Jak naprawdę działa system ATS (i czego o nim nie wiesz)',
    excerpt:
      'ATS nie jest wyrocznią, która "odrzuca" CV w tajemniczy sposób. To parser tekstu, który robi dokładnie to, co mu każe algorytm — i da się go zrozumieć.',
    body: [
      'ATS (Applicant Tracking System) to oprogramowanie, które rekruter używa do zarządzania zgłoszeniami. Jego rola to najczęściej: sparsować CV do ustrukturyzowanych danych (imię, doświadczenie, umiejętności) i policzyć, na ile pasuje do wymagań z ogłoszenia — nie podejmuje samodzielnej decyzji "odrzuć" czy "przyjmij", to robi człowiek, który widzi wynik dopasowania.',
      'Największy błąd, jaki popełnia się przy pisaniu CV pod ATS: upychanie słów kluczowych w niewidocznym miejscu (biały tekst, ukryte pole) — to nie działa, nowoczesne parsery to wychwytują, a czasem wręcz obniżają ocenę.',
      'To, co realnie pomaga: nazywanie swoich umiejętności dokładnie tak, jak robi to ogłoszenie. Jeśli oferta mówi "Node.js", a Ty w CV masz tylko "backend JavaScript" — dopasowanie tekstowe tego nie złapie, mimo że to ta sama umiejętność.',
      'Struktura dokumentu też ma znaczenie: standardowe nagłówki sekcji ("Doświadczenie zawodowe", nie "Moja ścieżka"), format daty MM/RRRR, brak grafik zastępujących tekst (paski umiejętności w % zamiast opisu słownego) — to wszystko rzeczy, które parser czyta łatwiej.',
    ],
    publishedAt: '2026-08-05',
    tags: ['ATS', 'techniczne'],
  },
  {
    id: 'osiagniecia-liczby',
    slug: 'osiagniecia-w-liczbach',
    title: 'Dlaczego liczby w CV robią różnicę',
    excerpt:
      '"Odpowiadałem za obsługę klienta" mówi mniej niż "obsługiwałem średnio 40 zgłoszeń dziennie przy wskaźniku jakości 4.6/5". To ta sama praca, opisana inaczej.',
    body: [
      'Zdanie bez liczby jest łatwe do zignorowania, bo brzmi tak samo u każdego kandydata na to stanowisko. Zdanie z konkretną liczbą (wolumen, procent, czas, wynik) natychmiast wyróżnia się na tle reszty CV — i daje rekruterowi coś, co może sobie wyobrazić.',
      'Nie każde osiągnięcie da się ująć w twardej liczbie, i to jest w porządku — nie warto zmyślać metryki, której nie masz (żaden rekruter nie zweryfikuje "poprawiłem wydajność" na rozmowie, ale zapyta o konkretną liczbę, jeśli ją podałeś, i pusta odpowiedź zaszkodzi bardziej niż brak liczby w CV).',
      'Dobry test: przeczytaj swój punkt w CV i zapytaj się "ile?", "jak często?", "o ile lepiej?". Jeśli potrafisz uczciwie odpowiedzieć — dopisz to do zdania.',
    ],
    publishedAt: '2026-08-08',
    tags: ['CV', 'pisanie'],
  },
];
