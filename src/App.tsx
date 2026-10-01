import React, { useState, useEffect } from 'react';
import { ToolId, UserProfile } from './types/imageTools';
import { Navbar } from './components/Navbar';
import { PrivacyBanner } from './components/PrivacyBanner';
import { ToolGrid } from './components/ToolGrid';
import { RemoveBgTool } from './components/tools/RemoveBgTool';
import { ResizeTool } from './components/tools/ResizeTool';
import { CompressTool } from './components/tools/CompressTool';
import { CropTool } from './components/tools/CropTool';
import { RotateTool } from './components/tools/RotateTool';
import { ConvertTool } from './components/tools/ConvertTool';
import { WatermarkTool } from './components/tools/WatermarkTool';
import { OcrTool } from './components/tools/OcrTool';
import { EnhanceTool } from './components/tools/EnhanceTool';
import { RenameTool } from './components/tools/RenameTool';
import { PassportTool } from './components/tools/PassportTool';
import { AccountModal } from './components/AccountModal';
import { ShieldCheck, Lock } from 'lucide-react';

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId | 'home'>('home');
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [activeBatchFiles, setActiveBatchFiles] = useState<File[] | null>(null);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'usr_892341',
    name: 'Creative Pro User',
    email: 'pro.user@imageedit.app',
    plan: 'Pro',
    dailyUsageLimit: 500,
    dailyUsageCount: 14,
    tokensRemaining: 8450,
    settings: {
      defaultExportFormat: 'PNG',
      defaultCompressionQuality: 85,
      autoDeleteAfterDownload: true,
      highDpiExport: true,
    },
  });

  useEffect(() => {
    // Fetch initial user profile settings from backend
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUserProfile(data.user);
        }
      })
      .catch((err) => console.log('Backend user fetch fallback:', err));
  }, []);

  const handleQuickUpload = (files: FileList) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    if (fileArray.length > 1) {
      setActiveBatchFiles(fileArray);
      setActiveTool('convert'); // Default batch action to converter
    } else {
      setActiveFile(fileArray[0]);
      setActiveTool('compress'); // Default single file action to compress
    }
  };

  const handleSelectTool = (tool: ToolId | 'home') => {
    setActiveTool(tool);
    if (tool === 'home') {
      setActiveFile(null);
      setActiveBatchFiles(null);
    }
  };

  const handleUpdateSettings = (newSettings: UserProfile['settings']) => {
    setUserProfile((prev) => ({ ...prev, settings: newSettings }));
    fetch('/api/user/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Bar Navigation */}
      <Navbar
        activeTool={activeTool}
        onSelectTool={handleSelectTool}
        userProfile={userProfile}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
      />

      {/* Global Strict Privacy Assurance Banner */}
      <PrivacyBanner />

      {/* Main Content Body */}
      <main className="flex-1">
        {activeTool === 'home' && (
          <ToolGrid
            onSelectTool={(toolId) => setActiveTool(toolId)}
            onQuickUpload={handleQuickUpload}
          />
        )}

        {activeTool === 'remove-bg' && (
          <RemoveBgTool
            initialFile={activeFile}
            onBack={() => handleSelectTool('home')}
            onSelectTool={handleSelectTool}
          />
        )}

        {activeTool === 'resize' && (
          <ResizeTool
            initialFile={activeFile}
            onBack={() => handleSelectTool('home')}
          />
        )}

        {activeTool === 'compress' && (
          <CompressTool
            initialFile={activeFile}
            onBack={() => handleSelectTool('home')}
          />
        )}

        {activeTool === 'crop' && (
          <CropTool
            initialFile={activeFile}
            onBack={() => handleSelectTool('home')}
          />
        )}

        {activeTool === 'rotate' && (
          <RotateTool
            initialFile={activeFile}
            onBack={() => handleSelectTool('home')}
          />
        )}

        {activeTool === 'convert' && (
          <ConvertTool
            initialFiles={activeBatchFiles || (activeFile ? [activeFile] : null)}
            onBack={() => handleSelectTool('home')}
          />
        )}

        {activeTool === 'watermark' && (
          <WatermarkTool
            initialFile={activeFile}
            onBack={() => handleSelectTool('home')}
          />
        )}

        {activeTool === 'ocr' && (
          <OcrTool
            initialFile={activeFile}
            onBack={() => handleSelectTool('home')}
          />
        )}

        {activeTool === 'enhance' && (
          <EnhanceTool
            initialFile={activeFile}
            onBack={() => handleSelectTool('home')}
          />
        )}

        {activeTool === 'rename' && (
          <RenameTool
            initialFiles={activeBatchFiles || (activeFile ? [activeFile] : null)}
            onBack={() => handleSelectTool('home')}
          />
        )}

        {activeTool === 'passport' && (
          <PassportTool
            initialFile={activeFile}
            onBack={() => handleSelectTool('home')}
          />
        )}
      </main>

      {/* Account & Subscription Preferences Modal Drawer */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        userProfile={userProfile}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/80 py-8 px-4 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <span className="font-bold text-white text-sm block">IMAGE EDIT</span>
            <span className="text-[11px] text-slate-400 block">
              Fast. Private. Powerful Image Tools.
            </span>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6 text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" /> 100% Zero File Storage Compliant
            </span>
            <span>·</span>
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="hover:text-white transition-colors"
            >
              Privacy Policy & Audit
            </button>
            <span>·</span>
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="hover:text-white transition-colors"
            >
              Subscription Plans
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            © {new Date().getFullYear()} IMAGE EDIT. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
