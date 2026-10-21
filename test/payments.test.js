import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import worker from '../worker/index.js';
import { createCheckout, grantPaidCredits, verifyStripeEvent } from '../worker/payments.js';

function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0001_credits.sql', import.meta.url), 'utf8'));
  return {
    prepare(sql) {
      let values = [];
      return {
        bind(...args) { values = args; return this; },
        first() { return sqlite.prepare(sql).get(...values) || null; },
        run() { sqlite.prepare(sql).run(...values); return {}; }
      };
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
      payment_status: 'paid', mode: 'payment', amount_total: 500, currency: 'usd',
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
    ROOM_ACCESS_CODE: 'invite', OPENAI_API_KEY: 'api-secret',
    ROOM_LIMIT: { limit: async () => ({ success: true }) },
    ASSETS: { fetch: async () => new Response('asset') }
  };
  const originalFetch = globalThis.fetch;
  try {
    const walletResponse = await worker.fetch(post('/api/wallet', { accessCode: 'invite' }), env);
    assert.equal(walletResponse.status, 200);
    const cookie = walletResponse.headers.get('set-cookie').split(';')[0];
    const wallet = await walletResponse.json();
    const noCredits = await worker.fetch(post('/api/council', { accessCode: 'invite', claim: 'Are these avalanches critical?', mode: 'QUICK' }, cookie), env);
    assert.equal(noCredits.status, 402);
    const session = {
      object: 'checkout.session', id: 'cs_test_3', client_reference_id: null,
      payment_status: 'paid', mode: 'payment', amount_total: 500, currency: 'usd',
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
    const failed = await worker.fetch(post('/api/council', { accessCode: 'invite', claim: 'Are these avalanches critical?', mode: 'QUICK' }, cookie), env);
    assert.equal(failed.status, 502);
    assert.equal(DB.prepare('SELECT credits FROM wallets WHERE id = ?').bind(id).first().credits, 10);
    globalThis.fetch = async () => Response.json({ status: 'completed', output: [{ content: [{ type: 'output_text', text: 'Review.' }] }] });
    const done = await worker.fetch(post('/api/council', { accessCode: 'invite', claim: 'Are these avalanches critical?', mode: 'QUICK' }, cookie), env);
    assert.equal(done.status, 200);
    assert.equal(DB.prepare('SELECT credits FROM wallets WHERE id = ?').bind(id).first().credits, 9);
  } finally { globalThis.fetch = originalFetch; DB.close(); }
});
