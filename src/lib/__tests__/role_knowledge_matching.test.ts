import { describe, it, expect } from 'vitest';
import { inferRoleKnowledge } from '../roleKnowledge';

describe('inferRoleKnowledge — fragment matching regression', () => {
  it('nie powinien dopasowywać roli po pojedynczych literach lub bardzo krótkich fragmentach tytułu', () => {
    // Typing the first one or two characters of a job title used to match as a
    // substring of an unrelated alias (e.g. "j" is inside "java", "an" is inside
    // countless words), surfacing a random role's "typical requirements" the moment
    // the user started typing.
    expect(inferRoleKnowledge('j')).toBeNull();
    expect(inferRoleKnowledge('an')).toBeNull();
  });

  it('nie powinien dopasowywać roli po fragmencie słowa, który nie jest całym wyrazem', () => {
    // "jav" is a substring of the "java" alias but is not itself a word — matching it
    // used to infer the Backend/API role from an incomplete word.
    expect(inferRoleKnowledge('jav')).toBeNull();
  });

  it('powinien dopasować rolę, gdy użytkownik wpisał pełne, rozpoznawalne słowo', () => {
    expect(inferRoleKnowledge('java')?.family).toBe('Backend / API');
    expect(inferRoleKnowledge('Senior Frontend Developer (React)')?.family).toBe('Frontend / UI');
  });
});
