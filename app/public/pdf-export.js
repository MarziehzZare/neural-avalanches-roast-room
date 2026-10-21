let libraryReady;

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
  const lines = review.replace(/\r\n/g, '\n').split('\n');
  const content = [];
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
    if (line.startsWith('### ')) {
      content.push({ text: plain(line.slice(4)), style: 'seatHeading' });
    } else if (line.startsWith('## ')) {
      content.push({ text: plain(line.slice(3)), style: 'sectionHeading' });
    } else if (/^[-*] /.test(line)) {
      content.push({ text: `• ${plain(line.slice(2))}`, style: 'body', margin: [12, 0, 0, 4] });
    } else {
      const paragraph = [line];
      while (i + 1 < lines.length && lines[i + 1].trim() && !/^(?:#{2,3} |\| |[-*] )/.test(lines[i + 1].trim())) {
        paragraph.push(lines[++i].trim());
      }
      content.push({ text: plain(paragraph.join(' ')), style: 'body' });
    }
  }
  return content;
}

export async function downloadReviewPdf(review) {
  if (!review?.trim()) throw new Error('No review is ready.');
  await ensurePdfLibrary();
  const date = new Date();
  const stamp = date.toISOString().slice(0, 10);
  const document = {
    info: { title: 'Neural Avalanches Council Review', author: 'Marzieh Zare — Neural Avalanches Roast Room' },
    pageSize: 'LETTER',
    pageMargins: [44, 50, 44, 48],
    defaultStyle: { font: 'Roboto', fontSize: 9.5, lineHeight: 1.32, color: '#173b32' },
    styles: {
      title: { fontSize: 22, bold: true, color: '#12342d', margin: [0, 4, 0, 3] },
      kicker: { fontSize: 9, bold: true, color: '#567227', characterSpacing: 1.1 },
      date: { fontSize: 8.5, color: '#567068', margin: [0, 0, 0, 14] },
      sectionHeading: { fontSize: 14, bold: true, color: '#12342d', margin: [0, 13, 0, 6] },
      seatHeading: { fontSize: 11, bold: true, color: '#567227', margin: [0, 8, 0, 4] },
      body: { margin: [0, 0, 0, 7] },
    },
    content: [
      { text: 'MARZIEH ZARE  /  NEURAL AVALANCHES', style: 'kicker' },
      { text: 'Council review', style: 'title' },
      { text: date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), style: 'date' },
      ...parseReview(review),
    ],
    footer: (page) => ({ columns: [{ text: 'NEURAL AVALANCHES ROAST ROOM', color: '#567068' }, { text: String(page), alignment: 'right', color: '#567068' }], margin: [44, 0, 44, 0], fontSize: 8 }),
  };
  await new Promise((resolve) => window.pdfMake.createPdf(document).download(`neural-avalanches-council-review-${stamp}.pdf`, resolve));
}
