import { z } from 'zod';

/**
 * Kontrakty żądań — jedno źródło dla serwera i dla klienta.
 *
 * Trasy sprawdzały ciała żądań ręcznie (`if (typeof url !== 'string' || …)`),
 * mimo że `zod` był już zależnością i był używany w `config.ts`. Ręczna walidacja
 * rozjeżdża się z typami przy pierwszej zmianie kształtu, a kontrakt opisany raz
 * daje przy okazji typ TypeScriptu po obu stronach.
 */

export const fetchJdUrlSchema = z.object({
  // 2048 znaków to praktyczny limit adresu obsługiwany przez serwery i
  // przeglądarki; dłuższy adres to prawie zawsze próba przemycenia ładunku.
  url: z.string().trim().min(1).max(2048),
});
export type FetchJdUrlInput = z.infer<typeof fetchJdUrlSchema>;

export const parseJdSchema = z.object({
  rawJdText: z.string().trim().min(1, 'Brak treści ogłoszenia o pracę.'),
});
export type ParseJdInput = z.infer<typeof parseJdSchema>;

/**
 * Vault trafia do bazy jako `jsonb`, więc kształt pilnuje ta walidacja, a nie
 * schemat tabeli. `passthrough` jest celowy: MasterVault zmienia się razem
 * z interfejsem, a odrzucanie nieznanych pól oznaczałoby, że starszy serwer
 * po cichu obcina dane zapisane przez nowszy front.
 */
export const vaultPayloadSchema = z.object({
  vault: z.object({
    version: z.string(),
    updatedAt: z.string(),
    personalInfo: z.object({}).passthrough(),
  }).passthrough(),
});
export type VaultPayload = z.infer<typeof vaultPayloadSchema>;

export const applicationStatusSchema = z.enum([
  'Wysłana',
  'Rozmowa',
  'Oferta',
  'Odrzucona',
  'Archiwum',
]);

export const applicationInputSchema = z.object({
  company: z.string().trim().min(1).max(200),
  position: z.string().trim().min(1).max(200),
  salary: z.string().trim().max(120).optional(),
  appliedAt: z.string().trim().max(40).optional(),
  status: applicationStatusSchema.default('Wysłana'),
  notes: z.string().max(10_000).optional(),
  jobUrl: z.string().trim().max(2048).optional(),
});
export type ApplicationInput = z.infer<typeof applicationInputSchema>;

/** Aktualizacja częściowa — PATCH nie wymaga kompletu pól. */
export const applicationPatchSchema = applicationInputSchema.partial();

export const checkoutSessionSchema = z.object({
  // Identyfikator ceny jest weryfikowany w tabeli `plans`, zanim powstanie
  // sesja płatności. Bez tego wystarczyłoby podmienić `price_...` w żądaniu
  // i kupić plan Pro za cenę szablonu.
  priceId: z.string().trim().min(1).max(200),
});
export type CheckoutSessionInput = z.infer<typeof checkoutSessionSchema>;
