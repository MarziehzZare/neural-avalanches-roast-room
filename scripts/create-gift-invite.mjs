import { randomBytes, createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [mode, label, count] = process.argv.slice(2);
const credits = Number(count);
if (!['--test', '--live'].includes(mode) || !label?.trim() || !Number.isInteger(credits) || credits < 1 || credits > 100) {
  console.error('Usage: node scripts/create-gift-invite.mjs --test|--live "Recipient label" 1-100');
  process.exit(2);
}

const isLive = mode === '--live';
const database = `neural-avalanches-credits-${isLive ? 'live' : 'test'}`;
const config = `wrangler.${isLive ? 'live' : 'test'}.jsonc`;
const origin = `https://neural-avalanches-roast-room-${isLive ? 'paid' : 'test'}.vieclinic.workers.dev`;
const token = randomBytes(32).toString('base64url');
const tokenHash = createHash('sha256').update(token).digest('hex');
const safeLabel = label.trim().replaceAll("'", "''");
const url = `${origin}/#gift=${token}`;
const temporaryDir = mkdtempSync(path.join(tmpdir(), 'roast-gift-'));
const sqlPath = path.join(temporaryDir, 'invite.sql');
const safeFileLabel = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'guest';
const outputDir = path.join(projectDir, 'output', 'invites');
const linkPath = path.join(outputDir, `${isLive ? 'live' : 'test'}-${safeFileLabel}-${Date.now()}.txt`);

try {
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(sqlPath, `INSERT INTO gift_invites (token_hash, label, credits) VALUES ('${tokenHash}', '${safeLabel}', ${credits});\n`, { mode: 0o600 });
  writeFileSync(linkPath, `${url}\n`, { mode: 0o600 });
  execFileSync('npx', ['--yes', 'wrangler', 'd1', 'execute', database, '--remote', '--config', config, `--file=${sqlPath}`], { cwd: projectDir, stdio: ['ignore', 'ignore', 'pipe'] });
  console.log(`Created a one-use ${credits}-review invitation for ${label.trim()}.`);
  console.log(`Private link saved at: ${linkPath}`);
  console.log('The first person to open this link claims its credits. Share it privately.');
} catch (error) {
  rmSync(linkPath, { force: true });
  console.error(error.stderr?.toString() || error.message);
  process.exitCode = 1;
} finally {
  rmSync(temporaryDir, { recursive: true, force: true });
}
