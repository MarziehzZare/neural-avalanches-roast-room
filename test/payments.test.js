import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { PDFDocument } from 'pdf-lib';
import worker from '../worker/index.js';
import { createCheckout, grantPaidCredits, hashToken, randomToken, verifyStripeEvent } from '../worker/payments.js';

function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0001_credits.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0002_reversals.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0003_gift_invites.sql', import.meta.url), 'utf8'));
  return {
    prepare(sql) {
      let values = [];
      return {
        bind(...args) { values = args; return this; },
        first() { return sqlite.prepare(sql).get(...values) || null; },
        run() { sqlite.prepare(sql).run(...values); return {}; },
        get sql() { return sql; },
        get values() { return values; }
      };
    },
    batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const results = statements.map(statement => {
          const rows = sqlite.prepare(statement.sql).all(...statement.values);
          const changes = sqlite.prepare('SELECT changes() AS count').get().count;
          return { results: rows, meta: { changes } };
        });
        sqlite.exec('COMMIT');
        return results;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
    close() { sqlite.close(); }
  };
}

const endpoint = 'https://room.example';
function post(path, body, cookie) {
  return new Request(`${endpoint}${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json', origin: endpoint, ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body)
  });
}

function signedEvent(event, secret, timestamp = Math.floor(Date.now() / 1000)) {
  const payload = JSON.stringify(event);
  const signature = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  return { payload, header: `t=${timestamp},v1=${signature}` };
}

test('Stripe signature accepts raw body and rejects stale or tampered events', async () => {
  const { payload, header } = signedEvent({ id: 'evt_1' }, 'whsec_test');
  assert.equal((await verifyStripeEvent(payload, header, 'whsec_test')).id, 'evt_1');
  assert.equal(await verifyStripeEvent(`${payload} `, header, 'whsec_test'), null);
  assert.equal(await verifyStripeEvent(payload, header, 'whsec_wrong'), null);
  const stale = signedEvent({ id: 'evt_1' }, 'whsec_test', Math.floor(Date.now() / 1000) - 301);
  assert.equal(await verifyStripeEvent(stale.payload, stale.header, 'whsec_test'), null);
});

test('Checkout creates only the agreed test package on Stripe-hosted checkout', async () => {
  const originalFetch = globalThis.fetch;
  let params;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://api.stripe.com/v1/checkout/sessions');
    assert.equal(options.headers.authorization, 'Bearer sk_test_fake');
    params = new URLSearchParams(options.body);
    return Response.json({ url: 'https://checkout.stripe.com/c/pay/cs_test_1' });
  };
  try {
    const url = await createCheckout('wallet-1', `${endpoint}/api/checkout`, { STRIPE_SECRET_KEY: 'sk_test_fake' });
    assert.match(url, /^https:\/\/checkout\.stripe\.com\//);
    assert.equal(params.get('line_items[0][price_data][unit_amount]'), '500');
    assert.equal(params.get('line_items[0][price_data][currency]'), 'usd');
    assert.equal(params.get('metadata[credit_count]'), '10');
    assert.equal(params.get('client_reference_id'), 'wallet-1');
  } finally { globalThis.fetch = originalFetch; }
});

test('verified checkout grants credits once, and only after paid status', async () => {
  const DB = database();
  try {
    DB.prepare('INSERT INTO wallets (id, token_hash) VALUES (?, ?)').bind('wallet-1', 'hash').run();
    const session = {
      object: 'checkout.session', id: 'cs_test_1', client_reference_id: 'wallet-1',
      payment_status: 'paid', mode: 'payment', amount_total: 500, currency: 'usd', payment_intent: 'pi_test_1',
      metadata: { wallet_id: 'wallet-1', credit_count: '10' }
    };
    const event = { type: 'checkout.session.completed', data: { object: session } };
    await grantPaidCredits(event, { DB });
    await grantPaidCredits(event, { DB });
    assert.equal(DB.prepare('SELECT credits FROM wallets WHERE id = ?').bind('wallet-1').first().credits, 10);
    await grantPaidCredits({ ...event, data: { object: { ...session, id: 'cs_test_2', payment_status: 'unpaid' } } }, { DB });
    assert.equal(DB.prepare('SELECT credits FROM wallets WHERE id = ?').bind('wallet-1').first().credits, 10);
  } finally { DB.close(); }
});

test('paid council uses one credit only for a completed review and restores it on failure', async () => {
  const DB = database();
  const env = {
    DB, PAYMENTS_MODE: 'test', STRIPE_SECRET_KEY: 'sk_test_fake', STRIPE_WEBHOOK_SECRET: 'whsec_fake',
    OPENAI_API_KEY: 'api-secret',
    ROOM_LIMIT: { limit: async () => ({ success: true }) },
    ASSETS: { fetch: async () => new Response('asset') }
  };
  const originalFetch = globalThis.fetch;
  try {
    const walletResponse = await worker.fetch(post('/api/wallet', {}), env);
    assert.equal(walletResponse.status, 200);
    const cookie = walletResponse.headers.get('set-cookie').split(';')[0];
    const wallet = await walletResponse.json();
    const noCredits = await worker.fetch(post('/api/council', { claim: 'Are these avalanches critical?', mode: 'QUICK' }, cookie), env);
    assert.equal(noCredits.status, 402);
    const session = {
      object: 'checkout.session', id: 'cs_test_3', client_reference_id: null,
      payment_status: 'paid', mode: 'payment', amount_total: 500, currency: 'usd', payment_intent: 'pi_test_3',
      metadata: { wallet_id: null, credit_count: '10' }
    };
    const tokenHash = await (await import('../worker/payments.js')).hashToken(wallet.recoveryCode);
    const id = DB.prepare('SELECT id FROM wallets WHERE token_hash = ?').bind(tokenHash).first().id;
    session.client_reference_id = id;
    session.metadata.wallet_id = id;
    const { payload, header } = signedEvent({ type: 'checkout.session.completed', data: { object: session } }, 'whsec_fake');
    const webhook = await worker.fetch(new Request(`${endpoint}/api/stripe-webhook`, { method: 'POST', headers: { 'stripe-signature': header }, body: payload }), env);
    assert.equal(webhook.status, 200);
    globalThis.fetch = async () => Response.json({ error: { code: 'credit_balance_exhausted' } }, { status: 429 });
    const failed = await worker.fetch(post('/api/council', { claim: 'Are these avalanches critical?', mode: 'QUICK' }, cookie), env);
    assert.equal(failed.status, 502);
    assert.equal(DB.prepare('SELECT credits FROM wallets WHERE id = ?').bind(id).first().credits, 10);
    globalThis.fetch = async (_url, options) => {
      assert.equal(JSON.parse(options.body).max_output_tokens, 10000);
      return Response.json({ status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output: [] });
    };
    const incomplete = await worker.fetch(post('/api/council', { claim: 'Are these avalanches critical?', mode: 'QUICK' }, cookie), env);
    assert.equal(incomplete.status, 502);
    assert.match((await incomplete.json()).error, /answer-length limit.*credit was restored/);
    assert.equal(DB.prepare('SELECT credits FROM wallets WHERE id = ?').bind(id).first().credits, 10);
    globalThis.fetch = async () => Response.json({ status: 'completed', output: [{ content: [{ type: 'output_text', text: 'Review.' }] }] });
    const done = await worker.fetch(post('/api/council', { claim: 'Are these avalanches critical?', mode: 'QUICK' }, cookie), env);
    assert.equal(done.status, 200);
    assert.equal(DB.prepare('SELECT credits FROM wallets WHERE id = ?').bind(id).first().credits, 9);
  } finally { globalThis.fetch = originalFetch; DB.close(); }
});

test('a private complimentary invite can be claimed once and used without the shared room code', async () => {
  const DB = database();
  const env = {
    DB, PAYMENTS_MODE: 'test', STRIPE_SECRET_KEY: 'sk_test_fake', STRIPE_WEBHOOK_SECRET: 'whsec_fake',
    ROOM_ACCESS_CODE: 'invite', OPENAI_API_KEY: 'api-secret',
    ROOM_LIMIT: { limit: async () => ({ success: true }) },
    ASSETS: { fetch: async () => new Response('asset') }
  };
  const token = randomToken();
  DB.prepare('INSERT INTO gift_invites (token_hash, label, credits) VALUES (?, ?, ?)').bind(await hashToken(token), 'Prof. Beggs', 10).run();
  const originalFetch = globalThis.fetch;
  try {
    const claim = await worker.fetch(post('/api/gift/claim', { inviteToken: token }), env);
    assert.equal(claim.status, 200);
    assert.equal((await claim.json()).credits, 10);
    const cookie = claim.headers.get('set-cookie').split(';')[0];
    const repeat = await worker.fetch(post('/api/gift/claim', { inviteToken: token }), env);
    assert.equal(repeat.status, 410);
    const wallet = await worker.fetch(post('/api/wallet', {} , cookie), env);
    assert.equal((await wallet.json()).credits, 10);
    globalThis.fetch = async () => Response.json({ status: 'completed', output: [{ content: [{ type: 'output_text', text: 'Review.' }] }] });
    const review = await worker.fetch(post('/api/council', { claim: 'Are these avalanches critical?', mode: 'QUICK' }, cookie), env);
    assert.equal(review.status, 200);
    assert.equal((await worker.fetch(post('/api/wallet', {}, cookie), env)).status, 200);
    const credits = DB.prepare('SELECT credits FROM wallets WHERE invite_access = 1').first().credits;
    assert.equal(credits, 9);
  } finally { globalThis.fetch = originalFetch; DB.close(); }
});

test('paper pilot reads a bounded PDF, sends it as a file, and consumes one test credit', async () => {
  const DB = database();
  const env = {
    DB, PAYMENTS_MODE: 'test', STRIPE_SECRET_KEY: 'sk_test_fake', STRIPE_WEBHOOK_SECRET: 'whsec_fake',
    OPENAI_API_KEY: 'api-secret', ROOM_LIMIT: { limit: async () => ({ success: true }) },
    ASSETS: { fetch: async () => new Response('asset') }
  };
  const pdf = await PDFDocument.create();
  pdf.addPage();
  const bytes = await pdf.save();
  const originalFetch = globalThis.fetch;
  let sent;
  globalThis.fetch = async (_url, options) => {
    sent = JSON.parse(options.body);
    return Response.json({ status: 'completed', output: [{ content: [{ type: 'output_text', text: 'Paper critique.' }] }] });
  };
  try {
    const opened = await worker.fetch(post('/api/wallet', {}), env);
    const cookie = opened.headers.get('set-cookie').split(';')[0];
    DB.prepare('UPDATE wallets SET credits = 2 WHERE token_hash = ?').bind(await hashToken(cookie.split('=')[1])).run();
    const form = new FormData();
    form.set('paper', new Blob([bytes], { type: 'application/pdf' }), 'sample.pdf');
    form.set('focus', 'Assess the central claim.');
    form.set('mode', 'QUICK');
    const response = await worker.fetch(new Request(`${endpoint}/api/paper`, { method: 'POST', headers: { origin: endpoint, cookie }, body: form }), env);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).review, 'Paper critique.');
    assert.equal(sent.store, false);
    assert.match(sent.instructions, /paper-specific strength or concern/);
    assert.equal(sent.input[0].content[1].type, 'input_file');
    assert.match(sent.input[0].content[1].file_data, /^data:application\/pdf;base64,/);
    assert.equal(sent.input[0].content[1].detail, 'low');
    assert.equal(DB.prepare('SELECT credits FROM wallets').first().credits, 1);
  } finally { globalThis.fetch = originalFetch; DB.close(); }
});

test('paper pilot rejects overlong PDFs without consuming a credit', async () => {
  const DB = database();
  const env = {
    DB, PAYMENTS_MODE: 'test', STRIPE_SECRET_KEY: 'sk_test_fake', STRIPE_WEBHOOK_SECRET: 'whsec_fake',
    OPENAI_API_KEY: 'api-secret', ROOM_LIMIT: { limit: async () => ({ success: true }) },
    ASSETS: { fetch: async () => new Response('asset') }
  };
  try {
    const opened = await worker.fetch(post('/api/wallet', {}), env);
    const cookie = opened.headers.get('set-cookie').split(';')[0];
    DB.prepare('UPDATE wallets SET credits = 1 WHERE token_hash = ?').bind(await hashToken(cookie.split('=')[1])).run();
    const pdf = await PDFDocument.create();
    for (let page = 0; page < 21; page++) pdf.addPage();
    const form = new FormData();
    form.set('paper', new Blob([await pdf.save()], { type: 'application/pdf' }), 'long.pdf');
    form.set('focus', 'Assess the central claim.');
    form.set('mode', 'FULL');
    const response = await worker.fetch(new Request(`${endpoint}/api/paper`, { method: 'POST', headers: { origin: endpoint, cookie }, body: form }), env);
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /20 pages/);
    assert.equal(DB.prepare('SELECT credits FROM wallets').first().credits, 1);
  } finally { DB.close(); }
});

test('claiming a gift adds credits to an existing wallet without replacing its browser cookie', async () => {
  const DB = database();
  const env = {
    DB, PAYMENTS_MODE: 'test', STRIPE_SECRET_KEY: 'sk_test_fake', STRIPE_WEBHOOK_SECRET: 'whsec_fake',
    ROOM_ACCESS_CODE: 'invite', OPENAI_API_KEY: 'api-secret'
  };
  try {
    const opened = await worker.fetch(post('/api/wallet', { accessCode: 'invite' }), env);
    const cookie = opened.headers.get('set-cookie').split(';')[0];
    const token = randomToken();
    DB.prepare('INSERT INTO gift_invites (token_hash, label, credits) VALUES (?, ?, ?)').bind(await hashToken(token), 'Existing guest', 3).run();
    const claim = await worker.fetch(post('/api/gift/claim', { inviteToken: token }, cookie), env);
    assert.equal(claim.status, 200);
    assert.equal(claim.headers.get('set-cookie').split(';')[0], cookie);
    assert.equal((await claim.json()).credits, 3);
    const wallet = await worker.fetch(post('/api/wallet', {}, cookie), env);
    assert.equal((await wallet.json()).credits, 3);
  } finally { DB.close(); }
});

test('a second browser starts empty and can restore the original credited wallet', async () => {
  const DB = database();
  const env = {
    DB, PAYMENTS_MODE: 'test', STRIPE_SECRET_KEY: 'sk_test_fake', STRIPE_WEBHOOK_SECRET: 'whsec_fake',
    OPENAI_API_KEY: 'api-secret'
  };
  try {
    const first = await worker.fetch(post('/api/wallet', {}), env);
    const firstWallet = await first.json();
    const firstCookie = first.headers.get('set-cookie').split(';')[0];
    DB.prepare('UPDATE wallets SET credits = 1 WHERE token_hash = ?')
      .bind(await hashToken(firstWallet.recoveryCode)).run();
    const second = await worker.fetch(post('/api/wallet', {}), env);
    assert.equal((await second.json()).credits, 0);
    const recovered = await worker.fetch(post('/api/wallet/recover', { recoveryCode: firstWallet.recoveryCode }), env);
    assert.equal((await recovered.json()).credits, 1);
    assert.equal(recovered.headers.get('set-cookie').split(';')[0], firstCookie);
  } finally { DB.close(); }
});

test('a refunded or disputed purchase locks the wallet and cannot revoke twice', async () => {
  const DB = database();
  try {
    DB.prepare('INSERT INTO wallets (id, token_hash) VALUES (?, ?)').bind('wallet-1', 'hash').run();
    const session = {
      object: 'checkout.session', id: 'cs_live_1', client_reference_id: 'wallet-1',
      payment_status: 'paid', mode: 'payment', amount_total: 500, currency: 'usd', payment_intent: 'pi_live_1',
      metadata: { wallet_id: 'wallet-1', credit_count: '10' }
    };
    await grantPaidCredits({ type: 'checkout.session.completed', data: { object: session } }, { DB, PAYMENTS_MODE: 'live' });
    assert.equal(DB.prepare('SELECT credits FROM wallets WHERE id = ?').bind('wallet-1').first().credits, 10);
    const reversal = { type: 'charge.refunded', data: { object: { payment_intent: 'pi_live_1', refunded: true, amount_refunded: 500 } } };
    await grantPaidCredits(reversal, { DB, PAYMENTS_MODE: 'live' });
    await grantPaidCredits(reversal, { DB, PAYMENTS_MODE: 'live' });
    await grantPaidCredits({ type: 'charge.dispute.created', data: { object: { payment_intent: 'pi_live_1' } } }, { DB, PAYMENTS_MODE: 'live' });
    assert.deepEqual({ ...DB.prepare('SELECT credits, locked FROM wallets WHERE id = ?').bind('wallet-1').first() }, { credits: 0, locked: 1 });
    await grantPaidCredits({ type: 'checkout.session.completed', data: { object: { ...session, id: 'cs_live_2', payment_intent: 'pi_live_2' } } }, { DB, PAYMENTS_MODE: 'live' });
    assert.equal(DB.prepare('SELECT credits FROM wallets WHERE id = ?').bind('wallet-1').first().credits, 0);
  } finally { DB.close(); }
});

test('a dispute without an embedded PaymentIntent resolves its charge', async () => {
  const DB = database();
  const originalFetch = globalThis.fetch;
  try {
    DB.prepare('INSERT INTO wallets (id, token_hash) VALUES (?, ?)').bind('wallet-2', 'hash-2').run();
    await grantPaidCredits({ type: 'checkout.session.completed', data: { object: {
      object: 'checkout.session', id: 'cs_live_3', client_reference_id: 'wallet-2',
      payment_status: 'paid', mode: 'payment', amount_total: 500, currency: 'usd', payment_intent: 'pi_live_3',
      metadata: { wallet_id: 'wallet-2', credit_count: '10' }
    } } }, { DB, PAYMENTS_MODE: 'live' });
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://api.stripe.com/v1/charges/ch_live_3');
      assert.equal(options.headers.authorization, 'Bearer sk_live_fake');
      return Response.json({ payment_intent: 'pi_live_3' });
    };
    await grantPaidCredits({ type: 'charge.dispute.created', data: { object: { charge: 'ch_live_3', payment_intent: null } } }, { DB, STRIPE_SECRET_KEY: 'sk_live_fake' });
    assert.equal(DB.prepare('SELECT locked FROM wallets WHERE id = ?').bind('wallet-2').first().locked, 1);
  } finally { globalThis.fetch = originalFetch; DB.close(); }
});
