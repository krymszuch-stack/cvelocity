#!/usr/bin/env node
/**
 * Test polityk RLS: użytkownik A nie może odczytać danych użytkownika B.
 *
 * To jest jedyny test, który potwierdza, że przeniesienie danych na serwer
 * faktycznie je odgradza. Testy jednostkowe sprawdzają kod aplikacji; polityki
 * RLS egzekwuje baza i tylko baza może potwierdzić, że działają.
 *
 * Wymaga działającego Supabase (`supabase start`) albo projektu zdalnego.
 * Uruchomienie: `npm run test:rls`
 *
 * Zmienne: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
 * (lub VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import 'dotenv/config';

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !serviceKey || !anonKey) {
  console.error(
    'Brak konfiguracji. Wymagane: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY.\n' +
      'Uruchom `supabase start` i przepisz wypisane wartości do .env.'
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const failures = [];
const created = [];

function check(name, passed, detail = '') {
  if (passed) {
    console.log(`  ✓ ${name}`);
  } else {
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
    failures.push(name);
  }
}

/** Zakłada konto i zwraca klienta działającego jako ten użytkownik. */
async function createUser(label) {
  const email = `rls-${label}-${randomUUID()}@example.test`;
  const password = `Test-${randomUUID()}`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`Nie udało się założyć konta ${label}: ${error.message}`);

  created.push(data.user.id);

  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(`Nie udało się zalogować ${label}: ${signInError.message}`);

  return { id: data.user.id, client };
}

async function cleanup() {
  for (const id of created) {
    await admin.rpc('delete_user_data', { p_user: id }).catch(() => {});
    await admin.auth.admin.deleteUser(id).catch(() => {});
  }
}

try {
  console.log('\nTest polityk RLS\n');

  const alice = await createUser('alice');
  const bob = await createUser('bob');

  // Vault Alicji, zapisany kluczem serwisowym (tak jak robi to API).
  await admin.from('vaults').upsert({
    user_id: alice.id,
    data: { sekret: 'CV Alicji' },
    version: '1',
  });

  await admin.from('applications').insert({
    user_id: alice.id,
    company: 'Firma Alicji',
    position: 'Stanowisko Alicji',
  });

  console.log('Izolacja danych między kontami:');

  const bobReadsVault = await bob.client.from('vaults').select('*').eq('user_id', alice.id);
  check(
    'Bob nie widzi vaultu Alicji',
    (bobReadsVault.data ?? []).length === 0,
    `zwrócono ${bobReadsVault.data?.length ?? 0} wierszy`
  );

  const bobReadsApps = await bob.client.from('applications').select('*');
  check(
    'Bob nie widzi aplikacji Alicji',
    (bobReadsApps.data ?? []).length === 0,
    `zwrócono ${bobReadsApps.data?.length ?? 0} wierszy`
  );

  const aliceReadsOwn = await alice.client.from('vaults').select('*');
  check(
    'Alicja widzi własny vault',
    (aliceReadsOwn.data ?? []).length === 1,
    `zwrócono ${aliceReadsOwn.data?.length ?? 0} wierszy`
  );

  console.log('\nOchrona statusu subskrypcji:');

  // Sedno sprawy: gdyby to przeszło, plan Pro byłby darmowy dla każdego, kto
  // otworzy konsolę przeglądarki.
  const selfUpgrade = await bob.client
    .from('subscriptions')
    .upsert({ user_id: bob.id, status: 'active' });
  check(
    'Bob nie może nadać sobie statusu active',
    selfUpgrade.error !== null,
    'zapis się powiódł'
  );

  const quotaTamper = await bob.client
    .from('usage_counters')
    .upsert({ user_id: bob.id, month_key: '2026-01', ai_uses: 0, import_uses: 0 });
  check('Bob nie może wyzerować własnych liczników', quotaTamper.error !== null, 'zapis się powiódł');

  const rpcTamper = await bob.client.rpc('consume_quota', { p_user: alice.id, p_kind: 'ai' });
  check(
    'Bob nie może wywołać consume_quota bezpośrednio',
    rpcTamper.error !== null,
    'wywołanie się powiodło'
  );

  console.log('\nLimity:');

  // Plan darmowy ma 5 wywołań AI. Szóste musi zostać odrzucone.
  const results = [];
  for (let i = 0; i < 6; i++) {
    const { data } = await admin.rpc('consume_quota', { p_user: bob.id, p_kind: 'ai' });
    results.push(data);
  }
  check(
    'Piąte wywołanie przechodzi, szóste jest odrzucane',
    results.slice(0, 5).every((r) => r === true) && results[5] === false,
    `wyniki: ${results.join(', ')}`
  );

  console.log('\nUsunięcie konta:');

  await admin.rpc('delete_user_data', { p_user: alice.id });
  const leftovers = await admin.from('vaults').select('*').eq('user_id', alice.id);
  check('delete_user_data usuwa vault', (leftovers.data ?? []).length === 0);

  const leftoverApps = await admin.from('applications').select('*').eq('user_id', alice.id);
  check('delete_user_data usuwa aplikacje', (leftoverApps.data ?? []).length === 0);
} catch (err) {
  console.error('\nTest przerwany:', err.message);
  failures.push('wyjątek');
} finally {
  await cleanup();
}

if (failures.length > 0) {
  console.error(`\n✗ Nieudane sprawdzenia: ${failures.length}. NIE WDRAŻAJ.\n`);
  process.exit(1);
}

console.log('\n✓ Wszystkie polityki działają.\n');
