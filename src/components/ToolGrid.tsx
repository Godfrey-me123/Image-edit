import React, { useState } from 'react';
import {
  Sparkles,
  Maximize2,
  FileArchive,
  Crop,
  RotateCw,
  FileType,
  Stamp,
  FileText,
  Zap,
  FileEdit,
  User,
  Settings,
  Edit3,
  PenTool,
  Upload,
  ChevronRight,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';
import { ToolId } from '../types/imageTools';
import { PassportDocumentSpec, PASSPORT_SPECS } from '../types/passport';
import { CustomSizeModal } from './modals/CustomSizeModal';

interface ToolGridProps {
  onSelectTool: (toolId: ToolId) => void;
  onQuickUpload: (files: FileList) => void;
  onSelectPassportTemplate?: (spec: PassportDocumentSpec) => void;
  onOpenSettings?: () => void;
}

interface ToolCard {
  id: ToolId;
  title: string;
  category: 'editing' | 'conversion';
  icon: React.ReactNode;
  features: string[];
}

export const ToolGrid: React.FC<ToolGridProps> = ({
  onSelectTool,
  onQuickUpload,
  onSelectPassportTemplate,
  onOpenSettings
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);

  const tools: ToolCard[] = [
    { id: 'passport', title: 'Passport Photo Maker', category: 'editing', icon: <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />, features: ['Automated Cutout & Official Compliance'] },
    { id: 'remove-bg', title: 'Remove Background', category: 'editing', icon: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />, features: ['Auto subject detection & transparent PNG'] },
    { id: 'annotation', title: 'Annotation & Stamps', category: 'editing', icon: <Edit3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />, features: ['Notes, arrows, highlights, approval badges'] },
    { id: 'signature', title: 'Digital Signature', category: 'editing', icon: <PenTool className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />, features: ['Draw & save transparent PNG signatures'] },
    { id: 'sign-photo', title: 'Sign Photo', category: 'editing', icon: <Stamp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />, features: ['Place & scale signatures on documents'] },
    { id: 'resize', title: 'Resize Image', category: 'editing', icon: <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />, features: ['Dimension presets & aspect ratio lock'] },
    { id: 'compress', title: 'Compress Image', category: 'editing', icon: <FileArchive className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />, features: ['Quality slider up to 90% file reduction'] },
    { id: 'crop', title: 'Crop Image', category: 'editing', icon: <Crop className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />, features: ['Rule of thirds grid & fixed ratios'] },
    { id: 'rotate', title: 'Rotate & Flip', category: 'editing', icon: <RotateCw className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />, features: ['90° turns, horizontal & vertical flip'] },
    { id: 'convert', title: 'Convert Image', category: 'conversion', icon: <FileType className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />, features: ['Batch export JPG, PNG, WEBP, AVIF'] },
    { id: 'watermark', title: 'Watermark', category: 'editing', icon: <Stamp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />, features: ['Custom text & logo positioning'] },
    { id: 'ocr', title: 'OCR Text Extract', category: 'editing', icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />, features: ['1-click text extraction from documents'] },
    { id: 'enhance', title: 'Enhance & Upscale', category: 'editing', icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />, features: ['2x/4x Super-resolution & sharpening'] },
    { id: 'rename', title: 'Batch Rename', category: 'conversion', icon: <FileEdit className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />, features: ['Sequential numbering & pattern rename'] },
    { id: 'photo-to-pdf', title: 'Photo to PDF', category: 'conversion', icon: <FileType className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />, features: ['A4, A5, 5x7 sheet PDF document export'] },
  ];

  const handleCustomConfirm = (spec: PassportDocumentSpec) => {
    setShowCustomModal(false);
    if (onSelectPassportTemplate) {
      onSelectPassportTemplate(spec);
    } else {
      onSelectTool('passport');
    }
  };

  return (
    <div className="w-full max-w-lg md:max-w-2xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Passport Photo</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm shadow-amber-500/20 active:scale-95 transition-transform"
          >
            ★ Pro
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1.5 sm:p-2 bg-white rounded-full text-slate-600 border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Quick Action Modules (Custom, Annotation, Signature, Sign Photo) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center text-xs">
        <button
          onClick={() => setShowCustomModal(true)}
          className="bg-white p-2 sm:p-3 rounded-2xl shadow-sm text-slate-700 font-semibold border border-slate-200 hover:border-blue-500 hover:shadow-md active:scale-95 transition-all flex flex-col items-center group touch-manipulation"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 rounded-xl mb-1 sm:mb-1.5 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
            <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[11px] sm:text-xs">Custom</span>
        </button>

        <button
          onClick={() => onSelectTool('annotation')}
          className="bg-white p-2 sm:p-3 rounded-2xl shadow-sm text-slate-700 font-semibold border border-slate-200 hover:border-blue-500 hover:shadow-md active:scale-95 transition-all flex flex-col items-center group touch-manipulation"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 rounded-xl mb-1 sm:mb-1.5 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
            <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[11px] sm:text-xs">Annotation</span>
        </button>

        <button
          onClick={() => onSelectTool('signature')}
          className="bg-white p-2 sm:p-3 rounded-2xl shadow-sm text-slate-700 font-semibold border border-slate-200 hover:border-blue-500 hover:shadow-md active:scale-95 transition-all flex flex-col items-center group touch-manipulation"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 rounded-xl mb-1 sm:mb-1.5 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
            <PenTool className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[11px] sm:text-xs">Signature</span>
        </button>

        <button
          onClick={() => onSelectTool('sign-photo')}
          className="bg-white p-2 sm:p-3 rounded-2xl shadow-sm text-slate-700 font-semibold border border-slate-200 hover:border-blue-500 hover:shadow-md active:scale-95 transition-all flex flex-col items-center group touch-manipulation"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 rounded-xl mb-1 sm:mb-1.5 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
            <Stamp className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-[11px] sm:text-xs">Sign Photo</span>
        </button>
      </div>

      {/* Primary Action Buttons (Create Photo & My Photos) */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <button
          onClick={() => onSelectTool('passport')}
          className="bg-blue-600 hover:bg-blue-500 text-white p-3.5 sm:p-4 rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-1.5 sm:gap-2 active:scale-[0.98] transition-all touch-manipulation"
        >
          <User className="w-4 h-4 sm:w-5 sm:h-5" /> Create Photo
        </button>
        <button
          onClick={() => onSelectTool('my-photos')}
          className="bg-white hover:bg-slate-50 text-blue-600 p-3.5 sm:p-4 rounded-2xl font-bold text-xs sm:text-sm border border-blue-200 shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 active:scale-[0.98] transition-all touch-manipulation"
        >
          <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" /> My Photos
        </button>
      </div>

      {/* Universal Sizes Carousel */}
      <div className="space-y-2.5 sm:space-y-3">
        <div className="flex justify-between items-center text-slate-900 font-bold">
          <h2 className="text-sm sm:text-base">Universal Sizes</h2>
          <button
            onClick={() => onSelectTool('passport')}
            className="text-blue-600 text-xs font-semibold hover:underline"
          >
            See all
          </button>
        </div>
        <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
          {PASSPORT_SPECS.slice(0, 4).map((spec) => (
            <button
              key={spec.id}
              onClick={() => {
                if (onSelectPassportTemplate) {
                  onSelectPassportTemplate(spec);
                } else {
                  onSelectTool('passport');
                }
              }}
              className="min-w-[120px] sm:min-w-[130px] bg-white p-3 sm:p-3.5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md active:scale-95 transition-all text-left flex-shrink-0 group"
            >
              <div className="w-full aspect-[4/5] bg-slate-50 rounded-xl mb-2 sm:mb-2.5 flex items-center justify-center border border-slate-100 group-hover:scale-[1.02] transition-transform">
                <span className="text-xl sm:text-2xl">{spec.flag || '🌐'}</span>
              </div>
              <div className="font-bold text-xs text-slate-900 truncate">{spec.country}</div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 font-mono">
                {spec.width}×{spec.height} {spec.unit}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Instant Drop Box */}
      <label className="block p-4 bg-white border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl cursor-pointer text-center space-y-1 transition-all">
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-800">
          <Upload className="w-4 h-4 text-blue-600" />
          <span>Quick Drop File to Process</span>
        </div>
        <span className="text-[10px] text-slate-400 block">
          Drop any photo or PDF to open compressor / converter
        </span>
        <input
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => e.target.files && onQuickUpload(e.target.files)}
        />
      </label>

      {/* All Tools List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">All Utility Tools</h2>
          <span className="text-xs text-slate-400 font-medium">{tools.length} modules</span>
        </div>
        <div className="space-y-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className="w-full flex items-center gap-3.5 bg-white p-3.5 rounded-2xl shadow-sm hover:border-blue-500 border border-slate-200 hover:shadow-md transition-all text-left group"
            >
              <div className="p-2.5 bg-slate-50 rounded-xl text-blue-600 group-hover:bg-blue-50 transition-colors">
                {tool.icon}
              </div>
              <div className="flex-grow min-w-0">
                <div className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                  {tool.title}
                </div>
                <div className="text-[11px] text-slate-400 truncate">{tool.features[0]}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      </div>

      {/* Custom Size Modal */}
      <CustomSizeModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onConfirm={handleCustomConfirm}
      />
    </div>
  );
};
