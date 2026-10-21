import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import pdfMake from 'pdfmake/build/pdfmake.js';
import { buildReviewPdfDocument } from '../app/public/pdf-export.js';

test('the browser PDF renderer embeds the MZ logo and brand fonts', async () => {
  const names = ['Inter.ttf', 'Inter-SemiBold.ttf', 'Fraunces.ttf', 'InstrumentSans.ttf'];
  const vfs = Object.fromEntries(names.map(name => [name,
    readFileSync(new URL(`../app/public/brand/pdf-fonts/${name}`, import.meta.url)).toString('base64')]));
  const fonts = {
    Inter: { normal: names[0], bold: names[1], italics: names[0], bolditalics: names[1] },
    Fraunces: { normal: names[2], bold: names[2], italics: names[2], bolditalics: names[2] },
    Instrument: { normal: names[3], bold: names[3], italics: names[3], bolditalics: names[3] }
  };
  const logo = readFileSync(new URL('../app/public/brand/favicon-mz.svg', import.meta.url), 'utf8');
  const document = buildReviewPdfDocument('## Claim brief\nA sample council review.\n\n## Synthesis\nThe evidence is incomplete.', new Date('2026-10-21T12:00:00Z'), logo);
  assert.match(document.header().columns[0].svg, /<svg/);
  const bytes = await new Promise(resolve => pdfMake.createPdf(document, undefined, fonts, vfs).getBuffer(resolve));
  assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), '%PDF-');
});
