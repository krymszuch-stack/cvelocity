import { NextFunction, Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { validateBody } from '../middleware/validate';
import { vaultPayloadSchema, type VaultPayload } from '../../types/contracts';
import { getSupabase } from '../supabase';

export const vaultRouter = Router();

/**
 * GET /api/vault
 *
 * Brak zapisanego vaultu to normalny stan nowego konta, nie błąd — stąd 200
 * z `vault: null`, a nie 404. Klient i tak musi wtedy pokazać pusty formularz.
 */
vaultRouter.get('/vault', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await getSupabase()
      .from('vaults')
      .select('data, version, updated_at')
      .eq('user_id', req.user!.id)
      .maybeSingle();

    if (error) throw new Error(`Nie udało się odczytać profilu: ${error.message}`);

    res.json({
      success: true,
      vault: data?.data ?? null,
      updatedAt: data?.updated_at ?? null,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/vault
 *
 * Zapis całości, nie zmiana przyrostowa. Vault jest edytowany jako jeden
 * dokument w przeglądarce i wysyłany po zakończeniu edycji; scalanie po polach
 * dawałoby konflikty bez żadnej korzyści.
 *
 * `user_id` pochodzi wyłącznie z tokenu. Klient `service_role` omija RLS, więc
 * gdyby brać go z ciała żądania, wystarczyłoby podmienić jedno pole, żeby
 * nadpisać cudze CV.
 */
vaultRouter.put(
  '/vault',
  requireAuth,
  validateBody(vaultPayloadSchema),
  async (req: Request<unknown, unknown, VaultPayload>, res: Response, next: NextFunction) => {
    try {
      const { vault } = req.body;

      const { error } = await getSupabase()
        .from('vaults')
        .upsert(
          {
            user_id: req.user!.id,
            data: vault,
            version: vault.version,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) throw new Error(`Nie udało się zapisać profilu: ${error.message}`);

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);
