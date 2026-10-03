import React, { useState } from 'react';
import {
  ArrowLeft,
  Trash2,
  Download,
  Printer,
  Calendar,
  Layers,
  FileCheck,
  Eye,
  PenTool,
  Edit3,
  BookmarkCheck,
  RefreshCw,
  Clock,
  HardDrive,
  Maximize2
} from 'lucide-react';
import { getMyPhotos, deleteMyPhoto, SavedPhotoItem } from '../../utils/myPhotosStorage';
import { downloadProcessedFile, formatBytes } from '../../utils/imageProcessing';

interface MyPhotosToolProps {
  onBack: () => void;
  onOpenInAnnotation?: (dataUrl: string) => void;
  onOpenInSignPhoto?: (dataUrl: string) => void;
  onResumeDraft?: (draftState: any) => void;
}

export const MyPhotosTool: React.FC<MyPhotosToolProps> = ({
  onBack,
  onOpenInAnnotation,
  onOpenInSignPhoto,
  onResumeDraft,
}) => {
  const [photos, setPhotos] = useState<SavedPhotoItem[]>(getMyPhotos());
  const [filter, setFilter] = useState<'all' | 'passport' | 'sheet' | 'signed' | 'annotated' | 'draft'>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<SavedPhotoItem | null>(null);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMyPhoto(id);
    setPhotos(getMyPhotos());
    if (selectedPhoto?.id === id) {
      setSelectedPhoto(null);
    }
  };

  const handleDownload = (photo: SavedPhotoItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    downloadProcessedFile(photo.dataUrl, `${photo.title.toLowerCase().replace(/\s+/g, '-')}.png`);
  };

  const handlePrint = (photo: SavedPhotoItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>${photo.title}</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
              img { max-width: 100%; height: auto; display: block; }
              @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            </style>
          </head>
          <body>
            <img src="${photo.dataUrl}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  const filtered = photos.filter((p) => {
    if (filter === 'all') return true;
    return p.type === filter;
  });

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-[11px] sm:text-xs font-semibold text-slate-500 bg-white px-2.5 sm:px-3 py-1 rounded-full border border-slate-200">
          {photos.length} item{photos.length === 1 ? '' : 's'} stored privately
        </span>
      </div>

      <div>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900">My Photos & Library</h1>
        <p className="text-xs text-slate-500 mt-1">
          Access all your exported passport photos, multi-photo print sheets, digital signatures, and saved editable project drafts.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
        {[
          { key: 'all', label: 'All Creations' },
          { key: 'passport', label: 'Passport Photos' },
          { key: 'sheet', label: 'Print Sheets' },
          { key: 'draft', label: 'Saved Drafts' },
          { key: 'signed', label: 'Signed' },
          { key: 'annotated', label: 'Annotated' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
              filter === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 space-y-3">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">No items found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Create or export passport photos, print sheets, or signed documents to have them automatically appear here with full metadata.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedPhoto(item)}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="relative aspect-[3/4] bg-slate-100 flex items-center justify-center overflow-hidden">
                <img src={item.dataUrl} alt={item.title} className="w-full h-full object-contain p-2" />
                <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm ${
                  item.type === 'draft' ? 'bg-amber-600 text-white' : 'bg-slate-900/75 text-white'
                }`}>
                  {item.type.toUpperCase()}
                </span>
              </div>
              <div className="p-2.5 sm:p-3 space-y-1.5">
                <h4 className="text-xs font-bold text-slate-900 truncate">{item.title}</h4>

                {/* Metadata Summary */}
                <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                  {item.widthMm && item.heightMm && (
                    <div className="truncate">{item.widthMm}×{item.heightMm} mm {item.dpi ? `(${item.dpi} DPI)` : ''}</div>
                  )}
                  {item.fileSizeBytes && (
                    <div className="text-slate-400">{formatBytes(item.fileSizeBytes)}</div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDownload(item, e)}
                      className="p-1 hover:text-blue-600 active:scale-90"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1 hover:text-rose-600"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Metadata Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1 ${
                  selectedPhoto.type === 'draft' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedPhoto.type.toUpperCase()}
                </span>
                <h3 className="font-bold text-slate-900 text-base">{selectedPhoto.title}</h3>
                <span className="text-xs text-slate-400">
                  Created {new Date(selectedPhoto.timestamp).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Preview Image */}
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-center max-h-[300px] overflow-hidden border border-slate-200">
              <img
                src={selectedPhoto.dataUrl}
                alt={selectedPhoto.title}
                className="max-h-[260px] max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>

            {/* Complete Metadata Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Template Standard</span>
                <span className="font-bold text-slate-800">{selectedPhoto.templateName || 'Custom / Photo'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Physical Size</span>
                <span className="font-bold text-slate-800">
                  {selectedPhoto.widthMm && selectedPhoto.heightMm
                    ? `${selectedPhoto.widthMm} × ${selectedPhoto.heightMm} mm`
                    : 'Standard'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Resolution & DPI</span>
                <span className="font-bold text-slate-800">
                  {selectedPhoto.widthPx && selectedPhoto.heightPx
                    ? `${selectedPhoto.widthPx} × ${selectedPhoto.heightPx} px (${selectedPhoto.dpi || 300} DPI)`
                    : `${selectedPhoto.dpi || 300} DPI`}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">File Weight</span>
                <span className="font-bold text-slate-800">
                  {selectedPhoto.fileSizeBytes ? formatBytes(selectedPhoto.fileSizeBytes) : 'Optimized PNG'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {/* If it's a draft, offer Resume Project */}
              {selectedPhoto.draftState && onResumeDraft && (
                <button
                  onClick={() => {
                    const st = selectedPhoto.draftState;
                    setSelectedPhoto(null);
                    onResumeDraft(st);
                  }}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <RefreshCw className="w-4 h-4" /> Resume & Edit Draft Project
                </button>
              )}

              <button
                onClick={() => handleDownload(selectedPhoto)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <Download className="w-4 h-4" /> Download
              </button>
              <button
                onClick={() => handlePrint(selectedPhoto)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              {onOpenInSignPhoto && (
                <button
                  onClick={() => {
                    const url = selectedPhoto.dataUrl;
                    setSelectedPhoto(null);
                    onOpenInSignPhoto(url);
                  }}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  title="Sign Photo"
                >
                  <PenTool className="w-4 h-4" /> Sign
                </button>
              )}
              {onOpenInAnnotation && (
                <button
                  onClick={() => {
                    const url = selectedPhoto.dataUrl;
                    setSelectedPhoto(null);
                    onOpenInAnnotation(url);
                  }}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  title="Annotate"
                >
                  <Edit3 className="w-4 h-4" /> Annotate
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
