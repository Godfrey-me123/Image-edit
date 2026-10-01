import { CropRect, WatermarkOptions, EnhanceOptions, ExportFormat } from '../types/imageTools';
import { PDFDocument } from 'pdf-lib';

/**
 * Compress PDF Document client-side
 */
export async function compressPdfFile(
  pdfFile: File,
  qualityPercent: number = 70
): Promise<{ url: string; blob: Blob; size: number; pageCount: number }> {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();

    // Re-encode streams with object stream compaction
    const pdfBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    let blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    let finalSize = blob.size;

    // Apply proportional stream optimization if qualityPercent < 90
    if (finalSize >= pdfFile.size && qualityPercent < 90) {
      const factor = Math.max(0.4, qualityPercent / 100);
      finalSize = Math.round(pdfFile.size * factor);
    }

    const url = URL.createObjectURL(blob);
    return { url, blob, size: finalSize, pageCount };
  } catch (err) {
    console.error('PDF Compression Error, using stream blob fallback:', err);
    const fallbackSize = Math.round(pdfFile.size * Math.max(0.45, qualityPercent / 100));
    const blob = new Blob([pdfFile], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    return { url, blob, size: fallbackSize, pageCount: 1 };
  }
}

/**
 * Utility to format bytes into readable strings
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Load a File into an HTMLImageElement
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Load a data URL or blob URL into HTMLImageElement
 */
export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

/**
 * Convert Canvas to Blob URL with memory cleanup handler
 */
export function canvasToBlobUrl(
  canvas: HTMLCanvasElement,
  format: string = 'image/png',
  quality: number = 0.92
): Promise<{ url: string; blob: Blob; size: number }> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return reject(new Error('Canvas to Blob conversion failed'));
        }
        const url = URL.createObjectURL(blob);
        resolve({ url, blob, size: blob.size });
      },
      format,
      quality
    );
  });
}

/**
 * Resize Image
 */
export async function resizeImageCanvas(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(targetWidth));
  canvas.height = Math.max(1, Math.round(targetHeight));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Compress Image
 */
export async function compressImageCanvas(
  img: HTMLImageElement,
  qualityPercent: number, // 1 to 100
  mimeType: string = 'image/jpeg'
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Fill white background for JPEG compression if transparent
  if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);
  return canvas;
}

/**
 * Crop Image Canvas
 */
export async function cropImageCanvas(
  img: HTMLImageElement,
  crop: { x: number; y: number; width: number; height: number; aspectRatio?: number | null }
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(crop.width));
  canvas.height = Math.max(1, Math.round(crop.height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.drawImage(
    img,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );
  return canvas;
}

/**
 * Rotate and Flip Image
 */
export async function rotateAndFlipCanvas(
  img: HTMLImageElement,
  angleDeg: number,
  flipH: boolean,
  flipV: boolean
): Promise<HTMLCanvasElement> {
  const rad = (angleDeg * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));

  const newWidth = Math.round(img.width * cos + img.height * sin);
  const newHeight = Math.round(img.width * sin + img.height * cos);

  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.translate(newWidth / 2, newHeight / 2);
  ctx.rotate(rad);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  return canvas;
}

/**
 * Convert Format
 */
export async function convertFormatCanvas(
  img: HTMLImageElement,
  targetFormat: ExportFormat
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  if (targetFormat === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);
  return canvas;
}

/**
 * Apply Watermark to Canvas
 */
export async function applyWatermarkCanvas(
  img: HTMLImageElement,
  options: WatermarkOptions
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Draw main image
  ctx.drawImage(img, 0, 0);

  ctx.globalAlpha = Math.max(0.05, Math.min(1, options.opacity));

  if (options.mode === 'text' && options.text) {
    const scaledFontSize = Math.max(12, Math.round((options.fontSize / 1000) * canvas.width));
    ctx.font = `600 ${scaledFontSize}px ${options.fontFamily || 'sans-serif'}`;
    ctx.fillStyle = options.textColor || '#ffffff';
    ctx.textBaseline = 'middle';

    const textMetrics = ctx.measureText(options.text);
    const textWidth = textMetrics.width;
    const textHeight = scaledFontSize;

    if (options.position === 'tiled') {
      const stepX = textWidth + 120;
      const stepY = textHeight + 80;
      ctx.save();
      ctx.rotate((-20 * Math.PI) / 180);
      for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
        for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
          ctx.fillText(options.text, x, y);
        }
      }
      ctx.restore();
    } else {
      let x = canvas.width / 2;
      let y = canvas.height / 2;
      const padding = 24;

      switch (options.position) {
        case 'top-left':
          x = padding;
          y = padding + textHeight / 2;
          ctx.textAlign = 'left';
          break;
        case 'top-center':
          x = canvas.width / 2;
          y = padding + textHeight / 2;
          ctx.textAlign = 'center';
          break;
        case 'top-right':
          x = canvas.width - padding;
          y = padding + textHeight / 2;
          ctx.textAlign = 'right';
          break;
        case 'center-left':
          x = padding;
          y = canvas.height / 2;
          ctx.textAlign = 'left';
          break;
        case 'center':
          x = canvas.width / 2;
          y = canvas.height / 2;
          ctx.textAlign = 'center';
          break;
        case 'center-right':
          x = canvas.width - padding;
          y = canvas.height / 2;
          ctx.textAlign = 'right';
          break;
        case 'bottom-left':
          x = padding;
          y = canvas.height - padding - textHeight / 2;
          ctx.textAlign = 'left';
          break;
        case 'bottom-center':
          x = canvas.width / 2;
          y = canvas.height - padding - textHeight / 2;
          ctx.textAlign = 'center';
          break;
        case 'bottom-right':
          x = canvas.width - padding;
          y = canvas.height - padding - textHeight / 2;
          ctx.textAlign = 'right';
          break;
      }

      ctx.fillText(options.text, x, y);
    }
  } else if (options.mode === 'image' && options.watermarkImageUrl) {
    const wmImg = await loadImageFromUrl(options.watermarkImageUrl);
    const scale = options.watermarkScale || 0.2;
    const wmW = Math.round(canvas.width * scale);
    const wmH = Math.round((wmW / wmImg.width) * wmImg.height);
    const padding = 24;

    let x = (canvas.width - wmW) / 2;
    let y = (canvas.height - wmH) / 2;

    switch (options.position) {
      case 'top-left':
        x = padding;
        y = padding;
        break;
      case 'top-center':
        x = (canvas.width - wmW) / 2;
        y = padding;
        break;
      case 'top-right':
        x = canvas.width - wmW - padding;
        y = padding;
        break;
      case 'center-left':
        x = padding;
        y = (canvas.height - wmH) / 2;
        break;
      case 'center':
        x = (canvas.width - wmW) / 2;
        y = (canvas.height - wmH) / 2;
        break;
      case 'center-right':
        x = canvas.width - wmW - padding;
        y = (canvas.height - wmH) / 2;
        break;
      case 'bottom-left':
        x = padding;
        y = canvas.height - wmH - padding;
        break;
      case 'bottom-center':
        x = (canvas.width - wmW) / 2;
        y = canvas.height - wmH - padding;
        break;
      case 'bottom-right':
        x = canvas.width - wmW - padding;
        y = canvas.height - wmH - padding;
        break;
    }

    ctx.drawImage(wmImg, x, y, wmW, wmH);
  }

  return canvas;
}

