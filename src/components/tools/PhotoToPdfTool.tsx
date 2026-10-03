import React, { useState } from 'react';
import { ArrowLeft, FileType, Upload, Download } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { downloadProcessedFile } from '../../utils/imageProcessing';
import { generateBigstaFilename } from '../../utils/filename';

interface PhotoToPdfToolProps {
  initialFile?: File | null;
  onBack: () => void;
}

const PAPER_SIZES = {
  'A4': { width: 595, height: 842 },
  'A5': { width: 420, height: 595 },
  '5x7': { width: 360, height: 504 },
};

export const PhotoToPdfTool: React.FC<PhotoToPdfToolProps> = ({ initialFile, onBack }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [pageSize, setPageSize] = useState<keyof typeof PAPER_SIZES>('A4');
  const [position, setPosition] = useState<'center' | 'top-left'>('center');
  const [targetSizeKb, setTargetSizeKb] = useState<number>(0);

  const handleGeneratePdf = async () => {
    if (!file) return;
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([PAPER_SIZES[pageSize].width, PAPER_SIZES[pageSize].height]);
    
    const imageBytes = await file.arrayBuffer();
    const image = await pdfDoc.embedJpg(imageBytes).catch(() => pdfDoc.embedPng(imageBytes));
    
    const x = position === 'center' ? (PAPER_SIZES[pageSize].width - 400) / 2 : 50;
    const y = position === 'center' ? (PAPER_SIZES[pageSize].height - 500) / 2 : 50;

    page.drawImage(image, { x, y, width: 400, height: 500 });
    
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(pdfBytes.buffer as ArrayBuffer)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    downloadProcessedFile(url, generateBigstaFilename(file.name, 'pdf'));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-slate-100">
      <button onClick={onBack} className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Tools
      </button>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
        <h2 className="text-2xl font-bold">Photo to PDF</h2>
        
        <div className="grid grid-cols-2 gap-4">
            <select onChange={(e) => setPageSize(e.target.value as keyof typeof PAPER_SIZES)} className="bg-slate-800 p-2 rounded-lg">
                {Object.keys(PAPER_SIZES).map(size => <option key={size} value={size}>{size}</option>)}
            </select>
            <select onChange={(e) => setPosition(e.target.value as 'center' | 'top-left')} className="bg-slate-800 p-2 rounded-lg">
                <option value="center">Center</option>
                <option value="top-left">Top-Left</option>
            </select>
            <input type="number" placeholder="Target size (KB)" onChange={(e) => setTargetSizeKb(Number(e.target.value))} className="bg-slate-800 p-2 rounded-lg col-span-2" />
        </div>

        {!file && (
          <label className="block p-12 border-2 border-dashed border-slate-700 rounded-3xl cursor-pointer hover:border-emerald-500 text-center">
            <Upload className="mx-auto w-10 h-10" />
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
          </label>
        )}
        {file && <button onClick={handleGeneratePdf} className="w-full bg-emerald-500 p-4 rounded-xl text-slate-950 font-bold"><Download className="inline" /> Generate PDF</button>}
      </div>
    </div>
  );
};
