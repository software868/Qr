export type QrPageSize = "A4" | "A3" | "A5";

const PAGE_MM: Record<QrPageSize, { widthMm: number; heightMm: number }> = {
  A4: { widthMm: 210, heightMm: 297 },
  A3: { widthMm: 297, heightMm: 420 },
  A5: { widthMm: 148, heightMm: 210 },
};

function getPreset(pageSize: QrPageSize) {
  // Presets chosen to keep label cells large enough for a QR + serial text.
  switch (pageSize) {
    case "A4":
      return { cols: 3, rows: 4 };
    case "A3":
      return { cols: 4, rows: 6 };
    case "A5":
      return { cols: 2, rows: 3 };
    default:
      return { cols: 3, rows: 4 };
  }
}

export function buildQrLabelsPrintableHtmlGrid(args: {
  qrDataUrl: string;
  total: number;
  pageSize: QrPageSize;
  title?: string;
}) {
  const total = Math.max(1, Math.min(args.total, 100));
  const pageSize = args.pageSize;
  const { widthMm: pageWmm, heightMm: pageHmm } = PAGE_MM[pageSize];
  const { cols, rows } = getPreset(pageSize);
  const paddingMm = 8; // Print margin inside the page, in millimeters.

  const cellW = (pageWmm - paddingMm * 2) / cols;
  const cellH = (pageHmm - paddingMm * 2) / rows;

  // QR size in mm; clamp so it always fits in the label cell.
  const qrMm = Math.max(18, Math.min(48, cellW - 8, cellH - 22));

  const cellsPerPage = cols * rows;
  const pages = Math.ceil(total / cellsPerPage);

  const escapeHtml = (s: string) =>
    s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const title = escapeHtml(args.title ?? `QR Labels — ${args.total}`);

  const pageHtml = Array.from({ length: pages }, (_, pageIndex) => {
    const start = pageIndex * cellsPerPage;
    const end = Math.min(total, start + cellsPerPage);

    const cells: string[] = [];
    for (let i = 0; i < cellsPerPage; i++) {
      const n = start + i;
      if (n >= end) {
        // Keep a stable grid on the last page.
        cells.push(`<div class="cell empty"></div>`);
        continue;
      }
      const label = `${n + 1} / ${total}`;
      cells.push(`
        <div class="cell">
          <img class="qr" src="${args.qrDataUrl}" alt="QR ${label}" />
          <div class="serial">${escapeHtml(label)}</div>
        </div>
      `);
    }

    // Use inline grid sizing so the browser gets mm-based dimensions.
    const gridStyle = `grid-template-columns: repeat(${cols}, ${cellW.toFixed(2)}mm); grid-auto-rows: ${cellH.toFixed(
      2,
    )}mm;`;

    return `
      <section class="page" data-page="${pageIndex + 1}">
        <div class="grid" style="${gridStyle}">
          ${cells.join("")}
        </div>
      </section>
    `;
  }).join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      @page { size: ${pageSize}; margin: 0; }
      html, body { margin: 0; padding: 0; background: #fff; }
      .page {
        width: ${pageWmm}mm;
        height: ${pageHmm}mm;
        box-sizing: border-box;
        padding: ${paddingMm}mm;
        page-break-after: always;
      }
      .grid {
        width: 100%;
        height: 100%;
        display: grid;
        gap: 0;
      }
      .cell {
        box-sizing: border-box;
        border: 0.2mm dashed #000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2mm;
      }
      .cell.empty {
        border: 0.2mm dashed transparent;
      }
      .qr {
        width: ${qrMm.toFixed(2)}mm;
        height: ${qrMm.toFixed(2)}mm;
        object-fit: contain;
        image-rendering: pixelated;
      }
      .serial {
        margin-top: 2mm;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 10pt;
        font-weight: 700;
        letter-spacing: 0.2px;
      }
    </style>
  </head>
  <body>
    ${pageHtml}
  </body>
</html>`;
}

