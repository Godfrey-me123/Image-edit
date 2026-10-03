import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { PassportDocumentSpec } from '../../types/passport';

interface CustomSizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (spec: PassportDocumentSpec) => void;
}

export const CustomSizeModal: React.FC<CustomSizeModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  const [width, setWidth] = useState('35');
  const [height, setHeight] = useState('45');
  const [unit, setUnit] = useState<'mm' | 'cm' | 'inch' | 'px'>('mm');

  const handleUnitChange = (newUnit: 'mm' | 'cm' | 'inch' | 'px') => {
    setUnit(newUnit);
    if (newUnit === 'mm') {
      setWidth('35');
      setHeight('45');
    } else if (newUnit === 'cm') {
      setWidth('3.5');
      setHeight('4.5');
    } else if (newUnit === 'inch') {
      setWidth('2');
      setHeight('2');
    } else if (newUnit === 'px') {
      setWidth('600');
      setHeight('600');
    }
  };

  const handleConfirm = () => {
    const w = parseFloat(width) || (unit === 'inch' ? 2 : 35);
    const h = parseFloat(height) || (unit === 'inch' ? 2 : 45);

    const customSpec: PassportDocumentSpec = {
      id: `custom_${Date.now()}`,
      country: 'Custom',
      documentType: `Custom ${w}×${h} ${unit}`,
      category: 'Custom',
      width: w,
      height: h,
      unit,
      dpi: unit === 'px' ? 72 : 300,
      background: 'white',
      flag: '📐',
      description: `User-defined size ${w} × ${h} ${unit}`
    };

    onConfirm(customSpec);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">Custom Sizes</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Width</label>
            <input
              type="number"
              step="any"
              placeholder="Width"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Height</label>
            <input
              type="number"
              step="any"
              placeholder="Height"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Unit Selector Grid */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 block">Select Unit</label>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { key: 'mm', label: 'Millimeters (mm)' },
              { key: 'px', label: 'Pixels (px)' },
              { key: 'cm', label: 'Centimeters (cm)' },
              { key: 'inch', label: 'Inches (in)' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleUnitChange(item.key as any)}
                className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all ${
                  unit === item.key
                    ? 'border-blue-600 bg-blue-50/60 text-blue-700 shadow-sm ring-1 ring-blue-500'
                    : 'border-slate-100 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{item.label}</span>
                {unit === item.key && (
                  <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleConfirm}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-[0.99] transition-all"
        >
          OK
        </button>
      </div>
    </div>
  );
};
