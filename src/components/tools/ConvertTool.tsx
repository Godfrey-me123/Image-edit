import React, { useState } from 'react';
import {
  FileType,
  Download,
  Upload,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Layers,
  Trash2
} from 'lucide-react';
import { ExportFormat } from '../../types/imageTools';
import {
  formatBytes,
  loadImageFromFile,
  convertFormatCanvas,
  canvasToBlobUrl,
  downloadProcessedFile
} from '../../utils/imageProcessing';

interface ConvertToolProps {
  initialFiles?: File[] | null;
  onBack: () => void;
}

interface BatchConvertItem {
  id: string;
  file: File;
  targetFormat: ExportFormat;
  convertedUrl?: string;
  convertedSize?: number;
  status: 'idle' | 'processing' | 'done' | 'error';
}

export const ConvertTool: React.FC<ConvertToolProps> = ({ initialFiles, onBack }) => {
  const [targetFormat, setTargetFormat] = useState<ExportFormat>('image/png');
  const [quality, setQuality] = useState<number>(90);
  const [items, setItems] = useState<BatchConvertItem[]>(() => {
    if (initialFiles && initialFiles.length > 0) {
      return initialFiles.map((f) => ({
        id: Math.random().toString(36).substring(7),
        file: f,
        targetFormat: 'image/png',
        status: 'idle',
      }));
    }
    return [];
  });

  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);

  const handleAddFiles = (fileList: FileList) => {
    const newItems: BatchConvertItem[] = Array.from(fileList).map((f) => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      targetFormat,
      status: 'idle',
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const handleConvertAll = async () => {
    setIsBatchProcessing(true);

    const updated = [...items];
    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      item.status = 'processing';
      setItems([...updated]);

      try {
        const img = await loadImageFromFile(item.file);
        const canvas = await convertFormatCanvas(img, targetFormat);
        const result = await canvasToBlobUrl(canvas, targetFormat, quality / 100);

        item.convertedUrl = result.url;
        item.convertedSize = result.size;
        item.targetFormat = targetFormat;
        item.status = 'done';
      } catch (err) {
        console.error('Convert item error:', err);
        item.status = 'error';
      }

      setItems([...updated]);
    }

    setIsBatchProcessing(false);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const downloadItem = (item: BatchConvertItem) => {
    if (!item.convertedUrl) return;
    const ext =
      item.targetFormat === 'image/jpeg'
        ? 'jpg'
        : item.targetFormat === 'image/webp'
        ? 'webp'
        : item.targetFormat === 'image/avif'
        ? 'avif'
        : 'png';
    const cleanName = item.file.name.replace(/\.[^/.]+$/, '') + `.${ext}`;
    downloadProcessedFile(item.convertedUrl, cleanName);
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

        {items.some((i) => i.status === 'done') && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => items.filter((i) => i.status === 'done').forEach(downloadItem)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/30 transition-colors"
            >
              <Download className="w-4 h-4" /> Download All Converted
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-slate-900 border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-400 mx-auto flex items-center justify-center">
            <FileType className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Convert Image Formats</h2>
            <p className="text-xs text-slate-400 mt-1">
              Convert single or batch image files to JPG, PNG, WEBP, or AVIF.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-lg shadow-emerald-950/30">
            <Upload className="w-4 h-4" /> Select Image Files
            <input
              type="file"
              multiple
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files) handleAddFiles(e.target.files);
              }}
            />
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Target Format Header Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-sm font-bold text-white block">Target Output Format</span>
              <p className="text-xs text-slate-400">Select format for all batch queue items</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[
                  { label: 'PNG', mime: 'image/png' },
                  { label: 'JPG', mime: 'image/jpeg' },
                  { label: 'WEBP', mime: 'image/webp' },
                  { label: 'AVIF', mime: 'image/avif' },
                ].map((fmt) => (
                  <button
                    key={fmt.label}
                    onClick={() => setTargetFormat(fmt.mime as any)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      targetFormat === fmt.mime
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>

              <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Add More
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files) handleAddFiles(e.target.files);
                  }}
                />
              </label>

              <button
                onClick={handleConvertAll}
                disabled={isBatchProcessing}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-md shadow-emerald-950/20"
              >
                <RefreshCw className={`w-4 h-4 ${isBatchProcessing ? 'animate-spin' : ''}`} />
                Convert {items.length} Files
              </button>
            </div>
          </div>

          {/* Batch File Queue Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>File Queue ({items.length} items)</span>
              <span>Zero-Storage Client Processing</span>
            </div>

            <div className="divide-y divide-slate-800">
              {items.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-[10px] text-teal-400 uppercase">
                      {item.file.name.split('.').pop() || 'IMG'}
                    </div>
                    <div>
                      <span className="font-semibold text-white block">{item.file.name}</span>
                      <span className="text-slate-400 block font-mono">
                        {formatBytes(item.file.size)}{' '}
                        {item.convertedSize && `→ ${formatBytes(item.convertedSize)} (${item.targetFormat.split('/')[1].toUpperCase()})`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.status === 'processing' && (
                      <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Converting...
                      </span>
                    )}
                    {item.status === 'done' && (
                      <button
                        onClick={() => downloadItem(item)}
                        className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl font-bold flex items-center gap-1.5 hover:bg-emerald-500/30 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    )}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
