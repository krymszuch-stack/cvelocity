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
    try {
      await admin.rpc('delete_user_data', { p_user: id });
    } catch {}
    try {
      await admin.auth.admin.deleteUser(id);
    } catch {}
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

  console.log('\nIzolacja zapisu między kontami (UPDATE/DELETE):');

  // Odczyt to połowa granicy. Polityka UPDATE bez `with check` albo DELETE
  // bez polityki usuwania pozwoliłyby drugiej osobie zmazać cudze CV mimo
  // braku możliwości jego zobaczenia.
  const bobOverwrites = await bob.client
    .from('vaults')
    .update({ data: { sekret: 'Podmienione przez Boba' } })
    .eq('user_id', alice.id);
  const aliceAfterOverwrite = await admin
    .from('vaults')
    .select('data')
    .eq('user_id', alice.id)
    .maybeSingle();
  check(
    "Bob nie może nadpisać vaultu Alicji",
    aliceAfterOverwrite.data?.data?.sekret === 'CV Alicji',
    bobOverwrites.error ? `błąd: ${bobOverwrites.error.message}` : 'aktualizacja dotknęła wiersz'
  );

  const bobDeletes = await bob.client.from('vaults').delete().eq('user_id', alice.id);
  const aliceCountAfterDelete = await admin.from('vaults').select('*', { count: 'exact', head: true }).eq('user_id', alice.id);
  check(
    'Bob nie może usunąć vaultu Alicji',
    (aliceCountAfterDelete.count ?? 0) === 1,
    bobDeletes.error ? `błąd: ${bobDeletes.error.message}` : `wierszy po próbie: ${aliceCountAfterDelete.count ?? 0}`
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

  console.log('\nWyścig o limit AI (blokada pesymistyczna):');

  // Dziesięć równoległych rezerwacji z limitem 5. Bez `SELECT ... FOR UPDATE`
  // w procedurze wszystkie dziesięć zdążyłoby odczytać licznik przed jakimkolwiek
  // zapisem i każda przeszłaby — to jest dokładnie klasa wyścigu, którą test
  // ma wyłapać, zanim trafi na produkcję.
  const race = await Promise.all(
    Array.from({ length: 10 }, () =>
      admin.rpc('reserve_ai_quota', { p_user_id: alice.id, p_max_daily_uses: 5 })
    )
  );
  const allowedCount = race.filter((r) => r.data?.allowed === true).length;
  const deniedCount = race.filter((r) => r.data?.allowed === false).length;
  check(
    'Z 10 równoległych rezerwacji (limit 5) dokładnie 5 przechodzi',
    allowedCount === 5 && deniedCount === 5,
    `dopuszczono: ${allowedCount}, odrzucono: ${deniedCount}`
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
