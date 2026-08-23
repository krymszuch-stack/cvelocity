import { STARStory, MasterVault } from '../types';

/**
 * Słownik słów kluczowych dla silnika autotagowania NLP (Lightweight NLP)
 */
const AUTO_TAG_DICTIONARY: Array<{ tag: string; regex: RegExp; category: 'TECH' | 'TRADE' | 'SOFT' | 'BUSINESS' }> = [
  // IT & Technologie
  { tag: 'TypeScript', regex: /\b(?:typescript|ts)\b/i, category: 'TECH' },
  { tag: 'React', regex: /\b(?:react|reactjs|react\.js)\b/i, category: 'TECH' },
  { tag: 'Node.js', regex: /\b(?:node|nodejs|node\.js)\b/i, category: 'TECH' },
  { tag: 'PostgreSQL', regex: /\b(?:postgres|postgresql)\b/i, category: 'TECH' },
  { tag: 'SQL', regex: /\b(?:sql|mysql|oracle|database)\b/i, category: 'TECH' },
  { tag: 'Kafka', regex: /\b(?:kafka|event-driven|strumieniowanie)\b/i, category: 'TECH' },
  { tag: 'Docker', regex: /\b(?:docker|konteneryzacja|containers)\b/i, category: 'TECH' },
  { tag: 'Kubernetes', regex: /\b(?:kubernetes|k8s)\b/i, category: 'TECH' },
  { tag: 'AWS', regex: /\b(?:aws|amazon web services|s3|lambda|ec2)\b/i, category: 'TECH' },
  { tag: 'GCP', regex: /\b(?:gcp|google cloud|bigquery)\b/i, category: 'TECH' },
  { tag: 'Azure', regex: /\b(?:azure|microsoft cloud)\b/i, category: 'TECH' },
  { tag: 'Python', regex: /\b(?:python|django|fastapi|flask)\b/i, category: 'TECH' },
  { tag: 'Redis', regex: /\b(?:redis|caching|pamięć podręczna)\b/i, category: 'TECH' },
  { tag: 'GraphQL', regex: /\b(?:graphql|apollo)\b/i, category: 'TECH' },
  { tag: 'CI/CD', regex: /\b(?:ci\/cd|pipeline|github actions|gitlab ci|jenkins)\b/i, category: 'TECH' },
  { tag: 'Mikroserwisy', regex: /\b(?:mikroserwisy|microservices|rozproszon)\b/i, category: 'TECH' },

  // Branże techniczne i prace fizyczne (Reguła 8)
  { tag: 'SEP', regex: /\b(?:sep|sep\s+g1|sep\s+g2|sep\s+g3|uprawnienia\s+elektryczne)\b/i, category: 'TRADE' },
  { tag: 'UDT', regex: /\b(?:udt|wózki\s+widłowe|suwnice|podesty)\b/i, category: 'TRADE' },
  { tag: 'F-Gaz', regex: /\b(?:f-gaz|fgaz|klimatyzacja|chłodnictwo)\b/i, category: 'TRADE' },
  { tag: 'Spawanie TIG', regex: /\b(?:spawanie\s+tig|metoda\s+141|tig)\b/i, category: 'TRADE' },
  { tag: 'Spawanie MIG/MAG', regex: /\b(?:spawanie\s+mig|spawanie\s+mag|metoda\s+135|mig\/mag)\b/i, category: 'TRADE' },
  { tag: 'Utrzymanie Ruchu', regex: /\b(?:utrzymanie\s+ruchu|ur|awari[ae]|napraw[ay]|prewencja)\b/i, category: 'TRADE' },
  { tag: 'BHP', regex: /\b(?:bhp|bezpieczeństwo\s+pracy|środki\s+ochrony)\b/i, category: 'TRADE' },
  { tag: '5S', regex: /\b(?:5s|lean|lean\s+manufacturing|kaizen)\b/i, category: 'TRADE' },
  { tag: 'WMS', regex: /\b(?:wms|magazyn|gospodarka\s+magazynowa|kompletacja)\b/i, category: 'TRADE' },

  // Kompetencje miękkie & przywództwo
  { tag: 'Optymalizacja', regex: /\b(?:optymalizacj[aei]|przyspieszen|skrócen|popraw[ay]\s+wydajności)\b/i, category: 'SOFT' },
  { tag: 'Architektura', regex: /\b(?:architektur[ae]|design\s+patterns|wzorce\s+projektowe)\b/i, category: 'SOFT' },
  { tag: 'Przywództwo', regex: /\b(?:przywództwo|leadership|kierowanie|zarządzanie\s+zespołem|team\s+lead)\b/i, category: 'SOFT' },
  { tag: 'Mentoring', regex: /\b(?:mentoring|onboarding|wdrażanie\s+pracowników|szkolenie)\b/i, category: 'SOFT' },
  { tag: 'Rozwiązywanie Problemów', regex: /\b(?:rozwiąz|problem|debugging|analiza\s+przyczyn|rca)\b/i, category: 'SOFT' },
  { tag: 'Zarządzanie Kryzysowe', regex: /\b(?:kryzys|incydent|postmortem|awaria\s+krytyczna)\b/i, category: 'SOFT' },
  { tag: 'Praca Zespołowa', regex: /\b(?:zespół|współpraca|cross-functional|komunikacja)\b/i, category: 'SOFT' },

  // Wyniki & Wskaźniki Biznesowe
  { tag: 'Redukcja Kosztów', regex: /\b(?:koszt[ówy]|oszczędnoś|taniej|budżet)\b/i, category: 'BUSINESS' },
  { tag: 'Wysoka Dostępność (HA)', regex: /\b(?:uptime|high\s+availability|sla|99\.\d+%)\b/i, category: 'BUSINESS' },
  { tag: 'Skalowanie', regex: /\b(?:skalowan|tps|ruch|użytkownik[ówi]|skala)\b/i, category: 'BUSINESS' },
];

