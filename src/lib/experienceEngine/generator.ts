import { ExperienceFact, GeneratedExperienceVariant } from './types';
import { formatActionWord, joinWithPolishConjunction } from './polishForms';

/**
 * Generuje zróżnicowane, w 100% oparte na faktach warianty opisu doświadczenia.
 */
export function generateExperienceVariants(fact: ExperienceFact): GeneratedExperienceVariant[] {
  const objectsStr = joinWithPolishConjunction(fact.objects, 'oraz');
  const techStr = fact.technologies.length > 0
    ? joinWithPolishConjunction(fact.technologies, 'oraz')
    : '';

  const outcomeClause = fact.outcome ? `, ${fact.outcome}` : '';
  const metricClause = fact.metric ? ` (${fact.metric})` : '';

  // 1. Wariant Formalny (Rzeczownikowy / Bezosobowy — standard nowoczesnego CV ATS)
  const actionNoun = formatActionWord(fact.action, 'impersonal');
  let formalBullet1 = `${actionNoun}: ${objectsStr}`;
  if (techStr) {
    formalBullet1 += ` z wykorzystaniem ${techStr}`;
  }
  if (outcomeClause) {
    formalBullet1 += `${outcomeClause}${metricClause}.`;
  } else {
    formalBullet1 += '.';
  }

  const formalBullet2 = techStr
    ? `Bieżąca praca w oparciu o ${techStr}, z dbałością o najwyższe standardy techniczne i jakościowe.`
    : `Realizacja zadań w obszarze ${fact.area} zgodnie z dokumentacją i normami branżowymi.`;

  // 2. Wariant Aktywny (Czasowniki sprawcze 1 os. lp z uwzględnieniem formy gramatycznej)
  const actionVerb = formatActionWord(fact.action, fact.narrativeStyle);
  let activeBullet1 = `${actionVerb} ${objectsStr}`;
  if (techStr) {
    activeBullet1 += ` w oparciu o ${techStr}`;
  }
  if (outcomeClause) {
    activeBullet1 += `${outcomeClause}${metricClause}.`;
  } else {
    activeBullet1 += '.';
  }

  const isFemale = fact.narrativeStyle === 'first_person_f';
  const activeBullet2 = fact.outcome
    ? (isFemale
        ? 'Konsekwentnie dbałam o wysoką jakość, terminowość i bezpieczeństwo realizowanych prac.'
        : 'Konsekwentnie dbałem o wysoką jakość, terminowość i bezpieczeństwo realizowanych prac.')
    : (isFemale
        ? 'Współpracowałam w zespole nad ciągłym rozwojem, standaryzacją i optymalizacją procesów.'
        : 'Współpracowałem w zespole nad ciągłym rozwojem, standaryzacją i optymalizacją procesów.');

  // 3. Wariant Techniczny / Narzędziowy
  let techBullet1 = techStr
    ? `Narzędzia i technologie: ${techStr} — ${actionNoun.toLowerCase()}: ${objectsStr}.`
    : `${actionNoun}: ${objectsStr} w ramach obszaru ${fact.area}.`;
  if (outcomeClause && fact.outcome) {
    techBullet1 += ` Cel: ${fact.outcome.replace(/^,\s*/, '')}${metricClause}.`;
  }

  const variants: GeneratedExperienceVariant[] = [
    {
      id: 'variant-formal',
      styleName: 'Formalny (Bezosobowy)',
      bulletPoints: [formalBullet1, formalBullet2],
      fullParagraph: `${formalBullet1} ${formalBullet2}`,
      highlights: {
        action: actionNoun,
        object: objectsStr,
        tech: fact.technologies,
        outcome: fact.outcome,
      },
    },
    {
      id: 'variant-active',
      styleName: 'Osiągnięcia (Czasowniki)',
      bulletPoints: [activeBullet1, activeBullet2],
      fullParagraph: `${activeBullet1} ${activeBullet2}`,
      highlights: {
        action: actionVerb,
        object: objectsStr,
        tech: fact.technologies,
        outcome: fact.outcome,
      },
    },
    {
      id: 'variant-tech',
      styleName: 'Techniczny / Narzędziowy',
      bulletPoints: [techBullet1],
      fullParagraph: techBullet1,
      highlights: {
        action: actionNoun,
        object: objectsStr,
        tech: fact.technologies,
        outcome: fact.outcome,
      },
    },
  ];

  return variants;
}
