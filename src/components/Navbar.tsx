import React from 'react';
import { User, ShieldCheck } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full bg-white backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTool('home')}
            className="flex items-center gap-2.5 text-left focus:outline-none rounded-lg py-1 px-1.5 transition-colors hover:bg-slate-100"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-lg">
              IE
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 block leading-none">
                IMAGE EDIT
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => onSelectTool('home')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTool === 'home'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            All Tools
          </button>
        </nav>

        {/* Zone 3: Account */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAccountModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition-colors"
          >
            <User className="w-4 h-4" />
            <span>{userProfile.name}</span>
            <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              {userProfile.plan}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
