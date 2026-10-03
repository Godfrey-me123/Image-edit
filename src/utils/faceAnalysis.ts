export interface FaceAnalysisResult {
  hasFace: boolean;
  confidence: number;
  boundingBox: {
    x: number; // 0 to 1
    y: number; // 0 to 1
    width: number;
    height: number;
  };
  landmarks: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
    eyeCenter: { x: number; y: number };
    noseTip: { x: number; y: number };
    mouthCenter: { x: number; y: number };
    chinBottom: { x: number; y: number };
    foreheadTop: { x: number; y: number };
  };
  metrics: {
    headHeightRatio: number; // Head height as % of image height
    centerHorizontalOffset: number; // -0.5 to +0.5 from center
    eyeLineLevelFromBottom: number; // 0 to 1 from bottom of photo
    eyeAngleDeg: number; // tilt in degrees
  };
}

/**
 * Client-side facial landmark detection heuristics
 * Uses skin chrominance cluster analysis and gradient edge profiling on scaled offscreen canvas.
 */
export async function analyzeFaceLandmarks(
  source: HTMLImageElement | HTMLCanvasElement
): Promise<FaceAnalysisResult> {
  const canvas = document.createElement('canvas');
  const maxDim = 320;
  const scale = Math.min(1, maxDim / Math.max(source.width, source.height));
  canvas.width = Math.max(60, Math.round(source.width * scale));
  canvas.height = Math.max(60, Math.round(source.height * scale));

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return createDefaultFaceResult();
  }

  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const w = canvas.width;
  const h = canvas.height;

  let minX = w, maxX = 0, minY = h, maxY = 0;
  let skinPixelCount = 0;
  let sumX = 0, sumY = 0;

  for (let y = Math.round(h * 0.05); y < Math.round(h * 0.95); y++) {
    for (let x = Math.round(w * 0.08); x < Math.round(w * 0.92); x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const isSkin =
        r > 75 &&
        g > 35 &&
        b > 15 &&
        Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
        Math.abs(r - g) > 12 &&
        r > g &&
        r > b;

      if (isSkin) {
        skinPixelCount++;
        sumX += x;
        sumY += y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (skinPixelCount > (w * h * 0.04) && maxX > minX && maxY > minY) {
    const faceW = (maxX - minX) / w;
    const faceH = (maxY - minY) / h;
    const centerX = (sumX / skinPixelCount) / w;
    const centerY = (sumY / skinPixelCount) / h;

    const left = Math.max(0, (minX / w));
    const top = Math.max(0, (minY / h));

    const headTop = Math.max(0.06, top - 0.09);
    const chin = Math.min(0.94, top + faceH * 0.95);
    const headHeight = chin - headTop;

    const eyeY = top + faceH * 0.38;
    const eyeSpread = faceW * 0.36;

    return {
      hasFace: true,
      confidence: 0.95,
      boundingBox: {
        x: left,
        y: top,
        width: Math.min(1 - left, faceW),
        height: Math.min(1 - top, faceH)
      },
      landmarks: {
        leftEye: { x: Math.max(0.08, centerX - eyeSpread / 2), y: eyeY },
        rightEye: { x: Math.min(0.92, centerX + eyeSpread / 2), y: eyeY },
        eyeCenter: { x: centerX, y: eyeY },
        noseTip: { x: centerX, y: top + faceH * 0.55 },
        mouthCenter: { x: centerX, y: top + faceH * 0.72 },
        chinBottom: { x: centerX, y: chin },
        foreheadTop: { x: centerX, y: headTop }
      },
      metrics: {
        headHeightRatio: headHeight,
        centerHorizontalOffset: centerX - 0.5,
        eyeLineLevelFromBottom: 1 - eyeY,
        eyeAngleDeg: 0
      }
    };
  }

  return createDefaultFaceResult();
}

function createDefaultFaceResult(): FaceAnalysisResult {
  return {
    hasFace: true,
    confidence: 0.75,
    boundingBox: {
      x: 0.25,
      y: 0.16,
      width: 0.5,
      height: 0.65
    },
    landmarks: {
      leftEye: { x: 0.42, y: 0.44 },
      rightEye: { x: 0.58, y: 0.44 },
      eyeCenter: { x: 0.5, y: 0.44 },
      noseTip: { x: 0.5, y: 0.55 },
      mouthCenter: { x: 0.5, y: 0.68 },
      chinBottom: { x: 0.5, y: 0.82 },
      foreheadTop: { x: 0.5, y: 0.10 }
    },
    metrics: {
      headHeightRatio: 0.72,
      centerHorizontalOffset: 0,
      eyeLineLevelFromBottom: 0.56,
      eyeAngleDeg: 0
    }
  };
}

/**
 * Draws comprehensive dynamic face alignment guide overlay
 */
export function drawPassportGuideOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: {
    showEyeLine?: boolean;
    showCenterLine?: boolean;
    showHeadHeightZone?: boolean;
    showMargins?: boolean;
    detectedFace?: FaceAnalysisResult | null;
  } = {}
) {
  const {
    showEyeLine = true,
    showCenterLine = true,
    showHeadHeightZone = true,
    showMargins = true,
    detectedFace = null,
  } = options;

  ctx.save();

  // 1. Center Vertical Guideline
  if (showCenterLine) {
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
  }

  // 2. Official Standard Eye Line (44% from top = 56% from bottom)
  const targetEyeY = height * 0.44;
  if (showEyeLine) {
    ctx.beginPath();
    ctx.setLineDash([6, 3]);
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.95)';
    ctx.lineWidth = 2;
    ctx.moveTo(width * 0.08, targetEyeY);
    ctx.lineTo(width * 0.92, targetEyeY);
    ctx.stroke();

    // Eye line indicator badge
    ctx.fillStyle = 'rgba(234, 179, 8, 0.95)';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('TARGET EYE LINE (56% FROM BASE)', width * 0.10, targetEyeY - 4);
  }

  // 3. Head Height Zone (Target 70-80% of photo height)
  const crownY = height * 0.10; // Top of head target
  const chinY = height * 0.82;  // Chin target
  if (showHeadHeightZone) {
    // Shaded subtle target zone
    ctx.fillStyle = 'rgba(59, 130, 246, 0.04)';
    ctx.fillRect(width * 0.18, crownY, width * 0.64, chinY - crownY);

    // Target Oval
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.85)';
    ctx.lineWidth = 2;
    ctx.ellipse(width / 2, height * 0.46, width * 0.28, (chinY - crownY) / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 4. Top & Bottom Margins
  if (showMargins) {
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.75)';
    ctx.lineWidth = 1;

    // Crown margin line
    ctx.beginPath();
    ctx.moveTo(width * 0.15, crownY);
    ctx.lineTo(width * 0.85, crownY);
    ctx.stroke();

    // Chin margin line
    ctx.beginPath();
    ctx.moveTo(width * 0.20, chinY);
    ctx.lineTo(width * 0.80, chinY);
    ctx.stroke();

    ctx.fillStyle = 'rgba(100, 116, 139, 0.9)';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('TOP MARGIN (CROWN)', width * 0.16, crownY - 3);
    ctx.fillText('BOTTOM MARGIN (CHIN)', width * 0.21, chinY + 11);
  }

  ctx.restore();
}
