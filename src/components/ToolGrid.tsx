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
  ArrowRight,
  ShieldCheck,
  Search,
  Upload
} from 'lucide-react';
import { ToolId } from '../types/imageTools';

interface ToolGridProps {
  onSelectTool: (toolId: ToolId) => void;
  onQuickUpload: (files: FileList) => void;
}

interface ToolCard {
  id: ToolId;
  title: string;
  category: 'ai' | 'editing' | 'conversion';
  description: string;
  icon: React.ReactNode;
  badge: string;
  badgeColor: string;
  features: string[];
}

export const ToolGrid: React.FC<ToolGridProps> = ({ onSelectTool, onQuickUpload }) => {
  const [filter, setFilter] = useState<'all' | 'ai' | 'editing' | 'conversion'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tools: ToolCard[] = [
    {
      id: 'remove-bg',
      title: 'Remove Background',
      category: 'ai',
      description: 'Automatically detect subjects and generate transparent PNG backgrounds.',
      icon: <Sparkles className="w-6 h-6 text-emerald-400" />,
      badge: 'AI Powered',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      features: ['Auto subject detection', 'Transparent PNG export', 'Live edge comparison'],
    },
    {
      id: 'resize',
      title: 'Resize Image',
      category: 'editing',
      description: 'Adjust width, height, aspect ratio presets, and resolution scale.',
      icon: <Maximize2 className="w-6 h-6 text-blue-400" />,
      badge: 'Instant Canvas',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      features: ['Dimension presets', 'Ratio lock option', 'Bicubic high quality'],
    },
    {
      id: 'compress',
      title: 'Compress Image',
      category: 'editing',
      description: 'Reduce file size up to 90% without sacrificing visual quality.',
      icon: <FileArchive className="w-6 h-6 text-purple-400" />,
      badge: 'Popular',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      features: ['Quality slider', 'Estimated size preview', 'Side-by-side comparison'],
    },
    {
      id: 'crop',
      title: 'Crop Image',
      category: 'editing',
      description: 'Trim canvas using interactive handles, fixed aspect ratios, or custom px.',
      icon: <Crop className="w-6 h-6 text-amber-400" />,
      badge: 'Interactive',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      features: ['Rule of thirds grid', '16:9, 1:1, 4:3 ratios', 'Custom pixel coordinates'],
    },
    {
      id: 'rotate',
      title: 'Rotate & Flip',
      category: 'editing',
      description: 'Rotate 90°, 180°, 270°, horizontal flip, vertical flip, or free angle dial.',
      icon: <RotateCw className="w-6 h-6 text-cyan-400" />,
      badge: 'Instant Canvas',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      features: ['Quick 90° turns', 'Horizontal & Vertical flip', 'Fine angle precision'],
    },
    {
      id: 'convert',
      title: 'Convert Image',
      category: 'conversion',
      description: 'Convert single or batch images to JPG, PNG, WEBP, or AVIF formats.',
      icon: <FileType className="w-6 h-6 text-teal-400" />,
      badge: 'Batch Ready',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      features: ['JPG, PNG, WEBP, AVIF', 'Batch multi-file export', 'Zero quality loss mode'],
    },
    {
      id: 'watermark',
      title: 'Watermark Image',
      category: 'editing',
      description: 'Add custom text or brand logos with opacity and 9-point grid positioning.',
      icon: <Stamp className="w-6 h-6 text-rose-400" />,
      badge: 'Branding Tool',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      features: ['Text & Logo watermark', 'Tile pattern option', 'Opacity & scale control'],
    },
    {
      id: 'ocr',
      title: 'OCR Text Extraction',
      category: 'ai',
      description: 'Extract readable text, numbers, and tables directly from image documents.',
      icon: <FileText className="w-6 h-6 text-indigo-400" />,
      badge: 'AI Powered',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      features: ['1-Click Copy Text', 'Download .txt file', 'Multi-language support'],
    },
    {
      id: 'enhance',
      title: 'AI Image Enhancement',
      category: 'ai',
      description: 'Upscale resolution (1.5x, 2x, 4x), sharpen detail, and reduce noise.',
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      badge: 'AI Upscale',
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      features: ['2x / 4x Super Resolution', 'Detail sharpening', 'Before/After curtain view'],
    },
    {
      id: 'rename',
      title: 'Rename Image & PDF',
      category: 'conversion',
      description: 'Batch rename image and PDF filenames with custom patterns, sequential numbering, and find-replace.',
      icon: <FileEdit className="w-6 h-6 text-orange-400" />,
      badge: 'Batch Tool',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      features: ['Images & PDF documents', 'Sequential numbering (Doc_001)', 'Prefix, Suffix & Find-Replace'],
    },
    {
      id: 'passport',
      title: 'Passport Size',
      category: 'editing',
      description: 'Prepare images for passport requirements with standard size presets.',
      icon: <User className="w-6 h-6 text-pink-400" />,
      badge: 'Editing',
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      features: ['2x2 inch preset', '35x45mm preset', 'Easy cropping'],
    },
  ];

  const filteredTools = tools.filter((t) => {
    const matchesCategory = filter === 'all' || t.category === filter;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Welcome Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>100% Private Temporary Processing Platform</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Every Image Tool You Need, <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Without Saving a Single Byte.
          </span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Compress, resize, crop, convert, watermark, remove background, extract OCR text, and AI upscale images with zero file retention.
        </p>

        {/* Global Instant Upload Box */}
        <div className="pt-2">
          <label className="relative group cursor-pointer block max-w-2xl mx-auto bg-slate-900/90 hover:bg-slate-850 border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 rounded-2xl p-6 sm:p-8 transition-all shadow-xl shadow-emerald-950/20">
            <input
              type="file"
              multiple
              accept="image/*, application/pdf, .pdf"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onQuickUpload(e.target.files);
                }
              }}
            />
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1 text-center">
                <span className="text-base font-semibold text-white block">
                  Drop image or PDF files here or click to upload
                </span>
                <span className="text-xs text-slate-400 block">
                  Supports JPG, PNG, WEBP, AVIF, PDF, HEIC, GIF • Max 50MB per file
                </span>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
        {/* Interactive Segmented Filter Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All 11 Tools
          </button>
          <button
            onClick={() => setFilter('ai')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              filter === 'ai'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Powered
          </button>
          <button
            onClick={() => setFilter('editing')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filter === 'editing'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Canvas Editing
          </button>
          <button
            onClick={() => setFilter('conversion')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filter === 'conversion'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Convert & Batch
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className="group relative bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:shadow-emerald-950/20"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {tool.icon}
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${tool.badgeColor}`}
                >
                  {tool.badge}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              {/* Feature bullet list */}
              <ul className="space-y-1.5 pt-2 border-t border-slate-800/80">
                {tool.features.map((feat, idx) => (
                  <li key={idx} className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-300 group-hover:text-emerald-400 transition-colors">
              <span>Open Tool</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
