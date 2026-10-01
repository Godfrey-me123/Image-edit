import React, { useState, useRef, useEffect } from 'react';
import {
  Crop as CropIcon,
  Download,
  Upload,
  ArrowLeft,
  Check,
  RotateCcw
} from 'lucide-react';
import {
  formatBytes,
  loadImageFromFile,
  cropImageCanvas,
  canvasToBlobUrl,
  downloadProcessedFile
} from '../../utils/imageProcessing';

interface CropToolProps {
  initialFile?: File | null;
  onBack: () => void;
}

export const CropTool: React.FC<CropToolProps> = ({ initialFile, onBack }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Aspect ratio selected
  const [aspectPreset, setAspectPreset] = useState<string>('free');

  // Crop Box Coordinates relative to original image px
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 400,
    height: 400
  });

  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const [croppedSize, setCroppedSize] = useState<number | null>(null);
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

    const img = await loadImageFromFile(selectedFile);
    setImageObj(img);

    // Initial crop box centered in middle 80% of image
    const initialW = Math.round(img.width * 0.8);
    const initialH = Math.round(img.height * 0.8);
    const initialX = Math.round((img.width - initialW) / 2);
    const initialY = Math.round((img.height - initialH) / 2);

    const initialBox = { x: initialX, y: initialY, width: initialW, height: initialH };
    setCropBox(initialBox);

    await executeCrop(img, initialBox);
  };

  const handleAspectPreset = (preset: string) => {
    setAspectPreset(preset);
    if (!imageObj) return;

    let targetRatio: number | null = null;
    if (preset === '1:1') targetRatio = 1;
    else if (preset === '16:9') targetRatio = 16 / 9;
    else if (preset === '4:3') targetRatio = 4 / 3;
    else if (preset === '3:2') targetRatio = 3 / 2;
    else if (preset === '9:16') targetRatio = 9 / 16;

    if (targetRatio) {
      let newW = cropBox.width;
      let newH = Math.round(newW / targetRatio);

      if (newH > imageObj.height) {
        newH = imageObj.height;
        newW = Math.round(newH * targetRatio);
      }

      const newBox = {
        x: Math.max(0, Math.min(cropBox.x, imageObj.width - newW)),
        y: Math.max(0, Math.min(cropBox.y, imageObj.height - newH)),
        width: newW,
        height: newH
      };

      setCropBox(newBox);
      executeCrop(imageObj, newBox);
    }
  };

  const executeCrop = async (img?: HTMLImageElement, box?: typeof cropBox) => {
    const activeImg = img || imageObj;
    const activeBox = box || cropBox;
    if (!activeImg || !file) return;

    setIsProcessing(true);
    try {
      const canvas = await cropImageCanvas(activeImg, activeBox);
      const mime = file.type || 'image/png';
      const result = await canvasToBlobUrl(canvas, mime, 0.95);

      setCroppedUrl(result.url);
      setCroppedSize(result.size);
    } catch (err) {
      console.error('Crop Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!croppedUrl || !file) return;
    const ext = file.name.split('.').pop() || 'png';
    const cleanName = file.name.replace(/\.[^/.]+$/, '') + `-cropped.${ext}`;
    downloadProcessedFile(croppedUrl, cleanName);
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

        {croppedUrl && (
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/30 transition-colors"
          >
            <Download className="w-4 h-4" /> Download Cropped Image
          </button>
        )}
      </div>

      {!file ? (
        <div className="bg-slate-900 border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <CropIcon className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Crop Image Canvas</h2>
            <p className="text-xs text-slate-400 mt-1">
              Trim image borders, isolate exact sections, or enforce standard ratio frames.
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
              <CropIcon className="w-4 h-4 text-amber-400" /> Aspect Ratio & Coordinates
            </h3>

            {/* Ratios Buttons */}
            <div>
              <label className="text-xs text-slate-400 block mb-2 font-medium">Aspect Ratios</label>
              <div className="grid grid-cols-3 gap-2">
                {['free', '1:1', '16:9', '4:3', '3:2', '9:16'].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleAspectPreset(r)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-colors ${
                      aspectPreset === r
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Coordinates Manual Form */}
            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-medium block">Crop Selection (px)</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Width</label>
                  <input
                    type="number"
                    value={cropBox.width}
                    onChange={(e) => {
                      const newBox = { ...cropBox, width: Number(e.target.value) };
                      setCropBox(newBox);
                      executeCrop(undefined, newBox);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Height</label>
                  <input
                    type="number"
                    value={cropBox.height}
                    onChange={(e) => {
                      const newBox = { ...cropBox, height: Number(e.target.value) };
                      setCropBox(newBox);
                      executeCrop(undefined, newBox);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => executeCrop()}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-colors"
            >
              Apply Crop
            </button>
          </div>

          {/* Canvas Preview Area */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 min-h-[400px]">
            {croppedUrl ? (
              <div className="space-y-4 text-center">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 max-h-[380px] flex items-center justify-center overflow-hidden">
                  <img src={croppedUrl} alt="Cropped" className="max-h-[340px] object-contain rounded-lg" />
                </div>
                <span className="text-xs text-slate-400 font-mono block">
                  Cropped Dimensions: {cropBox.width} × {cropBox.height} px ({formatBytes(croppedSize || 0)})
                </span>
              </div>
            ) : (
              <div className="text-slate-500 text-xs">Cropping preview...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
