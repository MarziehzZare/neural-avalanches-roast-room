import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(appDir, 'public');
const outputDir = path.resolve(appDir, '..', 'dist');

await rm(outputDir, { recursive: true, force: true });
await mkdir(path.join(outputDir, 'avatars'), { recursive: true });

for (const file of ['index.html', 'styles.css', 'app.js', 'pdf-export.js']) {
  await cp(path.join(publicDir, file), path.join(outputDir, file));
}
await mkdir(path.join(outputDir, 'vendor'), { recursive: true });
for (const file of ['pdfmake.min.js', 'vfs_fonts.js']) {
  await cp(path.resolve(appDir, '..', 'node_modules', 'pdfmake', 'build', file), path.join(outputDir, 'vendor', file));
}
const pdfBytes = await readFile(path.join(outputDir, 'pdf-export.js'));
const pdfVersion = createHash('sha256').update(pdfBytes).digest('hex').slice(0, 12);
const appPath = path.join(outputDir, 'app.js');
const appSource = await readFile(appPath, 'utf8');
await writeFile(appPath, appSource.replace("import('/pdf-export.js')", `import('/pdf-export.js?v=${pdfVersion}')`));
let html = await readFile(path.join(outputDir, 'index.html'), 'utf8');
for (const asset of ['styles.css', 'app.js']) {
  const bytes = await readFile(path.join(outputDir, asset));
  const version = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  html = html.replace(`/${asset}"`, `/${asset}?v=${version}"`);
}
await writeFile(path.join(outputDir, 'index.html'), html);
await cp(path.join(publicDir, 'brand'), path.join(outputDir, 'brand'), { recursive: true });
await cp(path.join(publicDir, 'avatars', 'illustrated'), path.join(outputDir, 'avatars', 'illustrated'), { recursive: true });

console.log(`Shareable site ready: ${outputDir}`);