/**
 * Lekki silnik NLP (Lightweight NLP) sugerujący tagi na podstawie treści historii STAR.
 */
export function suggestTagsForSTARStory(
  story: Partial<STARStory>,
  existingTags: string[] = []
): string[] {
  const combinedText = [
    story.title || '',
    story.situation || '',
    story.task || '',
    story.action || '',
    story.result || '',
    ...(story.metrics || []),
  ].join(' ');

  if (!combinedText.trim()) {
    return [];
  }

  const existingNorm = new Set(
    [...(story.tags || []), ...existingTags].map((t) => t.trim().toLowerCase())
  );

  const suggested = new Set<string>();

  for (const item of AUTO_TAG_DICTIONARY) {
    if (!existingNorm.has(item.tag.toLowerCase()) && item.regex.test(combinedText)) {
      suggested.add(item.tag);
    }
  }

  // Wykrywanie wskaźników liczbowych -> tag "Metryki i Liczby"
  if (/(?:^|\s|[+<>=~])\d+[%xXkKmM+]?(?:\s*(?:s|ms|zł|pln|tps|lcp|fcp))?(?:\s|$|[,.:;])/i.test(combinedText) && !existingNorm.has('metryki i liczby')) {
    suggested.add('Metryki i Liczby');
  }

  return Array.from(suggested);
}

/**
 * Buduje bazowe historie STAR na podstawie MasterVault (z historii zatrudnienia i projektów).
 */
