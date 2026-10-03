import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Save, Undo, Redo, Minus, Plus, Trash2, Check, Download, Sparkles } from 'lucide-react';
import { Canvas } from 'fabric';
import { saveSignature } from '../../utils/myPhotosStorage';
import { downloadProcessedFile } from '../../utils/imageProcessing';

interface SignatureToolProps {
  onBack: () => void;
  onSave?: (dataUrl: string) => void;
}

/**
 * Trims empty transparent margins around signature so it's tight and reusable
 */
function trimTransparentCanvas(sourceCanvas: HTMLCanvasElement): string {
  const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return sourceCanvas.toDataURL('image/png');

  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let hasPixels = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > 12) {
        hasPixels = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasPixels) {
    return sourceCanvas.toDataURL('image/png');
  }

  // Add 16px clean padding
  const pad = 16;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(w - cropX, (maxX - minX) + pad * 2);
  const cropH = Math.min(h - cropY, (maxY - minY) + pad * 2);

  const trimmed = document.createElement('canvas');
  trimmed.width = cropW;
  trimmed.height = cropH;
  const trimCtx = trimmed.getContext('2d');
  if (!trimCtx) return sourceCanvas.toDataURL('image/png');

  trimCtx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return trimmed.toDataURL('image/png');
}

export const SignatureTool: React.FC<SignatureToolProps> = ({ onBack, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<Canvas | null>(null);

  const [strokeWidth, setStrokeWidth] = useState(3);
  const [penColor, setPenColor] = useState('#000000');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);

  const colors = [
    { label: 'Black Ink', hex: '#000000' },
    { label: 'Royal Blue', hex: '#1D4ED8' },
    { label: 'Dark Navy', hex: '#0F172A' },
    { label: 'Dark Slate', hex: '#334155' },
  ];

  useEffect(() => {
    if (canvasRef.current && !fabricCanvas.current) {
      const containerW = Math.min(window.innerWidth - 48, 620);
      const containerH = 340;

      const canvas = new Canvas(canvasRef.current, {
        isDrawingMode: true,
        width: containerW,
        height: containerH,
        backgroundColor: 'transparent',
      });
      fabricCanvas.current = canvas;

      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = strokeWidth;
        canvas.freeDrawingBrush.color = penColor;
      }

      // Initial empty state
      const initialJson = JSON.stringify(canvas.toJSON());
      historyRef.current = [initialJson];
      historyIndexRef.current = 0;

      // Track strokes for undo/redo
      canvas.on('path:created', () => {
        setHasDrawn(true);
        const json = JSON.stringify(canvas.toJSON());
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        historyRef.current.push(json);
        historyIndexRef.current = historyRef.current.length - 1;
      });
    }

    return () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
        fabricCanvas.current = null;
      }
    };
  }, []);

  // Update brush settings immediately
  useEffect(() => {
    if (fabricCanvas.current && fabricCanvas.current.freeDrawingBrush) {
      fabricCanvas.current.freeDrawingBrush.width = strokeWidth;
      fabricCanvas.current.freeDrawingBrush.color = penColor;
    }
  }, [strokeWidth, penColor]);

  const handleUndo = () => {
    if (!fabricCanvas.current || historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const json = historyRef.current[historyIndexRef.current];
    fabricCanvas.current.loadFromJSON(json, () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.isDrawingMode = true;
        if (fabricCanvas.current.freeDrawingBrush) {
          fabricCanvas.current.freeDrawingBrush.width = strokeWidth;
          fabricCanvas.current.freeDrawingBrush.color = penColor;
        }
        fabricCanvas.current.renderAll();
      }
    });
  };

  const handleRedo = () => {
    if (!fabricCanvas.current || historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const json = historyRef.current[historyIndexRef.current];
    fabricCanvas.current.loadFromJSON(json, () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.isDrawingMode = true;
        if (fabricCanvas.current.freeDrawingBrush) {
          fabricCanvas.current.freeDrawingBrush.width = strokeWidth;
          fabricCanvas.current.freeDrawingBrush.color = penColor;
        }
        fabricCanvas.current.renderAll();
      }
    });
  };

  const handleClear = () => {
    if (!fabricCanvas.current) return;
    fabricCanvas.current.clear();
    fabricCanvas.current.backgroundColor = 'transparent';
    fabricCanvas.current.renderAll();
    historyRef.current = [JSON.stringify(fabricCanvas.current.toJSON())];
    historyIndexRef.current = 0;
    setHasDrawn(false);
  };

  const handleSaveSignature = () => {
    if (!fabricCanvas.current) return;

    // 1. Get raw transparent canvas
    const rawDataUrl = fabricCanvas.current.toDataURL({
      format: 'png',
      multiplier: 2,
    });

    // 2. Crop empty margins so signature has no wasteful blank borders
    const tempImg = new Image();
    tempImg.onload = () => {
      const tempC = document.createElement('canvas');
      tempC.width = tempImg.width;
      tempC.height = tempImg.height;
      const tCtx = tempC.getContext('2d');
      tCtx?.drawImage(tempImg, 0, 0);

      const trimmedDataUrl = trimTransparentCanvas(tempC);

      // 3. Store in User Signature Library
      saveSignature(trimmedDataUrl, `Signature ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);

      if (onSave) {
        onSave(trimmedDataUrl);
      } else {
        downloadProcessedFile(trimmedDataUrl, 'signature-transparent.png');
      }
    };
    tempImg.src = rawDataUrl;
  };

  return (
    <div className="w-full max-w-xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition-colors"
            title="Clear Signature Canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleSaveSignature}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all"
          >
            {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {savedSuccess ? 'Saved to Library!' : 'Save Signature'}
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Digital Signature Workspace</h1>
        <p className="text-xs text-slate-500 mt-1">
          Draw your official signature using a stylus or finger. Automatically trimmed into a clean transparent PNG and saved in your library.
        </p>
      </div>

      {/* Success Banner */}
      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3 rounded-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Signature cropped, converted to transparent PNG, and saved to library!</span>
        </div>
      )}

      {/* Drawing Canvas Area with Touch Tracking */}
      <div
        className="relative bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex flex-col items-center select-none"
        style={{ touchAction: 'none' }}
      >
        <div className="w-full flex items-center justify-between text-[11px] text-slate-400 mb-2 px-1">
          <span className="font-medium text-slate-500">Sign within the area below</span>
          <span className="font-mono text-blue-600">Continuous Touch Tracking</span>
        </div>

        {/* Canvas Element */}
        <div
          className="relative border-2 border-slate-200 border-dashed rounded-2xl w-full flex items-center justify-center bg-slate-50/50 overflow-hidden"
          style={{ touchAction: 'none' }}
        >
          <canvas ref={canvasRef} className="touch-none" />

          {/* Baseline guideline */}
          <div className="absolute bottom-16 inset-x-8 border-b border-slate-300 pointer-events-none flex items-center justify-between">
            <span className="text-[10px] text-slate-300 uppercase tracking-widest pl-1">Baseline</span>
            <span className="text-[10px] text-slate-300 uppercase tracking-widest pr-1">✕</span>
          </div>
        </div>

        <div className="w-full flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
          <span>Auto-crops empty borders on Save</span>
          <span>Transparent PNG Vector Output</span>
        </div>
      </div>

      {/* Bottom Editing Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Ink Color Palette */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Ink Color</span>
          <div className="flex items-center gap-2">
            {colors.map((c) => (
              <button
                key={c.hex}
                onClick={() => setPenColor(c.hex)}
                style={{ backgroundColor: c.hex }}
                className={`w-7 h-7 rounded-full transition-transform ${
                  penColor === c.hex
                    ? 'scale-125 ring-2 ring-blue-500 ring-offset-2'
                    : 'hover:scale-110 opacity-90'
                }`}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Stroke Width Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>Stroke Width / Thickness</span>
            <span className="font-mono text-blue-600 font-bold">{strokeWidth}px</span>
          </div>
          <div className="flex items-center gap-3">
            <Minus className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min="1"
              max="14"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="flex-1 accent-blue-600 cursor-pointer"
            />
            <Plus className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Undo / Redo Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={handleUndo}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Undo className="w-3.5 h-3.5" /> Undo
          </button>
          <button
            onClick={handleRedo}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Redo className="w-3.5 h-3.5" /> Redo
          </button>
        </div>
      </div>
    </div>
  );
};
