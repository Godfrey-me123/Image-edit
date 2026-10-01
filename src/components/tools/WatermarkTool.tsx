import React, { useState, useEffect } from 'react';
import {
  Stamp,
  Type,
  Image as ImageIcon,
  Download,
  Upload,
  ArrowLeft,
  Grid
} from 'lucide-react';
import { WatermarkOptions } from '../../types/imageTools';
import {
  formatBytes,
  loadImageFromFile,
  applyWatermarkCanvas,
  canvasToBlobUrl,
  downloadProcessedFile
} from '../../utils/imageProcessing';

interface WatermarkToolProps {
  initialFile?: File | null;
  onBack: () => void;
}

export const WatermarkTool: React.FC<WatermarkToolProps> = ({ initialFile, onBack }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [watermarkOptions, setWatermarkOptions] = useState<WatermarkOptions>({
    mode: 'text',
    text: '© IMAGE EDIT · CONFIDENTIAL',
    textColor: '#ffffff',
    fontFamily: 'sans-serif',
    fontSize: 48,
    opacity: 0.7,
    position: 'bottom-right',
    watermarkScale: 0.25,
  });

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

    await processWatermark(selectedFile, watermarkOptions);
  };

  const processWatermark = async (targetFile?: File, options?: WatermarkOptions) => {
    const activeFile = targetFile || file;
    const activeOpts = options || watermarkOptions;
    if (!activeFile) return;

    setIsProcessing(true);
    try {
      const img = await loadImageFromFile(activeFile);
      const canvas = await applyWatermarkCanvas(img, activeOpts);

      const mime = activeFile.type || 'image/png';
      const result = await canvasToBlobUrl(canvas, mime, 0.95);

      setProcessedUrl(result.url);
      setProcessedSize(result.size);
    } catch (err) {
      console.error('Watermark error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptionChange = (newOpts: Partial<WatermarkOptions>) => {
    const updated = { ...watermarkOptions, ...newOpts };
    setWatermarkOptions(updated);
    processWatermark(file || undefined, updated);
  };

  const handleLogoUpload = (logoFile: File) => {
    const url = URL.createObjectURL(logoFile);
    const updated = {
      ...watermarkOptions,
      mode: 'image' as const,
      watermarkImageFile: logoFile,
      watermarkImageUrl: url,
    };
    setWatermarkOptions(updated);
    processWatermark(file || undefined, updated);
  };

  const handleDownload = () => {
    if (!processedUrl || !file) return;
    const ext = file.name.split('.').pop() || 'png';
    const cleanName = file.name.replace(/\.[^/.]+$/, '') + `-watermarked.${ext}`;
    downloadProcessedFile(processedUrl, cleanName);
  };

  const positions: WatermarkOptions['position'][] = [
    'top-left', 'top-center', 'top-right',
    'center-left', 'center', 'center-right',
    'bottom-left', 'bottom-center', 'bottom-right',
  ];

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
            <Download className="w-4 h-4" /> Download Watermarked Image
          </button>
        )}
      </div>

      {!file ? (
        <div className="bg-slate-900 border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
            <Stamp className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Watermark Image</h2>
            <p className="text-xs text-slate-400 mt-1">
              Protect photos with custom copyright text or transparent brand logo overlays.
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
              <Stamp className="w-4 h-4 text-rose-400" /> Watermark Controls
            </h3>

            {/* Mode Switcher */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                onClick={() => handleOptionChange({ mode: 'text' })}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  watermarkOptions.mode === 'text'
                    ? 'bg-rose-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Type className="w-3.5 h-3.5" /> Text
              </button>
              <button
                onClick={() => handleOptionChange({ mode: 'image' })}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  watermarkOptions.mode === 'image'
                    ? 'bg-rose-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" /> Logo Image
              </button>
            </div>

            {watermarkOptions.mode === 'text' ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Watermark Text</label>
                  <input
                    type="text"
                    value={watermarkOptions.text}
                    onChange={(e) => handleOptionChange({ text: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Color</label>
                    <input
                      type="color"
                      value={watermarkOptions.textColor}
                      onChange={(e) => handleOptionChange({ textColor: e.target.value })}
                      className="w-full h-9 bg-slate-950 border border-slate-800 rounded-xl p-1 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Font Family</label>
                    <select
                      value={watermarkOptions.fontFamily}
                      onChange={(e) => handleOptionChange({ fontFamily: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white"
                    >
                      <option value="sans-serif">Sans-Serif</option>
                      <option value="serif">Serif</option>
                      <option value="monospace">Monospace</option>
                      <option value="Impact">Impact</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block p-4 border-2 border-dashed border-slate-800 hover:border-rose-500 rounded-2xl text-center cursor-pointer transition-colors">
                  <Upload className="w-5 h-5 text-rose-400 mx-auto mb-1" />
                  <span className="text-xs text-slate-300 font-semibold block">
                    Upload Logo Graphic
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleLogoUpload(e.target.files[0]);
                    }}
                  />
                </label>

                {watermarkOptions.watermarkImageUrl && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Logo Scale</span>
                      <span className="font-mono text-emerald-400">
                        {Math.round((watermarkOptions.watermarkScale || 0.2) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={0.8}
                      step={0.05}
                      value={watermarkOptions.watermarkScale || 0.2}
                      onChange={(e) => handleOptionChange({ watermarkScale: Number(e.target.value) })}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Opacity Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Opacity</span>
                <span className="font-mono text-emerald-400">
                  {Math.round(watermarkOptions.opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.05}
                value={watermarkOptions.opacity}
                onChange={(e) => handleOptionChange({ opacity: Number(e.target.value) })}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* 9 Point Grid Position Selector */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400 font-medium">Placement Grid</span>
                <button
                  onClick={() => handleOptionChange({ position: 'tiled' })}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    watermarkOptions.position === 'tiled'
                      ? 'bg-rose-500 text-slate-950 border-rose-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Tile Repeating
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-950 rounded-2xl border border-slate-800">
                {positions.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => handleOptionChange({ position: pos })}
                    className={`h-8 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                      watermarkOptions.position === pos
                        ? 'bg-rose-500 text-slate-950 shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {pos.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Canvas Preview Column */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 min-h-[400px]">
            {processedUrl ? (
              <div className="space-y-4 text-center">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 max-h-[380px] flex items-center justify-center overflow-hidden">
                  <img src={processedUrl} alt="Watermarked" className="max-h-[340px] object-contain rounded-lg" />
                </div>
                <span className="text-xs text-slate-400 font-mono block">
                  Watermarked Output ({formatBytes(processedSize || 0)})
                </span>
              </div>
            ) : (
              <div className="text-slate-500 text-xs">Applying watermark...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
