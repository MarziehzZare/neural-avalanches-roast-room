import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(appDir, 'public');
const outputDir = path.resolve(appDir, '..', 'dist');

await rm(outputDir, { recursive: true, force: true });
await mkdir(path.join(outputDir, 'avatars'), { recursive: true });

for (const file of ['index.html', 'styles.css', 'app.js']) {
  await cp(path.join(publicDir, file), path.join(outputDir, file));
}
await cp(path.join(publicDir, 'brand'), path.join(outputDir, 'brand'), { recursive: true });
await cp(path.join(publicDir, 'avatars', 'illustrated'), path.join(outputDir, 'avatars', 'illustrated'), { recursive: true });

console.log(`Shareable site ready: ${outputDir}`);