export function buildStarStoriesFromVault(vault: MasterVault): STARStory[] {
  const stories: STARStory[] = [];

  // 1. Z historii zatrudnienia
  if (Array.isArray(vault.history)) {
    vault.history.forEach((exp) => {
      if (Array.isArray(exp.highlights)) {
        exp.highlights.forEach((hl, hlIdx) => {
          const metrics: string[] = [];
          if (hl.metric) {
            metrics.push(hl.metric);
          } else {
            const digitMatch = hl.text.match(/\d+[%kKmM+xX]?/g);
            if (digitMatch) {
              metrics.push(...digitMatch);
            }
          }

          const tags = Array.isArray(hl.keywords) && hl.keywords.length > 0
            ? [...hl.keywords]
            : [exp.role, exp.company];

          const story: STARStory = {
            id: `star_exp_${exp.id}_${hlIdx}`,
            title: `${exp.role} @ ${exp.company} — ${hl.action || 'Wdrożenie'} ${hl.target || 'Projektu'}`,
            situation: `W firmie ${exp.company} na stanowisku ${exp.role} zidentyfikowano potrzebę optymalizacji w obszarze: ${hl.target || hl.text}.`,
            task: `Moim zadaniem było ${hl.action ? `${hl.action.toLowerCase()} ${hl.target || ''}` : 'zrealizowanie kluczowego usprawnienia'} przy użyciu ${hl.tool || 'dedykowanych narzędzi'}.`,
            action: `Zastosowałem ${hl.tool || 'odpowiednie technologie'} (${tags.slice(0, 3).join(', ')}), przeprowadzając analizę, projekt techniczny i bezpieczne wdrożenie.`,
            result: hl.metric
              ? `Osiągnięto wymierny rezultat: ${hl.metric}. Pełny opis: ${hl.text}`
              : `Projekt zakończył się sukcesem: ${hl.text}`,
            metrics,
            tags,
            projectId: exp.id,
            durationSec: 90, // Domyślny czas prezentacji STAR = 90 sekund (1.5 minuty)
          };

          // Dopełnij tagi sugestiami NLP
          const autoTags = suggestTagsForSTARStory(story, story.tags);
          story.tags = Array.from(new Set([...story.tags, ...autoTags.slice(0, 2)]));

          stories.push(story);
        });
      }
    });
  }

  // 2. Z projektów
  if (Array.isArray(vault.projects)) {
    vault.projects.forEach((proj, projIdx) => {
      const metrics: string[] = [];
      if (proj.metrics) {
        metrics.push(proj.metrics);
      }

      const story: STARStory = {
        id: `star_proj_${proj.id || projIdx}`,
        title: `Projekt: ${proj.name} (${proj.role})`,
        situation: `W ramach projektu „${proj.name}” istniało zapotrzebowanie na: ${proj.description || 'nowe rozwiązanie techniczne'}.`,
        task: `Jako ${proj.role} odpowiadałem za zaprojektowanie i dostarczenie skalowalnej architektury.`,
        action: `Zbudowałem rozwiązanie z wykorzystaniem: ${proj.techStack?.join(', ') || 'kluczowego stosu technologicznego'}.`,
        result: proj.metrics
          ? `Wdrożenie przyniosło wynik: ${proj.metrics}.`
          : 'System został z powodzeniem wdrożony i spełnił wszystkie założenia wydajnościowe.',
        metrics,
        tags: Array.isArray(proj.techStack) ? [...proj.techStack] : [],
        projectId: proj.id || `proj_${projIdx}`,
        durationSec: 90,
      };

      const autoTags = suggestTagsForSTARStory(story, story.tags);
      story.tags = Array.from(new Set([...story.tags, ...autoTags.slice(0, 2)]));

      stories.push(story);
    });
  }

  return stories;
}

/**
 * Filtruje historie STAR na podstawie wybranych tagów z chmury tagów.
 */
export function filterStarStoriesByTags(
  stories: STARStory[],
  activeTags: string[],
  searchQuery: string = ''
): STARStory[] {
  let filtered = stories;

  if (activeTags.length > 0) {
    const activeLower = activeTags.map((t) => t.toLowerCase());
    filtered = filtered.filter((s) =>
      s.tags.some((tag) => activeLower.includes(tag.toLowerCase()))
    );
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.situation.toLowerCase().includes(q) ||
        s.action.toLowerCase().includes(q) ||
        s.result.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return filtered;
}

/**
 * Znajduje najbardziej pasującą historię STAR dla aktywnego tagu (auto-load do slotu 3 w HUD).
 */
export function findStoryForActiveTag(
  stories: STARStory[],
  activeTag: string | undefined
): STARStory | undefined {
  if (!activeTag || !stories.length) return undefined;
  const tagLower = activeTag.toLowerCase();
  return stories.find((s) => s.tags.some((t) => t.toLowerCase() === tagLower));
}
