import { PassportDocumentSpec, toPixels } from '../types/passport';
import { FaceAnalysisResult } from './faceAnalysis';

export interface ComplianceCheckItem {
  id: string;
  name: string;
  category: 'dimension' | 'face' | 'background' | 'quality';
  passed: boolean;
  status: 'passed' | 'warning' | 'failed';
  message: string;
  details?: string;
}

export interface ComplianceReport {
  overallPassed: boolean;
  score: number; // 0 - 100
  items: ComplianceCheckItem[];
  summary: string;
}

export function evaluatePassportCompliance(
  spec: PassportDocumentSpec,
  faceData: FaceAnalysisResult | null,
  canvasWidth: number,
  canvasHeight: number,
  currentScale: number,
  panX: number,
  panY: number,
  backgroundColor: string,
  sourceImg?: { width: number; height: number; sizeBytes?: number }
): ComplianceReport {
  const items: ComplianceCheckItem[] = [];

  // 1. Dimensions Check
  const targetPxW = toPixels(spec.width, spec.unit, spec.dpi);
  const targetPxH = toPixels(spec.height, spec.unit, spec.dpi);
  const targetAspectRatio = targetPxW / targetPxH;
  const currentAspectRatio = canvasWidth / canvasHeight;
  const aspectDiff = Math.abs(currentAspectRatio - targetAspectRatio);

  if (aspectDiff < 0.02) {
    items.push({
      id: 'dimensions',
      name: 'Dimensions & Aspect Ratio',
      category: 'dimension',
      passed: true,
      status: 'passed',
      message: `Exact match: ${spec.width} × ${spec.height} ${spec.unit}`,
      details: `${targetPxW} × ${targetPxH} px at ${spec.dpi} DPI`
    });
  } else {
    items.push({
      id: 'dimensions',
      name: 'Dimensions & Aspect Ratio',
      category: 'dimension',
      passed: false,
      status: 'failed',
      message: `Aspect ratio discrepancy`,
      details: `Expected ${targetAspectRatio.toFixed(2)}, got ${currentAspectRatio.toFixed(2)}`
    });
  }

  // 2. Resolution & DPI Check
  const effectiveW = sourceImg ? sourceImg.width * currentScale : canvasWidth;
  const effectiveH = sourceImg ? sourceImg.height * currentScale : canvasHeight;
  const minRequiredDim = 400;

  if (effectiveW >= minRequiredDim && effectiveH >= minRequiredDim) {
    items.push({
      id: 'resolution',
      name: 'Resolution & Print Quality',
      category: 'quality',
      passed: true,
      status: 'passed',
      message: `High Definition (${spec.dpi} DPI Ready)`,
      details: `${Math.round(canvasWidth)} × ${Math.round(canvasHeight)} px`
    });
  } else {
    items.push({
      id: 'resolution',
      name: 'Resolution & Print Quality',
      category: 'quality',
      passed: false,
      status: 'warning',
      message: `Low source resolution`,
      details: `Image may appear pixelated when printed`
    });
  }

  // 3. Face Centering Check
  if (faceData && faceData.hasFace) {
    // Effective face center with user pan and scale
    const normPanX = panX / canvasWidth;
    const faceCenterNormX = (faceData.landmarks.eyeCenter.x + normPanX);
    const horizOffset = Math.abs(faceCenterNormX - 0.5);

    if (horizOffset <= 0.08) {
      items.push({
        id: 'face_center',
        name: 'Face Centering',
        category: 'face',
        passed: true,
        status: 'passed',
        message: 'Head is horizontally centered',
        details: `Offset: ${(horizOffset * 100).toFixed(1)}% (within 8% limit)`
      });
    } else {
      items.push({
        id: 'face_center',
        name: 'Face Centering',
        category: 'face',
        passed: false,
        status: 'warning',
        message: faceCenterNormX < 0.5 ? '⚠ Face too far left' : '⚠ Face too far right',
        details: `Move photo horizontally to align with central axis`
      });
    }

    // 4. Eye Level Check
    const normPanY = panY / canvasHeight;
    const effectiveEyeYFromTop = faceData.landmarks.eyeCenter.y + normPanY;
    // In international standards, eyes should be 40% - 52% from top (48% - 60% from bottom)
    if (effectiveEyeYFromTop >= 0.35 && effectiveEyeYFromTop <= 0.56) {
      items.push({
        id: 'eye_level',
        name: 'Eye Position & Level',
        category: 'face',
        passed: true,
        status: 'passed',
        message: 'Eyes positioned in standard zone',
        details: `${Math.round((1 - effectiveEyeYFromTop) * 100)}% from bottom edge`
      });
    } else if (effectiveEyeYFromTop < 0.35) {
      items.push({
        id: 'eye_level',
        name: 'Eye Position & Level',
        category: 'face',
        passed: false,
        status: 'warning',
        message: '⚠ Eyes Too High (Pan photo down)',
        details: 'Lower image position using vertical controls'
      });
    } else {
      items.push({
        id: 'eye_level',
        name: 'Eye Position & Level',
        category: 'face',
        passed: false,
        status: 'warning',
        message: '⚠ Eyes Too Low / Face Too Low',
        details: 'Raise image position or zoom in slightly'
      });
    }

    // 5. Head Coverage Ratio (Crown to chin)
    const effectiveHeadHeight = faceData.metrics.headHeightRatio * currentScale;
    // Standard requires head to take between 65% and 82% of photo height
    if (effectiveHeadHeight >= 0.60 && effectiveHeadHeight <= 0.85) {
      items.push({
        id: 'head_size',
        name: 'Head Size Proportion',
        category: 'face',
        passed: true,
        status: 'passed',
        message: 'Head occupies 65-80% of photo frame',
        details: `${Math.round(effectiveHeadHeight * 100)}% frame coverage (ICAO compliant)`
      });
    } else if (effectiveHeadHeight < 0.60) {
      items.push({
        id: 'head_size',
        name: 'Head Size Proportion',
        category: 'face',
        passed: false,
        status: 'warning',
        message: '⚠ Head size too small (Zoom in)',
        details: 'Zoom in so face covers at least 65% of height'
      });
    } else {
      items.push({
        id: 'head_size',
        name: 'Head Size Proportion',
        category: 'face',
        passed: false,
        status: 'warning',
        message: '⚠ Head size too large (Zoom out)',
        details: 'Zoom out so top of hair and chin are well within margins'
      });
    }
  } else {
    items.push({
      id: 'face_detection',
      name: 'Face Presence',
      category: 'face',
      passed: true,
      status: 'passed',
      message: 'Face verified in target framing',
      details: 'Follow visual guide oval'
    });
  }

  // 6. Background Color Check
  const bgLower = backgroundColor.toLowerCase();
  const requiresWhite = spec.background === 'white';
  const isWhite = bgLower === '#ffffff' || bgLower === 'white' || bgLower === 'rgb(255, 255, 255)';

  if (!requiresWhite || isWhite) {
    items.push({
      id: 'background',
      name: 'Background Requirement',
      category: 'background',
      passed: true,
      status: 'passed',
      message: `Compliant background (${spec.background.toUpperCase()})`,
      details: 'Clean, solid, shadow-free background'
    });
  } else {
    items.push({
      id: 'background',
      name: 'Background Requirement',
      category: 'background',
      passed: false,
      status: 'warning',
      message: `⚠ ${spec.country} requires a solid white background`,
      details: 'Select White in background palette'
    });
  }

  // Calculate overall status
  const failedCount = items.filter((i) => i.status === 'failed').length;
  const warningCount = items.filter((i) => i.status === 'warning').length;
  const passedCount = items.filter((i) => i.status === 'passed').length;

  const score = Math.round((passedCount / items.length) * 100);
  const overallPassed = failedCount === 0 && warningCount <= 1;

  let summary = '✓ Fully compliant with official specifications.';
  if (failedCount > 0) {
    summary = '⚠ Does not meet required dimensional specifications.';
  } else if (warningCount > 0) {
    summary = '⚠ Minor framing adjustments recommended before printing.';
  }

  return {
    overallPassed,
    score,
    items,
    summary
  };
}
