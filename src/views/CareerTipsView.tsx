import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';

export interface Article {
  id: string;
  title: string;
  category: 'ats' | 'interview' | 'trades' | 'career';
  categoryLabel: string;
  readTime: string;
  snippet: string;
  badge?: string;
  content: {
    lead: string;
    sections: {
      heading: string;
      body: string;
      keyTakeaways?: string[];
    }[];
  };
}

const ARTICLES: Article[] = [
  {
    id: 'ats-optymalizacja-2026',
    title: 'Jak przejść filtry ATS w 2026 roku — Kompletny poradnik',
    category: 'ats',
    categoryLabel: 'Filtry ATS & Algorytmy',
    readTime: '4 min czytania',
    badge: 'Kluczowe',
    snippet: 'Ponad 75% aplikacji w dużych firmach jest odrzucanych przez algorytmy ATS zanim trafi do rekrutera. Poznaj zasady formatowania i gęstości słów kluczowych.',
    content: {
      lead: 'Systemy Applicant Tracking Systems (ATS) przeszły ewolucję. Dziś nie tylko zliczają słowa kluczowe, ale analizują semantyczny kontekst doświadczenia kandydata.',
      sections: [
        {
          heading: '1. Jednokolumnowy, czysty układ bez tabel i grafik',
          body: 'Nowoczesne parsery ATS najlepiej radzą sobie ze standardowymi nagłówkami sekcji (Doświadczenie, Umiejętności, Edukacja). Unikaj wielokolumnowych szablonów z Canvy, które gubią kolejność chronologiczną tekstu.',
          keyTakeaways: [
            'Używaj standardowych czcionek (Inter, Roboto, Arial)',
            'Formatuj daty w układzie MM/RRRR lub RRRR',
            'Zapisuj dokument w formacie PDF lub DOCX',
          ],
        },
        {
          heading: '2. Twarde dopasowanie terminologii z ogłoszenia',
          body: 'Jeśli oferta wymaga „Zarządzania magazynem w SAP WMS”, nie pisz jedynie „obsługa komputera w magazynie”. ATS weryfikuje dokładne nazwy technologii, uprawnień i certyfikatów.',
        },
        {
          heading: '3. Formuła Osiągnięcia zamiast listy obowiązków',
          body: 'Rekruterzy i zaawansowane parsery AI szukają dowodów sprawczości. Każdy punkt w CV powinien zawierać czasownik sprawczy, narzędzie oraz mierzalny wynik liczbowy (%).',
        },
      ],
    },
  },
  {
    id: 'metoda-star-rozmowa',
    title: 'Metoda STAR na rozmowie rekrutacyjnej — Mów językiem faktów',
    category: 'interview',
    categoryLabel: 'Rozmowa Kwalifikacyjna',
    readTime: '5 min czytania',
    badge: 'Popularne',
    snippet: 'Jak odpowiadać na pytania behawioralne w 60–90 sekund, budując autorytet i pokazując twarde metryki sukcesu.',
    content: {
      lead: 'Pytania zaczynające się od „Opowiedz o sytuacji, gdy...” to standard na 90% rozmów kwalifikacyjnych. Metoda STAR pozwala uniknąć lania wody i przekazać esencję Twojej wartości.',
      sections: [
        {
          heading: 'Struktura STAR krok po kroku',
          body: 'S (Situation) — nakreślenie tła (15s); T (Task) — cel/wyzwanie (15s); A (Action) — konkretne działania podjęte osobiście przez Ciebie (45s); R (Result) — mierzalny efekt i liczby (15s).',
          keyTakeaways: [
            'Używaj formy pierwszej osoby („Wdrożyłem”, „Zoptymalizowałem”, a nie „Robiliśmy”)',
            'Podawaj konkretne wskaźniki: czas, koszty, spadek awaryjności, wolumen',
            'Przygotuj 3–4 uniwersalne historie pasujące do różnych pytań',
          ],
        },
        {
          heading: 'Unikanie pułapki generalizacji',
          body: 'Zamiast mówić „zawsze dbam o jakość”, opowiedz o konkretnym incydencie, w którym Twoja czujność zapobiegła przestojowi linii lub reklamacji klienta.',
        },
      ],
    },
  },
  {
    id: 'uprawnienia-knockout-monter-spawacz',
    title: 'Kryteria Knockout: SEP, UDT, F-Gaz i Prawo Jazdy',
    category: 'trades',
    categoryLabel: 'Prace Techniczne & Przemysł',
    readTime: '3 min czytania',
    snippet: 'Dla technika, montera i magazyniera brak wpisanego numeru uprawnienia oznacza natychmiastowe odrzucenie. Jak prawidłowo eksponować kwalifikacje techniczne.',
    content: {
      lead: 'W branży technicznej i logistycznej rekrutacja zaczyna się od kryteriów zero-jedynkowych. Niezależnie od doświadczenia, brak formalnego uprawnienia blokuje zatrudnienie.',
      sections: [
        {
          heading: 'Eksponuj uprawnienia na samej górze profilu',
          body: 'Rekruter techniczny poświęca 6 sekund na przeskanowanie wzrokiem uprawnień takich jak SEP E+D do 1kV/20kV, UDT (WJO I/II), F-Gaz czy certyfikaty spawalnicze TIG 141.',
          keyTakeaways: [
            'Podawaj dokładne kategorie i zakresy napięć / metod',
            'Wpisuj daty ważności lub adnotację o bezterminowości',
            'Wymieniaj markę i typ obsługiwanych urządzeń diagnostycznych',
          ],
        },
      ],
    },
  },
  {
    id: 'medycyna-rekrutacja-szpital',
    title: 'CV Medyczne: Lekarz, Pielęgniarka, Ratownik Medyczny',
    category: 'career',
    categoryLabel: 'Sektor Medyczny',
    readTime: '4 min czytania',
    snippet: 'Jak strukturyzować doświadczenie kliniczne, staże specjalizacyjne, procedury zabiegowe i dyżury na SOR.',
    content: {
      lead: 'Aplikowanie do szpitali, klinik i centrów medycznych wymaga szczególnego nacisku na samodzielność zabiegową, liczbę wykonanych procedur oraz znajomość procedur NFZ/ISO.',
      sections: [
        {
          heading: 'Kluczowe elementy profilu medycznego',
          body: 'Wymień oddziały szpitalne, na których odbywałeś dyżury, znajomość systemów medycznych (np. Asseco AMMS, KS-SOMED) oraz procedury triage i certyfikaty ALS/BLS/PALS.',
          keyTakeaways: [
            'Wpisz numer prawa wykonywania zawodu (PWZ)',
            'Określ stopień zaawansowania specjalizacji klinicznej',
            'Podawaj szacunkowy wolumen przyjętych pacjentów i zabiegów',
          ],
        },
      ],
    },
  },
];

