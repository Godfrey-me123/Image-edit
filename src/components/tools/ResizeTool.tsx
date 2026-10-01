import React, { useState, useEffect } from 'react';
import {
  Maximize2,
  Lock,
  Unlock,
  Download,
  Upload,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import {
  formatBytes,
  loadImageFromFile,
  resizeImageCanvas,
  canvasToBlobUrl,
  downloadProcessedFile
} from '../../utils/imageProcessing';

interface ResizeToolProps {
  initialFile?: File | null;
  onBack: () => void;
}

export const ResizeTool: React.FC<ResizeToolProps> = ({ initialFile, onBack }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [width, setWidth] = useState<number>(1080);
  const [height, setHeight] = useState<number>(1080);
  const [maintainRatio, setMaintainRatio] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [preset, setPreset] = useState<string>('custom');

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resizedUrl, setResizedUrl] = useState<string | null>(null);
  const [resizedSize, setResizedSize] = useState<number | null>(null);
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
    setOriginalDimensions({ width: img.width, height: img.height });
    setWidth(img.width);
    setHeight(img.height);
    const ratio = img.width / img.height;
    setAspectRatio(ratio);

    await processResize(img, img.width, img.height);
  };

  const handleWidthChange = (val: number) => {
    const newWidth = Math.max(1, val);
    setWidth(newWidth);
    if (maintainRatio && aspectRatio) {
      setHeight(Math.round(newWidth / aspectRatio));
    }
    setPreset('custom');
  };

  const handleHeightChange = (val: number) => {
    const newHeight = Math.max(1, val);
    setHeight(newHeight);
    if (maintainRatio && aspectRatio) {
      setWidth(Math.round(newHeight * aspectRatio));
    }
    setPreset('custom');
  };

  const handlePresetSelect = (presetKey: string) => {
    setPreset(presetKey);
    if (!originalDimensions) return;

    let targetW = originalDimensions.width;
    let targetH = originalDimensions.height;

    switch (presetKey) {
      case 'instagram-square':
        targetW = 1080;
        targetH = 1080;
        break;
      case 'instagram-story':
        targetW = 1080;
        targetH = 1920;
        break;
      case 'youtube-thumb':
        targetW = 1280;
        targetH = 720;
        break;
      case 'full-hd':
        targetW = 1920;
        targetH = 1080;
        break;
      case 'website-banner':
        targetW = 1200;
        targetH = 630;
        break;
      case 'half-size':
        targetW = Math.round(originalDimensions.width * 0.5);
        targetH = Math.round(originalDimensions.height * 0.5);
        break;
      case 'double-size':
        targetW = Math.round(originalDimensions.width * 2);
        targetH = Math.round(originalDimensions.height * 2);
        break;
    }

    setWidth(targetW);
    setHeight(targetH);
  };

  const processResize = async (imgObj?: HTMLImageElement, w?: number, h?: number) => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const targetImg = imgObj || (await loadImageFromFile(file));
      const targetW = w || width;
      const targetH = h || height;

      const canvas = await resizeImageCanvas(targetImg, targetW, targetH);
      const mime = file.type || 'image/png';
      const result = await canvasToBlobUrl(canvas, mime, 0.95);

      setResizedUrl(result.url);
      setResizedSize(result.size);
    } catch (err) {
      console.error('Resize Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resizedUrl || !file) return;
    const extension = file.name.split('.').pop() || 'png';
    const cleanName = file.name.replace(/\.[^/.]+$/, '') + `-${width}x${height}.${extension}`;
    downloadProcessedFile(resizedUrl, cleanName);
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

        {resizedUrl && (
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/30 transition-colors"
          >
            <Download className="w-4 h-4" /> Download Resized Image
          </button>
        )}
      </div>

      {!file ? (
        <div className="bg-slate-900 border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center">
            <Maximize2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Resize Image Dimensions</h2>
            <p className="text-xs text-slate-400 mt-1">
              Change width, height, aspect ratio presets, or scale image percentages cleanly.
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
              <Maximize2 className="w-4 h-4 text-blue-400" /> Dimension Settings
            </h3>

            {/* Presets Selector */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-medium">Presets</label>
              <select
                value={preset}
                onChange={(e) => handlePresetSelect(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="custom">Custom Dimensions</option>
                <option value="half-size">50% Scale (Half Size)</option>
                <option value="double-size">200% Scale (Double Size)</option>
                <option value="instagram-square">Instagram Square (1080 x 1080)</option>
                <option value="instagram-story">Instagram Story (1080 x 1920)</option>
                <option value="youtube-thumb">YouTube Thumbnail (1280 x 720)</option>
                <option value="full-hd">Full HD (1920 x 1080)</option>
                <option value="website-banner">Website Banner (1200 x 630)</option>
              </select>
            </div>

            {/* Width and Height Inputs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Pixels</span>
                <button
                  onClick={() => setMaintainRatio(!maintainRatio)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                    maintainRatio
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {maintainRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>Aspect Ratio {maintainRatio ? 'Locked' : 'Unlocked'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => processResize()}
              disabled={isProcessing}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              Apply New Dimensions
            </button>
          </div>

          {/* Preview Canvas Column */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 min-h-[400px]">
            {resizedUrl ? (
              <div className="space-y-4 w-full text-center">
                <div className="max-h-[420px] flex items-center justify-center overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-2">
                  <img
                    src={resizedUrl}
                    alt="Resized Preview"
                    className="max-h-[380px] w-auto object-contain rounded-lg"
                  />
                </div>
                <div className="flex items-center justify-center gap-4 text-xs text-slate-400 font-mono">
                  <span>New Size: <strong className="text-white">{width} × {height} px</strong></span>
                  <span>File Size: <strong className="text-emerald-400">{formatBytes(resizedSize || 0)}</strong></span>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-xs">Processing preview...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
