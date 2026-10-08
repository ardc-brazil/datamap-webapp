export const PRINT_CSS = `
  @page { size: A4; }
  html, body { background: #fff !important; }
  .manual-impressao { font-size: 11pt; line-height: 1.55; color: #374151; max-width: 174mm; margin: 0 auto; padding: 12mm 0; }
  .manual-impressao h1 { color: #0b0b0c; letter-spacing: -0.02em; }
  .manual-capa { min-height: 240mm; display: flex; flex-direction: column; justify-content: center; gap: 6mm; }
  .manual-capa h1 { font-size: 40pt; line-height: 1.05; margin: 10mm 0 0; }
  .manual-capa-lede { font-size: 15pt; color: #4b5563; margin: 0; }
  .manual-capa-meta { color: #6b7280; margin: 0; }
  .manual-indice { break-before: page; }
  .manual-indice h2 { font-size: 20pt; }
  .manual-indice ol { list-style: none; padding: 0; }
  .manual-indice li { padding: 2mm 0; border-bottom: 1px solid #e5e7eb; }
  .manual-indice a, .manual-impressao a { color: #0b0b0c; }
  .manual-capitulo { break-before: page; }
  .manual-capitulo h1 { font-size: 26pt; margin: 0 0 3mm; }
  .manual-capitulo-numero { color: #6b7280; margin: 0; }
  .manual-capitulo-resumo { font-size: 13pt; color: #4b5563; }
  .manual-capitulo h2 { font-size: 15pt; margin: 8mm 0 3mm; break-after: avoid; }
  .manual-capitulo figure { break-inside: avoid; margin: 5mm 0; }
  .manual-capitulo figure img { width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 3px; }
  .manual-capitulo figcaption { font-size: 9pt; color: #6b7280; margin-top: 1.5mm; }
  .manual-capitulo aside, .manual-capitulo table, .manual-capitulo li { break-inside: avoid; }
  .manual-capitulo table { width: 100%; border-collapse: collapse; font-size: 10pt; }
  .manual-capitulo th, .manual-capitulo td { text-align: left; border-bottom: 1px solid #e5e7eb; padding: 1.5mm 2mm; vertical-align: top; }
  .manual-capitulo ul { list-style: disc; padding-left: 6mm; }
  .manual-capitulo ol { list-style: decimal; padding-left: 6mm; }
  .manual-capitulo strong { color: #0b0b0c; }
`;
