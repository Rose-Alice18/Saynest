import { WordEntry } from '../types';

/**
 * Generates an Anki-compatible tab-delimited text file
 * Fields: Front (Word + POS), Back (Definition + Nuance), Phonetic, Example Sentence, Tags
 */
export function exportToAnki(words: WordEntry[], deckName: string = 'SayNest Deck') {
  if (words.length === 0) return;

  const sanitize = (text: string) =>
    (text || '').replace(/\t/g, ' ').replace(/\r?\n/g, '<br>');

  const lines = [
    '#separator:tab',
    '#html:true',
    '#tags column:5',
    '#columns:Front\tBack\tPhonetic\tExample\tTags'
  ];

  words.forEach(w => {
    const primaryMeaning = w.meanings[0];
    const pos = primaryMeaning?.partOfSpeech || w.type || 'word';
    const def = primaryMeaning?.definitions[0]?.definition || '';
    const example = primaryMeaning?.definitions[0]?.example || '';
    const ipa = w.phonetic || w.accents[0]?.ipa || '';
    const accent = w.accents[0]?.accent || 'British';

    // Front of card
    const front = `<div style="font-family: serif; font-size: 24px; font-weight: bold; color: #1c1917;">${sanitize(
      w.word
    )}</div><div style="font-family: sans-serif; font-size: 13px; color: #78716c; margin-top: 4px;">(${sanitize(
      pos
    )}) &bull; ${accent} English</div>`;

    // Back of card
    let back = `<div style="font-family: sans-serif; font-size: 16px; line-height: 1.5; color: #1c1917; text-align: left;"><strong>Definition:</strong> ${sanitize(
      def
    )}</div>`;

    if (w.nuance?.bestUsedWhen && w.nuance.bestUsedWhen.length > 0) {
      back += `<div style="font-size: 12px; color: #b45309; margin-top: 6px; text-align: left;"><strong>Best used when:</strong> ${sanitize(
        w.nuance.bestUsedWhen.join('; ')
      )}</div>`;
    }

    if (w.userNote) {
      back += `<div style="font-size: 12px; color: #44403c; margin-top: 6px; text-align: left;"><strong>Your Note:</strong> ${sanitize(
        w.userNote
      )}</div>`;
    }

    // Phonetic column
    const phoneticCol = `/${sanitize(ipa)}/ (${accent})`;

    // Example column
    const exampleCol = example ? `<em>"${sanitize(example)}"</em>` : '';

    // Tags
    const cleanTags = [
      'SayNest',
      w.type,
      w.nuance?.cefr || '',
      ...(w.tags || [])
    ]
      .filter(Boolean)
      .map(t => t.replace(/\s+/g, '_'))
      .join(' ');

    lines.push([front, back, phoneticCol, exampleCol, cleanTags].join('\t'));
  });

  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/tab-separated-values;charset=utf-8' });
  triggerDownload(blob, `${deckName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-anki.txt`);
}

/**
 * Generates a clean CSV file
 */
