import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Upload,
  Camera,
  Printer,
  Save,
  RotateCw,
  Wand2,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  Sparkles,
  Download,
  Eye,
  Eraser,
  PenTool,
  ZoomIn,
  ZoomOut,
  Maximize,
  Move,
  Layers,
  FileCheck,
  Check,
  ChevronRight,
  ShieldCheck,
  FileText,
  Undo,
  Redo,
  BookmarkCheck
} from 'lucide-react';
import {
  PassportDocumentSpec,
  PASSPORT_SPECS,
  TemplateCategory,
  toMillimeters,
  toPixels,
  formatDimensions,
  calculateTargetDimensions
} from '../../types/passport';
import {
  analyzeFaceLandmarks,
  FaceAnalysisResult,
  drawPassportGuideOverlay
} from '../../utils/faceAnalysis';
import {
  evaluatePassportCompliance,
  ComplianceReport
} from '../../utils/validationEngine';
import {
  PAPER_SIZES,
  PaperSizeKey,
  calculateSheetLayout,
  generatePrintSheetCanvas,
  createPdfFromSheetCanvas
} from '../../utils/printSheetGenerator';
import {
  saveToMyPhotos,
  getMyPhotos,
  SavedPhotoItem
} from '../../utils/myPhotosStorage';
import {
  downloadProcessedFile,
  removeBackgroundCanvas,
  loadImageFromFile
} from '../../utils/imageProcessing';

export type PassportWorkflowStep =
  | 'template'
  | 'photo-import'
  | 'camera-capture'
  | 'analysis'
  | 'editor'
  | 'preview'
  | 'print-sheet';

interface EditorStateSnapshot {
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
  straighten: number;
  backgroundColor: string;
  enhancements: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
}

const SESSION_STORAGE_KEY = 'image_edit_passport_session_v4';

interface PassportToolProps {
  initialFile?: File | null;
  initialTemplate?: PassportDocumentSpec | null;
  initialDraftState?: any;
  onBack: () => void;
  onOpenAnnotation?: (dataUrl: string) => void;
  onOpenSignPhoto?: (dataUrl: string) => void;
}

