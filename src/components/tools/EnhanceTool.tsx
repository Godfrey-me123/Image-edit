import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  Download,
  Upload,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { EnhanceOptions } from '../../types/imageTools';
import {
  formatBytes,
  loadImageFromFile,
  enhanceImageCanvas,
  canvasToBlobUrl,
  downloadProcessedFile
} from '../../utils/imageProcessing';

interface EnhanceToolProps {
  initialFile?: File | null;
  onBack: () => void;
}

export const EnhanceTool: React.FC<EnhanceToolProps> = ({ initialFile, onBack }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [options, setOptions] = useState<EnhanceOptions>({
    scaleFactor: 2,
    sharpen: 1.25,
    contrast: 1.1,
    saturation: 1.05,
    brightness: 1.0,
    denoise: true,
  });

  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [enhancedSize, setEnhancedSize] = useState<number | null>(null);
  const [analysisPlan, setAnalysisPlan] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialFile) {
      handleFileSelect(initialFile);
    }
  }, [initialFile]);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    await processEnhancement(selectedFile, options);
  };

  const processEnhancement = async (targetFile?: File, activeOpts?: EnhanceOptions) => {
    const fileToProcess = targetFile || file;
    const currentOpts = activeOpts || options;
    if (!fileToProcess) return;

    setIsProcessing(true);
    try {
      const img = await loadImageFromFile(fileToProcess);

      // Call AI endpoint to analyze image quality and get recommended parameters
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(fileToProcess);
      });

      const res = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          scaleFactor: currentOpts.scaleFactor
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setAnalysisPlan(json.enhancementPlan);
        }
      }

      // Render enhanced image canvas
      const canvas = await enhanceImageCanvas(img, currentOpts);
      const mime = fileToProcess.type || 'image/png';
      const result = await canvasToBlobUrl(canvas, mime, 0.95);

      setEnhancedUrl(result.url);
      setEnhancedSize(result.size);
    } catch (err) {
      console.error('Enhancement error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptionChange = (newOpts: Partial<EnhanceOptions>) => {
    const updated = { ...options, ...newOpts };
    setOptions(updated);
    processEnhancement(file || undefined, updated);
  };

  const handleDownload = () => {
    if (!enhancedUrl || !file) return;
    const ext = file.name.split('.').pop() || 'png';
    const cleanName = file.name.replace(/\.[^/.]+$/, '') + `-enhanced-${options.scaleFactor}x.${ext}`;
    downloadProcessedFile(enhancedUrl, cleanName);
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

        {enhancedUrl && (
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/30 transition-colors"
          >
            <Download className="w-4 h-4" /> Download Enhanced ({options.scaleFactor}x)
          </button>
        )}
      </div>

      {!file ? (
        <div className="bg-slate-900 border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 text-yellow-400 mx-auto flex items-center justify-center">
            <Zap className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Image Enhancement & Upscale</h2>
            <p className="text-xs text-slate-400 mt-1">
              Super resolution upscaling (2x/4x), detail sharpening, and artifact reduction.
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
              <Zap className="w-4 h-4 text-yellow-400" /> Enhancement Controls
            </h3>

            {/* Scale Factor Selection */}
            <div>
              <label className="text-xs text-slate-400 block mb-2 font-medium">
                Upscale Factor
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1.5, 2, 4].map((scale) => (
                  <button
                    key={scale}
                    onClick={() => handleOptionChange({ scaleFactor: scale as any })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                      options.scaleFactor === scale
                        ? 'bg-yellow-500 text-slate-950 border-yellow-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {scale}x Scale
                  </button>
                ))}
              </div>
            </div>

            {/* Sharpen Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Sharpening Filter</span>
                <span className="font-mono text-emerald-400 font-bold">{options.sharpen}x</span>
              </div>
              <input
                type="range"
                min={1.0}
                max={2.0}
                step={0.05}
                value={options.sharpen}
                onChange={(e) => handleOptionChange({ sharpen: Number(e.target.value) })}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Contrast Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Contrast Boost</span>
                <span className="font-mono text-emerald-400 font-bold">{options.contrast}x</span>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.5}
                step={0.05}
                value={options.contrast}
                onChange={(e) => handleOptionChange({ contrast: Number(e.target.value) })}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Saturation Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Color Vibrance</span>
                <span className="font-mono text-emerald-400 font-bold">{options.saturation}x</span>
              </div>
              <input
                type="range"
                min={0.8}
                max={1.5}
                step={0.05}
                value={options.saturation}
                onChange={(e) => handleOptionChange({ saturation: Number(e.target.value) })}
                className="w-full accent-emerald-500"
              />
            </div>

            {analysisPlan && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] text-slate-300 space-y-1">
                <span className="font-bold text-yellow-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Quality Score
                </span>
                <div className="flex justify-between font-mono text-xs">
                  <span>Before: {analysisPlan.qualityScoreBefore}/100</span>
                  <span className="text-emerald-400 font-bold">After: {analysisPlan.qualityScoreAfter}/100</span>
                </div>
              </div>
            )}
          </div>

          {/* Canvas Preview Split View */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 min-h-[400px]">
            {isProcessing ? (
              <div className="text-center space-y-3 p-8">
                <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-semibold text-white">Enhancing Image Details...</p>
              </div>
            ) : enhancedUrl && previewUrl ? (
              <div
                ref={containerRef}
                className="relative w-full max-w-4xl h-[440px] overflow-hidden rounded-2xl select-none bg-slate-900 border border-slate-800"
              >
                {/* Enhanced Image (Bottom Layer) */}
                <img
                  src={enhancedUrl}
                  alt="Enhanced"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />

                {/* Original Image (Clipped Top Layer) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={previewUrl}
                    alt="Original"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none max-w-none"
                    style={{ width: containerRef.current?.clientWidth || '100%' }}
                  />
                </div>

                {/* Split Line */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-yellow-400 shadow-xl cursor-ew-resize flex items-center justify-center z-10"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="w-8 h-8 rounded-full bg-yellow-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-lg">
                    ↔
                  </div>
                </div>

                {/* Range Slider Overlay */}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-ew-resize z-20 w-full h-full"
                />

                <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-white z-10 border border-slate-700">
                  Original ({formatBytes(file.size)})
                </span>
                <span className="absolute bottom-3 right-3 bg-yellow-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-yellow-300 z-10 border border-yellow-700">
                  Enhanced {options.scaleFactor}x ({formatBytes(enhancedSize || 0)})
                </span>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