export function exportToCsv(words: WordEntry[], deckName: string = 'SayNest Vocabulary') {
  if (words.length === 0) return;

  const escapeCsv = (str: string) => {
    const text = str || '';
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const headers = ['Word', 'Part of Speech', 'Phonetic', 'Definition', 'Example Sentence', 'CEFR / Nuance', 'Tags', 'Date Added'];
  const rows = [headers.join(',')];

  words.forEach(w => {
    const primaryMeaning = w.meanings[0];
    const pos = primaryMeaning?.partOfSpeech || w.type || '';
    const def = primaryMeaning?.definitions[0]?.definition || '';
    const example = primaryMeaning?.definitions[0]?.example || '';
    const ipa = w.phonetic || w.accents[0]?.ipa || '';
    const cefr = w.nuance?.cefr || '';
    const tags = (w.tags || []).join('; ');

    rows.push([
      escapeCsv(w.word),
      escapeCsv(pos),
      escapeCsv(ipa),
      escapeCsv(def),
      escapeCsv(example),
      escapeCsv(cefr),
      escapeCsv(tags),
      escapeCsv(w.dateAdded)
    ].join(','));
  });

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  triggerDownload(blob, `${deckName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`);
}

/**
 * Triggers clean print view for double-sided / grid flashcards and study sheets
 */
export function printStudyCards(title: string, words: WordEntry[]) {
  if (words.length === 0) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    // If popup blocked, print current page with print media
    window.print();
    return;
  }

  const cardsHtml = words
    .map(
      (w, i) => `
    <div class="card-item">
      <div class="card-header">
        <span class="card-num">#${i + 1}</span>
        <span class="card-pos">${w.meanings[0]?.partOfSpeech || w.type}</span>
      </div>
      <div class="card-word">${w.word}</div>
      <div class="card-phonetic">/${w.phonetic || w.accents[0]?.ipa || ''}/ &bull; ${w.accents[0]?.accent || 'British'} English</div>
      <div class="card-divider"></div>
      <div class="card-definition">
        <strong>Definition:</strong> ${w.meanings[0]?.definitions[0]?.definition || ''}
      </div>
      ${
        w.meanings[0]?.definitions[0]?.example
          ? `<div class="card-example"><em>&ldquo;${w.meanings[0]?.definitions[0]?.example}&rdquo;</em></div>`
          : ''
      }
      ${
        w.nuance?.bestUsedWhen && w.nuance.bestUsedWhen.length > 0
          ? `<div class="card-nuance"><strong>Context:</strong> ${w.nuance.bestUsedWhen.join('; ')}</div>`
          : ''
      }
    </div>
  `
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${title} - SayNest Flashcards</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #1c1917;
          background: #fff;
          margin: 0;
          padding: 10px;
        }
        .sheet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #e7e5e4;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .sheet-title {
          font-size: 22px;
          font-weight: 800;
          font-family: Georgia, serif;
          margin: 0;
        }
        .sheet-meta {
          font-size: 12px;
          color: #78716c;
        }
        .cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .card-item {
          border: 1.5px dashed #d6d3d1;
          border-radius: 12px;
          padding: 16px;
          background: #fafaf9;
          break-inside: avoid;
          page-break-inside: avoid;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .card-num {
          font-size: 11px;
          font-weight: bold;
          color: #a8a29e;
          font-family: monospace;
        }
        .card-pos {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          background: #fef08a;
          color: #854d0e;
          padding: 2px 8px;
          border-radius: 6px;
        }
        .card-word {
          font-size: 22px;
          font-weight: 800;
          font-family: Georgia, serif;
          color: #0c0a09;
        }
        .card-phonetic {
          font-size: 12px;
          color: #78716c;
          font-family: monospace;
          margin-top: 2px;
          margin-bottom: 8px;
        }
        .card-divider {
          border-top: 1px solid #e7e5e4;
          margin: 8px 0;
        }
        .card-definition {
          font-size: 12px;
          line-height: 1.45;
          color: #292524;
          margin-bottom: 6px;
        }
        .card-example {
          font-size: 11.5px;
          font-family: Georgia, serif;
          font-style: italic;
          color: #57534e;
          background: #fff;
          padding: 8px 10px;
          border-radius: 6px;
          border-left: 3px solid #facc15;
          margin-top: 4px;
        }
        .card-nuance {
          font-size: 10.5px;
          color: #b45309;
          margin-top: 6px;
        }
        @media print {
          body {
            padding: 0;
          }
          .card-item {
            border: 1px solid #78716c;
            background: #fff;
          }
        }
      </style>
    </head>
    <body>
      <div class="sheet-header">
        <div>
          <h1 class="sheet-title">${title}</h1>
          <div class="sheet-meta">SayNest Study Cards &bull; ${words.length} items</div>
        </div>
        <div class="sheet-meta">
          Printed on ${new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}
        </div>
      </div>
      <div class="cards-grid">
        ${cardsHtml}
      </div>
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
