const encoder = new TextEncoder();
const cookieName = 'council_wallet';

export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

export function readCookie(request) {
  const match = request.headers.get('cookie')?.match(/(?:^|;\s*)council_wallet=([A-Za-z0-9_-]{43})/);
  return match?.[1] || null;
}

export function walletCookie(token) {
  return `${cookieName}=${token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=31536000`;
}

export function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function hashToken(token) {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function findWallet(request, env) {
  const token = readCookie(request);
  if (!token) return null;
  const wallet = await env.DB.prepare('SELECT id, credits FROM wallets WHERE token_hash = ?')
    .bind(await hashToken(token)).first();
  return wallet ? { ...wallet, token } : null;
}

export async function createWallet(env) {
  const token = randomToken();
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO wallets (id, token_hash, credits) VALUES (?, ?, 0)')
    .bind(id, await hashToken(token)).run();
  return { id, token, credits: 0 };
}

export async function recoverWallet(token, env) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const wallet = await env.DB.prepare('SELECT id, credits FROM wallets WHERE token_hash = ?')
    .bind(await hashToken(token)).first();
  return wallet ? { ...wallet, token } : null;
}

export async function spendCredit(walletId, env) {
  const result = await env.DB.prepare('UPDATE wallets SET credits = credits - 1 WHERE id = ? AND credits > 0 RETURNING credits')
    .bind(walletId).first();
  return result != null;
}

export async function refundCredit(walletId, env) {
  await env.DB.prepare('UPDATE wallets SET credits = credits + 1 WHERE id = ?').bind(walletId).run();
}

export async function createCheckout(walletId, requestUrl, env) {
  const page = new URL(requestUrl);
  const form = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': '500',
    'line_items[0][price_data][product_data][name]': 'Neural Avalanches Roast Room — 10 reviews',
    'line_items[0][quantity]': '1',
    client_reference_id: walletId,
    'metadata[wallet_id]': walletId,
    'metadata[credit_count]': '10',
    success_url: `${page.origin}/?payment=success#question`,
    cancel_url: `${page.origin}/?payment=cancelled#question`
  });
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'content-type': 'application/x-www-form-urlencoded',
      'idempotency-key': crypto.randomUUID()
    },
    body: form
  });
  if (!response.ok) return null;
  const session = await response.json();
  return typeof session.url === 'string' && session.url.startsWith('https://checkout.stripe.com/') ? session.url : null;
}

export async function verifyStripeEvent(payload, header, secret, now = Date.now()) {
  if (!header || !secret || payload.length > 100000) return null;
  const timestamp = header.match(/(?:^|,)t=(\d+)(?:,|$)/)?.[1];
  const signatures = [...header.matchAll(/(?:^|,)v1=([a-f0-9]{64})(?=,|$)/g)].map(match => match[1]);
  if (!timestamp || signatures.length === 0 || Math.abs(now / 1000 - Number(timestamp)) > 300) return null;
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${payload}`));
  const expected = new Uint8Array(digest);
  let valid = false;
  for (const signature of signatures) {
    const supplied = Uint8Array.from(signature.match(/../g), part => parseInt(part, 16));
    let difference = 0;
    for (let i = 0; i < expected.length; i++) difference |= expected[i] ^ supplied[i];
    valid ||= difference === 0;
  }
  if (!valid) return null;
  try { return JSON.parse(payload); } catch { return null; }
}

export async function grantPaidCredits(event, env) {
  if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) return 'ignored';
  const session = event.data?.object;
  const walletId = session?.client_reference_id;
  if (session?.object !== 'checkout.session' || !/^cs_(test|live)_/.test(session.id || '') ||
      session.payment_status !== 'paid' || session.mode !== 'payment' ||
      session.amount_total !== 500 || session.currency !== 'usd' ||
      session.metadata?.wallet_id !== walletId || session.metadata?.credit_count !== '10' ||
      typeof walletId !== 'string') return 'ignored';
  // SQLite trigger grants ten credits only for a new session ID. Webhook retries stay harmless.
  await env.DB.prepare('INSERT OR IGNORE INTO paid_checkouts (session_id, wallet_id, amount_cents) SELECT ?, id, 500 FROM wallets WHERE id = ?')
    .bind(session.id, walletId).run();
  return 'accepted';
}
