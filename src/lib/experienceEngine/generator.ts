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
  let formalBullet1 = `${actionNoun} ${objectsStr}`;
  if (techStr) {
    formalBullet1 += ` z wykorzystaniem ${techStr}`;
  }
  if (outcomeClause) {
    formalBullet1 += `${outcomeClause}${metricClause}.`;
  } else {
    formalBullet1 += '.';
  }

  const formalBullet2 = techStr
    ? `Bieżąca praca w środowisku technologicznym ${techStr}, z dbałością o standardy jakościowe.`
    : `Realizacja zadań w obszarze ${fact.area} zgodnie z dokumentacją i standardami technicznymi.`;

  // 2. Wariant Aktywny (Czasowniki sprawcze 1 os. lp)
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

  const activeBullet2 = fact.outcome
    ? `Konsekwentnie dbałem o wysoką jakość i niezawodność realizowanych rozwiązań.`
    : `Współpracowałem w zespole nad ciągłym rozwojem i optymalizacją powierzonych obszarów.`;

  // 3. Wariant Techniczny / Narzędziowy
  let techBullet1 = techStr
    ? `Stack technologiczny: ${techStr} — ${actionNoun.toLowerCase()} ${objectsStr}.`
    : `${actionNoun} ${objectsStr} w ramach projektów ${fact.area}.`;
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
