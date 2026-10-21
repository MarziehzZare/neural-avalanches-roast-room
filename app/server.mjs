import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const roomDir = path.resolve(publicDir, '..', '..');
const portraits = {
  'beggs.jpg': 'brains/john-m-beggs/JohnBeggs2019.jpg',
  'plenz.jpg': 'brains/dietmar-plenz/Dietmar.jpg',
  'chialvo.jpeg': 'brains/dante-r-chialvo/dante.jpeg',
  'munoz.webp': 'brains/miguel-a-munoz/Miguel-Munoz-23.webp',
  'destexhe.jpeg': 'brains/alain-destexhe/images.jpeg',
  'priesemann.jpeg': 'brains/viola-priesemann/viola.jpeg',
  'levina.jpg': 'brains/anna-levina/anna.jpg',
};
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const port = Number(process.env.PORT || 4731);

http.createServer(async (req, res) => {
  if (req.method !== 'GET') { res.writeHead(405); res.end(); return; }
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const portraitName = pathname.startsWith('/portraits/') ? pathname.slice('/portraits/'.length) : null;
  if (portraitName !== null && !Object.hasOwn(portraits, portraitName)) { res.writeHead(404); res.end(); return; }
  const file = portraitName !== null
    ? path.join(roomDir, portraits[portraitName])
    : path.resolve(publicDir, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (portraitName === null && !file.startsWith(publicDir + path.sep)) { res.writeHead(403); res.end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Neural Avalanches Roast Room: http://localhost:${port}`));
