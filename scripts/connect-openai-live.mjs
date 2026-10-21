import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const key = (await new Promise((resolve, reject) => {
  let value = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { value += chunk; });
  process.stdin.on('end', () => resolve(value.trim()));
  process.stdin.on('error', reject);
}));

if (!key.startsWith('sk-') || key.length < 20) {
  console.error('This does not look like a complete OpenAI API key. Nothing was uploaded.');
  process.exit(1);
}

let response;
try {
  response = await fetch('https://api.openai.com/v1/models', {
    headers: { authorization: `Bearer ${key}` }
  });
} catch {
  console.error('Could not reach OpenAI to check the key. Nothing was uploaded.');
  process.exit(1);
}
if (!response.ok) {
  console.error(`OpenAI rejected the key check (HTTP ${response.status}). Nothing was uploaded.`);
  process.exit(1);
}

const result = spawnSync('npx', ['--yes', 'wrangler', 'secret', 'put', 'OPENAI_API_KEY', '--config', 'wrangler.live.jsonc'], {
  cwd: root, input: `${key}\n`, encoding: 'utf8', timeout: 120000
});
if (result.status !== 0) {
  console.error('Cloudflare could not save the OpenAI key. Nothing was written to a project file.');
  process.exit(1);
}
console.log('Validated OpenAI API key and uploaded it to the live Worker.');
