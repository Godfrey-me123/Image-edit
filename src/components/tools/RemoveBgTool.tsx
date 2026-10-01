import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Download,
  Upload,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import {
  formatBytes,
  downloadProcessedFile
} from '../../utils/imageProcessing';
import { ToolId } from '../../types/imageTools';

interface RemoveBgToolProps {
  initialFile?: File | null;
  onBack: () => void;
  onSelectTool: (tool: ToolId) => void;
}

export const RemoveBgTool: React.FC<RemoveBgToolProps> = ({ initialFile, onBack, onSelectTool }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processedSize, setProcessedSize] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
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
    await processRemoveBg(selectedFile);
  };

  const processRemoveBg = async (targetFile: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', targetFile);
      const res = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Failed to process image');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setProcessedUrl(url);
      setProcessedSize(blob.size);
      fetch('/api/clean-temp', { method: 'POST' }).catch(() => {});
    } catch (err: any) {
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
      <div className="flex items-center justify-between gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </button>
        {processedUrl && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/30 transition-colors"
            >
              <Download className="w-4 h-4" /> Download Transparent PNG
            </button>
        )}
      </div>

      {!file ? (
        <div className="bg-slate-900 border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Remove Image Background</h2>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-lg shadow-emerald-950/30">
            <Upload className="w-4 h-4" /> Select Image File
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])} />
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <span className="text-sm font-bold text-white block">{file.name}</span>
            <button onClick={() => processRemoveBg(file)} disabled={isProcessing} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} /> Re-process
            </button>
          </div>
          {error && <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-2xl text-xs text-rose-300">{error}</div>}
          <div className="relative bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden min-h-[420px] flex items-center justify-center p-4">
            {isProcessing ? (
              <div className="text-center p-8 text-sm font-semibold text-white">Detecting Subject...</div>
            ) : processedUrl && previewUrl ? (
              <div ref={containerRef} className="relative w-full max-w-4xl h-[480px] overflow-hidden rounded-2xl select-none shadow-2xl">
                <img src={processedUrl} alt="Result" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPosition}%` }}>
                  <img src={previewUrl} alt="Original" className="absolute inset-0 w-full h-full object-contain pointer-events-none max-w-none" />
                </div>
                <input type="range" min={0} max={100} value={sliderPosition} onChange={(e) => setSliderPosition(Number(e.target.value))} className="absolute inset-0 opacity-0 cursor-ew-resize z-20 w-full h-full" />
              </div>
            ) : null}
          </div>
          <div className="text-center p-4">
            <button onClick={() => onSelectTool('passport')} className="text-xs text-emerald-400 hover:underline">Use for Passport Size</button>
          </div>
        </div>
      )}
    </div>
  );
};
