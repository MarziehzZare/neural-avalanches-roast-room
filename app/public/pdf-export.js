let libraryReady;
let brandReady;

const brandFonts = {
  Inter: { normal: 'Inter.ttf', bold: 'Inter-SemiBold.ttf', italics: 'Inter.ttf', bolditalics: 'Inter-SemiBold.ttf' },
  Fraunces: { normal: 'Fraunces.ttf', bold: 'Fraunces.ttf', italics: 'Fraunces.ttf', bolditalics: 'Fraunces.ttf' },
  Instrument: { normal: 'InstrumentSans.ttf', bold: 'InstrumentSans.ttf', italics: 'InstrumentSans.ttf', bolditalics: 'InstrumentSans.ttf' }
};
const forest = '#0a1f1c';
const lime = '#c4f042';
const cream = '#f4f1ea';

function base64(bytes) {
  let binary = '';
  for (let start = 0; start < bytes.length; start += 8192) {
    binary += String.fromCharCode(...bytes.subarray(start, start + 8192));
  }
  return btoa(binary);
}

function ensureBrandAssets() {
  brandReady ||= (async () => {
    const names = ['Inter.ttf', 'Inter-SemiBold.ttf', 'Fraunces.ttf', 'InstrumentSans.ttf'];
    const [logoResponse, ...fontResponses] = await Promise.all([
      fetch('/brand/favicon-mz.svg'),
      ...names.map(name => fetch(`/brand/pdf-fonts/${name}`))
    ]);
    if (![logoResponse, ...fontResponses].every(response => response.ok)) {
      throw new Error('The PDF brand assets could not be loaded.');
    }
    const logoSvg = await logoResponse.text();
    if (!logoSvg.includes('<svg')) throw new Error('The MZ logo could not be read.');
    const fontBytes = await Promise.all(fontResponses.map(response => response.arrayBuffer()));
    const vfs = Object.fromEntries(names.map((name, index) => [name, base64(new Uint8Array(fontBytes[index]))]));
    return { logoSvg, vfs };
  })();
  return brandReady;
}

function loadScript(path) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = path;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${path}`));
    document.head.append(script);
  });
}

function ensurePdfLibrary() {
  libraryReady ||= loadScript('/vendor/pdfmake.min.js')
    .then(() => loadScript('/vendor/vfs_fonts.js'))
    .then(() => {
      if (!window.pdfMake?.createPdf) throw new Error('PDF library did not initialize.');
    });
  return libraryReady;
}

function plain(text) {
  return text.replace(/\*\*/g, '').replace(/`/g, '')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1 ($2)');
}

function parseReview(review) {
  const lines = review.replace(/\r\n/g, '\n')
    .replace(/^\s*(?:\*\*)?One AI model applied seven simulated research lenses; no named scientist participated\.(?:\*\*)?\s*/i, '')
    .split('\n');
  const content = [];
  const isNewBlock = (line) => /^(?:#{2,3} |\| |[-*] )/.test(line);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith('|') && i + 1 < lines.length && /^[\s|:-]+$/.test(lines[i + 1])) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i].trim().replace(/^\||\|$/g, '').split('|').map(cell => plain(cell.trim()));
        if (!/^[\s|:-]+$/.test(lines[i])) rows.push(cells);
        i++;
      }
      i--;
      if (rows.length) {
        content.push({
          table: { headerRows: 1, widths: rows[0].map(() => '*'), body: rows.map((row, index) => row.map(text => ({ text, fillColor: index === 0 ? '#143b32' : index % 2 ? '#f2f6f1' : '#ffffff', color: index === 0 ? '#ffffff' : '#173b32', margin: [2, 3, 2, 3] }))) },
          layout: { hLineColor: () => '#d7e3d9', vLineWidth: () => 0, hLineWidth: () => 0.5, paddingLeft: () => 5, paddingRight: () => 5 },
          fontSize: 8,
          margin: [0, 3, 0, 11]
        });
      }
      continue;
    }
    if (line.startsWith('### ') || line.startsWith('## ')) {
      const heading = { text: plain(line.slice(line.startsWith('### ') ? 4 : 3)), style: line.startsWith('### ') ? 'seatHeading' : 'sectionHeading' };
      let next = i + 1;
      while (next < lines.length && !lines[next].trim()) next++;
      if (next < lines.length && !isNewBlock(lines[next].trim())) {
        const paragraph = [lines[next].trim()];
        while (next + 1 < lines.length && lines[next + 1].trim() && !isNewBlock(lines[next + 1].trim())) {
          paragraph.push(lines[++next].trim());
        }
        content.push({ stack: [heading, { text: plain(paragraph.join(' ')), style: 'body' }], unbreakable: true });
        i = next;
      } else {
        content.push(heading);
      }
    } else if (/^[-*] /.test(line)) {
      content.push({ text: `• ${plain(line.slice(2))}`, style: 'body', margin: [12, 0, 0, 4] });
    } else {
      const paragraph = [line];
      while (i + 1 < lines.length && lines[i + 1].trim() && !isNewBlock(lines[i + 1].trim())) {
        paragraph.push(lines[++i].trim());
      }
      content.push({ text: plain(paragraph.join(' ')), style: 'body' });
    }
  }
  return content;
}

