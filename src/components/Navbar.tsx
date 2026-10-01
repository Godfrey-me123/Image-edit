import React from 'react';
import { ShieldCheck, Sparkles, User, Image as ImageIcon, Sliders, Layers } from 'lucide-react';
import { ToolId, UserProfile } from '../types/imageTools';

interface NavbarProps {
  activeTool: ToolId | 'home';
  onSelectTool: (tool: ToolId | 'home') => void;
  userProfile: UserProfile;
  onOpenAccountModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTool,
  onSelectTool,
  userProfile,
  onOpenAccountModal,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTool('home')}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg py-1 px-1.5 transition-colors hover:bg-slate-800/80"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 font-black tracking-tighter text-lg">
              IE
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block leading-none">
                IMAGE EDIT
              </span>
              <span className="text-[10px] font-medium text-slate-400 block tracking-wide">
                Fast. Private. Powerful Image Tools.
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links / Tool Categories */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => onSelectTool('home')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTool === 'home'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            All Tools
          </button>
          <button
            onClick={() => onSelectTool('remove-bg')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              activeTool === 'remove-bg'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Remove BG
          </button>
          <button
            onClick={() => onSelectTool('compress')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTool === 'compress'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Compress
          </button>
          <button
            onClick={() => onSelectTool('resize')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTool === 'resize'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Resize
          </button>
          <button
            onClick={() => onSelectTool('convert')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTool === 'convert'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Convert
          </button>
          <button
            onClick={() => onSelectTool('ocr')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTool === 'ocr'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            OCR Text
          </button>
          <button
            onClick={() => onSelectTool('rename')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTool === 'rename'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Rename
          </button>
        </nav>

        {/* Zone 3: Privacy Indicator & Account Actions */}
        <div className="flex items-center gap-3">
          {/* Zero Storage Shield Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/50 text-emerald-300 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero Image Storage</span>
          </div>

          {/* Account Profile Button */}
          <button
            onClick={onOpenAccountModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <User className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">{userProfile.name}</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              {userProfile.plan}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
