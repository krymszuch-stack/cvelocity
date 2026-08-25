/**
 * Detekcja pustego szkieletu SPA i rozpoznanie portalu.
 *
 * Portale renderujące ofertę w przeglądarce serwerowi wysyłają szkielet:
 * pusty kontener montowania i skrypty. Zamiast rzucać ogólnym błędem serwera,
 * mówimy użytkownikowi jasno, co się stało i na jakim portalu — treść trzeba
 * wtedy wkleić ręcznie, a interfejs może to zaproponować jednym przyciskiem.
 */

/** Poniżej tylu znaków widocznego tekstu strona jest szkieletem. */
export const SPA_SKELETON_MIN_TEXT = 250;

const MOUNT_SELECTORS = ['#root', '#app', '#__next', '#__nuxt', '[data-reactroot]', '#app-root'];

/** Rozpoznane portale — nazwa do pokazania użytkownikowi. */
const KNOWN_PORTALS: Array<[RegExp, string]> = [
  [/(^|\.)pracuj\.pl$/i, 'Pracuj.pl'],
  [/(^|\.)justjoin\.it$/i, 'JustJoin.it'],
  [/(^|\.)nofluffjobs\.com$/i, 'No Fluff Jobs'],
  [/(^|\.)rocketjobs\.pl$/i, 'RocketJobs'],
  [/(^|\.)theprotocol\.it$/i, 'The Protocol'],
  [/(^|\.)solid\.jobs$/i, 'Solid.jobs'],
  [/(^|\.)linkedin\.com$/i, 'LinkedIn'],
  [/(^|\.)olx\.pl$/i, 'OLX'],
];

/**
 * Nazwa portalu dla adresu albo `null`, gdy host jest nieznany. `null` to
 * poprawny wynik — nieznany portal nie jest błędem, tylko brakiem etykiety.
 */
export function detectPortal(urlOrHost: string): string | null {
  let hostname = (urlOrHost ?? '').trim();
  try {
    hostname = new URL(urlOrHost).hostname;
  } catch {
    // Nie-adres: traktujemy ciąg jako samą nazwę hosta.
  }

  for (const [pattern, name] of KNOWN_PORTALS) {
    if (pattern.test(hostname)) return name;
  }
  return null;
}

/**
 * Czy pobrana strona wygląda na pusty szkielet aplikacji?
 *
 * Dwa sygnały, wystarczy jeden: mało widocznego tekstu po odcięciu skryptów
 * i stylów, albo korpus strony to praktycznie wyłącznie pusty kontener
 * montowania frameworka.
 */
export function looksLikeSpaSkeleton(html: string): boolean {
  if (!html || html.length === 0) return false;

  const withoutScripts = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (withoutScripts.length < SPA_SKELETON_MIN_TEXT) return true;

  // Strona z treścią zwykle ma w kontenerze montowania dużo tekstu; szkielet —
  // kontener pusty lub z pojedynczym słowem ładowania.
  for (const selector of MOUNT_SELECTORS) {
    const mounts = html.match(new RegExp(`<[^>]*id=["']${selector.slice(1)}["'][^>]*>([\\s\\S]*?)</`, 'i'));
    if (!mounts) continue;
    const mountText = mounts[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (mountText.length < SPA_SKELETON_MIN_TEXT) return true;
  }

  return false;
}
