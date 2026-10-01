import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, Camera, Users, Check } from 'lucide-react';
import { Canvas, Image as FabricImage } from 'fabric';
import { PassportDocumentSpec, PASSPORT_SPECS } from '../../types/passport';

interface PassportToolProps {
  initialFile?: File | null;
  onBack: () => void;
}

export const PassportTool: React.FC<PassportToolProps> = ({ initialFile, onBack }) => {
  const [step, setStep] = useState<'country' | 'photo' | 'edit'>('country');
  const [selectedSpec, setSelectedSpec] = useState<PassportDocumentSpec | null>(null);
  const [file, setFile] = useState<File | null>(initialFile || null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<Canvas | null>(null);

  useEffect(() => {
    if (step === 'edit' && canvasRef.current && !fabricCanvas.current) {
      fabricCanvas.current = new Canvas(canvasRef.current, {
        width: 500,
        height: 600,
        backgroundColor: '#f1f5f9'
      });
      
      if (file) {
        const url = URL.createObjectURL(file);
        FabricImage.fromURL(url).then(img => {
          img.scaleToWidth(400);
          fabricCanvas.current?.add(img);
          fabricCanvas.current?.centerObject(img);
          fabricCanvas.current?.renderAll();
        });
      }
    }
  }, [step, file]);

  const renderCountrySelector = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Select Document Type</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PASSPORT_SPECS.map((spec, idx) => (
          <button
            key={idx}
            onClick={() => { setSelectedSpec(spec); setStep('photo'); }}
            className="p-4 bg-slate-900 rounded-2xl border border-slate-800 hover:border-emerald-500 text-left"
          >
            <div className="font-bold text-white">{spec.country}</div>
            <div className="text-sm text-slate-400">{spec.document}</div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-slate-100">
      <button onClick={onBack} className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Tools
      </button>
      
      {step === 'country' && renderCountrySelector()}
      
      {step === 'photo' && (
        <div className="space-y-4 text-center">
            <h2 className="text-xl font-bold">Upload Photo for {selectedSpec?.country} {selectedSpec?.document}</h2>
            <label className="inline-block p-12 border-2 border-dashed border-slate-700 rounded-3xl cursor-pointer hover:border-emerald-500">
                <Upload className="w-12 h-12 text-emerald-400 mx-auto" />
                <span className="block mt-2 font-bold">Select Image</span>
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => {
                    if (e.target.files?.[0]) {
                        setFile(e.target.files[0]);
                        setStep('edit');
                    }
                }} />
            </label>
        </div>
      )}

      {step === 'edit' && (
          <div className="text-center p-4 bg-slate-900 rounded-3xl">
              <h2 className="text-xl font-bold mb-4">Position Your Photo</h2>
              <canvas ref={canvasRef} className="border border-slate-700 rounded-lg mx-auto" />
              <div className="flex gap-4 mt-4 justify-center">
                <button onClick={() => fabricCanvas.current?.renderAll()} className="px-4 py-2 bg-emerald-500 rounded-lg text-slate-950 font-bold">Export</button>
              </div>
          </div>
      )}
    </div>
  );
};