export const CareerTipsView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const categories = [
    { id: 'all', label: 'Wszystkie porady' },
    { id: 'ats', label: 'Filtry ATS' },
    { id: 'interview', label: 'Rozmowa o pracę' },
    { id: 'trades', label: 'Techniczne & Przemysł' },
    { id: 'career', label: 'Medycyna & Branże' },
  ];

  const filteredArticles = ARTICLES.filter((art) => {
    const matchesCategory = activeCategory === 'all' || art.category === activeCategory;
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <PageHeader
        title="Baza Wiedzy i Poradnik Kariery"
        description="Merytoryczne artykuły, wzorce odpowiedzi i strategie pokonywania filtrów ATS przygotowane przez ekspertów rekrutacji."
        badge="Wiedza & SEO"
      />

      {/* Jeśli czytamy konkretny artykuł */}
      {selectedArticle ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedArticle(null)}
            className="text-brand-fg mb-2"
          >
            &larr; Wróć do listy poradników
          </Button>

          <article className="rounded-3xl border border-line bg-surface p-6 sm:p-10 shadow-floating space-y-6">
            <div className="space-y-3 border-b border-line/60 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-brand-500/10 text-brand-600 px-2.5 py-0.5 text-xs font-bold font-mono">
                  {selectedArticle.categoryLabel}
                </span>
                <span className="flex items-center gap-1 text-muted text-xs font-mono">
                  <Clock className="h-3.5 w-3.5" />
                  {selectedArticle.readTime}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-ink tracking-tight leading-tight">
                {selectedArticle.title}
              </h1>

              <p className="text-sm sm:text-base text-muted leading-relaxed font-medium">
                {selectedArticle.content.lead}
              </p>
            </div>

            {/* Treść artykułu */}
            <div className="space-y-8 text-ink text-sm sm:text-base leading-relaxed">
              {selectedArticle.content.sections.map((sec, idx) => (
                <div key={idx} className="space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-ink flex items-center gap-2">
                    <span className="text-brand-600">#</span> {sec.heading}
                  </h2>
                  <p className="text-muted leading-relaxed">{sec.body}</p>

                  {sec.keyTakeaways && sec.keyTakeaways.length > 0 && (
                    <div className="rounded-2xl border border-brand-500/30 bg-brand-500/5 p-4 space-y-2 mt-3">
                      <div className="font-bold text-xs text-brand-fg uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-success-fg" />
                        Kluczowe wskazówki:
                      </div>
                      <ul className="space-y-1.5 pl-2 text-xs sm:text-sm text-ink">
                        {sec.keyTakeaways.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-brand-600 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-line/60 flex items-center justify-between">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelectedArticle(null)}
              >
                &larr; Wróć do bazy artykułów
              </Button>
            </div>
          </article>
        </motion.div>
      ) : (
        /* Lista artykułów */
        <div className="space-y-6">
          {/* Wyszukiwarka i filtry */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                    activeCategory === c.id
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 font-bold'
                      : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj tematu poradnika..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-line bg-surface text-ink focus:border-brand-500 focus-visible:outline-none"
              />
            </div>
          </div>

          {/* Siatka artykułów */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArticles.map((art) => (
              <motion.div
                key={art.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                className="rounded-2xl border border-line bg-surface p-5 shadow-xs flex flex-col justify-between hover:border-brand-500/40 cursor-pointer transition-colors"
                onClick={() => setSelectedArticle(art)}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-brand-500/10 text-brand-600 px-2 py-0.5 text-[10px] font-bold font-mono">
                      {art.categoryLabel}
                    </span>
                    <span className="flex items-center gap-1 text-muted text-[11px] font-mono">
                      <Clock className="h-3 w-3" />
                      {art.readTime}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-ink leading-snug group-hover:text-brand-fg">
                    {art.title}
                  </h3>

                  <p className="text-xs text-muted leading-relaxed line-clamp-3">
                    {art.snippet}
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-between text-xs font-semibold text-brand-fg mt-2 border-t border-line/40">
                  <span>Czytaj artykuł</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
