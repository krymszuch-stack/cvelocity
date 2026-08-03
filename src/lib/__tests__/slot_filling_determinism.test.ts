import { describe, it, expect } from 'vitest';
import { extractSlotsFromHighlight, fillSlotSentence } from '../slotFillingEngine';
import { HighlightMetric } from '../../types';

/**
 * Regression guard: fillSlotSentence used to pick a synonym with Math.random on every
 * call. Because its output feeds simulateAtsCheck, the live ATS score jumped between
 * unrelated values (30 → 100 → 1 …) on every re-render without any user input.
 */
describe('fillSlotSentence determinism', () => {
  const highlight: HighlightMetric = {
    id: 'h1',
    text: 'Zarządzałem zespołem inżynierów, wdrażając mikroserwisy w Node.js, skracając deploy o 40%',
    action: 'Zarządzałem',
    target: 'zespołem inżynierów',
    tool: 'Node.js',
    metric: '40%',
    keywords: ['zespołem', 'mikroserwisy'],
  };

  const keywords = ['typescript', 'node.js', 'docker', 'sql'];

  it('returns an identical sentence across repeated calls with the same input', () => {
    const slot = extractSlotsFromHighlight(highlight);
    const runs = Array.from({ length: 25 }, () => fillSlotSentence(slot, keywords, 'ACTION_FIRST'));

    expect(new Set(runs).size).toBe(1);
  });

  it('stays stable when the slot is re-extracted each time', () => {
    const runs = Array.from({ length: 10 }, () =>
      fillSlotSentence(extractSlotsFromHighlight(highlight), keywords, 'ACTION_FIRST')
    );

    expect(new Set(runs).size).toBe(1);
  });

  it('still differentiates distinct phrases rather than collapsing to one synonym', () => {
    const other: HighlightMetric = {
      ...highlight,
      id: 'h2',
      text: 'Zarządzałem budżetem marketingowym, obniżając koszt pozyskania klienta o 25%',
      target: 'budżetem marketingowym',
      tool: 'HubSpot',
      metric: '25%',
    };

    const a = fillSlotSentence(extractSlotsFromHighlight(highlight), keywords, 'ACTION_FIRST');
    const b = fillSlotSentence(extractSlotsFromHighlight(other), keywords, 'ACTION_FIRST');

    expect(a).not.toBe(b);
  });
});
