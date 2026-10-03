import React, { useState, useEffect } from 'react';
import { ToolId, UserProfile } from './types/imageTools';
import { PassportDocumentSpec } from './types/passport';
import { Navbar } from './components/Navbar';
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
import { PhotoToPdfTool } from './components/tools/PhotoToPdfTool';
import { AnnotationTool } from './components/tools/AnnotationTool';
import { SignatureTool } from './components/tools/SignatureTool';
import { SignPhotoTool } from './components/tools/SignPhotoTool';
import { MyPhotosTool } from './components/tools/MyPhotosTool';
import { AccountModal } from './components/AccountModal';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId | 'home'>('home');
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [activeBatchFiles, setActiveBatchFiles] = useState<File[] | null>(null);
  const [activeDataUrl, setActiveDataUrl] = useState<string | null>(null);
  const [activePassportTemplate, setActivePassportTemplate] = useState<PassportDocumentSpec | null>(null);
  const [activeDraftState, setActiveDraftState] = useState<any | null>(null);

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
      setActiveTool('convert');
    } else {
      setActiveFile(fileArray[0]);
      setActiveTool('compress');
    }
  };

  const handleSelectTool = (tool: ToolId | 'home') => {
    setActiveTool(tool);
    if (tool === 'home') {
      setActiveFile(null);
      setActiveBatchFiles(null);
      setActiveDataUrl(null);
      setActivePassportTemplate(null);
      setActiveDraftState(null);
    }
  };

  const handleLaunchPassportWithTemplate = (spec: PassportDocumentSpec) => {
    setActivePassportTemplate(spec);
    setActiveDraftState(null);
    setActiveTool('passport');
  };

  const handleResumeDraft = (draftState: any) => {
    setActiveDraftState(draftState);
    setActiveTool('passport');
  };

  const handleOpenAnnotationWithImage = (dataUrl: string) => {
    setActiveDataUrl(dataUrl);
    setActiveTool('annotation');
  };

  const handleOpenSignPhotoWithImage = (dataUrl: string) => {
    setActiveDataUrl(dataUrl);
    setActiveTool('sign-photo');
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
    <div className="min-h-screen bg-[#F0F4F8] text-[#1E293B] font-sans flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Bar Navigation */}
      <Navbar
        activeTool={activeTool}
        onSelectTool={handleSelectTool}
        userProfile={userProfile}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        {activeTool === 'home' && (
          <ToolGrid
            onSelectTool={(toolId) => handleSelectTool(toolId)}
            onQuickUpload={handleQuickUpload}
            onSelectPassportTemplate={handleLaunchPassportWithTemplate}
            onOpenSettings={() => setIsAccountModalOpen(true)}
          />
        )}

        {/* Master Passport Photo Maker Orchestrator */}
        {activeTool === 'passport' && (
          <PassportTool
            initialFile={activeFile}
            initialTemplate={activePassportTemplate}
            initialDraftState={activeDraftState}
            onBack={() => handleSelectTool('home')}
            onOpenAnnotation={handleOpenAnnotationWithImage}
            onOpenSignPhoto={handleOpenSignPhotoWithImage}
          />
        )}

        {/* Annotation & Stamps Tool */}
        {activeTool === 'annotation' && (
          <AnnotationTool
            initialFile={activeFile}
            initialDataUrl={activeDataUrl || undefined}
            onBack={() => handleSelectTool('home')}
          />
        )}

        {/* Digital Signature Tool */}
        {activeTool === 'signature' && (
          <SignatureTool
            onBack={() => handleSelectTool('home')}
          />
        )}

        {/* Sign Photo Tool */}
        {activeTool === 'sign-photo' && (
          <SignPhotoTool
            initialFile={activeFile}
            initialDataUrl={activeDataUrl || undefined}
            onBack={() => handleSelectTool('home')}
            onOpenSignatureDrawer={() => handleSelectTool('signature')}
          />
        )}

        {/* My Photos & Saved Library */}
        {activeTool === 'my-photos' && (
          <MyPhotosTool
            onBack={() => handleSelectTool('home')}
            onOpenInAnnotation={handleOpenAnnotationWithImage}
            onOpenInSignPhoto={handleOpenSignPhotoWithImage}
            onResumeDraft={handleResumeDraft}
          />
        )}

        {/* Other Reused & Connected Utility Tools */}
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

        {activeTool === 'photo-to-pdf' && (
          <PhotoToPdfTool
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
      <footer className="border-t border-slate-200 bg-white py-6 px-4 mt-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 text-sm block">IMAGE EDIT</span>
            <span className="text-[11px] text-slate-400 block">
              Professional Passport Photo Maker & Image Studio
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            © {new Date().getFullYear()} IMAGE EDIT. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
