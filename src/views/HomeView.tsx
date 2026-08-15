import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  UploadCloud,
  Briefcase,
  Sparkles,
  Heart,
  ArrowRight,
  Clock,
  Tag,
  CheckCircle2,
  BookOpen,
  Award,
  Zap,
  TrendingUp,
  X,
  Share2,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../components/ui/Card';
import { MasterVault, TokenStats } from '../types';
import { NavTabId } from '../components/GlobalShell';

interface CareerTip {
  id: string;
  title: string;
  excerpt: string;
  category: 'ATS' | 'Junior' | 'IT' | 'Rozmowa' | 'Negocjacje';
  readTime: string;
  date: string;
  content: {
    summary: string;
    keyPoints: string[];
    dosAndDonts: { do: string; dont: string };
    example?: string;
  };
}

const CAREER_TIPS: CareerTip[] = [
  {
    id: 'ats-guide-2026',
    title: 'Jak napisać CV pod filtry ATS w 2026 roku?',
    excerpt: 'Kluczowe reguły parsowania dokumentów przez nowoczesne algorytmy rekrutacyjne i unikanie odrzucenia na wstępie.',
    category: 'ATS',
    readTime: '4 min',
    date: '15.08.2026',
    content: {
      summary: 'Nowoczesne systemy ATS (Applicant Tracking Systems) analizują semantykę, gęstość słów kluczowych i logiczną strukturę sekcji. Złożone grafiki i wielokolumnowe tabele utrudniają automatyczny odczyt.',
      keyPoints: [
        'Używaj standardowych nagłówków: Doświadczenie, Edukacja, Umiejętności.',
        'Podawaj technologie w kontekście projektu (np. "Wdrożenie React 19 skracające czas ładowania o 40%").',
        'Zadbaj o plik PDF ze standardową warstwą tekstową (selectable text).',
        'Dopasuj nazwy stanowisk do terminologii z ogłoszenia.',
      ],
      dosAndDonts: {
        do: 'Używaj prostego, jedno- lub dwułamowego układu z czytelną hierarchią nagłówków.',
        dont: 'Nie umieszczaj kluczowych danych kontaktowych ani technologii wyłącznie wewnątrz grafik lub stopki.',
      },
      example: 'Zamiast "Praca przy API", napisz: "Zaprojektowanie REST API w Express.js obsługującego 50k żądań/minutę".',
    },
  },
  {
    id: 'star-method-projects',
    title: 'Metoda STAR w opisach doświadczenia zawodowego',
    excerpt: 'Jak formułować punkty w CV, aby rekruter od razu zobaczył Twój wpływ biznesowy i twarde rezultaty.',
    category: 'Rozmowa',
    readTime: '3 min',
    date: '14.08.2026',
    content: {
      summary: 'Format STAR (Situation, Task, Action, Result) przekształca zwykłą listę obowiązków w dowody Twojej skuteczności i kompetencji inżynierskich.',
      keyPoints: [
        'Sytuacja: Krótki kontekst wyzwania biznesowego.',
        'Zadanie: Twoja bezpośrednia odpowiedzialność.',
        'Działanie: Zastosowane technologie, narzędzia i decyzje architektoniczne.',
        'Rezultat: Mierzalny zysk (procenty, czas, koszty, bezawaryjność).',
      ],
      dosAndDonts: {
        do: 'W każdym punkcie staraj się zawrzeć co najmniej jedną metrykę lub wskaźnik sukcesu.',
        dont: 'Unikaj ogólników typu "Uczestnictwo w spotkaniach i rozwój aplikacji".',
      },
      example: 'Zoptymalizowałem zapytania SQL, co zredukowało czas odpowiedzi backendu o 35% i obniżyło koszty bazy danych.',
    },
  },
  {
    id: 'junior-mistakes-cv',
    title: '5 najczęstszych błędów w CV kandydata IT',
    excerpt: 'Od przeładowania zbędnymi certyfikatami po brak linków do działających projektów – sprawdź, czego unikać.',
    category: 'Junior',
    readTime: '5 min',
    date: '12.08.2026',
    content: {
      summary: 'Rekruterzy przeglądają pojedyncze CV średnio przez 6–8 sekund. Nadmiar nieuporządkowanych informacji działa na Twoją niekorzyść.',
      keyPoints: [
        'Brak linku do aktywnego demo projektu (sam kod na GitHub to za mało).',
        'Paski postępu umiejętności (np. "HTML 90%, CSS 75%") – są niemierzalne.',
        'Brak podziału na technologie główne i narzędzia drugorzędne.',
        'Zbyt długie podsumowanie zawodowe bez konkretnego celu.',
      ],
      dosAndDonts: {
        do: 'Wymień 2-3 dopracowane projekty komercyjne lub open-source z linkami do działającego wdrożenia.',
        dont: 'Nie twórz 4-stronicowego CV na starcie kariery – 1 do 2 stron jest optymalne.',
      },
    },
  },
  {
    id: 'b2b-uop-negotiations',
    title: 'Negocjacje stawek w IT: B2B vs Umowa o Pracę',
    excerpt: 'Jak przeliczać stawki godzinowe na realny dochód netto i jak argumentować swoje oczekiwania finansowe.',
    category: 'Negocjacje',
    readTime: '6 min',
    date: '10.08.2026',
    content: {
      summary: 'Właściwe przygotowanie do rozmowy o wynagrodzeniu wymaga znajomości widełek rynkowych, form opodatkowania (ryczałt, skala) i kosztów urlopów na B2B.',
      keyPoints: [
        'Zawsze określaj stawkę bazową netto na B2B powiększoną o rezerwę urlopową (ok. 10-15%).',
        'Badaj raporty płacowe (No Fluff Jobs, Just Join IT) dla swojego poziomu i stosu technologicznego.',
        'Wyceniaj wartość dodaną: znajomość specyfiki branży i szybkość wdrażania rozwiązań.',
      ],
      dosAndDonts: {
        do: 'Przedstawiaj widełki wynagrodzenia z dolną granicą będącą Twoją satysfakcjonującą stawką.',
        dont: 'Nie podawaj kwoty bez uprzedniego poznania pełnego zakresu odpowiedzialności.',
      },
    },
  },
  {
    id: 'zero-keyword-stuffing',
    title: 'Optymalizacja ATS bez sztucznego upychania słów',
    excerpt: 'Jak naturalnie wpleść technologie z ogłoszenia, aby zachować autentyczność przed człowiekiem.',
    category: 'IT',
    readTime: '4 min',
    date: '08.08.2026',
    content: {
      summary: 'Systemy ATS to tylko pierwszy etap. Po przejściu filtrów maszynowych dokument czyta człowiek – treść musi brzmieć naturalnie.',
      keyPoints: [
        'Stosuj warianty synonimiczne (np. TypeScript / TS, REST API / Web Services).',
        'Grupuj technologie w logiczne klastry (Frontend, Backend, DevOps, Narzędzia).',
        'Wykorzystaj dedykowaną sekcję "Podsumowanie Techniczne" na górze CV.',
      ],
      dosAndDonts: {
        do: 'Używaj silnika CVELOCITY do precyzyjnego dopasowania słów kluczowych z ogłoszenia.',
        dont: 'Nigdy nie ukrywaj białego tekstu w tle – nowoczesne parsery wykrywają to jako spam.',
      },
    },
  },
];

