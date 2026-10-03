import { PDFDocument } from 'pdf-lib';
import { PassportDocumentSpec, toMillimeters } from '../types/passport';

export type PaperSizeKey = '3R' | '4R' | '5R' | '6R' | 'A4' | 'A5' | 'Letter' | 'Custom';

export interface PaperSizeSpec {
  key: PaperSizeKey;
  label: string;
  widthMm: number;
  heightMm: number;
  description: string;
}

export const PAPER_SIZES: Record<PaperSizeKey, PaperSizeSpec> = {
  '3R': {
    key: '3R',
    label: '3R (3.5 × 5 inches / 9 × 13 cm)',
    widthMm: 88.9,
    heightMm: 127.0,
    description: 'Compact photo print card'
  },
  '4R': {
    key: '4R',
    label: '4R (4 × 6 inches / 10 × 15 cm)',
    widthMm: 101.6,
    heightMm: 152.4,
    description: 'Most popular standard photo paper sheet'
  },
  '5R': {
    key: '5R',
    label: '5R (5 × 7 inches / 13 × 18 cm)',
    widthMm: 127.0,
    heightMm: 177.8,
    description: 'Medium portrait photo paper'
  },
  '6R': {
    key: '6R',
    label: '6R (6 × 8 inches / 15 × 20 cm)',
    widthMm: 152.4,
    heightMm: 203.2,
    description: 'Large photo print sheet'
  },
  'A4': {
    key: 'A4',
    label: 'A4 (210 × 297 mm)',
    widthMm: 210.0,
    heightMm: 297.0,
    description: 'Standard international office printer document'
  },
  'A5': {
    key: 'A5',
    label: 'A5 (148 × 210 mm)',
    widthMm: 148.0,
    heightMm: 210.0,
    description: 'Half A4 printer sheet'
  },
  'Letter': {
    key: 'Letter',
    label: 'US Letter (8.5 × 11 inches)',
    widthMm: 215.9,
    heightMm: 279.4,
    description: 'Standard North American office printer paper'
  },
  'Custom': {
    key: 'Custom',
    label: 'Custom Paper Size',
    widthMm: 100.0,
    heightMm: 150.0,
    description: 'User specified dimensions'
  }
};

export interface SheetLayoutCalculation {
  paperWidthMm: number;
  paperHeightMm: number;
  photoWidthMm: number;
  photoHeightMm: number;
  cols: number;
  rows: number;
  maxCopies: number;
  copiesCount: number;
  marginMm: number;
  spacingMm: number;
  orientation: 'portrait' | 'landscape';
}

export function calculateSheetLayout(
  paperSpec: PaperSizeSpec,
  docSpec: PassportDocumentSpec,
  orientation: 'portrait' | 'landscape' = 'portrait',
  requestedCopies?: number
): SheetLayoutCalculation {
  let paperW = paperSpec.widthMm;
  let paperH = paperSpec.heightMm;

  if (orientation === 'landscape' && paperW < paperH) {
    [paperW, paperH] = [paperH, paperW];
  } else if (orientation === 'portrait' && paperW > paperH) {
    [paperW, paperH] = [paperH, paperW];
  }

  const photoW = toMillimeters(docSpec.width, docSpec.unit, docSpec.dpi);
  const photoH = toMillimeters(docSpec.height, docSpec.unit, docSpec.dpi);

  const marginMm = 8; // 8mm paper border margin
  const spacingMm = 4; // 4mm spacing between photos

  const availableW = paperW - marginMm * 2;
  const availableH = paperH - marginMm * 2;

  const cols = Math.max(1, Math.floor((availableW + spacingMm) / (photoW + spacingMm)));
  const rows = Math.max(1, Math.floor((availableH + spacingMm) / (photoH + spacingMm)));
  const maxCopies = cols * rows;

  const copiesCount = requestedCopies !== undefined
    ? Math.min(requestedCopies, maxCopies)
    : Math.min(maxCopies, 8);

  return {
    paperWidthMm: paperW,
    paperHeightMm: paperH,
    photoWidthMm: photoW,
    photoHeightMm: photoH,
    cols,
    rows,
    maxCopies,
    copiesCount,
    marginMm,
    spacingMm,
    orientation
  };
}

/**
 * Renders print sheet onto a 300 DPI high-resolution canvas
 */
