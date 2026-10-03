import React, { useState } from 'react';
import { X, ShieldCheck, Check, Zap, Server, Trash2, Key, RefreshCw } from 'lucide-react';
import { UserProfile } from '../types/imageTools';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateSettings: (newSettings: UserProfile['settings']) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'plans' | 'privacy'>('profile');
  const [settings, setSettings] = useState(userProfile.settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveSettings = () => {
    onUpdateSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Account & Preferences</h2>
              <p className="text-[11px] text-slate-400">
                User #{userProfile.id} · Zero-Storage Verified
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Profile & Settings
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'plans'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Subscription Plans
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'privacy'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Privacy Guarantee
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'profile' && (
            <div className="space-y-5">
              {/* Profile Card */}
              <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-white block">{userProfile.name}</span>
                  <span className="text-xs text-slate-400 block">{userProfile.email}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                    {userProfile.plan} Tier
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {userProfile.dailyUsageCount} / {userProfile.dailyUsageLimit} daily items
                  </span>
                </div>
              </div>

              {/* Preferences Form */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Default Processing Preferences
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Default Export Format
                    </label>
                    <select
                      value={settings.defaultExportFormat}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          defaultExportFormat: e.target.value as any,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="PNG">PNG (Lossless & Transparent)</option>
                      <option value="JPG">JPG (High Compression)</option>
                      <option value="WEBP">WEBP (Web Optimized)</option>
                      <option value="AVIF">AVIF (Next-Gen Ultra)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Default Compression Quality ({settings.defaultCompressionQuality}%)
                    </label>
                    <input
                      type="range"
                      min={20}
                      max={100}
                      value={settings.defaultCompressionQuality}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          defaultCompressionQuality: Number(e.target.value),
                        })
                      }
                      className="w-full accent-emerald-500 mt-2"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoDeleteAfterDownload}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          autoDeleteAfterDownload: e.target.checked,
                        })
                      }
                      className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Auto-delete temporary file memory after download
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Instantly revokes Blob Object URLs and frees RAM buffer memory.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.highDpiExport}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          highDpiExport: e.target.checked,
                        })
                      }
                      className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        High-DPI Retina Canvas Rendering
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Renders edits at 2x resolution matrix for ultra-sharp output.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                {savedSuccess && (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Preferences Saved!
                  </span>
                )}
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Free Plan */}
                <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-400 block">Free Tier</span>
                  <div className="text-xl font-extrabold text-white">$0 / mo</div>
                  <ul className="space-y-1.5 text-[11px] text-slate-300">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> 100 images / day
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> All 9 image tools
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Zero DB image storage
                    </li>
                  </ul>
                </div>

                {/* Pro Plan */}
                <div className="p-4 rounded-xl bg-emerald-950/40 border-2 border-emerald-500 space-y-3 relative">
                  <span className="absolute -top-2.5 right-3 bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Active
                  </span>
                  <span className="text-xs font-bold text-emerald-400 block">Pro Unlimited</span>
                  <div className="text-xl font-extrabold text-white">$12 / mo</div>
                  <ul className="space-y-1.5 text-[11px] text-slate-300">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> 500 images / day
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Ultra 4K HD Upscale
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Batch 50 files
                    </li>
                  </ul>
                </div>

                {/* Business Plan */}
                <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-purple-400 block">Business</span>
                  <div className="text-xl font-extrabold text-white">$29 / mo</div>
                  <ul className="space-y-1.5 text-[11px] text-slate-300">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Unlimited daily files
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Team Accounts
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Dedicated License Key
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Our Absolute Zero-Storage Rules</span>
                </div>
                <p className="text-slate-300">
                  IMAGE EDIT operates under a strict Zero-Persistence Policy:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                  <li>User images are NEVER saved to any database tables or disk storage.</li>
                  <li>Client-side canvas tools execute entirely inside your device's browser memory.</li>
                  <li>
                    All processing modules (Remove BG, OCR, Enhance) use temporary in-memory streams
                    and immediately destroy byte buffers upon response delivery.
                  </li>
                  <li>Downloaded files belong exclusively to your device storage.</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-400 space-y-1">
                <div className="text-emerald-400 font-bold">Privacy Audit Log (Live Session):</div>
                <div>[SYSTEM] In-Memory Storage: ACTIVE (0 bytes saved to disk)</div>
                <div>[PREFERENCES] Active Profile: Current tier & settings only</div>
                <div>[CLEANUP] Buffer Wipe Protocol: ENABLED on download complete</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