interface HomeViewProps {
  vault: MasterVault;
  tokenStats: TokenStats;
  onNavigate: (tab: NavTabId) => void;
  onOpenAdvisor: (question?: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  vault,
  tokenStats,
  onNavigate,
  onOpenAdvisor,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Wszystkie');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cvelocity-favorite-tips');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeTipModal, setActiveTipModal] = useState<CareerTip | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('cvelocity-favorite-tips', JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const categories = ['Wszystkie', 'ATS', 'IT', 'Junior', 'Rozmowa', 'Negocjacje', 'Ulubione'];

  const filteredTips = CAREER_TIPS.filter((tip) => {
    if (selectedCategory === 'Wszystkie') return true;
    if (selectedCategory === 'Ulubione') return favorites.includes(tip.id);
    return tip.category === selectedCategory;
  });

  // Calculate profile metrics
  const historyCount = vault.history.length;
  const hardSkillsCount = vault.skillsMatrix.hardSkills.length;
  const certsCount = vault.skillsMatrix.certifications?.length || 0;
  const hasFullName = Boolean(vault.personalInfo.fullName);

  const quickActions = [
    {
      title: 'Dopasuj CV do oferty',
      description: 'Wklej treść oferty pracy i zoptymalizuj słowa kluczowe ATS.',
      icon: Search,
      tab: 'matcher' as NavTabId,
      badge: 'Główne narzędzie',
      badgeColor: 'brand',
    },
    {
      title: 'Edytuj Master Vault',
      description: 'Zarządzaj pełną historią zatrudnienia, projektami i matrycą skilli.',
      icon: FileText,
      tab: 'vault' as NavTabId,
      badge: `${historyCount} pozycji`,
      badgeColor: 'success',
    },
    {
      title: 'Wczytaj istniejące CV',
      description: 'Zaimportuj plik PDF lub DOCX i połącz dane bez utraty wpisów.',
      icon: UploadCloud,
      tab: 'parser' as NavTabId,
      badge: '1 darmowy/mc',
      badgeColor: 'warning',
    },
    {
      title: 'Śledź aplikacje',
      description: 'Zarządzaj procesami rekrutacyjnymi, terminami rozmów i ofertami.',
      icon: Layers,
      tab: 'applications' as NavTabId,
      badge: 'CRM Rejestr',
      badgeColor: 'brand',
    },
  ];

  const EASING: [number, number, number, number] = [0.19, 1, 0.22, 1];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: EASING },
    },
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
        className="relative overflow-hidden rounded-3xl border border-line bg-elevated p-6 shadow-sm sm:p-8"
      >
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 font-mono text-xs font-semibold text-brand-fg">
              <Sparkles className="h-3.5 w-3.5 text-brand-600" />
              CVELOCITY Career Hub • Edycja 2026
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {hasFullName ? `Witaj ponownie, ${vault.personalInfo.fullName}` : 'Witaj w CVELOCITY'}
            </h1>
            <p className="text-sm leading-relaxed text-muted">
              Twój asystent kariery napędzany sztuczną inteligencją. Przygotowuj dokumenty, które pokonują automatyczne filtry ATS i przyciągają uwagę rekruterów.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('matcher')}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-raised transition-all hover:bg-brand-700 hover:scale-[1.02] focus-visible:outline-none"
            >
              <Search className="h-4 w-4" />
              <span>Dopasuj do Oferty</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAdvisor('Jak najlepiej zoptymalizować mój profil pod kątem ATS?')}
              className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-brand-50 hover:text-brand-fg focus-visible:outline-none"
            >
              <Sparkles className="h-4 w-4 text-brand-500" />
              <span>Zapytaj Doradcę</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. User Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card variant="elevated" className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Doświadczenie</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Briefcase className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-ink">{historyCount}</div>
          <p className="mt-0.5 text-[11px] text-subtle">
            {historyCount === 0 ? 'Brak wpisów w Vault' : 'Aktywne stanowiska'}
          </p>
        </Card>

        <Card variant="elevated" className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Twarde Skille</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Award className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-ink">{hardSkillsCount}</div>
          <p className="mt-0.5 text-[11px] text-subtle">
            + {certsCount} certyfikatów
          </p>
        </Card>

        <Card variant="elevated" className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Zaoszczędzone Tokeny</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-soft text-success-fg">
              <Zap className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-success-fg">
            {tokenStats.totalTokensSaved.toLocaleString()}
          </div>
          <p className="mt-0.5 text-[11px] text-subtle">Silnik 0-Token Slot Filling</p>
        </Card>

        <Card variant="elevated" className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Oszczędność $</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning-soft text-warning-fg">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-warning-fg">
            ${tokenStats.estimatedCostSavedUSD.toFixed(4)}
          </div>
          <p className="mt-0.5 text-[11px] text-subtle">Zredukowane zapytania API</p>
        </Card>
      </div>

      {/* 3. Quick Actions (Kafelki Szybkiego Startu) */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Szybki Start</h2>
            <p className="text-xs text-muted">Wybierz moduł, aby natychmiast rozpocząć pracę nad dokumentami</p>
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {quickActions.map((action) => (
            <motion.div
              key={action.title}
              variants={itemVariants}
              onClick={() => onNavigate(action.tab)}
              className="cursor-pointer"
            >
              <Card
                variant="elevated"
                hoverEffect
                className="group relative flex h-full flex-col justify-between p-5"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-line bg-surface px-2.5 py-0.5 font-mono text-[10px] font-semibold text-muted">
                      {action.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-ink transition-colors group-hover:text-brand-fg">
                    {action.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">
                    {action.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-brand-fg">
                  <span>Przejdź do modułu</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* 4. Career Microblog (Porady Rekrutacyjne) */}
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-brand-600" />
              <h2 className="text-base font-bold text-ink">Baza Wiedzy & Porady Rekrutacyjne</h2>
            </div>
            <p className="text-xs text-muted">
              Praktyczne przewodniki przygotowane przez ekspertów rekrutacji technicznej
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-xl border px-3 py-1 text-xs font-medium transition-all ${
                    isSelected
                      ? 'border-brand-200 bg-brand-50 font-semibold text-brand-fg shadow-xs'
                      : 'border-line bg-elevated text-muted hover:border-brand-200 hover:text-ink'
                  }`}
                >
                  {cat === 'Ulubione' ? `⭐ Ulubione (${favorites.length})` : `#${cat}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tips Grid */}
        {filteredTips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-elevated p-8 text-center">
            <p className="text-xs font-medium text-muted">
              Brak zapisanych porad w tej kategorii. Dodaj porady do ulubionych klikając ikonę serca.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTips.map((tip) => {
              const isFav = favorites.includes(tip.id);
              return (
                <Card
                  key={tip.id}
                  variant="elevated"
                  hoverEffect
                  onClick={() => setActiveTipModal(tip)}
                  className="group flex cursor-pointer flex-col justify-between p-5"
                >
                  <div>
                    {/* Card Header: Category & Favorite */}
                    <div className="mb-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-brand-fg">
                        <Tag className="h-3 w-3" />
                        #{tip.category}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(e, tip.id)}
                        aria-label={isFav ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
                        className={`rounded-lg p-1.5 transition-colors ${
                          isFav
                            ? 'text-danger-fg hover:bg-danger-soft'
                            : 'text-subtle hover:bg-surface hover:text-ink'
                        }`}
                      >
                        <Heart
                          className={`h-4 w-4 ${isFav ? 'fill-danger-fg text-danger-fg' : ''}`}
                        />
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-ink transition-colors group-hover:text-brand-fg">
                      {tip.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted line-clamp-2">
                      {tip.excerpt}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[11px] font-medium text-subtle">
                    <div className="flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3" />
                      <span>{tip.readTime}</span>
                    </div>
                    <span className="font-semibold text-brand-fg group-hover:underline">
                      Czytaj poradę →
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Career Tip Modal View */}
      <AnimatePresence>
        {activeTipModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveTipModal(null)}
              className="fixed inset-0 bg-surface/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
              className="relative z-10 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-elevated p-6 shadow-floating sm:p-8"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="inline-block rounded-md border border-brand-200 bg-brand-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-brand-fg">
                    #{activeTipModal.category} • Baza Wiedzy CVELOCITY
                  </span>
                  <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                    {activeTipModal.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-subtle font-mono">
                    <span>{activeTipModal.date}</span>
                    <span>•</span>
                    <span>{activeTipModal.readTime} czytania</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTipModal(null)}
                  className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none"
                  aria-label="Zamknij"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6 text-sm text-ink">
                {/* Summary Box */}
                <div className="rounded-2xl border border-line bg-surface p-4 text-xs leading-relaxed text-muted">
                  <strong className="text-ink">Podsumowanie: </strong>
                  {activeTipModal.content.summary}
                </div>

                {/* Key Points */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-subtle">
                    Kluczowe Zasady do Wdrożenia
                  </h3>
                  <ul className="space-y-2">
                    {activeTipModal.content.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-ink">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-fg" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Dos and Don'ts */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-success/30 bg-success-soft p-3.5 text-xs text-success-fg">
                    <p className="font-bold mb-1">RÓB TO (DO):</p>
                    <p>{activeTipModal.content.dosAndDonts.do}</p>
                  </div>
                  <div className="rounded-xl border border-danger/30 bg-danger-soft p-3.5 text-xs text-danger-fg">
                    <p className="font-bold mb-1">UNIKAJ (DON'T):</p>
                    <p>{activeTipModal.content.dosAndDonts.dont}</p>
                  </div>
                </div>

                {/* Example if exists */}
                {activeTipModal.content.example && (
                  <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-xs text-brand-fg">
                    <p className="font-bold mb-1">Przykład w praktyce:</p>
                    <p className="italic font-mono">{activeTipModal.content.example}</p>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="mt-8 flex items-center justify-between border-t border-line pt-4">
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(e, activeTipModal.id)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                    favorites.includes(activeTipModal.id)
                      ? 'border-danger/30 bg-danger-soft text-danger-fg'
                      : 'border-line bg-surface text-ink hover:bg-brand-50'
                  }`}
                >
                  <Heart
                    className={`h-4 w-4 ${
                      favorites.includes(activeTipModal.id)
                        ? 'fill-danger-fg text-danger-fg'
                        : ''
                    }`}
                  />
                  <span>
                    {favorites.includes(activeTipModal.id)
                      ? 'W ulubionych'
                      : 'Dodaj do ulubionych'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTipModal(null)}
                  className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-brand-700"
                >
                  Zamknij
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
