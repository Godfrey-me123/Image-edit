import React, { useRef, useState, useEffect } from 'react';
import {
  ArrowLeft,
  Upload,
  Download,
  RotateCw,
  Trash2,
  PenTool,
  Check,
  Plus,
  Undo,
  Redo,
  Save,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { Canvas, Image as FabricImage } from 'fabric';
import { getMyPhotos, getSavedSignatures, saveToMyPhotos, SavedSignatureItem } from '../../utils/myPhotosStorage';
import { downloadProcessedFile } from '../../utils/imageProcessing';

interface SignPhotoToolProps {
  initialFile?: File | null;
  initialDataUrl?: string;
  onBack: () => void;
  onOpenSignatureDrawer?: () => void;
}

export const SignPhotoTool: React.FC<SignPhotoToolProps> = ({
  initialFile,
  initialDataUrl,
  onBack,
  onOpenSignatureDrawer,
}) => {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);

  const [hasPhoto, setHasPhoto] = useState(false);
  const [savedSignatures, setSavedSignatures] = useState<SavedSignatureItem[]>([]);
  const [selectedSigIndex, setSelectedSigIndex] = useState<number | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);

  // Load saved signatures automatically on mount and whenever refreshed
  useEffect(() => {
    setSavedSignatures(getSavedSignatures());
  }, []);

  useEffect(() => {
    if (!canvasElRef.current) return;
    const canvas = new Canvas(canvasElRef.current, {
      width: Math.min(window.innerWidth - 48, 540),
      height: 480,
      backgroundColor: '#F8FAFC',
    });
    fabricRef.current = canvas;

    const source = initialDataUrl || (initialFile ? URL.createObjectURL(initialFile) : null);
    if (source) {
      loadPhoto(source);
    }

    const saveState = () => {
      const json = JSON.stringify(canvas.toJSON());
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(json);
      historyIndexRef.current = historyRef.current.length - 1;
    };

    canvas.on('object:modified', saveState);
    canvas.on('object:added', saveState);
    canvas.on('object:removed', saveState);

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  const loadPhoto = (url: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!fabricRef.current) return;
      const canvas = fabricRef.current;
      const maxW = Math.min(window.innerWidth - 48, 540);
      const maxH = 460;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);

      const targetW = Math.round(img.width * scale);
      const targetH = Math.round(img.height * scale);

      canvas.setDimensions({
        width: targetW,
        height: targetH,
      });

      const fabricImg = new FabricImage(img, {
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
      });

      canvas.backgroundImage = fabricImg;
      canvas.renderAll();
      setHasPhoto(true);

      historyRef.current = [JSON.stringify(canvas.toJSON())];
      historyIndexRef.current = 0;
    };
    img.src = url;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadPhoto(URL.createObjectURL(file));
    }
  };

  const addSignatureToCanvas = (sigDataUrl: string) => {
    if (!fabricRef.current) return;
    const sigImg = new Image();
    sigImg.crossOrigin = 'anonymous';
    sigImg.onload = () => {
      if (!fabricRef.current) return;
      const canvas = fabricRef.current;

      // Calculate initial proportion
      const targetScale = Math.min(180 / sigImg.width, canvas.width * 0.45 / sigImg.width, 0.6);

      const fabricSig = new FabricImage(sigImg, {
        left: Math.round(canvas.width / 2 - (sigImg.width * targetScale) / 2),
        top: Math.round(canvas.height * 0.65),
        scaleX: targetScale,
        scaleY: targetScale,
        cornerColor: '#2563EB',
        cornerStyle: 'rect',
        cornerSize: 10,
        transparentCorners: false,
        borderColor: '#2563EB',
        borderScaleFactor: 2,
        hasRotatingPoint: true,
      });

      canvas.add(fabricSig);
      canvas.setActiveObject(fabricSig);
      canvas.renderAll();
    };
    sigImg.src = sigDataUrl;
  };

  const handleUndo = () => {
    if (!fabricRef.current || historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const json = historyRef.current[historyIndexRef.current];
    fabricRef.current.loadFromJSON(json, () => {
      fabricRef.current?.renderAll();
    });
  };

  const handleRedo = () => {
    if (!fabricRef.current || historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const json = historyRef.current[historyIndexRef.current];
    fabricRef.current.loadFromJSON(json, () => {
      fabricRef.current?.renderAll();
    });
  };

  const deleteActiveObject = () => {
    if (!fabricRef.current) return;
    const active = fabricRef.current.getActiveObjects();
    if (active.length) {
      active.forEach((obj) => fabricRef.current?.remove(obj));
      fabricRef.current.discardActiveObject();
      fabricRef.current.renderAll();
    }
  };

  // 1. Save Draft (saves editable state to My Photos)
  const handleSaveDraft = () => {
    if (!fabricRef.current) return;
    const dataUrl = fabricRef.current.toDataURL({ format: 'png', quality: 0.95, multiplier: 1 });
    saveToMyPhotos({
      title: `Draft Signed Document - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      type: 'signed',
      dataUrl,
    });
    setSaveSuccessMessage('Draft saved to My Photos!');
    setTimeout(() => setSaveSuccessMessage(null), 2500);
  };

  // 2. Export Image (generates final flattened signed photo download)
  const handleExportFinal = () => {
    if (!fabricRef.current) return;
    fabricRef.current.discardActiveObject();
    fabricRef.current.renderAll();

    const dataUrl = fabricRef.current.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
    saveToMyPhotos({
      title: `Final Signed Document - ${new Date().toLocaleDateString()}`,
      type: 'signed',
      dataUrl,
    });
    downloadProcessedFile(dataUrl, 'signed-photo-final.png');
    setSaveSuccessMessage('Final signed image exported!');
    setTimeout(() => setSaveSuccessMessage(null), 2500);
  };

  const myPhotos = getMyPhotos();

  return (
    <div className="w-full max-w-xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {hasPhoto && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDraft}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" /> Save Draft
            </button>
            <button
              onClick={handleExportFinal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Export Final
            </button>
          </div>
        )}
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Sign Photo Studio</h1>
        <p className="text-xs text-slate-500 mt-1">
          Select an image, place your saved signature, and drag, resize, or rotate it anywhere on the document.
        </p>
      </div>

      {saveSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3 rounded-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Main Canvas Work Area */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex flex-col items-center">
        {!hasPhoto ? (
          <div className="p-8 text-center space-y-4 w-full">
            <label className="p-8 border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 rounded-2xl block cursor-pointer transition-colors group">
              <Upload className="w-10 h-10 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="block font-bold text-sm text-slate-900">Choose Photo / Document to Sign</span>
              <span className="block text-xs text-slate-500 mt-1">Upload JPG, PNG, or passport photo</span>
              <input type="file" accept="image/*" className="sr-only" onChange={handleFileUpload} />
            </label>

            {myPhotos.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-500 block mb-2 text-left">
                  Or select from My Photos:
                </span>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {myPhotos.slice(0, 6).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadPhoto(item.dataUrl)}
                      className="min-w-[68px] h-18 rounded-xl border border-slate-200 overflow-hidden hover:ring-2 hover:ring-blue-500 flex-shrink-0 relative group"
                    >
                      <img src={item.dataUrl} alt={item.title} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-white text-[8px] truncate px-1">
                        {item.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 w-full flex flex-col items-center">
            <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-sm bg-white">
              <canvas ref={canvasElRef} />
            </div>

            {/* Quick Canvas Controls */}
            <div className="flex items-center justify-between w-full text-xs pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUndo}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold flex items-center gap-1"
                >
                  <Undo className="w-3.5 h-3.5" /> Undo
                </button>
                <button
                  onClick={handleRedo}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold flex items-center gap-1"
                >
                  <Redo className="w-3.5 h-3.5" /> Redo
                </button>
              </div>
              <button
                onClick={deleteActiveObject}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Signature Selector Section (Automatically shows saved signatures) */}
      {hasPhoto && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              Select Signature to Place on Document:
            </span>
            {onOpenSignatureDrawer && (
              <button
                onClick={onOpenSignatureDrawer}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Draw New Signature
              </button>
            )}
          </div>

          {savedSignatures.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 space-y-2">
              <span>No signatures saved yet in your library.</span>
              {onOpenSignatureDrawer && (
                <button
                  onClick={onOpenSignatureDrawer}
                  className="block mx-auto px-3.5 py-1.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-sm"
                >
                  Create Signature Now
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {savedSignatures.map((sig, idx) => (
                <button
                  key={sig.id}
                  onClick={() => {
                    setSelectedSigIndex(idx);
                    addSignatureToCanvas(sig.dataUrl);
                  }}
                  className={`p-2.5 rounded-xl border bg-slate-50 flex flex-col items-center justify-between h-20 transition-all ${
                    selectedSigIndex === idx
                      ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={sig.dataUrl} alt="Signature" className="max-h-11 max-w-full object-contain" />
                  <span className="text-[9px] text-slate-500 truncate w-full text-center">
                    {sig.title || `Signature ${idx + 1}`}
                  </span>
                </button>
              ))}
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            Tip: Tap on the placed signature to move, use circular corner handles to scale, or top handle to rotate.
          </p>
        </div>
      )}
    </div>
  );
};