export function buildReviewPdfDocument(review, date, logoSvg) {
  if (!review?.trim()) throw new Error('No review is ready.');
  const displayDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return {
    info: { title: 'Neural Avalanches Council Review', author: 'Marzieh Zare — Neural Avalanches Roast Room', subject: 'AI-assisted research review' },
    pageSize: 'LETTER',
    pageMargins: [46, 76, 46, 54],
    defaultStyle: { font: 'Inter', fontSize: 9.4, lineHeight: 1.3, color: '#173b32' },
    styles: {
      sectionHeading: { font: 'Fraunces', fontSize: 15, color: forest, margin: [0, 15, 0, 6] },
      seatHeading: { font: 'Instrument', fontSize: 11, color: '#416b35', margin: [0, 10, 0, 4] },
      body: { margin: [0, 0, 0, 8] }
    },
    header: () => ({
      margin: [46, 20, 46, 0],
      columns: [
        { svg: logoSvg, width: 29, height: 29 },
        { stack: [
          { text: 'MARZIEH ZARE', font: 'Instrument', fontSize: 10, color: forest, characterSpacing: 0.5 },
          { text: 'The thinking behind the thinking', font: 'Fraunces', fontSize: 7.5, color: '#587344' }
        ], margin: [7, 3, 0, 0] },
        { text: 'NEURAL AVALANCHES  /  ROAST ROOM', alignment: 'right', font: 'Instrument', fontSize: 7.5, color: '#587344', margin: [0, 10, 0, 0] }
      ]
    }),
    content: [
      { table: { widths: ['*'], body: [[{
        fillColor: forest,
        stack: [
          { text: 'RESEARCH REVIEW  /  SEVEN SIMULATED LENSES', font: 'Instrument', fontSize: 8, color: lime, characterSpacing: 1.1, margin: [0, 0, 0, 8] },
          { text: 'Neural avalanches', font: 'Fraunces', fontSize: 27, color: cream, margin: [0, 0, 0, 3] },
          { text: 'Council review', font: 'Fraunces', fontSize: 18, color: lime, margin: [0, 0, 0, 12] },
          { text: displayDate, font: 'Inter', fontSize: 8.5, color: '#cbd9cf' }
        ],
        margin: [18, 17, 18, 18]
      }]] }, layout: 'noBorders', margin: [0, 0, 0, 14] },
      { table: { widths: ['*'], body: [[{ text: 'One AI model applied seven simulated research lenses. No named scientist participated. This is not peer review.', fontSize: 8.5, color: '#486359', fillColor: '#eef4e8', margin: [10, 8, 10, 8] }]] }, layout: 'noBorders', margin: [0, 0, 0, 12] },
      ...parseReview(review)
    ],
    footer: (page, pages) => ({
      margin: [46, 0, 46, 16],
      stack: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 520, y2: 0, lineWidth: 1, lineColor: '#c4d6bd' }], margin: [0, 0, 0, 7] },
        { columns: [
          { text: `© ${date.getFullYear()} Marzieh Zare`, font: 'Instrument', color: forest },
          { text: 'SIMULATED LENSES  /  NOT PEER REVIEW', alignment: 'center', color: '#587344' },
          { text: `${page} / ${pages}`, alignment: 'right', color: forest }
        ], fontSize: 7.5 }
      ]
    })
  };
}

export async function downloadReviewPdf(review) {
  if (!review?.trim()) throw new Error('No review is ready.');
  const [_, { logoSvg, vfs }] = await Promise.all([ensurePdfLibrary(), ensureBrandAssets()]);
  const date = new Date();
  const stamp = date.toISOString().slice(0, 10);
  const document = buildReviewPdfDocument(review, date, logoSvg);
  await new Promise((resolve) => window.pdfMake.createPdf(document, undefined, brandFonts, vfs).download(`neural-avalanches-council-review-${stamp}.pdf`, resolve));
}
