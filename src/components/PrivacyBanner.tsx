import React from 'react';
import { ShieldCheck, Lock, Trash2, CheckCircle2 } from 'lucide-react';

export const PrivacyBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border-b border-emerald-900/40 text-slate-300 py-2.5 px-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <span className="font-semibold text-emerald-300 mr-2">Strict Privacy Rule:</span>
            <span>Images are processed in temporary RAM and automatically purged immediately after download.</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero DB Storage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero Cloud Backups</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Auto Temporary Memory Cleanup</span>
          </div>
        </div>
      </div>
    </div>
  );
};
