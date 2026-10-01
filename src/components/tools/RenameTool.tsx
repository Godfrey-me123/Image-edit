import React, { useState } from 'react';
import {
  FileEdit,
  Download,
  Upload,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Hash,
  Search,
  Type
} from 'lucide-react';
import { RenameOptions } from '../../types/imageTools';
import { formatBytes, downloadProcessedFile } from '../../utils/imageProcessing';

interface RenameToolProps {
  initialFiles?: File[] | null;
  onBack: () => void;
}

interface RenameQueueItem {
  id: string;
  file: File;
  originalName: string;
  extension: string;
  proposedName: string;
  blobUrl: string;
}

export const RenameTool: React.FC<RenameToolProps> = ({ initialFiles, onBack }) => {
  const [items, setItems] = useState<RenameQueueItem[]>(() => {
    if (initialFiles && initialFiles.length > 0) {
      return initialFiles.map((f) => {
        const lastDot = f.name.lastIndexOf('.');
        const nameWithoutExt = lastDot > 0 ? f.name.substring(0, lastDot) : f.name;
        const ext = lastDot > 0 ? f.name.substring(lastDot) : '';
        return {
          id: Math.random().toString(36).substring(7),
          file: f,
          originalName: nameWithoutExt,
          extension: ext,
          proposedName: nameWithoutExt + ext,
          blobUrl: URL.createObjectURL(f),
        };
      });
    }
    return [];
  });

  const [options, setOptions] = useState<RenameOptions>({
    patternMode: 'sequential',
    customName: 'Image',
    prefix: '',
    suffix: '_edited',
    startNumber: 1,
    numberPadding: 3,
    findText: '',
    replaceText: '',
    casing: 'preserve',
    spaceReplacement: 'hyphen',
  });

  const handleAddFiles = (fileList: FileList) => {
    const newItems: RenameQueueItem[] = Array.from(fileList).map((f) => {
      const lastDot = f.name.lastIndexOf('.');
      const nameWithoutExt = lastDot > 0 ? f.name.substring(0, lastDot) : f.name;
      const ext = lastDot > 0 ? f.name.substring(lastDot) : '';
      return {
        id: Math.random().toString(36).substring(7),
        file: f,
        originalName: nameWithoutExt,
        extension: ext,
        proposedName: nameWithoutExt + ext,
        blobUrl: URL.createObjectURL(f),
      };
    });
    setItems((prev) => {
      const updated = [...prev, ...newItems];
      return recalculateNames(updated, options);
    });
  };

  const recalculateNames = (
    currentItems: RenameQueueItem[],
    opts: RenameOptions
  ): RenameQueueItem[] => {
    return currentItems.map((item, index) => {
      let baseName = item.originalName;

      switch (opts.patternMode) {
        case 'sequential': {
          const num = opts.startNumber + index;
          const paddedNum = String(num).padStart(opts.numberPadding, '0');
          baseName = `${opts.customName || 'Image'}_${paddedNum}`;
          break;
        }
        case 'prefix-suffix': {
          baseName = `${opts.prefix}${item.originalName}${opts.suffix}`;
          break;
        }
        case 'custom': {
          baseName = currentItems.length > 1
            ? `${opts.customName || 'Image'}_${index + 1}`
            : (opts.customName || item.originalName);
          break;
        }
        case 'find-replace': {
          if (opts.findText) {
            const regex = new RegExp(escapeRegExp(opts.findText), 'gi');
            baseName = item.originalName.replace(regex, opts.replaceText);
          }
          break;
        }
        case 'clean': {
          baseName = item.originalName;
          break;
        }
      }

      // Space replacements
      if (opts.spaceReplacement === 'hyphen') {
        baseName = baseName.replace(/\s+/g, '-');
      } else if (opts.spaceReplacement === 'underscore') {
        baseName = baseName.replace(/\s+/g, '_');
      }

      // Casing adjustments
      if (opts.casing === 'lowercase') {
        baseName = baseName.toLowerCase();
      } else if (opts.casing === 'uppercase') {
        baseName = baseName.toUpperCase();
      } else if (opts.casing === 'titlecase') {
        baseName = baseName.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
      }

      return {
        ...item,
        proposedName: baseName + item.extension,
      };
    });
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const handleOptionChange = (newOpts: Partial<RenameOptions>) => {
    const updatedOpts = { ...options, ...newOpts };
    setOptions(updatedOpts);
    setItems((prev) => recalculateNames(prev, updatedOpts));
  };

  const handleIndividualProposedNameChange = (id: string, newProposed: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, proposedName: newProposed } : item))
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const remaining = prev.filter((i) => i.id !== id);
      return recalculateNames(remaining, options);
    });
  };

  const downloadSingle = (item: RenameQueueItem) => {
    downloadProcessedFile(item.blobUrl, item.proposedName);
  };

  const downloadAll = () => {
    items.forEach((item, i) => {
      setTimeout(() => {
        downloadProcessedFile(item.blobUrl, item.proposedName);
      }, i * 200);
    });
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

        {items.length > 0 && (
          <button
            onClick={downloadAll}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/30 transition-colors"
          >
            <Download className="w-4 h-4" /> Download All Renamed ({items.length})
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-slate-900 border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/20 text-orange-400 mx-auto flex items-center justify-center">
            <FileEdit className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Rename Image Files</h2>
            <p className="text-xs text-slate-400 mt-1">
              Batch rename photo titles, apply sequential numbers, add prefixes/suffixes, or search & replace.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-lg shadow-emerald-950/30">
            <Upload className="w-4 h-4" /> Select Images or PDFs to Rename
            <input
              type="file"
              multiple
              accept="image/*, application/pdf, .pdf"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files) handleAddFiles(e.target.files);
              }}
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileEdit className="w-4 h-4 text-orange-400" /> Renaming Pattern
            </h3>

            {/* Pattern Mode Selector */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-medium">Mode</label>
              <select
                value={options.patternMode}
                onChange={(e) => handleOptionChange({ patternMode: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="sequential">Sequential Numbering (Photo_001.png)</option>
                <option value="prefix-suffix">Prefix & Suffix (edited_Photo_v2.png)</option>
                <option value="custom">Custom Title / Name</option>
                <option value="find-replace">Find & Replace Text</option>
                <option value="clean">Format & Clean Spaces</option>
              </select>
            </div>

            {/* Dynamic Controls Based on Pattern Mode */}
            {options.patternMode === 'sequential' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Base Name / Title</label>
                  <input
                    type="text"
                    value={options.customName}
                    onChange={(e) => handleOptionChange({ customName: e.target.value })}
                    placeholder="e.g. Vacation_Photo"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Start At</label>
                    <input
                      type="number"
                      min={1}
                      value={options.startNumber}
                      onChange={(e) => handleOptionChange({ startNumber: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Padding</label>
                    <select
                      value={options.numberPadding}
                      onChange={(e) => handleOptionChange({ numberPadding: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    >
                      <option value={1}>1 (1, 2, 3)</option>
                      <option value={2}>2 (01, 02, 03)</option>
                      <option value={3}>3 (001, 002, 003)</option>
                      <option value={4}>4 (0001, 0002)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {options.patternMode === 'prefix-suffix' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Prefix (Add to front)</label>
                  <input
                    type="text"
                    value={options.prefix}
                    onChange={(e) => handleOptionChange({ prefix: e.target.value })}
                    placeholder="e.g. draft_"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Suffix (Add to end)</label>
                  <input
                    type="text"
                    value={options.suffix}
                    onChange={(e) => handleOptionChange({ suffix: e.target.value })}
                    placeholder="e.g. _v2"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>
            )}

            {options.patternMode === 'custom' && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">New Image Title</label>
                <input
                  type="text"
                  value={options.customName}
                  onChange={(e) => handleOptionChange({ customName: e.target.value })}
                  placeholder="New_Image_Title"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            )}

            {options.patternMode === 'find-replace' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Find Text</label>
                  <input
                    type="text"
                    value={options.findText}
                    onChange={(e) => handleOptionChange({ findText: e.target.value })}
                    placeholder="e.g. DSC_"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Replace With</label>
                  <input
                    type="text"
                    value={options.replaceText}
                    onChange={(e) => handleOptionChange({ replaceText: e.target.value })}
                    placeholder="e.g. Wedding_"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>
            )}

            {/* Space Formatting & Casing Options */}
            <div className="pt-2 border-t border-slate-800/80 space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Spaces Replacement</label>
                <select
                  value={options.spaceReplacement}
                  onChange={(e) => handleOptionChange({ spaceReplacement: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="none font-mono">Keep Original Spaces</option>
                  <option value="hyphen">Replace Spaces with Hyphens (-)</option>
                  <option value="underscore">Replace Spaces with Underscores (_)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Letter Casing</label>
                <select
                  value={options.casing}
                  onChange={(e) => handleOptionChange({ casing: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="preserve">Preserve Original Case</option>
                  <option value="lowercase">lowercase (photo.png)</option>
                  <option value="uppercase">UPPERCASE (PHOTO.PNG)</option>
                  <option value="titlecase">Title Case (Photo.png)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Preview Column */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  Renamed Name Preview ({items.length} files)
                </span>
                <label className="text-xs text-emerald-400 hover:underline cursor-pointer font-semibold">
                  + Add More Files
                  <input
                    type="file"
                    multiple
                    accept="image/*, application/pdf, .pdf"
                    className="sr-only"
                    onChange={(e) => {
                      if (e.target.files) handleAddFiles(e.target.files);
                    }}
                  />
                </label>
              </div>

              <div className="divide-y divide-slate-800">
                {items.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-500 line-through block truncate max-w-xs font-mono">
                        {item.file.name}
                      </span>
                      <input
                        type="text"
                        value={item.proposedName}
                        onChange={(e) => handleIndividualProposedNameChange(item.id, e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-emerald-400 font-bold font-mono focus:outline-none focus:border-emerald-500 w-full sm:w-80 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => downloadSingle(item)}
                        className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl font-bold flex items-center gap-1.5 hover:bg-emerald-500/30 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span>🔒 100% In-Memory Renaming — Zero Database Saves</span>
              <button
                onClick={downloadAll}
                className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400 transition-colors"
              >
                Download All ({items.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
