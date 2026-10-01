import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Download,
  Upload,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  Check,
  Zap,
  Trash2
} from 'lucide-react';
import {
  formatBytes,
  loadImageFromFile,
  canvasToBlobUrl,
  removeBackgroundCanvas,
  downloadProcessedFile
} from '../../utils/imageProcessing';

interface RemoveBgToolProps {
  initialFile?: File | null;
  onBack: () => void;
}

export const RemoveBgTool: React.FC<RemoveBgToolProps> = ({ initialFile, onBack }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processedSize, setProcessedSize] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50); // Split screen slider position
  const [analysisInfo, setAnalysisInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialFile) {
      handleFileChange(initialFile);
    }
  }, [initialFile]);

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setProcessedUrl(null);
    setError(null);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    // Auto trigger background removal
    await processRemoveBg(selectedFile);
  };

  const processRemoveBg = async (targetFile: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const img = await loadImageFromFile(targetFile);
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(targetFile);
      });

      // Call AI endpoint to detect subject and generate mask metadata
      const res = await fetch('/api/ai/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to process image');
      }

      setAnalysisInfo(json.analysis);

      // Apply subject segmentation & mask canvas
      const canvas = await removeBackgroundCanvas(img, json.analysis);
      const result = await canvasToBlobUrl(canvas, 'image/png');

      setProcessedUrl(result.url);
      setProcessedSize(result.size);

      // Call clean temp endpoint
      fetch('/api/clean-temp', { method: 'POST' }).catch(() => {});
    } catch (err: any) {
      console.error('Remove BG Error:', err);
      setError(err.message || 'Error processing background removal');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedUrl || !file) return;
    const cleanName = file.name.replace(/\.[^/.]+$/, '') + '-nobg.png';
    downloadProcessedFile(processedUrl, cleanName);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Action Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">
            🔒 Processed in temporary memory
          </span>
          {processedUrl && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/30 transition-colors"
            >
              <Download className="w-4 h-4" /> Download Transparent PNG
            </button>
          )}
        </div>
      </div>

      {/* Main Tool Canvas Area */}
      {!file ? (
        <div className="bg-slate-900 border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Remove Image Background</h2>
            <p className="text-xs text-slate-400 mt-1">
              Upload photos, products, logos, or portraits to instantly isolate foreground subjects.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-lg shadow-emerald-950/30">
            <Upload className="w-4 h-4" /> Select Image File
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
              }}
            />
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status & Details Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 font-bold text-xs">
                PNG
              </div>
              <div>
                <span className="text-sm font-bold text-white block">{file.name}</span>
                <span className="text-xs text-slate-400 block">
                  Original: {formatBytes(file.size)} {processedSize && `→ PNG Output: ${formatBytes(processedSize)}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl cursor-pointer transition-colors">
                Change Image
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                  }}
                />
              </label>
              <button
                onClick={() => processRemoveBg(file)}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                Re-process
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-2xl text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Interactive Split-Screen Comparison View */}
          <div className="relative bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden min-h-[420px] flex items-center justify-center p-4">
            {isProcessing ? (
              <div className="text-center space-y-3 p-8">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-semibold text-white">Detecting Subject & Isolating Background...</p>
                <p className="text-xs text-slate-400">Processing in temporary RAM</p>
              </div>
            ) : processedUrl && previewUrl ? (
              <div
                ref={containerRef}
                className="relative w-full max-w-4xl h-[480px] overflow-hidden rounded-2xl select-none shadow-2xl"
                style={{
                  // Checkerboard background for transparency
                  backgroundImage: `radial-gradient(#334155 1px, transparent 1px)`,
                  backgroundSize: '16px 16px',
                  backgroundColor: '#0f172a'
                }}
              >
                {/* Result Transparent PNG Image (Bottom Layer) */}
                <img
                  src={processedUrl}
                  alt="Background Removed Result"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />

                {/* Original Image (Top Layer clipped by slider position) */}
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

                {/* Split Slider Line */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-emerald-400 shadow-xl cursor-ew-resize flex items-center justify-center z-10"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-lg">
                    ↔
                  </div>
                </div>

                {/* Range Slider Overlay Input */}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-ew-resize z-20 w-full h-full"
                />

                {/* Corner Labels */}
                <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-white border border-slate-700/60 z-10">
                  Original
                </span>
                <span className="absolute bottom-3 right-3 bg-emerald-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-300 border border-emerald-700/60 z-10">
                  Transparent PNG
                </span>
              </div>
            ) : null}
          </div>

          {/* AI Analysis Card */}
          {analysisInfo && (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs">
              <span className="font-bold text-white block">AI Detection Insights</span>
              <p className="text-slate-400">
                Identified Subject: <span className="text-emerald-300 font-semibold">{analysisInfo.subjectDescription}</span> ({analysisInfo.subjectType})
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