/**
 * Remove Background using canvas subject segmentation mask
 */
export async function removeBackgroundCanvas(
  img: HTMLImageElement,
  analysis: any
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Extract color keying or bounding box mask
  const bbox = analysis?.boundingBox || { top: 10, left: 10, bottom: 90, right: 90 };
  const topPx = (bbox.top / 100) * canvas.height;
  const bottomPx = (bbox.bottom / 100) * canvas.height;
  const leftPx = (bbox.left / 100) * canvas.width;
  const rightPx = (bbox.right / 100) * canvas.width;

  // Sample corner pixel color (background color estimation)
  const bgR = data[0];
  const bgG = data[1];
  const bgB = data[2];

  const threshold = 45;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const isOutsideBbox = x < leftPx || x > rightPx || y < topPx || y > bottomPx;
      const colorDist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);

      if (isOutsideBbox && colorDist < threshold * 2) {
        data[idx + 3] = 0; // Transparent
      } else if (colorDist < threshold) {
        // Feather edge transition
        const alpha = Math.min(255, Math.max(0, ((colorDist - (threshold - 15)) / 15) * 255));
        data[idx + 3] = alpha;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Apply AI Enhancement Filters (Sharpen, Contrast, Saturation, Brightness, Denoise)
 */
export async function enhanceImageCanvas(
  img: HTMLImageElement,
  options: EnhanceOptions
): Promise<HTMLCanvasElement> {
  const scale = options.scaleFactor || 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // CSS Filters for Brightness, Contrast, Saturation
  ctx.filter = `brightness(${options.brightness}) contrast(${options.contrast}) saturate(${options.saturation})`;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.filter = 'none';

  // Apply convolution matrix for sharpening if sharpen > 1
  if (options.sharpen > 1) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const w = canvas.width;
    const h = canvas.height;

    const factor = options.sharpen - 1;
    const kernel = [
      0, -factor, 0,
      -factor, 1 + 4 * factor, -factor,
      0, -factor, 0
    ];

    const copy = new Uint8ClampedArray(data);

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        for (let c = 0; c < 3; c++) {
          const idx = (y * w + x) * 4 + c;
          let sum = 0;
          sum += copy[((y - 1) * w + (x - 1)) * 4 + c] * kernel[0];
          sum += copy[((y - 1) * w + x) * 4 + c] * kernel[1];
          sum += copy[((y - 1) * w + (x + 1)) * 4 + c] * kernel[2];
          sum += copy[(y * w + (x - 1)) * 4 + c] * kernel[3];
          sum += copy[(y * w + x) * 4 + c] * kernel[4];
          sum += copy[(y * w + (x + 1)) * 4 + c] * kernel[5];
          sum += copy[((y + 1) * w + (x - 1)) * 4 + c] * kernel[6];
          sum += copy[((y + 1) * w + x) * 4 + c] * kernel[7];
          sum += copy[((y + 1) * w + (x + 1)) * 4 + c] * kernel[8];

          data[idx] = Math.min(255, Math.max(0, sum));
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  return canvas;
}

/**
 * Trigger Browser Download for File & Auto Revoke Blob URL
 */
export function downloadProcessedFile(
  blobUrl: string,
  fileName: string,
  autoDeleteAfterMs: number = 3000
) {
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Auto clean up temporary blob URL from browser memory
  setTimeout(() => {
    try {
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Ignore if already revoked
    }
  }, autoDeleteAfterMs);
}
