import React, { useState, useEffect } from 'react';
import {
  FileArchive,
  Download,
  Upload,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  FileText
} from 'lucide-react';
import {
  formatBytes,
  loadImageFromFile,
  compressImageCanvas,
  compressPdfFile,
  canvasToBlobUrl,
  downloadProcessedFile
} from '../../utils/imageProcessing';

interface CompressToolProps {
  initialFile?: File | null;
  onBack: () => void;
}

export const CompressTool: React.FC<CompressToolProps> = ({ initialFile, onBack }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [quality, setQuality] = useState<number>(75);
  const [targetFormat, setTargetFormat] = useState<'image/jpeg' | 'image/webp' | 'image/png' | 'application/pdf'>('image/jpeg');

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (initialFile) {
      handleFileSelect(initialFile);
    }
  }, [initialFile]);

  const isPdf = file?.type === 'application/pdf' || file?.name.toLowerCase().endsWith('.pdf');

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    if (selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setTargetFormat('application/pdf');
      await processPdfCompression(selectedFile, 75);
    } else {
      if (selectedFile.type === 'image/png') {
        setTargetFormat('image/webp');
      } else {
        setTargetFormat('image/jpeg');
      }
      await processCompression(selectedFile, 75, selectedFile.type === 'image/png' ? 'image/webp' : 'image/jpeg');
    }
  };

  const processPdfCompression = async (pdfFile: File, qVal: number) => {
    setIsProcessing(true);
    try {
      const res = await compressPdfFile(pdfFile, qVal);
      setCompressedUrl(res.url);
      setCompressedSize(res.size);
      setPdfPageCount(res.pageCount);
    } catch (err) {
      console.error('PDF Compress Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const processCompression = async (targetFile?: File, qVal?: number, mime?: string) => {
    const activeFile = targetFile || file;
    if (!activeFile) return;

    if (activeFile.type === 'application/pdf' || activeFile.name.toLowerCase().endsWith('.pdf')) {
      return processPdfCompression(activeFile, qVal !== undefined ? qVal : quality);
    }

    setIsProcessing(true);
    try {
      const q = qVal !== undefined ? qVal : quality;
      const format = mime || targetFormat;

      const img = await loadImageFromFile(activeFile);
      const canvas = await compressImageCanvas(img, q, format);

      const result = await canvasToBlobUrl(canvas, format, q / 100);

      setCompressedUrl(result.url);
      setCompressedSize(result.size);
    } catch (err) {
      console.error('Compression Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQualityChange = (newVal: number) => {
    setQuality(newVal);
    processCompression(file || undefined, newVal, targetFormat);
  };

  const handleFormatChange = (newFormat: 'image/jpeg' | 'image/webp' | 'image/png' | 'application/pdf') => {
    setTargetFormat(newFormat);
    processCompression(file || undefined, quality, newFormat);
  };

  const handleDownload = () => {
    if (!compressedUrl || !file) return;
    if (isPdf) {
      const cleanName = file.name.replace(/\.pdf$/i, '') + `-compressed.pdf`;
      downloadProcessedFile(compressedUrl, cleanName);
    } else {
      const ext = targetFormat === 'image/webp' ? 'webp' : targetFormat === 'image/png' ? 'png' : 'jpg';
      const cleanName = file.name.replace(/\.[^/.]+$/, '') + `-compressed.${ext}`;
      downloadProcessedFile(compressedUrl, cleanName);
    }
  };

  const savedPercent =
    file && compressedSize
      ? Math.max(0, Math.round(((file.size - compressedSize) / file.size) * 100))
      : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </button>

        {compressedUrl && (
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/30 transition-colors"
          >
            <Download className="w-4 h-4" /> Download Compressed {isPdf ? 'PDF' : 'Image'}
          </button>
        )}
      </div>

      {!file ? (
        <div className="bg-slate-900 border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-400 mx-auto flex items-center justify-center">
            <FileArchive className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Compress Image & PDF File Size</h2>
            <p className="text-xs text-slate-400 mt-1">
              Reduce image and PDF document bytes dramatically while preserving document quality.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-lg shadow-emerald-950/30">
            <Upload className="w-4 h-4" /> Select Image or PDF
            <input
              type="file"
              accept="image/*, application/pdf, .pdf"
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
              <FileArchive className="w-4 h-4 text-purple-400" /> {isPdf ? 'PDF' : 'Image'} Compression
            </h3>

            {/* Target Format */}
            {!isPdf && (
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                  Output Format
                </label>
                <select
                  value={targetFormat}
                  onChange={(e) => handleFormatChange(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="image/jpeg">JPEG (High Compatibility)</option>
                  <option value="image/webp">WEBP (Web Ultra Compact)</option>
                  <option value="image/png">PNG (Lossless)</option>
                </select>
              </div>
            )}

            {/* Quality Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-slate-400">Compression Level</span>
                <span className="text-emerald-400 font-bold font-mono">{quality}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={95}
                value={quality}
                onChange={(e) => handleQualityChange(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Maximum Compression</span>
                <span>Best Clarity</span>
              </div>
            </div>

            {/* Reduction Metrics */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 block">Compression Summary</span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">Original File</span>
                  <span className="text-slate-300 font-bold">{formatBytes(file.size)}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Compressed</span>
                  <span className="text-emerald-400 font-bold">
                    {compressedSize ? formatBytes(compressedSize) : 'Calculating...'}
                  </span>
                </div>
              </div>

              {savedPercent > 0 && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Savings:</span>
                  <span className="text-emerald-400 font-extrabold font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    -{savedPercent}% Smaller
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 min-h-[400px]">
            {isPdf ? (
              <div className="p-8 text-center space-y-4 bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center font-bold text-xl">
                  PDF
                </div>
                <div>
                  <h4 className="text-base font-bold text-white block">{file.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {pdfPageCount ? `${pdfPageCount} pages document` : 'PDF Document'}
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl font-mono text-xs text-emerald-400">
                  {compressedSize ? (
                    <span>Original: {formatBytes(file.size)} → Compressed: {formatBytes(compressedSize)}</span>
                  ) : (
                    <span>Compressing PDF streams...</span>
                  )}
                </div>
              </div>
            ) : compressedUrl && previewUrl ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="space-y-2 text-center">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 max-h-[360px] flex items-center justify-center overflow-hidden">
                    <img src={previewUrl} alt="Original" className="max-h-[320px] object-contain rounded-lg" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 block">
                    Original ({formatBytes(file.size)})
                  </span>
                </div>

                <div className="space-y-2 text-center">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 max-h-[360px] flex items-center justify-center overflow-hidden">
                    <img src={compressedUrl} alt="Compressed" className="max-h-[320px] object-contain rounded-lg" />
                  </div>
                  <span className="text-xs font-bold text-emerald-400 block">
                    Compressed ({formatBytes(compressedSize || 0)})
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-xs">Processing compression...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