export async function generatePrintSheetCanvas(
  singlePhotoCanvas: HTMLCanvasElement,
  layout: SheetLayoutCalculation,
  options: {
    showCutLines?: boolean;
    showCropMarks?: boolean;
    faintLines?: boolean;
  } = {}
): Promise<HTMLCanvasElement> {
  const { showCutLines = true, showCropMarks = true, faintLines = true } = options;

  const dpi = 300;
  const mmToPx = (mm: number) => Math.round((mm / 25.4) * dpi);

  const canvas = document.createElement('canvas');
  canvas.width = mmToPx(layout.paperWidthMm);
  canvas.height = mmToPx(layout.paperHeightMm);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas 2D context');

  // Solid white paper background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const photoWPx = mmToPx(layout.photoWidthMm);
  const photoHPx = mmToPx(layout.photoHeightMm);
  const spacingPx = mmToPx(layout.spacingMm);

  // Center the photo grid on the paper sheet
  const totalGridWPx = layout.cols * photoWPx + (layout.cols - 1) * spacingPx;
  const totalGridHPx = layout.rows * photoHPx + (layout.rows - 1) * spacingPx;

  const startXPx = Math.max(mmToPx(layout.marginMm), Math.round((canvas.width - totalGridWPx) / 2));
  const startYPx = Math.max(mmToPx(layout.marginMm), Math.round((canvas.height - totalGridHPx) / 2));

  let placedCount = 0;

  for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c < layout.cols; c++) {
      if (placedCount >= layout.copiesCount) break;

      const x = startXPx + c * (photoWPx + spacingPx);
      const y = startYPx + r * (photoHPx + spacingPx);

      // Draw photo
      ctx.drawImage(singlePhotoCanvas, x, y, photoWPx, photoHPx);

      // 1. Draw Cut Lines (Dashed boundary around each photo)
      if (showCutLines) {
        ctx.save();
        ctx.strokeStyle = faintLines ? 'rgba(148, 163, 184, 0.5)' : 'rgba(100, 116, 139, 0.85)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(x, y, photoWPx, photoHPx);
        ctx.restore();
      }

      // 2. Draw Corner Crop Marks (L-shapes around corners for precision scissors/guillotine)
      if (showCropMarks) {
        const markLen = Math.round(photoWPx * 0.09);
        ctx.save();
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.75)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([]);

        // Top-left corner mark
        ctx.beginPath();
        ctx.moveTo(x - 5, y);
        ctx.lineTo(x - 5 - markLen, y);
        ctx.moveTo(x, y - 5);
        ctx.lineTo(x, y - 5 - markLen);
        ctx.stroke();

        // Top-right corner mark
        ctx.beginPath();
        ctx.moveTo(x + photoWPx + 5, y);
        ctx.lineTo(x + photoWPx + 5 + markLen, y);
        ctx.moveTo(x + photoWPx, y - 5);
        ctx.lineTo(x + photoWPx, y - 5 - markLen);
        ctx.stroke();

        // Bottom-left corner mark
        ctx.beginPath();
        ctx.moveTo(x - 5, y + photoHPx);
        ctx.lineTo(x - 5 - markLen, y + photoHPx);
        ctx.moveTo(x, y + photoHPx + 5);
        ctx.lineTo(x, y + photoHPx + 5 + markLen);
        ctx.stroke();

        // Bottom-right corner mark
        ctx.beginPath();
        ctx.moveTo(x + photoWPx + 5, y + photoHPx);
        ctx.lineTo(x + photoWPx + 5 + markLen, y + photoHPx);
        ctx.moveTo(x + photoWPx, y + photoHPx + 5);
        ctx.lineTo(x + photoWPx, y + photoHPx + 5 + markLen);
        ctx.stroke();

        ctx.restore();
      }

      placedCount++;
    }
  }

  // Footer instructions outside cutting area
  ctx.save();
  ctx.fillStyle = 'rgba(100, 116, 139, 0.75)';
  ctx.font = '11px sans-serif';
  ctx.fillText(
    `IMAGE EDIT Passport Sheet · 300 DPI · ${layout.photoWidthMm}×${layout.photoHeightMm} mm · Print at 100% (Do Not Scale / Fit)`,
    startXPx,
    canvas.height - 14
  );
  ctx.restore();

  return canvas;
}

/**
 * Creates high-resolution PDF print document using pdf-lib
 */
export async function createPdfFromSheetCanvas(
  sheetCanvas: HTMLCanvasElement,
  paperWidthMm: number,
  paperHeightMm: number
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Convert mm to PostScript points (1 inch = 72 points, 1 inch = 25.4 mm)
  const ptW = (paperWidthMm / 25.4) * 72;
  const ptH = (paperHeightMm / 25.4) * 72;

  const page = pdfDoc.addPage([ptW, ptH]);

  const jpegBlob = await new Promise<Blob>((resolve) => {
    sheetCanvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.98);
  });
  const jpegArrayBuffer = await jpegBlob.arrayBuffer();

  const embeddedImage = await pdfDoc.embedJpg(jpegArrayBuffer);
  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width: ptW,
    height: ptH
  });

  return await pdfDoc.save();
}
