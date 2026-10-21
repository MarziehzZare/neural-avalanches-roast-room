import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const pdfVendorDir = path.resolve(publicDir, '..', '..', 'node_modules', 'pdfmake', 'build');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const port = Number(process.env.PORT || 4731);

http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/api/council') {
    res.writeHead(503, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    res.end(JSON.stringify({ error: 'Online questions are available after deployment. Use “Copy a request for Codex instead” in this local preview.' }));
    return;
  }
  if (req.method !== 'GET') { res.writeHead(405); res.end(); return; }
  const vendorFile = pathname.startsWith('/vendor/') ? path.basename(pathname) : null;
  const file = vendorFile && ['pdfmake.min.js', 'vfs_fonts.js'].includes(vendorFile)
    ? path.join(pdfVendorDir, vendorFile)
    : path.resolve(publicDir, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(publicDir + path.sep) && !file.startsWith(pdfVendorDir + path.sep)) { res.writeHead(403); res.end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Neural Avalanches Roast Room: http://localhost:${port}`));
