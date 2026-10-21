import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workerUrl = 'https://neural-avalanches-roast-room-paid.vieclinic.workers.dev/api/stripe-webhook';
const key = (await new Promise((resolve, reject) => {
  let text = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { text += chunk; });
  process.stdin.on('end', () => resolve(text.trim()));
  process.stdin.on('error', reject);
}));

if (!key.startsWith('sk_live_') || key.length < 20) {
  console.error('This setup accepts a Stripe LIVE secret key beginning sk_live_ only.');
  process.exit(1);
}

function putSecret(name, value) {
  const result = spawnSync('npx', ['--yes', 'wrangler', 'secret', 'put', name, '--config', 'wrangler.live.jsonc'], {
    cwd: root, input: `${value}\n`, encoding: 'utf8', timeout: 120000
  });
  if (result.status !== 0) {
    console.error(`Could not upload ${name}. ${result.error?.message || result.stderr || result.stdout || ''}`);
    process.exit(1);
  }
  console.log(`Uploaded ${name} to the live Worker.`);
}

putSecret('STRIPE_SECRET_KEY', key);

const form = new URLSearchParams({
  url: workerUrl,
  'enabled_events[0]': 'checkout.session.completed',
  'enabled_events[1]': 'checkout.session.async_payment_succeeded',
  'enabled_events[2]': 'charge.refunded',
  'enabled_events[3]': 'charge.dispute.created',
  description: 'Neural Avalanches Roast Room live credits'
});
let response;
try {
  response = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: form
  });
} catch {
  console.error('Could not reach Stripe to create the live webhook.');
  process.exit(1);
}
const endpoint = await response.json().catch(() => ({}));
if (!response.ok || typeof endpoint.secret !== 'string' || !endpoint.secret.startsWith('whsec_')) {
  console.error(`Stripe could not create the live webhook: ${endpoint.error?.message || response.status}`);
  process.exit(1);
}
putSecret('STRIPE_WEBHOOK_SECRET', endpoint.secret);
console.log(`Stripe live webhook connected: ${endpoint.id}. Live Checkout can accept real charges once all Worker secrets are configured.`);
