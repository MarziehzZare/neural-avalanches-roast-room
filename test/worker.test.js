import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

const env = {
  ROOM_ACCESS_CODE: 'demo-secret',
  OPENAI_API_KEY: 'api-secret',
  ROOM_LIMIT: { limit: async () => ({ success: true }) },
  ASSETS: { fetch: async () => new Response('asset') }
};

function request(body, headers = {}) {
  return new Request('https://room.example/api/council', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://room.example', ...headers },
    body: JSON.stringify(body)
  });
}

test('rejects unauthorized requests before calling the AI service', async () => {
  const result = await worker.fetch(request({ claim: 'A criticality claim', accessCode: 'wrong' }), env);
  assert.equal(result.status, 403);
});

test('sends a bounded, labeled review request and returns only the text', async () => {
  const originalFetch = globalThis.fetch;
  let sent;
  globalThis.fetch = async (_url, options) => {
    sent = JSON.parse(options.body);
    assert.equal(options.headers.authorization, 'Bearer api-secret');
    return Response.json({
      status: 'completed',
      output: [{ content: [{ type: 'output_text', text: 'A scoped review.' }] }],
      usage: { input_tokens: 200, output_tokens: 50 }
    });
  };
  try {
    const result = await worker.fetch(request({
      claim: 'Do these avalanches prove criticality?',
      context: 'Awake cortex, LFP.',
      mode: 'QUICK',
      accessCode: 'demo-secret'
    }), env);
    assert.equal(result.status, 200);
    assert.equal((await result.json()).review, 'A scoped review.');
    assert.equal(sent.store, false);
    assert.equal(sent.model, 'gpt-5.6-terra');
    assert.match(sent.instructions, /Anna Levina/);
    assert.match(sent.instructions, /One model performs this analysis sequentially/);
    assert.equal(sent.max_output_tokens, 4500);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('returns a clear error when secrets are missing', async () => {
  const result = await worker.fetch(request({ claim: 'A criticality claim' }), { ASSETS: env.ASSETS });
  assert.equal(result.status, 503);
});

test('omits links outside the curated source catalog', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({
    status: 'completed',
    output: [{ content: [{ type: 'output_text', text: 'Known: https://www.nature.com/articles/ncomms15140 Unknown: https://example.test/fake-paper' }] }]
  });
  try {
    const result = await worker.fetch(request({
      claim: 'Do these avalanches prove criticality?', mode: 'QUICK', accessCode: 'demo-secret'
    }), env);
    const { review } = await result.json();
    assert.match(review, /https:\/\/www\.nature\.com\/articles\/ncomms15140/);
    assert.doesNotMatch(review, /example\.test/);
    assert.match(review, /unverified link/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
