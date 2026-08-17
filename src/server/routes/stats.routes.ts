import { Router, Request, Response } from 'express';
import { getUsageTotals } from '../usageLedger';

export const statsRouter = Router();

/**
 * GET /api/usage/stats
 *
 * Zwraca realne zużycie odczytane z `usageMetadata` odpowiedzi modelu.
 * Wcześniej ta trasa zwracała wymyślone stałe, a potem — uczciwie — 501, bo
 * nic nie mierzyło faktycznego kosztu.
 *
 * Liczby pochodzą z agregacji w pamięci procesu, więc pokazują zużycie **tej
 * instancji od jej startu**, a nie sumę historyczną. Trwałym źródłem prawdy są
 * linie `{"type":"ai_usage",...}` w logach; pole `since` mówi wprost, od kiedy
 * liczy ten licznik, żeby nikt nie wziął go za sumę całkowitą.
 */
statsRouter.get('/usage/stats', (_req: Request, res: Response) => {
  const totals = getUsageTotals();

  res.json({
    success: true,
    scope: 'instance-since-start',
    ...totals,
    // Zaokrąglenie dopiero na wyjściu — akumulacja idzie na pełnej precyzji.
    estimatedCostUsd: Number(totals.estimatedCostUsd.toFixed(6)),
  });
});
