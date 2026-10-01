import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Download,
  Upload,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import {
  formatBytes,
  loadImageFromFile,
  rotateAndFlipCanvas,
  canvasToBlobUrl,
  downloadProcessedFile
} from '../../utils/imageProcessing';

interface RotateToolProps {
  initialFile?: File | null;
  onBack: () => void;
}

export const RotateTool: React.FC<RotateToolProps> = ({ initialFile, onBack }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [angle, setAngle] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processedSize, setProcessedSize] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (initialFile) {
      handleFileSelect(initialFile);
    }
  }, [initialFile]);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    setAngle(0);
    setFlipH(false);
    setFlipV(false);

    await processRotation(selectedFile, 0, false, false);
  };

  const processRotation = async (
    targetFile?: File,
    a?: number,
    fh?: boolean,
    fv?: boolean
  ) => {
    const activeFile = targetFile || file;
    if (!activeFile) return;

    setIsProcessing(true);
    try {
      const activeAngle = a !== undefined ? a : angle;
      const activeFlipH = fh !== undefined ? fh : flipH;
      const activeFlipV = fv !== undefined ? fv : flipV;

      const img = await loadImageFromFile(activeFile);
      const canvas = await rotateAndFlipCanvas(img, activeAngle, activeFlipH, activeFlipV);

      const mime = activeFile.type || 'image/png';
      const result = await canvasToBlobUrl(canvas, mime, 0.95);

      setProcessedUrl(result.url);
      setProcessedSize(result.size);
    } catch (err) {
      console.error('Rotation Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const addAngle = (delta: number) => {
    const newAngle = (angle + delta) % 360;
    setAngle(newAngle);
    processRotation(undefined, newAngle, flipH, flipV);
  };

  const toggleFlipH = () => {
    const newF = !flipH;
    setFlipH(newF);
    processRotation(undefined, angle, newF, flipV);
  };

  const toggleFlipV = () => {
    const newF = !flipV;
    setFlipV(newF);
    processRotation(undefined, angle, flipH, newF);
  };

  const handleDownload = () => {
    if (!processedUrl || !file) return;
    const ext = file.name.split('.').pop() || 'png';
    const cleanName = file.name.replace(/\.[^/.]+$/, '') + `-rotated.${ext}`;
    downloadProcessedFile(processedUrl, cleanName);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </button>

        {processedUrl && (
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/30 transition-colors"
          >
            <Download className="w-4 h-4" /> Download Rotated Image
          </button>
        )}
      </div>

      {!file ? (
        <div className="bg-slate-900 border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
            <RotateCw className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Rotate & Flip Image</h2>
            <p className="text-xs text-slate-400 mt-1">
              Rotate 90°, 180°, 270°, flip horizontally or vertically, or set exact angles.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-lg shadow-emerald-950/30">
            <Upload className="w-4 h-4" /> Select Image
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
              }}
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-cyan-400" /> Transform Controls
            </h3>

            {/* Quick 90 deg buttons */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-medium block">Quick Rotation</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => addAngle(-90)}
                  className="py-2.5 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-cyan-400" /> -90°
                </button>
                <button
                  onClick={() => addAngle(90)}
                  className="py-2.5 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCw className="w-4 h-4 text-cyan-400" /> +90°
                </button>
              </div>
            </div>

            {/* Flip Buttons */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-medium block">Flip Axis</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={toggleFlipH}
                  className={`py-2.5 px-3 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    flipH
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <FlipHorizontal className="w-4 h-4" /> Flip Horizontal
                </button>
                <button
                  onClick={toggleFlipV}
                  className={`py-2.5 px-3 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    flipV
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <FlipVertical className="w-4 h-4" /> Flip Vertical
                </button>
              </div>
            </div>

            {/* Precision Angle Dial */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Precision Angle</span>
                <span className="font-mono text-emerald-400 font-bold">{angle}°</span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                value={angle}
                onChange={(e) => {
                  const newA = Number(e.target.value);
                  setAngle(newA);
                  processRotation(undefined, newA, flipH, flipV);
                }}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>

          {/* Canvas Preview Area */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 min-h-[400px]">
            {processedUrl ? (
              <div className="space-y-4 text-center">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 max-h-[380px] flex items-center justify-center overflow-hidden">
                  <img src={processedUrl} alt="Rotated" className="max-h-[340px] object-contain rounded-lg" />
                </div>
                <span className="text-xs text-slate-400 font-mono block">
                  Angle: {angle}° · Flip H: {flipH ? 'Yes' : 'No'} · Flip V: {flipV ? 'Yes' : 'No'} ({formatBytes(processedSize || 0)})
                </span>
              </div>
            ) : (
              <div className="text-slate-500 text-xs">Rotating preview...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
