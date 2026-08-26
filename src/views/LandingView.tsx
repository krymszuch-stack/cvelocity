import React, { useId, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Eye, Flame, ScanLine, ShieldCheck } from 'lucide-react';
import { NavTabId } from '../lib/navigation';

/**
 * Strona wejściowa dla osoby, która widzi CVelocity pierwszy raz.
 *
 * Dlaczego osobny komponent, a nie kolejna sekcja w `HomeView`: ekran startowy
 * dla kogoś bez danych ma inne zadanie niż pulpit dla kogoś, kto już wypełnił
 * profil. Wcześniej obie role pełnił jeden widok i nowy użytkownik dostawał
 * liczniki „0 pozycji" oraz prośbę o uzupełnienie danych, zanim dowiedział się,
 * po co miałby je podawać.
 *
 * Reguła 1 z AGENTS.md obowiązuje tu ze zdwojoną siłą, bo to materiał
 * marketingowy: żadnych opinii klientów, logotypów firm, liczby użytkowników
 * ani skuteczności w procentach. Każda liczba na tej stronie albo pochodzi
 * z cennika (`PricingView`), albo stoi w makiecie podpisanej „przykład".
 *
 * Mapa ciepła jest **modelem**, nie pomiarem — nie zbieramy eye-trackingu, więc
 * legenda mówi „wzorzec F, model poglądowy" zamiast podawać średni czas
 * skupienia wzroku. Liczba w sekundach wyglądałaby jak wynik badania, którego
 * nikt tu nie przeprowadził. Nazwy firm w pipelinie są celowo fikcyjne z tego
 * samego powodu: prawdziwe logotypy czytałoby się jako listę klientów.
 */

interface LandingViewProps {
  onNavigate: (tab: NavTabId) => void;
  /** Miejsce na klin wejściowy (`QuickAtsCheck`) — realne narzędzie, nie makieta. */
  atsSlot: React.ReactNode;
}

/** Kotwica wezwania do działania. Jedna stała, bo używają jej trzy miejsca. */
const ATS_ANCHOR = 'sprawdz-cv';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F26440]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19]';

/** Powierzchnia karty — jedna definicja, żeby Bento nie rozjechało się wizualnie. */
const SURFACE =
  'rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl transition-colors duration-200 ease-out hover:border-slate-700/80';

const EYEBROW = 'font-mono text-xs uppercase tracking-[0.2em] text-[#F26440]';
const H2 =
  'mt-4 max-w-[20ch] text-balance text-3xl font-bold leading-tight tracking-tight text-slate-50 sm:text-4xl';

// ---------------------------------------------------------------------------
// Symulator CV: zwykły widok / mapa ciepła / rentgen ATS
// ---------------------------------------------------------------------------

type PreviewMode = 'plain' | 'heat' | 'ats';

const MODES: { id: PreviewMode; label: string; icon: React.ElementType }[] = [
  { id: 'plain', label: 'Zwykły widok', icon: Eye },
  { id: 'heat', label: 'Mapa ciepła', icon: Flame },
  { id: 'ats', label: 'Rentgen ATS', icon: ScanLine },
];

const MODE_NOTE: Record<PreviewMode, string> = {
  plain: 'Arkusz A4 tak, jak zobaczy go człowiek po drugiej stronie.',
  heat: 'Wzorzec F — model poglądowy uwagi, nie pomiar eye-trackingu.',
  ats: 'Warstwa maszynowa: co parser potrafi odczytać z układu.',
};

/**
 * Warstwa ciepła. Gradienty radialne w jednym `background`, bo trzy osobne
 * elementy z `mix-blend-screen` nakładałyby się na siebie, a nie na dokument.
 * Ciepłe plamy: nagłówek, dwa pierwsze podpunkty ostatniej pracy, kolumna
 * umiejętności. Chłodne: edukacja i stopka.
 */
const HEAT_LAYER =
  'radial-gradient(110px 46px at 27% 9%, rgba(242,100,64,0.9), transparent 70%),' +
  'radial-gradient(80px 34px at 22% 15%, rgba(255,170,60,0.7), transparent 70%),' +
  'radial-gradient(130px 34px at 40% 31%, rgba(242,100,64,0.85), transparent 72%),' +
  'radial-gradient(120px 30px at 37% 36%, rgba(255,120,60,0.7), transparent 72%),' +
  'radial-gradient(56px 120px at 86% 33%, rgba(242,100,64,0.6), transparent 72%),' +
  'radial-gradient(120px 40px at 38% 78%, rgba(56,189,248,0.45), transparent 74%),' +
  'radial-gradient(150px 34px at 50% 92%, rgba(30,58,95,0.5), transparent 76%)';

