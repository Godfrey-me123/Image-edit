import React, { useRef, useState, useEffect } from 'react';
import {
  ArrowLeft,
  Download,
  Type,
  ArrowRight as ArrowIcon,
  Square,
  Circle,
  Highlighter,
  Tag,
  Trash2,
  Save,
  Undo,
  Redo,
  Palette,
  Check
} from 'lucide-react';
import { Canvas, IText, Rect, Circle as FabricCircle, Line, Image as FabricImage } from 'fabric';
import { saveToMyPhotos } from '../../utils/myPhotosStorage';
import { downloadProcessedFile } from '../../utils/imageProcessing';

interface AnnotationToolProps {
  initialFile?: File | null;
  initialDataUrl?: string;
  onBack: () => void;
  onComplete?: (annotatedDataUrl: string) => void;
}

export const AnnotationTool: React.FC<AnnotationToolProps> = ({
  initialFile,
  initialDataUrl,
  onBack,
  onComplete
}) => {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);

  const [activeColor, setActiveColor] = useState('#2563EB');
  const [fontSize, setFontSize] = useState(24);
  const [hasImage, setHasImage] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);

  useEffect(() => {
    if (!canvasElRef.current) return;

    const canvas = new Canvas(canvasElRef.current, {
      width: Math.min(window.innerWidth - 48, 680),
      height: 480,
      backgroundColor: '#FFFFFF',
    });
    fabricRef.current = canvas;

    const saveState = () => {
      const json = JSON.stringify(canvas.toJSON());
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(json);
      historyIndexRef.current = historyRef.current.length - 1;
    };

    canvas.on('object:modified', saveState);
    canvas.on('object:added', saveState);
    canvas.on('object:removed', saveState);

    const initialJson = JSON.stringify(canvas.toJSON());
    historyRef.current = [initialJson];
    historyIndexRef.current = 0;

    const source = initialDataUrl || (initialFile ? URL.createObjectURL(initialFile) : null);
    if (source) {
      loadImageOntoCanvas(source);
    }

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  const loadImageOntoCanvas = (url: string) => {
    const imgEl = new Image();
    imgEl.crossOrigin = 'anonymous';
    imgEl.onload = () => {
      if (!fabricRef.current) return;
      const canvas = fabricRef.current;
      const maxW = Math.min(window.innerWidth - 48, 680);
      const scale = Math.min(maxW / imgEl.width, 480 / imgEl.height, 1);

      canvas.setDimensions({
        width: Math.round(imgEl.width * scale),
        height: Math.round(imgEl.height * scale),
      });

      const fabricImg = new FabricImage(imgEl, {
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
      });

      canvas.backgroundImage = fabricImg;
      canvas.renderAll();
      setHasImage(true);

      historyRef.current = [JSON.stringify(canvas.toJSON())];
      historyIndexRef.current = 0;
    };
    imgEl.src = url;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadImageOntoCanvas(URL.createObjectURL(file));
    }
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

  const addText = () => {
    if (!fabricRef.current) return;
    const text = new IText('Note / Label', {
      left: 60,
      top: 60,
      fontSize: fontSize,
      fill: activeColor,
      fontFamily: 'sans-serif',
      fontWeight: '600',
      cornerColor: '#2563EB',
      cornerSize: 10,
    });
    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    fabricRef.current.renderAll();
  };

  const addArrow = () => {
    if (!fabricRef.current) return;
    const line = new Line([50, 100, 200, 100], {
      stroke: activeColor,
      strokeWidth: 4,
      selectable: true,
      cornerColor: '#2563EB',
    });
    fabricRef.current.add(line);
    fabricRef.current.setActiveObject(line);
    fabricRef.current.renderAll();
  };

  const addRect = () => {
    if (!fabricRef.current) return;
    const rect = new Rect({
      left: 80,
      top: 80,
      width: 140,
      height: 90,
      fill: 'transparent',
      stroke: activeColor,
      strokeWidth: 3,
      rx: 8,
      ry: 8,
      cornerColor: '#2563EB',
      cornerSize: 10,
    });
    fabricRef.current.add(rect);
    fabricRef.current.setActiveObject(rect);
    fabricRef.current.renderAll();
  };

  const addCircle = () => {
    if (!fabricRef.current) return;
    const circle = new FabricCircle({
      left: 90,
      top: 90,
      radius: 45,
      fill: 'transparent',
      stroke: activeColor,
      strokeWidth: 3,
      cornerColor: '#2563EB',
      cornerSize: 10,
    });
    fabricRef.current.add(circle);
    fabricRef.current.setActiveObject(circle);
    fabricRef.current.renderAll();
  };

  const addHighlight = () => {
    if (!fabricRef.current) return;
    const highlight = new Rect({
      left: 70,
      top: 70,
      width: 180,
      height: 35,
      fill: 'rgba(250, 204, 21, 0.45)',
      stroke: 'rgba(234, 179, 8, 0.8)',
      strokeWidth: 1,
      rx: 4,
      ry: 4,
      cornerColor: '#2563EB',
      cornerSize: 10,
    });
    fabricRef.current.add(highlight);
    fabricRef.current.setActiveObject(highlight);
    fabricRef.current.renderAll();
  };

  const addLabel = () => {
    if (!fabricRef.current) return;
    const text = new IText('OFFICIAL ✓', {
      left: 80,
      top: 80,
      fontSize: 16,
      fill: '#FFFFFF',
      backgroundColor: activeColor,
      padding: 6,
      fontFamily: 'sans-serif',
      fontWeight: 'bold',
      cornerColor: '#2563EB',
      cornerSize: 10,
    });
    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    fabricRef.current.renderAll();
  };

  const deleteSelected = () => {
    if (!fabricRef.current) return;
    const active = fabricRef.current.getActiveObjects();
    if (active.length) {
      active.forEach((obj) => fabricRef.current?.remove(obj));
      fabricRef.current.discardActiveObject();
      fabricRef.current.renderAll();
    }
  };

  const handleSaveDraft = () => {
    if (!fabricRef.current) return;
    const dataUrl = fabricRef.current.toDataURL({ format: 'png', quality: 0.95, multiplier: 1 });
    saveToMyPhotos({
      title: `Draft Annotated Document - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      type: 'annotated',
      dataUrl,
    });
    setSuccessToast('Draft saved to My Photos!');
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const handleExportFinal = () => {
    if (!fabricRef.current) return;
    fabricRef.current.discardActiveObject();
    fabricRef.current.renderAll();

    const dataUrl = fabricRef.current.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
    saveToMyPhotos({
      title: `Annotated Image - ${new Date().toLocaleDateString()}`,
      type: 'annotated',
      dataUrl,
    });

    if (onComplete) {
      onComplete(dataUrl);
    } else {
      downloadProcessedFile(dataUrl, 'annotated-image.png');
    }
    setSuccessToast('Final annotated image exported!');
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const colors = ['#2563EB', '#475569', '#16A34A', '#D97706', '#9333EA', '#0F172A', '#EAB308'];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
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
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Annotation Suite</h1>
        <p className="text-xs text-slate-500">
          Add editable notes, stamps, arrows, shapes, and highlights. Select any element to move, resize, rotate, or delete.
        </p>
      </div>

      {successToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3 rounded-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Toolbar Controls */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Shape / Tool Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={addText}
            className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-700 transition-colors"
          >
            <Type className="w-3.5 h-3.5" /> Text
          </button>
          <button
            onClick={addArrow}
            className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-700 transition-colors"
          >
            <ArrowIcon className="w-3.5 h-3.5" /> Arrow
          </button>
          <button
            onClick={addRect}
            className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-700 transition-colors"
          >
            <Square className="w-3.5 h-3.5" /> Box
          </button>
          <button
            onClick={addCircle}
            className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-700 transition-colors"
          >
            <Circle className="w-3.5 h-3.5" /> Circle
          </button>
          <button
            onClick={addHighlight}
            className="px-3 py-1.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-700 transition-colors"
          >
            <Highlighter className="w-3.5 h-3.5" /> Highlight
          </button>
          <button
            onClick={addLabel}
            className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-700 transition-colors"
          >
            <Tag className="w-3.5 h-3.5" /> Label
          </button>
        </div>

        {/* Undo, Redo, Delete */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
          <button
            onClick={deleteSelected}
            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
            title="Delete Selected Element"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1.5">
          <Palette className="w-4 h-4 text-slate-400 mr-1" />
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setActiveColor(c)}
              style={{ backgroundColor: c }}
              className={`w-6 h-6 rounded-full transition-transform ${
                activeColor === c ? 'scale-125 ring-2 ring-blue-500 ring-offset-2' : 'hover:scale-110'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative bg-slate-100 p-4 rounded-3xl border border-slate-200 flex flex-col items-center justify-center min-h-[360px] overflow-auto">
        {!hasImage && (
          <div className="mb-4 text-center">
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-sm">
              Upload Background Photo
              <input type="file" accept="image/*" className="sr-only" onChange={handleFileUpload} />
            </label>
          </div>
        )}
        <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-lg bg-white">
          <canvas ref={canvasElRef} />
        </div>
      </div>
    </div>
  );
};