export const PassportTool: React.FC<PassportToolProps> = ({
  initialFile,
  initialTemplate,
  initialDraftState,
  onBack,
  onOpenAnnotation,
  onOpenSignPhoto
}) => {
  // Step state
  const [step, setStep] = useState<PassportWorkflowStep>(initialTemplate ? 'photo-import' : 'template');
  const [selectedTemplate, setSelectedTemplate] = useState<PassportDocumentSpec>(
    initialTemplate || PASSPORT_SPECS[0]
  );

  // Template browser state
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('Universal');
  const [searchQuery, setSearchQuery] = useState('');

  // Photo source state
  const [rawImage, setRawImage] = useState<HTMLImageElement | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(initialFile || null);
  const [cutoutCanvas, setCutoutCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [isFallbackCutout, setIsFallbackCutout] = useState(false);
  const [bgErrorMessage, setBgErrorMessage] = useState<string | null>(null);

  // Camera capture state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');

  // Face Analysis
  const [faceData, setFaceData] = useState<FaceAnalysisResult | null>(null);
  const [showFaceGuides, setShowFaceGuides] = useState(true);

  // Background selection (swaps instantly with zero reprocessing)
  const [backgroundColor, setBackgroundColor] = useState<string>('#FFFFFF');
  const [customBgColor, setCustomBgColor] = useState<string>('#3B82F6');

  // Manual Adjustments
  const [zoom, setZoom] = useState(1.0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [straighten, setStraighten] = useState(0);

  // Enhancements
  const [enhancements, setEnhancements] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
  });

  // Retouching brush (Erase / Hair Restore)
  const [activeRetouchMode, setActiveRetouchMode] = useState<'none' | 'erase' | 'restore'>('none');
  const [brushSize, setBrushSize] = useState(20);
  const [isBrushing, setIsBrushing] = useState(false);

  // Undo / Redo History Stack for adjustments
  const historyRef = useRef<EditorStateSnapshot[]>([]);
  const historyIndexRef = useRef<number>(-1);

  // Export settings (DPI, Format, Compression Quality)
  const [exportDpi, setExportDpi] = useState<number>(selectedTemplate.dpi || 300);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');
  const [exportQuality, setExportQuality] = useState<number>(95); // 1-100%

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Editor Canvas refs
  const editorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const guideOverlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live Compliance Report
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);

  // Print Sheet Generator state
  const [selectedPaperKey, setSelectedPaperKey] = useState<PaperSizeKey>('4R');
  const [paperOrientation, setPaperOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [customCopies, setCustomCopies] = useState<number>(6);
  const [sheetPreviewUrl, setSheetPreviewUrl] = useState<string | null>(null);
  const [printSheetCanvasState, setPrintSheetCanvasState] = useState<HTMLCanvasElement | null>(null);

  // Session recovery banner
  const [hasRecoverableSession, setHasRecoverableSession] = useState(false);

  // Initialize draft state if passed
  useEffect(() => {
    if (initialDraftState) {
      loadDraftSession(initialDraftState);
    }
  }, [initialDraftState]);

  // Check for auto-saved session recovery on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved && !initialDraftState) {
        const parsed = JSON.parse(saved);
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setHasRecoverableSession(true);
        }
      }
    } catch {}
  }, []);

  // Save current editor state to history stack for undo/redo
  const pushHistorySnapshot = (state: Partial<EditorStateSnapshot>) => {
    const current: EditorStateSnapshot = {
      zoom,
      panX,
      panY,
      rotation,
      straighten,
      backgroundColor,
      enhancements: { ...enhancements },
      ...state,
    };
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(current);
    historyIndexRef.current = historyRef.current.length - 1;
  };

  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const snap = historyRef.current[historyIndexRef.current];
    applySnapshot(snap);
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const snap = historyRef.current[historyIndexRef.current];
    applySnapshot(snap);
  };

  const applySnapshot = (snap: EditorStateSnapshot) => {
    setZoom(snap.zoom);
    setPanX(snap.panX);
    setPanY(snap.panY);
    setRotation(snap.rotation);
    setStraighten(snap.straighten);
    setBackgroundColor(snap.backgroundColor);
    setEnhancements(snap.enhancements);
  };

  // Auto-save session state to localStorage
  useEffect(() => {
    if (cutoutCanvas && rawImage && step !== 'template') {
      try {
        const recoveryData = {
          template: selectedTemplate,
          rawImageDataUrl: rawImage.src,
          cutoutDataUrl: cutoutCanvas.toDataURL('image/png'),
          backgroundColor,
          zoom,
          panX,
          panY,
          rotation,
          straighten,
          enhancements,
          step,
          timestamp: Date.now(),
        };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(recoveryData));
      } catch {}
    }
  }, [cutoutCanvas, rawImage, backgroundColor, zoom, panX, panY, rotation, straighten, enhancements, step]);

  const resumeSession = () => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!saved) return;
      loadDraftSession(JSON.parse(saved));
      setHasRecoverableSession(false);
    } catch {
      setHasRecoverableSession(false);
    }
  };

  const loadDraftSession = (parsed: any) => {
    setSelectedTemplate(parsed.template);
    setBackgroundColor(parsed.backgroundColor || '#FFFFFF');
    setZoom(parsed.zoom || 1);
    setPanX(parsed.panX || 0);
    setPanY(parsed.panY || 0);
    setRotation(parsed.rotation || 0);
    setStraighten(parsed.straighten || 0);
    if (parsed.enhancements) setEnhancements(parsed.enhancements);

    const rawImg = new Image();
    rawImg.crossOrigin = 'anonymous';
    rawImg.onload = () => {
      setRawImage(rawImg);
      const cutImg = new Image();
      cutImg.crossOrigin = 'anonymous';
      cutImg.onload = () => {
        const c = document.createElement('canvas');
        c.width = cutImg.width;
        c.height = cutImg.height;
        const ctx = c.getContext('2d');
        ctx?.drawImage(cutImg, 0, 0);
        setCutoutCanvas(c);
        setStep('editor');
      };
      cutImg.src = parsed.cutoutDataUrl;
    };
    rawImg.src = parsed.rawImageDataUrl;
  };

  const discardSession = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setHasRecoverableSession(false);
  };

  // 1. SAVE DRAFT (Distinct action: saves editable draft project into My Photos)
  const handleSaveDraft = () => {
    if (!editorCanvasRef.current || !rawImage || !cutoutCanvas) return;
    const thumbnailDataUrl = editorCanvasRef.current.toDataURL('image/jpeg', 0.85);

    const draftData = {
      template: selectedTemplate,
      rawImageDataUrl: rawImage.src,
      cutoutDataUrl: cutoutCanvas.toDataURL('image/png'),
      backgroundColor,
      zoom,
      panX,
      panY,
      rotation,
      straighten,
      enhancements,
    };

    saveToMyPhotos({
      title: `Draft - ${selectedTemplate.country} ${selectedTemplate.documentType}`,
      type: 'draft',
      dataUrl: thumbnailDataUrl,
      templateName: `${selectedTemplate.country} ${selectedTemplate.documentType}`,
      widthMm: toMillimeters(selectedTemplate.width, selectedTemplate.unit),
      heightMm: toMillimeters(selectedTemplate.height, selectedTemplate.unit),
      dpi: selectedTemplate.dpi,
      draftState: draftData,
    });

    setToastMessage('Editable Draft Saved to My Photos!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle Photo Selection
  const handleFileSelected = async (file: File) => {
    setRawFile(file);
    try {
      const img = await loadImageFromFile(file);
      setRawImage(img);
      setStep('analysis');
      await runAnalysisAndBgRemoval(file, img);
    } catch (err: any) {
      alert('Error loading image: ' + err.message);
    }
  };

  // Run Facial Landmark Analysis & Automated Background Removal
  const runAnalysisAndBgRemoval = async (file: File, img: HTMLImageElement) => {
    setIsProcessingBg(true);
    setBgErrorMessage(null);
    setIsFallbackCutout(false);

    // 1. Client-Side Facial Landmark Analysis
    const detectedFace = await analyzeFaceLandmarks(img);
    setFaceData(detectedFace);

    // 2. Automated Background Removal (via /api/remove-bg)
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const blob = await res.blob();
        const cutoutImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const url = URL.createObjectURL(blob);
          const i = new Image();
          i.onload = () => {
            URL.revokeObjectURL(url);
            resolve(i);
          };
          i.onerror = reject;
          i.src = url;
        });

        const canvas = document.createElement('canvas');
        canvas.width = cutoutImg.width;
        canvas.height = cutoutImg.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(cutoutImg, 0, 0);
        setCutoutCanvas(canvas);
      } else {
        throw new Error('Local cutout fallback required');
      }
    } catch (err: any) {
      console.warn('Using local client segmentation fallback:', err);
      setIsFallbackCutout(true);
      setBgErrorMessage('Automatic cutout applied.');
      // Resilient local canvas segmentation (keeps original image completely intact!)
      const fallbackCanvas = await removeBackgroundCanvas(img, detectedFace);
      setCutoutCanvas(fallbackCanvas);
    } finally {
      setIsProcessingBg(false);
      autoAlignFace(detectedFace, img);
      setStep('editor');
    }
  };

  // Re-process Cutout
  const handleRetryBgRemoval = async () => {
    if (!rawFile || !rawImage) return;
    await runAnalysisAndBgRemoval(rawFile, rawImage);
  };

  // Auto-Alignment Algorithm
  const autoAlignFace = (face: FaceAnalysisResult | null, img: HTMLImageElement) => {
    if (!face || !face.hasFace) {
      setZoom(1.0);
      setPanX(0);
      setPanY(0);
      setRotation(0);
      setStraighten(0);
      pushHistorySnapshot({ zoom: 1, panX: 0, panY: 0, rotation: 0, straighten: 0 });
      return;
    }

    // Target: Head height should be ~72% of photo height
    const currentHeadRatio = face.metrics.headHeightRatio;
    const targetScale = Math.max(0.6, Math.min(2.5, 0.72 / Math.max(0.1, currentHeadRatio)));
    setZoom(targetScale);

    // Center face horizontally
    const faceCenterX = face.landmarks.eyeCenter.x;
    const targetPanX = Math.round((0.5 - faceCenterX) * img.width * targetScale);
    setPanX(targetPanX);

    // Align eye line to ~44% from top (56% from base)
    const eyeY = face.landmarks.eyeCenter.y;
    const targetPanY = Math.round((0.44 - eyeY) * img.height * targetScale);
    setPanY(targetPanY);

    setRotation(0);
    setStraighten(0);

    pushHistorySnapshot({
      zoom: targetScale,
      panX: targetPanX,
      panY: targetPanY,
      rotation: 0,
      straighten: 0,
    });
  };

  // Camera Mode Controls
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStep('camera-capture');
    } catch (err) {
      alert('Camera access unavailable. Please use file gallery upload.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
  };

  const captureCameraSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (cameraFacing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const capturedFile = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        stopCamera();
        handleFileSelected(capturedFile);
      }
    }, 'image/jpeg', 0.95);
  };

  // Redraw Editor Canvas with exact math & instant background layer swap
  useEffect(() => {
    if (step !== 'editor' && step !== 'preview') return;
    if (!editorCanvasRef.current || !cutoutCanvas || !rawImage) return;

    const canvas = editorCanvasRef.current;
    const targetW = toPixels(selectedTemplate.width, selectedTemplate.unit, exportDpi);
    const targetH = toPixels(selectedTemplate.height, selectedTemplate.unit, exportDpi);

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw Background Layer (INSTANT COLOR SWAP - ZERO REPROCESSING)
    if (backgroundColor === 'transparent') {
      ctx.clearRect(0, 0, targetW, targetH);
    } else {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, targetW, targetH);
    }

    // 2. Render Scaled & Positioned Cutout Layer
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, targetW, targetH);
    ctx.clip();

    ctx.translate(targetW / 2 + panX, targetH / 2 + panY);

    const totalAngleRad = ((rotation + straighten) * Math.PI) / 180;
    ctx.rotate(totalAngleRad);
    ctx.scale(zoom, zoom);

    // Apply Enhancements
    const bVal = 1 + enhancements.brightness / 100;
    const cVal = 1 + enhancements.contrast / 100;
    const sVal = 1 + enhancements.saturation / 100;
    ctx.filter = `brightness(${bVal}) contrast(${cVal}) saturate(${sVal})`;

    const baseW = targetW;
    const baseH = (baseW / cutoutCanvas.width) * cutoutCanvas.height;
    ctx.drawImage(cutoutCanvas, -baseW / 2, -baseH / 2, baseW, baseH);
    ctx.filter = 'none';

    ctx.restore();

    // 3. Render Dynamic Face Guidelines
    if (guideOverlayCanvasRef.current && showFaceGuides) {
      const gCanvas = guideOverlayCanvasRef.current;
      gCanvas.width = targetW;
      gCanvas.height = targetH;
      const gCtx = gCanvas.getContext('2d');
      if (gCtx) {
        gCtx.clearRect(0, 0, targetW, targetH);
        drawPassportGuideOverlay(gCtx, targetW, targetH, {
          showEyeLine: true,
          showCenterLine: true,
          showHeadHeightZone: true,
          showMargins: true,
          detectedFace: faceData,
        });
      }
    } else if (guideOverlayCanvasRef.current) {
      const gCtx = guideOverlayCanvasRef.current.getContext('2d');
      gCtx?.clearRect(0, 0, targetW, targetH);
    }

    // 4. Live Compliance Evaluation
    const report = evaluatePassportCompliance(
      selectedTemplate,
      faceData,
      targetW,
      targetH,
      zoom,
      panX,
      panY,
      backgroundColor,
      { width: rawImage.width, height: rawImage.height }
    );
    setComplianceReport(report);
  }, [
    step,
    selectedTemplate,
    exportDpi,
    cutoutCanvas,
    rawImage,
    backgroundColor,
    zoom,
    panX,
    panY,
    rotation,
    straighten,
    enhancements,
    showFaceGuides,
  ]);

  // Retouching Brush Handler on Cutout Canvas
  const handleRetouchMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeRetouchMode === 'none') return;
    setIsBrushing(true);
    applyRetouchBrush(e);
  };

  const handleRetouchMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isBrushing || activeRetouchMode === 'none') return;
    applyRetouchBrush(e);
  };

  const handleRetouchMouseUp = () => {
    setIsBrushing(false);
  };

  const applyRetouchBrush = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cutoutCanvas || !rawImage || !editorCanvasRef.current) return;
    const rect = editorCanvasRef.current.getBoundingClientRect();
    const scaleX = editorCanvasRef.current.width / rect.width;
    const scaleY = editorCanvasRef.current.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const targetW = editorCanvasRef.current.width;
    const targetH = editorCanvasRef.current.height;
    const baseW = targetW;
    const baseH = (baseW / cutoutCanvas.width) * cutoutCanvas.height;

    const relX = (mouseX - (targetW / 2 + panX)) / zoom + baseW / 2;
    const relY = (mouseY - (targetH / 2 + panY)) / zoom + baseH / 2;

    const canvasX = (relX / baseW) * cutoutCanvas.width;
    const canvasY = (relY / baseH) * cutoutCanvas.height;

    const ctx = cutoutCanvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    if (activeRetouchMode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, brushSize, 0, Math.PI * 2);
      ctx.fill();
    } else if (activeRetouchMode === 'restore') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.save();
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, brushSize, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(rawImage, 0, 0, cutoutCanvas.width, cutoutCanvas.height);
      ctx.restore();
    }
    ctx.restore();

    const newCanvas = document.createElement('canvas');
    newCanvas.width = cutoutCanvas.width;
    newCanvas.height = cutoutCanvas.height;
    newCanvas.getContext('2d')?.drawImage(cutoutCanvas, 0, 0);
    setCutoutCanvas(newCanvas);
  };

  // Generate Print Sheet
  const handleProceedToPrintSheet = async () => {
    if (!editorCanvasRef.current) return;
    setStep('print-sheet');

    const paperSpec = PAPER_SIZES[selectedPaperKey];
    const layout = calculateSheetLayout(paperSpec, selectedTemplate, paperOrientation, customCopies);

    const sheet = await generatePrintSheetCanvas(editorCanvasRef.current, layout);
    setPrintSheetCanvasState(sheet);
    setSheetPreviewUrl(sheet.toDataURL('image/jpeg', 0.95));
  };

  // Update Print Sheet Layout
  const refreshPrintSheet = async (paperKey: PaperSizeKey, orient: 'portrait' | 'landscape', count: number) => {
    if (!editorCanvasRef.current) return;
    setSelectedPaperKey(paperKey);
    setPaperOrientation(orient);
    setCustomCopies(count);

    const paperSpec = PAPER_SIZES[paperKey];
    const layout = calculateSheetLayout(paperSpec, selectedTemplate, orient, count);
    const sheet = await generatePrintSheetCanvas(editorCanvasRef.current, layout);
    setPrintSheetCanvasState(sheet);
    setSheetPreviewUrl(sheet.toDataURL('image/jpeg', 0.95));
  };

  // 2. EXPORT FINAL DIGITAL PASSPORT PHOTO
  const handleExportDigitalPhoto = (format: 'png' | 'jpeg') => {
    if (!editorCanvasRef.current) return;
    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    const qualityNorm = exportQuality / 100;
    const dataUrl = editorCanvasRef.current.toDataURL(mime, qualityNorm);

    const targetDims = calculateTargetDimensions(selectedTemplate, exportDpi);
    const filename = `${selectedTemplate.country.toLowerCase().replace(/\s+/g, '-')}-passport-${selectedTemplate.width}x${selectedTemplate.height}${selectedTemplate.unit}-${exportDpi}dpi.${ext}`;

    // Store in My Photos with complete metadata
    saveToMyPhotos({
      title: `${selectedTemplate.country} ${selectedTemplate.documentType}`,
      type: 'passport',
      dataUrl,
      templateName: `${selectedTemplate.country} ${selectedTemplate.documentType}`,
      widthMm: toMillimeters(selectedTemplate.width, selectedTemplate.unit),
      heightMm: toMillimeters(selectedTemplate.height, selectedTemplate.unit),
      widthPx: targetDims.widthPx,
      heightPx: targetDims.heightPx,
      dpi: exportDpi,
      compliancePassed: complianceReport?.overallPassed ?? true,
    });

    downloadProcessedFile(dataUrl, filename);
    setToastMessage('Final Passport Photo Exported!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Export Print Sheet Document (PDF or JPG)
  const handleExportPrintSheet = async (format: 'pdf' | 'jpeg') => {
    if (!printSheetCanvasState) return;
    const paperSpec = PAPER_SIZES[selectedPaperKey];

    if (format === 'pdf') {
      const pdfBytes = await createPdfFromSheetCanvas(
        printSheetCanvasState,
        paperSpec.widthMm,
        paperSpec.heightMm
      );
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      downloadProcessedFile(url, `passport-print-sheet-${selectedPaperKey}.pdf`);
    } else {
      const qualityNorm = exportQuality / 100;
      const dataUrl = printSheetCanvasState.toDataURL('image/jpeg', qualityNorm);

      saveToMyPhotos({
        title: `Print Sheet (${selectedPaperKey.toUpperCase()}) - ${selectedTemplate.country}`,
        type: 'sheet',
        dataUrl,
        templateName: selectedTemplate.country,
        widthMm: paperSpec.widthMm,
        heightMm: paperSpec.heightMm,
        dpi: 300,
      });

      downloadProcessedFile(dataUrl, `passport-print-sheet-${selectedPaperKey}.jpg`);
    }

    setToastMessage('Print Sheet Exported!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePrintSheet = () => {
    if (!sheetPreviewUrl) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${selectedTemplate.country} Passport Photo Print Sheet</title>
            <style>
              @page { size: auto; margin: 0; }
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
              img { max-width: 100%; height: auto; display: block; }
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                img { width: 100%; height: auto; }
              }
            </style>
          </head>
          <body>
            <img src="${sheetPreviewUrl}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const filteredTemplates = PASSPORT_SPECS.filter((spec) => {
    const matchesCat = selectedCategory === 'Universal' ? true : spec.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      spec.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spec.documentType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-bold text-xs py-2.5 px-4 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Session Recovery Banner */}
      {hasRecoverableSession && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              ↻
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Resume Previous Editing Session?</span>
              <span className="text-[11px] text-slate-500 block">
                You have unsaved passport photo adjustments ready to be restored.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={discardSession}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
            >
              Start Fresh
            </button>
            <button
              onClick={resumeSession}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              Resume
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 1: TEMPLATE DATABASE SELECTOR --- */}
      {step === 'template' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Step 1 of 5 · Select Standard
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">Choose Document Standard</h1>
            <p className="text-xs text-slate-500 mt-1">
              Select country passport, visa, or identity card standard with official ICAO size requirements.
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by country (e.g. USA, UK, Canada, China, India, Schengen)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(['Universal', 'Passport', 'Visa', 'ID Card', 'Social'] as TemplateCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
            {filteredTemplates.map((spec) => (
              <button
                key={spec.id}
                onClick={() => {
                  setSelectedTemplate(spec);
                  setExportDpi(spec.dpi || 300);
                  setStep('photo-import');
                }}
                className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-1 bg-slate-50 rounded-lg">{spec.flag || '📄'}</span>
                  <div>
                    <span className="font-bold text-sm text-slate-900 block group-hover:text-blue-600 transition-colors">
                      {spec.country} {spec.documentType}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {formatDimensions(spec)} · {spec.dpi} DPI
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- STEP 2: PHOTO IMPORT --- */}
      {step === 'photo-import' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('template')}
              className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-4 h-4" /> Change Template
            </button>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Step 2 of 5 · Import Photo
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedTemplate.flag || '📄'}</span>
              <div>
                <span className="font-bold text-sm text-slate-900 block">
                  {selectedTemplate.country} {selectedTemplate.documentType}
                </span>
                <span className="text-xs text-slate-500">
                  Target: {formatDimensions(selectedTemplate)} · Mandatory Solid White Background
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              ICAO Spec
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">How would you like to provide your photo?</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select an existing portrait from your device gallery, take a new photo with camera guides, or pick from My Photos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="p-8 bg-white border-2 border-dashed border-blue-200 hover:border-blue-500 rounded-3xl cursor-pointer text-center space-y-3 transition-all hover:shadow-md block group">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <span className="font-bold text-base text-slate-900 block">Photo Gallery</span>
                <span className="text-xs text-slate-500 block mt-1">
                  Upload portrait (JPG, PNG, WEBP, HEIC)
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
              />
            </label>

            <button
              onClick={startCamera}
              className="p-8 bg-white border-2 border-dashed border-emerald-200 hover:border-emerald-500 rounded-3xl text-center space-y-3 transition-all hover:shadow-md block group"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Camera className="w-7 h-7" />
              </div>
              <div>
                <span className="font-bold text-base text-slate-900 block">Live Camera</span>
                <span className="text-xs text-slate-500 block mt-1">
                  Capture with on-screen head & eye alignment guides
                </span>
              </div>
            </button>
          </div>

          {getMyPhotos().length > 0 && (
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Or Select from My Photos:</span>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {getMyPhotos().slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    onClick={async () => {
                      const res = await fetch(item.dataUrl);
                      const blob = await res.blob();
                      const file = new File([blob], 'saved-photo.png', { type: 'image/png' });
                      handleFileSelected(file);
                    }}
                    className="min-w-[76px] h-20 rounded-xl border border-slate-200 overflow-hidden hover:ring-2 hover:ring-blue-500 flex-shrink-0 relative group"
                  >
                    <img src={item.dataUrl} alt={item.title} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-white text-[9px] truncate px-1 py-0.5">
                      {item.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- CAMERA LIVE CAPTURE MODE WITH GUIDES --- */}
      {step === 'camera-capture' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                stopCamera();
                setStep('photo-import');
              }}
              className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-4 h-4" /> Cancel Camera
            </button>
            <button
              onClick={() => {
                stopCamera();
                setCameraFacing((f) => (f === 'user' ? 'environment' : 'user'));
                setTimeout(startCamera, 200);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" /> Flip Camera
            </button>
          </div>

          <div className="relative bg-black rounded-3xl overflow-hidden aspect-[3/4] max-w-sm mx-auto shadow-2xl flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
            />

            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
              <div className="text-center">
                <span className="bg-slate-900/70 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-md">
                  Align face inside the oval guide
                </span>
              </div>

              <div className="relative flex-1 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 300 400">
                  <line x1="150" y1="20" x2="150" y2="380" stroke="rgba(59, 130, 246, 0.8)" strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="40" y1="175" x2="260" y2="175" stroke="rgba(234, 179, 8, 0.85)" strokeWidth="2" strokeDasharray="6 3" />
                  <text x="45" y="168" fill="rgba(234, 179, 8, 0.95)" fontSize="10" fontWeight="bold">EYE LEVEL</text>
                  <ellipse cx="150" cy="185" rx="85" ry="120" fill="none" stroke="rgba(59, 130, 246, 0.9)" strokeWidth="2.5" />
                  <line x1="70" y1="65" x2="230" y2="65" stroke="rgba(148, 163, 184, 0.7)" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="75" y="58" fill="rgba(148, 163, 184, 0.9)" fontSize="9">TOP OF HEAD</text>
                  <line x1="85" y1="305" x2="215" y2="305" stroke="rgba(148, 163, 184, 0.7)" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="90" y="318" fill="rgba(148, 163, 184, 0.9)" fontSize="9">CHIN LEVEL</text>
                </svg>
              </div>

              <div className="flex justify-center pb-2 pointer-events-auto">
                <button
                  onClick={captureCameraSnapshot}
                  className="w-16 h-16 rounded-full bg-white border-4 border-blue-600 shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- STEP 3: ANALYSIS & BACKGROUND REMOVAL LOADING --- */}
      {step === 'analysis' && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Preparing Your Portrait...</h2>
            <p className="text-xs text-slate-500 mt-1">
              Creating clean cutout and calculating facial alignment framing.
            </p>
          </div>
          <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-blue-600 animate-indeterminate" />
          </div>
        </div>
      )}

      {/* --- STEP 4: WORKSPACE & RETOUCHING SUITE --- */}
      {step === 'editor' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('photo-import')}
              className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-4 h-4" /> Change Photo
            </button>
            <div className="flex items-center gap-2">
              {/* SAVE DRAFT BUTTON (Separated from Export) */}
              <button
                onClick={handleSaveDraft}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <BookmarkCheck className="w-4 h-4 text-blue-600" /> Save Draft
              </button>
              <button
                onClick={() => setStep('preview')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
              >
                Proceed to Export <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Fallback Notice with Retry Option */}
          {isFallbackCutout && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs text-blue-900 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Automatic cutout applied. Fine-tune with the brush tools if needed.</span>
              </div>
              <button
                onClick={handleRetryBgRemoval}
                disabled={isProcessingBg}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-sm shrink-0 active:scale-95 transition-transform"
              >
                <RefreshCw className={`w-3 h-3 ${isProcessingBg ? 'animate-spin' : ''}`} /> Re-process
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Canvas Work Area (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-100 rounded-3xl p-3 sm:p-6 border border-slate-200 flex flex-col items-center justify-center relative shadow-inner min-h-[380px] sm:min-h-[440px]">
                {/* Fixed Aspect Crop Frame Container - Mobile Responsive */}
                <div
                  className="relative rounded-xl overflow-hidden shadow-2xl border-2 border-blue-500/60 bg-white max-w-[280px] sm:max-w-[320px] w-full"
                  style={{
                    aspectRatio: `${selectedTemplate.width} / ${selectedTemplate.height}`,
                    maxHeight: '440px',
                  }}
                >
                  <canvas
                    ref={editorCanvasRef}
                    onMouseDown={handleRetouchMouseDown}
                    onMouseMove={handleRetouchMouseMove}
                    onMouseUp={handleRetouchMouseUp}
                    className="w-full h-full object-contain cursor-move"
                  />

                  <canvas
                    ref={guideOverlayCanvasRef}
                    className="absolute inset-0 pointer-events-none w-full h-full"
                  />
                </div>

                {/* Canvas Floating Quick Controls (Guides Toggle & Auto Align) */}
                <div className="flex items-center gap-2 mt-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-xs">
                  <button
                    onClick={() => setShowFaceGuides((g) => !g)}
                    className={`px-2.5 py-1 rounded-full font-semibold transition-colors flex items-center gap-1 ${
                      showFaceGuides ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> Guides {showFaceGuides ? 'ON' : 'OFF'}
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => autoAlignFace(faceData, rawImage!)}
                    className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 rounded-full font-bold flex items-center gap-1"
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Auto Align
                  </button>
                </div>
              </div>

              {/* Live Compliance Scorecard Box */}
              {complianceReport && (
                <div
                  className={`p-4 rounded-2xl border ${
                    complianceReport.overallPassed
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  } flex items-center justify-between shadow-sm`}
                >
                  <div className="flex items-center gap-3">
                    {complianceReport.overallPassed ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <span className="text-xs font-bold block">{complianceReport.summary}</span>
                      <span className="text-[11px] opacity-80 block">
                        Compliance: {complianceReport.score}% · {selectedTemplate.country} Standards
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep('preview')}
                    className="text-xs font-bold underline hover:opacity-80"
                  >
                    View Details
                  </button>
                </div>
              )}
            </div>

            {/* Right Editing Control Suite (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Undo / Redo Toolbar */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Action History</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUndo}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Undo className="w-3.5 h-3.5" /> Undo
                  </button>
                  <button
                    onClick={handleRedo}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Redo className="w-3.5 h-3.5" /> Redo
                  </button>
                </div>
              </div>

              {/* 1. Background Color Panel (INSTANT COLOR SWAP) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Background Layer (Instant Swap · No Reprocessing)
                </span>
                <div className="flex items-center gap-2">
                  {[
                    { label: 'White', color: '#FFFFFF', border: 'border-slate-300' },
                    { label: 'Light Blue', color: '#BFDBFE', border: 'border-blue-300' },
                    { label: 'Royal Blue', color: '#2563EB', border: 'border-blue-600' },
                    { label: 'Light Gray', color: '#F1F5F9', border: 'border-slate-300' },
                    { label: 'Transparent', color: 'transparent', border: 'border-dashed border-slate-400' },
                  ].map((bg) => (
                    <button
                      key={bg.label}
                      onClick={() => {
                        setBackgroundColor(bg.color);
                        pushHistorySnapshot({ backgroundColor: bg.color });
                      }}
                      style={{ backgroundColor: bg.color === 'transparent' ? '#FFFFFF' : bg.color }}
                      className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all ${bg.border} ${
                        backgroundColor === bg.color ? 'scale-110 ring-2 ring-blue-500 ring-offset-2' : 'hover:scale-105'
                      }`}
                      title={bg.label}
                    >
                      {backgroundColor === bg.color && (
                        <Check className={`w-4 h-4 ${bg.color === '#FFFFFF' ? 'text-blue-600' : 'text-white'}`} />
                      )}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={customBgColor}
                    onChange={(e) => {
                      setCustomBgColor(e.target.value);
                      setBackgroundColor(e.target.value);
                      pushHistorySnapshot({ backgroundColor: e.target.value });
                    }}
                    className="w-9 h-9 rounded-xl cursor-pointer p-0.5 border border-slate-200"
                    title="Custom Color"
                  />
                </div>
              </div>

              {/* 2. Manual Alignment & Zoom Controls */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Zoom & Scale</span>
                  <span className="text-xs font-mono text-blue-600 font-bold">{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <ZoomOut className="w-4 h-4 text-slate-400" />
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.02"
                    value={zoom}
                    onChange={(e) => {
                      setZoom(Number(e.target.value));
                      pushHistorySnapshot({ zoom: Number(e.target.value) });
                    }}
                    className="flex-1 accent-blue-600 cursor-pointer"
                  />
                  <ZoomIn className="w-4 h-4 text-slate-400" />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-medium">Pan X (Horizontal)</span>
                    <input
                      type="range"
                      min="-140"
                      max="140"
                      value={panX}
                      onChange={(e) => {
                        setPanX(Number(e.target.value));
                        pushHistorySnapshot({ panX: Number(e.target.value) });
                      }}
                      className="w-full accent-blue-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-medium">Pan Y (Vertical)</span>
                    <input
                      type="range"
                      min="-140"
                      max="140"
                      value={panY}
                      onChange={(e) => {
                        setPanY(Number(e.target.value));
                        pushHistorySnapshot({ panY: Number(e.target.value) });
                      }}
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Straighten / Tilt</span>
                      <span>{straighten}°</span>
                    </div>
                    <input
                      type="range"
                      min="-15"
                      max="15"
                      value={straighten}
                      onChange={(e) => {
                        setStraighten(Number(e.target.value));
                        pushHistorySnapshot({ straighten: Number(e.target.value) });
                      }}
                      className="w-full accent-blue-600"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const nextRot = (rotation + 90) % 360;
                      setRotation(nextRot);
                      pushHistorySnapshot({ rotation: nextRot });
                    }}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1"
                    title="Rotate 90 degrees"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> 90°
                  </button>
                </div>
              </div>

              {/* 3. Photo Enhancements (Sliders) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Lighting & Tone Enhancement</span>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Brightness</span>
                      <span>{enhancements.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="-40"
                      max="40"
                      value={enhancements.brightness}
                      onChange={(e) => {
                        const newEnh = { ...enhancements, brightness: Number(e.target.value) };
                        setEnhancements(newEnh);
                        pushHistorySnapshot({ enhancements: newEnh });
                      }}
                      className="w-full accent-blue-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Contrast</span>
                      <span>{enhancements.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="-40"
                      max="40"
                      value={enhancements.contrast}
                      onChange={(e) => {
                        const newEnh = { ...enhancements, contrast: Number(e.target.value) };
                        setEnhancements(newEnh);
                        pushHistorySnapshot({ enhancements: newEnh });
                      }}
                      className="w-full accent-blue-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Saturation</span>
                      <span>{enhancements.saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="-40"
                      max="40"
                      value={enhancements.saturation}
                      onChange={(e) => {
                        const newEnh = { ...enhancements, saturation: Number(e.target.value) };
                        setEnhancements(newEnh);
                        pushHistorySnapshot({ enhancements: newEnh });
                      }}
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Retouch Tools (Erase / Hair Restore) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Edge & Hair Recovery Brush</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveRetouchMode(activeRetouchMode === 'erase' ? 'none' : 'erase')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      activeRetouchMode === 'erase'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Eraser className="w-3.5 h-3.5" /> Erase Stray Edges
                  </button>
                  <button
                    onClick={() => setActiveRetouchMode(activeRetouchMode === 'restore' ? 'none' : 'restore')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      activeRetouchMode === 'restore'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Restore Hair / Collar
                  </button>
                </div>
                {activeRetouchMode !== 'none' && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Brush Radius</span>
                      <span>{brushSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- STEP 5: PREVIEW & COMPLIANCE SCORECARD SCREEN --- */}
      {step === 'preview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('editor')}
              className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Editor
            </button>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Step 4 of 5 · Quality Control & Export
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Final Photo Preview & Export Settings (5 cols) */}
            <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-between space-y-4">
              <div className="text-center">
                <span className="font-bold text-base text-slate-900 block">
                  {selectedTemplate.country} {selectedTemplate.documentType}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {formatDimensions(selectedTemplate)} · {exportDpi} DPI Target
                </span>
              </div>

              {/* Rendered Photo Canvas */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
                <canvas
                  ref={editorCanvasRef}
                  className="rounded-lg shadow-md max-h-[280px] w-auto mx-auto object-contain"
                />
              </div>

              {/* Export DPI & Quality Controls */}
              <div className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Output Resolution (DPI):</span>
                  <div className="flex gap-1">
                    {[300, 600, 150].map((d) => (
                      <button
                        key={d}
                        onClick={() => setExportDpi(d)}
                        className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-colors ${
                          exportDpi === d
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        {d} DPI
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between font-medium text-slate-600 text-[11px]">
                    <span>Compression Quality</span>
                    <span className="font-mono text-blue-600">{exportQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="100"
                    value={exportQuality}
                    onChange={(e) => setExportQuality(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>

              {/* Digital Export Buttons */}
              <div className="w-full space-y-2">
                <button
                  onClick={() => handleExportDigitalPhoto('png')}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all"
                >
                  <Download className="w-4 h-4" /> Download Lossless PNG ({exportDpi} DPI)
                </button>
                <button
                  onClick={() => handleExportDigitalPhoto('jpeg')}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" /> Download Standard JPG ({exportQuality}% Quality)
                </button>
              </div>

              {/* Seamless Action Connection */}
              <div className="w-full pt-2 border-t border-slate-100 flex items-center justify-around text-xs">
                {onOpenSignPhoto && (
                  <button
                    onClick={() => {
                      if (editorCanvasRef.current) {
                        onOpenSignPhoto(editorCanvasRef.current.toDataURL());
                      }
                    }}
                    className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <PenTool className="w-3.5 h-3.5" /> Sign This Photo
                  </button>
                )}
                {onOpenAnnotation && (
                  <button
                    onClick={() => {
                      if (editorCanvasRef.current) {
                        onOpenAnnotation(editorCanvasRef.current.toDataURL());
                      }
                    }}
                    className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <FileText className="w-3.5 h-3.5" /> Add Annotation
                  </button>
                )}
              </div>
            </div>

            {/* Compliance Report & Print Sheet CTA (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              {/* Compliance Report Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Official Standards Verification</h3>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      complianceReport?.overallPassed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {complianceReport?.overallPassed ? '✓ PASSED' : '⚠ WARNINGS'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {complianceReport?.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        {item.status === 'passed' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="font-bold text-slate-800 block">{item.name}</span>
                          <span className="text-slate-500 block">{item.message}</span>
                        </div>
                      </div>
                      {item.details && (
                        <span className="text-[10px] text-slate-400 font-mono text-right">{item.details}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ready to Print Banner */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/20 space-y-3">
                <span className="font-bold text-lg block">Need a Multiple-Photo Print Sheet?</span>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Automatically duplicate this passport photo onto 3R, 4R, 5R, 6R, A4, or US Letter photo paper with precision cut guidelines and corner crop marks.
                </p>
                <button
                  onClick={handleProceedToPrintSheet}
                  className="px-5 py-3 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4" /> Create Printable Photo Sheet <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- STEP 6: PRINT SHEET GENERATOR & EXPORT --- */}
      {step === 'print-sheet' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('preview')}
              className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Preview
            </button>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Step 5 of 5 · Print Sheet
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Sheet Preview Display (7 cols) */}
            <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-between space-y-4">
              <div className="text-center">
                <span className="font-bold text-base text-slate-900 block">Print Sheet Preview</span>
                <span className="text-xs text-slate-500 font-mono">
                  {PAPER_SIZES[selectedPaperKey].label} · {customCopies} Copies · High 300 DPI
                </span>
              </div>

              <div className="p-4 bg-slate-100 rounded-2xl border border-slate-300 shadow-inner max-h-[460px] overflow-auto flex items-center justify-center">
                {sheetPreviewUrl ? (
                  <img
                    src={sheetPreviewUrl}
                    alt="Print Sheet Preview"
                    className="max-h-[400px] w-auto object-contain rounded shadow-lg border border-slate-300 bg-white"
                  />
                ) : (
                  <div className="text-xs text-slate-400">Rendering high-resolution sheet...</div>
                )}
              </div>

              <span className="text-[11px] text-slate-400 text-center">
                Includes corner crop marks and dashed cut lines. Print at 100% scale (Do Not Scale / Fit to Page).
              </span>
            </div>

            {/* Print & Paper Configuration (5 cols) */}
            <div className="md:col-span-5 space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <span className="text-xs font-bold text-slate-900 block">Paper Size Format</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['3R', '4R', '5R', '6R', 'A4', 'A5', 'Letter'] as PaperSizeKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => refreshPrintSheet(key, paperOrientation, customCopies)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedPaperKey === key
                          ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-bold text-xs text-slate-900 block">{PAPER_SIZES[key].label}</span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {PAPER_SIZES[key].description}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Photo Copies to Print</span>
                    <span className="font-mono text-blue-600 font-bold">{customCopies} photos</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="16"
                    value={customCopies}
                    onChange={(e) =>
                      refreshPrintSheet(selectedPaperKey, paperOrientation, Number(e.target.value))
                    }
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <button
                  onClick={handlePrintSheet}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
                >
                  <Printer className="w-4 h-4" /> Print Directly to Printer
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleExportPrintSheet('pdf')}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </button>
                  <button
                    onClick={() => handleExportPrintSheet('jpeg')}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download JPG
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
