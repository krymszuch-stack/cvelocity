import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import type Stripe from 'stripe';
import { stripeWebhookRouter } from '../routes/stripe.routes';
import * as supabaseModule from '../supabase';
import * as stripeClientModule from '../stripeClient';
import * as configModule from '../config';
import { errorHandler } from '../middleware/errorHandler';

vi.mock('../usageLedger', () => ({ recordUsage: vi.fn() }));

// Trasa woła getSupabase()/getStripe()/loadConfig() przy każdym żądaniu, więc
// każdy test podstawia własne atrapy przed wysłaniem żądania.
const rpcMock = vi.fn();
const insertEventsMock = vi.fn();
const upsertSubscriptionsMock = vi.fn();
const constructEventMock = vi.fn();

function fakeSupabase() {
  return {
    rpc: rpcMock,
    from: (table: string) => ({
      ...(table === 'stripe_events' ? { insert: insertEventsMock } : {}),
      upsert: upsertSubscriptionsMock,
    }),
  } as unknown as ReturnType<typeof supabaseModule.getSupabase>;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(configModule, 'loadConfig').mockReturnValue({
    paymentsEnabled: true,
    STRIPE_WEBHOOK_SECRET: 'whsec_test',
  } as unknown as ReturnType<typeof configModule.loadConfig>);
  vi.spyOn(stripeClientModule, 'getStripe').mockReturnValue({
    webhooks: { constructEvent: constructEventMock },
  } as unknown as ReturnType<typeof stripeClientModule.getStripe>);
  vi.spyOn(supabaseModule, 'getSupabase').mockImplementation(fakeSupabase);
});

function karnetEvent(): Stripe.Event {
  return {
    id: 'evt_karnet_1',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_1',
        object: 'checkout.session',
        mode: 'payment',
        customer: null,
        subscription: null,
        metadata: { user_id: 'user-1', plan_id: 'karnet' },
      },
    },
  } as unknown as Stripe.Event;
}

/** Wysyła podpisane żądanie do prawdziwego Expressa z parserem surowego bufora. */
async function postWebhook(
  body: string | Buffer
): Promise<{ status: number; json: Record<string, unknown> }> {
  const app = express();
  // Kolejność jak w server.ts: surowy bufor musi dotrzeć do trasy, bo podpis
  // liczy się z dokładnych bajtów. Trasa sama niesie pełną ścieżkę
  // `/stripe-webhook`, więc montujemy ją pod prefiksem `/api`.
  app.use('/api', express.raw({ type: '*/*' }), stripeWebhookRouter);
  app.use(errorHandler);

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/stripe-webhook`, {
      method: 'POST',
      headers: { 'stripe-signature': 't=1,v1=signature' },
      body,
    });
    return { status: response.status, json: await response.json() };
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe('POST /api/stripe-webhook — Karnet Aplikacyjny (checkout.session.completed, mode=payment)', () => {
  it('płatność jednorazowa aktywuje karnet RPC i nie podnosi statusu subskrypcji', async () => {
    constructEventMock.mockReturnValue(karnetEvent());
    insertEventsMock.mockResolvedValueOnce({ error: null });
    rpcMock.mockResolvedValueOnce({ data: '2026-09-24T00:00:00Z', error: null });
    upsertSubscriptionsMock.mockResolvedValueOnce({ error: null });

    const { status, json } = await postWebhook(JSON.stringify({ payload: 'raw' }));

    expect(status).toBe(200);
    expect(json).toEqual({ received: true });
    expect(rpcMock).toHaveBeenCalledWith('activate_application_pass', {
      p_user_id: 'user-1',
      p_days: 30,
    });
    // Status w tabeli subscriptions zostaje `free`: dostęp jednorazowy egzekwuje
    // plan_expires_at, nie status cyklicznego planu — inaczej kupno karnetu
    // otworzyłoby też ścieżki czytające wyłącznie status.
    expect(upsertSubscriptionsMock).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', status: 'free' }),
      expect.anything()
    );
  });

  it('powtórzone zdarzenie jest odsiewane przez tabelę zdarzeń i nie aktywuje niczego', async () => {
    constructEventMock.mockReturnValue(karnetEvent());
    insertEventsMock.mockResolvedValueOnce({ error: { code: '23505', message: 'duplicate key' } });

    const { status, json } = await postWebhook(JSON.stringify({ payload: 'raw' }));

    expect(status).toBe(200);
    expect(json).toEqual({ received: true, duplicate: true });
    expect(rpcMock).not.toHaveBeenCalled();
    expect(upsertSubscriptionsMock).not.toHaveBeenCalled();
  });

  it('nieprawidłowy podpis zwraca 400 i nie dotyka bazy', async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature');
    });

    const { status, json } = await postWebhook(JSON.stringify({ tampered: true }));

    expect(status).toBe(400);
    expect(json.success).toBe(false);
    expect(rpcMock).not.toHaveBeenCalled();
    expect(insertEventsMock).not.toHaveBeenCalled();
  });

  it('zdarzenie bez metadata.user_id jest pomijane bez aktywacji karnetu', async () => {
    constructEventMock.mockReturnValue({
      ...karnetEvent(),
      data: { object: { mode: 'payment', metadata: {} } },
    });
    insertEventsMock.mockResolvedValueOnce({ error: null });

    const { status, json } = await postWebhook(JSON.stringify({ payload: 'raw' }));

    expect(status).toBe(200);
    expect(json).toEqual({ received: true });
    expect(rpcMock).not.toHaveBeenCalled();
    expect(upsertSubscriptionsMock).not.toHaveBeenCalled();
  });
});