const SheetLine: React.FC<{ w: string; strong?: boolean }> = ({ w, strong }) => (
  <div className={`h-1.5 rounded ${strong ? 'bg-slate-400' : 'bg-slate-300'}`} style={{ width: w }} />
);

/** Miniatura arkusza. Tło zawsze białe — to podgląd dokumentu, nie interfejsu. */
const CvSheet: React.FC<{ mode: PreviewMode }> = ({ mode }) => (
  <div className="relative aspect-[1/1.18] w-full overflow-hidden rounded-lg bg-white p-5 text-slate-900 shadow-2xl">
    <div className="flex items-baseline justify-between">
      <div>
        <div className="text-sm font-bold tracking-tight">Anna Kowalska</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
          Monter instalacji gazowych
        </div>
      </div>
      <div className="space-y-1 text-right">
        <SheetLine w="46px" />
        <SheetLine w="34px" />
      </div>
    </div>

    <div className="mt-4 grid grid-cols-[1fr_auto] gap-4">
      <div className="space-y-4">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-400">
            Doświadczenie
          </div>
          <div className="mt-2 space-y-1.5">
            <SheetLine w="72%" strong />
            <SheetLine w="88%" />
            <SheetLine w="80%" />
            <SheetLine w="58%" />
          </div>
        </div>
        <div className="space-y-1.5">
          <SheetLine w="64%" strong />
          <SheetLine w="84%" />
          <SheetLine w="52%" />
        </div>
        <div className="space-y-1.5">
          <SheetLine w="68%" strong />
          <SheetLine w="90%" />
          <SheetLine w="76%" />
          <SheetLine w="48%" />
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-400">
            Edukacja
          </div>
          <div className="mt-2 space-y-1.5">
            <SheetLine w="60%" />
            <SheetLine w="44%" />
            <SheetLine w="52%" />
          </div>
        </div>
      </div>
      <div className="w-[74px] space-y-1.5">
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-400">
          Uprawnienia
        </div>
        {['SEP E1', 'UDT', 'F-Gaz', 'Prawo jazdy B'].map((t) => (
          <div key={t} className="rounded bg-slate-100 px-1.5 py-1 text-[8px] text-slate-600">
            {t}
          </div>
        ))}
      </div>
    </div>

    <div className="absolute inset-x-5 bottom-4 space-y-1.5">
      <SheetLine w="100%" />
      <SheetLine w="40%" />
    </div>

    {/* Warstwy trybów. `pointer-events-none`, bo arkusz nie jest klikalny. */}
    <AnimatePresence>
      {mode === 'heat' ? (
        <motion.div
          key="heat"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          // `multiply`, nie `screen`: arkusz jest biały, a tryb screen na bieli daje
          // biel — warstwa istniała, tylko była niewidoczna.
          className="pointer-events-none absolute inset-0 mix-blend-multiply"
          style={{ background: HEAT_LAYER }}
        />
      ) : null}
      {mode === 'ats' ? (
        <motion.div
          key="ats"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute inset-0 bg-[#0B0F19]/70" />
          {[
            { top: '4%', left: '5%', w: '58%', h: '11%', label: 'nagłówek — OK' },
            { top: '21%', left: '5%', w: '62%', h: '33%', label: 'doświadczenie — OK' },
            { top: '23%', left: '74%', w: '21%', h: '27%', label: 'uprawnienia — OK' },
            { top: '60%', left: '5%', w: '48%', h: '12%', label: 'daty — do poprawy' },
          ].map((box) => (
            <div
              key={box.label}
              className={`absolute rounded border ${
                box.label.includes('poprawy')
                  ? 'border-amber-400/80 bg-amber-400/10'
                  : 'border-[#38BDF8]/80 bg-[#38BDF8]/10'
              }`}
              style={{ top: box.top, left: box.left, width: box.w, height: box.h }}
            >
              <span
                className={`absolute -top-0.5 left-1 -translate-y-full whitespace-nowrap font-mono text-[8px] ${
                  box.label.includes('poprawy') ? 'text-amber-300' : 'text-[#38BDF8]'
                }`}
              >
                {box.label}
              </span>
            </div>
          ))}
        </motion.div>
      ) : null}
    </AnimatePresence>
  </div>
);

const CvSimulator: React.FC = () => {
  const [mode, setMode] = useState<PreviewMode>('heat');
  const noteId = useId();

  return (
    <div className={`${SURFACE} p-4 shadow-[0_0_60px_rgba(30,58,95,0.35)] sm:p-5`}>
      <div
        role="tablist"
        aria-label="Tryb podglądu dokumentu"
        className="flex gap-1 rounded-lg border border-slate-800/80 bg-[#0B0F19]/60 p-1"
      >
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={noteId}
              onClick={() => setMode(m.id)}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-2 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors duration-200 ease-out ${FOCUS_RING} ${
                active
                  ? 'bg-[#F26440] text-white'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{m.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <CvSheet mode={mode} />
      </div>

      {/* Stała wysokość: podpis zmienia się przy przełączaniu i bez niej
          arkusz podskakiwałby o jedną linijkę. */}
      <p
        id={noteId}
        aria-live="polite"
        className="mt-4 flex min-h-[36px] items-center gap-2 rounded-lg border border-slate-800/80 bg-[#0B0F19]/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-400"
      >
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            mode === 'heat' ? 'bg-[#F26440]' : mode === 'ats' ? 'bg-[#38BDF8]' : 'bg-slate-600'
          }`}
          aria-hidden="true"
        />
        {MODE_NOTE[mode]}
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Bento
// ---------------------------------------------------------------------------

const KEYWORDS: { word: string; state: 'found' | 'partial' | 'missing' }[] = [
  { word: 'instalacje gazowe', state: 'found' },
  { word: 'UDT', state: 'found' },
  { word: 'odbiory techniczne', state: 'found' },
  { word: 'kosztorysowanie', state: 'partial' },
  { word: 'dokumentacja powykonawcza', state: 'partial' },
  { word: 'SEP E2', state: 'missing' },
  { word: 'serwis kotłów kondensacyjnych', state: 'missing' },
];

const KEYWORD_STYLE: Record<string, string> = {
  found: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  partial: 'border-amber-400/50 bg-transparent text-amber-300 ring-1 ring-amber-400/30',
  missing: 'border-slate-800 bg-slate-900/60 text-slate-500 line-through',
};

const KANBAN: { col: string; cards: { firma: string; date: string; tone: string }[] }[] = [
  {
    col: 'Wysłane',
    cards: [
      { firma: 'Nordwind Sp. z o.o.', date: '12.08', tone: 'bg-[#1E3A5F]' },
      { firma: 'Termika Zachód', date: '10.08', tone: 'bg-slate-700' },
    ],
  },
  {
    col: 'Selekcja',
    cards: [{ firma: 'Gazoserwis Kraków', date: '14.08', tone: 'bg-[#38BDF8]/70' }],
  },
  {
    col: 'Rozmowa',
    cards: [{ firma: 'Instal-Bud', date: '19.08', tone: 'bg-[#F26440]' }],
  },
  { col: 'Oferta', cards: [] },
];

const BentoHeader: React.FC<{ label: string; note?: string }> = ({ label, note }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">
      {label}
    </span>
    {note ? (
      <span className="shrink-0 rounded-lg border border-slate-800 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
        {note}
      </span>
    ) : null}
  </div>
);

// ---------------------------------------------------------------------------

const DIFFERENCES: { us: string; them: string }[] = [
  {
    us: 'Wynik punktowy liczony pod konkretne ogłoszenie',
    them: 'Ten sam dokument wysyłany wszędzie',
  },
  {
    us: 'Doświadczenie przepisane metodą STAR',
    them: 'Lista obowiązków przepisana z umowy',
  },
  {
    us: 'Kokpit Rozmowy: pitch, trudne pytania, negocjacje',
    them: 'Koniec pomocy w chwili pobrania PDF-a',
  },
  {
    us: 'Pipeline ze statusami wysłanych aplikacji',
    them: 'Arkusz kalkulacyjny albo pamięć',
  },
];

const STEPS: { no: string; title: string; body: string }[] = [
  {
    no: '01',
    title: 'Wrzuć CV i ogłoszenie',
    body: 'Wklejasz treść albo plik oraz opis stanowiska. Analiza rusza od razu, bez zakładania konta.',
  },
  {
    no: '02',
    title: 'Dopasuj pod filtr',
    body: 'Dostajesz wynik i listę braków. Doświadczenie przepisujesz metodą STAR, punkt po punkcie.',
  },
  {
    no: '03',
    title: 'Wydrukuj i śledź',
    body: 'Podgląd A4 z wybranym szablonem, gotowy do druku. Wysłane aplikacje lądują w pipeline.',
  },
];

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate, atsSlot }) => {
  const scrollToAts = () => {
    document.getElementById(ATS_ANCHOR)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-20 pb-8">
      {/* HERO — obietnica po lewej, dowód po prawej. */}
      <section className="pt-6">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#F26440]/50 to-transparent" />
        <div className="grid items-center gap-10 pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-300 backdrop-blur-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F26440]" aria-hidden="true" />
              Bez konta • Dane lokalnie
            </span>
            <h1 className="mt-6 max-w-[18ch] text-balance text-[2.25rem] font-bold leading-none tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
              CV, które przejeżdża przez filtr ATS.
            </h1>
            <p className="mt-6 max-w-[46ch] text-pretty text-base leading-relaxed text-slate-400 sm:text-lg">
              Budujesz CV, przygotowujesz się do rozmowy i śledzisz wysłane aplikacje — w jednym
              miejscu. W trybie lokalnym dane zostają w tej przeglądarce.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={scrollToAts}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#F26440] px-5 py-3 text-sm font-bold text-white shadow-[0_0_25px_rgba(242,100,64,0.35)] transition-colors duration-200 ease-out hover:bg-[#F26440]/90 ${FOCUS_RING}`}
              >
                Sprawdź CV za darmo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('pricing')}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/60 px-5 py-3 text-sm font-bold text-slate-200 backdrop-blur-xl transition-colors duration-200 ease-out hover:border-slate-700/80 ${FOCUS_RING}`}
              >
                Zobacz cennik
              </button>
            </div>
            <p className="mt-4 max-w-[36ch] font-mono text-[11px] leading-relaxed text-slate-500">
              Bez konta i bez karty. Plik czytamy w przeglądarce.
            </p>
          </div>

          <CvSimulator />
        </div>
      </section>

      {/* Klin wejściowy: realne narzędzie zaraz pod obietnicą. */}
      <section id={ATS_ANCHOR} className="scroll-mt-24">
        {atsSlot}
      </section>

      {/* BENTO — cztery kokpity produktu zamiast czterech akapitów o produkcie. */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className={EYEBROW}>Produkt w akcji</p>
            <h2 className={H2}>Cztery kokpity, jeden proces.</h2>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            makiety poglądowe — dane przykładowe
          </span>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* 1 — ATS Deep Analysis (duża) */}
          <button
            type="button"
            onClick={() => onNavigate('aplikuj')}
            className={`${SURFACE} group cursor-pointer p-6 text-left md:col-span-2 ${FOCUS_RING}`}
          >
            <BentoHeader label="Analiza ATS" note="przykład" />
            <div className="mt-5 flex items-end justify-between">
              <div>
                <div className="font-mono text-5xl font-bold leading-none text-slate-50">
                  82<span className="text-2xl text-slate-500">/100</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  dopasowanie do jednego, konkretnego ogłoszenia
                </p>
              </div>
              <span className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-300">
                przejdzie filtr
              </span>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#0B0F19]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-[#F26440]"
                style={{ width: '82%' }}
              />
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {KEYWORDS.map((k) => (
                <span
                  key={k.word}
                  className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] ${KEYWORD_STYLE[k.state]}`}
                >
                  {k.word}
                </span>
              ))}
            </div>
            <p className="mt-5 text-sm leading-relaxed text-slate-400">
              Widzisz nie samą ocenę, tylko to, co konkretnie blokuje przejście: zielone —
              znalezione, żółte — wspomniane zbyt ogólnie, przekreślone — brakujące.
            </p>
          </button>

          {/* 2 — Pipeline CRM */}
          <button
            type="button"
            onClick={() => onNavigate('pipeline')}
            className={`${SURFACE} cursor-pointer p-6 text-left ${FOCUS_RING}`}
          >
            <BentoHeader label="Pipeline aplikacji" note="przykład" />
            <div className="mt-4 grid grid-cols-4 gap-1.5">
              {KANBAN.map((col) => (
                <div key={col.col} className="rounded-lg bg-[#0B0F19]/70 p-1.5">
                  <span className="block truncate font-mono text-[9px] uppercase tracking-[0.08em] text-slate-500">
                    {col.col}
                  </span>
                  <div className="mt-2 min-h-[64px] space-y-1.5">
                    {col.cards.map((c) => (
                      <div
                        key={c.firma}
                        className="rounded-md border border-slate-800 bg-slate-900/80 p-1.5"
                      >
                        <span
                          className={`block h-4 w-4 rounded ${c.tone}`}
                          aria-hidden="true"
                        />
                        <span className="mt-1 block truncate text-[10px] text-slate-300">
                          {c.firma}
                        </span>
                        <span className="font-mono text-[9px] text-slate-500">{c.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-50">Wszystko w jednej tablicy</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Statusy, daty i notatki z każdego procesu zamiast arkusza kalkulacyjnego.
            </p>
          </button>

          {/* 3 — Kokpit Rozmowy i widełki */}
          <button
            type="button"
            onClick={() => onNavigate('trenuj')}
            className={`${SURFACE} cursor-pointer p-6 text-left ${FOCUS_RING}`}
          >
            <BentoHeader label="Kokpit Rozmowy" note="przykład" />
            <div className="mt-4 rounded-lg bg-[#0B0F19]/70 p-3">
              <div className="flex items-baseline justify-between font-mono text-[11px]">
                <span className="text-slate-400">Widełki</span>
                <span className="text-slate-200">120 000 – 150 000 zł</span>
              </div>
              <div className="relative mt-3 h-1.5 rounded-full bg-slate-800">
                <div className="absolute inset-y-0 left-[24%] right-[22%] rounded-full bg-[#F26440]" />
                <span className="absolute -top-1 left-[24%] h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-[#0B0F19] bg-[#F26440]" />
                <span className="absolute -top-1 right-[22%] h-3.5 w-3.5 translate-x-1/2 rounded-full border-2 border-[#0B0F19] bg-[#F26440]" />
              </div>
              <div className="mt-3 flex items-center justify-between font-mono text-[10px]">
                <span className="text-slate-500">rynek · Twoja stawka</span>
                <span className="text-emerald-300">Pewność: wysoka</span>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {[
                { q: 'Dlaczego zmienia Pani pracę?', tag: 'Behavioral' },
                { q: 'Proszę opisać trudny odbiór techniczny.', tag: 'STAR' },
              ].map((row) => (
                <div
                  key={row.tag}
                  className="flex items-center gap-2 rounded-lg bg-[#0B0F19]/70 px-3 py-2"
                >
                  <span className="truncate text-[13px] text-slate-300">{row.q}</span>
                  <span className="ml-auto shrink-0 rounded-lg border border-slate-800 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-slate-400">
                    {row.tag}
                  </span>
                </div>
              ))}
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-50">Gotowy przed wejściem</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Pitch, trudne pytania i widełki przygotowane zanim usiądziesz do rozmowy.
            </p>
          </button>

          {/* 4 — Prywatność / local-first */}
          <div className={`${SURFACE} p-6 md:col-span-2`}>
            <BentoHeader label="Tryb lokalny" />
            <p className="mt-4 flex items-center gap-2 text-lg font-bold text-slate-50">
              <ShieldCheck className="h-5 w-5 text-[#F26440]" aria-hidden="true" />
              Dane nie opuszczają urządzenia
            </p>
            <ul className="mt-4 space-y-2">
              {[
                { text: 'Pamięć lokalna przeglądarki', state: 'aktywna', on: true },
                { text: 'Wysyłka CV na serwer', state: 'wyłączona', on: false },
                { text: 'Konto i subskrypcja', state: 'nie wymagane', on: false },
              ].map((row) => (
                <li
                  key={row.text}
                  className="flex items-center gap-3 rounded-lg bg-[#0B0F19]/70 px-3 py-2.5"
                >
                  <span
                    className={`flex h-4 w-7 shrink-0 items-center rounded-full px-0.5 ${
                      row.on ? 'justify-end bg-[#F26440]' : 'justify-start bg-slate-700'
                    }`}
                    aria-hidden="true"
                  >
                    <span className="h-3 w-3 rounded-full bg-white" />
                  </span>
                  <span className="truncate text-sm text-slate-300">{row.text}</span>
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-slate-500">
                    {row.state}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Konto zakładasz dopiero wtedy, gdy chcesz mieć te same dane na drugim urządzeniu.
            </p>
          </div>
        </div>
      </section>

      {/* CZYM SIĘ RÓŻNI */}
      <section className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className={EYEBROW}>Czym się różni</p>
          <h2 className={H2}>Nie kolejny kreator. Narzędzie do przejazdu.</h2>
          <p className="mt-4 max-w-[44ch] text-pretty leading-relaxed text-slate-400">
            Typowy kreator kończy pracę w chwili, gdy dokument wygląda ładnie. Tutaj dokument to
            dopiero pierwszy z czterech kroków: dopasowanie, przepisanie, rozmowa, pipeline.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={`${SURFACE} border-[#F26440]/40 p-5`}>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#F26440]">
              CVelocity
            </span>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              {DIFFERENCES.map((d) => (
                <li key={d.us} className="flex gap-2">
                  <span className="shrink-0 text-[#F26440]" aria-hidden="true">
                    ✓
                  </span>
                  {d.us}
                </li>
              ))}
            </ul>
          </div>
          <div className={`${SURFACE} p-5`}>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">
              Typowy kreator
            </span>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              {DIFFERENCES.map((d) => (
                <li key={d.them} className="flex gap-2">
                  <span className="shrink-0" aria-hidden="true">
                    •
                  </span>
                  {d.them}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* JAK TO DZIAŁA */}
      <section>
        <p className={EYEBROW}>Jak to działa</p>
        <h2 className={H2}>Trzy kroki do gotowego przejazdu.</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.no} className={`${SURFACE} p-6`}>
              <span className="font-mono text-2xl font-bold text-[#F26440]">{s.no}</span>
              <h3 className="mt-4 text-lg font-bold text-slate-50">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CENNIK — liczby zgodne z widokiem cennika, bez planów, których nie ma. */}
      <section>
        <p className={EYEBROW}>Cennik</p>
        <h2 className={H2}>Uczciwie o tym, co jest darmowe.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className={`${SURFACE} flex flex-col border-slate-800 p-6`}>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">
              Start
            </span>
            <span className="mt-3 font-mono text-3xl font-bold text-slate-50">0 zł</span>
            <p className="mt-1 text-sm text-slate-400">bez karty, bez limitu czasu</p>
            <ul className="mb-6 mt-5 space-y-3 text-sm text-slate-200">
              {[
                'Analiza ATS z wynikiem punktowym',
                'Profil i podgląd A4 z wydrukiem',
                'Szablony Modern i Minimal',
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="shrink-0 text-[#F26440]" aria-hidden="true">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={scrollToAts}
              className={`mt-auto cursor-pointer rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-bold text-slate-100 transition-colors duration-200 ease-out hover:border-slate-700 hover:bg-slate-900/80 ${FOCUS_RING}`}
            >
              Zacznij bez konta
            </button>
          </div>

          <div
            className={`${SURFACE} relative flex flex-col border-[#F26440]/50 p-6 shadow-[0_0_30px_rgba(242,100,64,0.15)]`}
          >
            <span className="absolute -top-2.5 right-6 rounded-lg bg-[#F26440] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white">
              Rekomendowany
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#F26440]">
              Pro
            </span>
            <span className="mt-3 font-mono text-3xl font-bold text-slate-50">
              49 zł
              <span className="text-base font-normal text-slate-400"> / miesiąc</span>
            </span>
            <p className="mt-1 text-sm text-slate-400">39 zł przy rozliczeniu rocznym</p>
            <ul className="mb-6 mt-5 space-y-3 text-sm text-slate-200">
              {[
                'Nielimitowany Instant-Import (PDF, DOCX)',
                'Wsparcie AI przy lukach kompetencyjnych',
                'Pełny dostęp do wszystkich szablonów A4',
                'Szablony Executive i Creative',
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="shrink-0 text-[#F26440]" aria-hidden="true">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className={`mt-auto cursor-pointer rounded-xl bg-[#F26440] px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_25px_rgba(242,100,64,0.35)] transition-colors duration-200 ease-out hover:bg-[#F26440]/90 ${FOCUS_RING}`}
            >
              Zobacz pełny cennik
            </button>
          </div>
        </div>
        <p className="mt-6 font-mono text-[11px] text-slate-500">
          Wersja Start zostaje darmowa. Pojedyncze szablony premium można kupić osobno za 19 zł
          zamiast wykupywania Pro.
        </p>
      </section>
    </div>
  );
};
