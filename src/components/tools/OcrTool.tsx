import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Download,
  Upload,
  ArrowLeft,
  Check,
  Search,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { OcrResult } from '../../types/imageTools';
import { formatBytes } from '../../utils/imageProcessing';

interface OcrToolProps {
  initialFile?: File | null;
  onBack: () => void;
}

export const OcrTool: React.FC<OcrToolProps> = ({ initialFile, onBack }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialFile) {
      handleFileSelect(initialFile);
    }
  }, [initialFile]);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setOcrResult(null);
    setError(null);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    await processOcr(selectedFile);
  };

  const processOcr = async (targetFile: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(targetFile);
      });

      const res = await fetch('/api/ai/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'OCR processing failed');
      }

      setOcrResult(json.data);
    } catch (err: any) {
      console.error('OCR Error:', err);
      setError(err.message || 'Error extracting text from image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyText = () => {
    if (!ocrResult?.extractedText) return;
    navigator.clipboard.writeText(ocrResult.extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!ocrResult?.extractedText || !file) return;
    const blob = new Blob([ocrResult.extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name.replace(/\.[^/.]+$/, '') + '-ocr.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

        {ocrResult?.extractedText && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Text'}
            </button>
            <button
              onClick={handleDownloadTxt}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/30 transition-colors"
            >
              <Download className="w-4 h-4" /> Download .txt File
            </button>
          </div>
        )}
      </div>

      {!file ? (
        <div className="bg-slate-900 border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">OCR Text Extraction</h2>
            <p className="text-xs text-slate-400 mt-1">
              Extract printed or handwritten text from screenshots, documents, and receipts.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-lg shadow-emerald-950/30">
            <Upload className="w-4 h-4" /> Select Image Document
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Image View */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" /> Source Image Document
              </span>
              <label className="text-xs text-emerald-400 cursor-pointer font-semibold hover:underline">
                Upload New Image
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

            {previewUrl && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2 max-h-[420px] flex items-center justify-center overflow-hidden">
                <img src={previewUrl} alt="Source" className="max-h-[380px] object-contain rounded-lg" />
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{file.name} ({formatBytes(file.size)})</span>
              <button
                onClick={() => processOcr(file)}
                disabled={isProcessing}
                className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                Re-scan OCR
              </button>
            </div>
          </div>

          {/* OCR Extracted Text Result Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between min-h-[420px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Extracted Text Output
              </span>
              {ocrResult && (
                <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                  <span>{ocrResult.wordCount} words</span>
                  <span>·</span>
                  <span>{ocrResult.confidenceScore}% confidence</span>
                </div>
              )}
            </div>

            {isProcessing ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-300 font-semibold">
                  Reading Text Structures & Symbols with Gemini OCR...
                </p>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-2xl text-xs text-rose-300">
                {error}
              </div>
            ) : ocrResult ? (
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-y-auto max-h-[360px] font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
                {ocrResult.extractedText}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                Scanning document...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
