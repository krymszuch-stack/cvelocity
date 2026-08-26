/**
 * Test end-to-end: otwarcie Doradcy AI w kokpicie.
 *
 * Sprawdza dokładnie to, co zawiodło w produkcji: dynamiczny import chunka
 * modala. Weryfikuje, że modal się renderuje i że w konsoli nie ma błędów
 * (w szczególności „Failed to fetch dynamically imported module”).
 *
 * Uruchomienie (Playwright nie jest zależnością repo — instalujemy doraźnie):
 *   npx --yes playwright@1 install chromium
 *   BASE_URL=http://localhost:5173 npm run test:e2e
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error(
    'Brak pakietu playwright. Zainstaluj go doraźnie:\n' +
      '  npx --yes playwright@1 install chromium && npm i -D playwright'
  );
  process.exit(2);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(String(err)));

let failed = false;
try {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  // Kokpit: przycisk Doradcy jest w pasku górnym.
  const trigger = page.getByRole('button', { name: /doradca/i }).first();
  await trigger.waitFor({ state: 'visible', timeout: 20_000 });
  await trigger.focus();
  await trigger.hover(); // wyzwala preload chunka
  await trigger.click();

  // Modal musi się wyrenderować (skeleton znika, treść wchodzi).
  await page
    .getByText(/Doradcą Kariery|Ekspertem ds\. Systemów ATS/i)
    .first()
    .waitFor({ state: 'visible', timeout: 20_000 });

  const dialog = page.getByRole('dialog', { name: /Doradcy Kariery/i });
  await dialog.waitFor({ state: 'visible' });
  const input = page.getByRole('textbox', { name: /Pytanie do Doradcy/i });
  await input.fill('Czy historia zostanie po ponownym otwarciu?');
  await page.getByRole('button', { name: 'Wyślij' }).click();
  await page.getByText('Czy historia zostanie po ponownym otwarciu?').waitFor({ state: 'visible' });

  // Tab i Shift+Tab pozostają wewnątrz dialogu.
  await page.keyboard.press('Tab');
  const focusInside = await dialog.evaluate((element) => element.contains(document.activeElement));
  if (!focusInside) throw new Error('Fokus opuścił modal po naciśnięciu Tab.');

  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  const focusRestored = await trigger.evaluate((element) => element === document.activeElement);
  if (!focusRestored) throw new Error('Fokus nie wrócił do przycisku Doradcy.');

  await trigger.click();
  await page.getByText('Czy historia zostanie po ponownym otwarciu?').waitFor({ state: 'visible' });

  console.log('OK: modal Doradcy, fokus i cache sesyjny działają.');
} catch (err) {
  failed = true;
  console.error('BŁĄD: nie udało się otworzyć Doradcy —', err.message);
}

const chunkErrors = errors.filter((e) => /dynamically imported module|Loading chunk/i.test(e));
if (chunkErrors.length) {
  failed = true;
  console.error('BŁĄD: błędy ładowania chunka w konsoli:', chunkErrors);
} else if (errors.length) {
  failed = true;
  console.error('BŁĄD: błędy w konsoli:', errors);
} else {
  console.log('OK: konsola bez błędów.');
}

await browser.close();
process.exit(failed ? 1 : 0);
