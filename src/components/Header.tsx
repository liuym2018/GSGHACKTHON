import React, { useState } from 'react';
import { ActiveTab, DeviceViewMode, VonageStatusResponse } from '../types';
import {
  Video,
  ShieldCheck,
  Code2,
  Smartphone,
  Activity,
  Layers,
  Sparkles,
  Info,
  CheckCircle,
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  deviceViewMode: DeviceViewMode;
  onSelectDeviceMode: (mode: DeviceViewMode) => void;
  vonageStatus: VonageStatusResponse | null;
  onOpenLogs: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  deviceViewMode,
  onSelectDeviceMode,
  vonageStatus,
  onOpenLogs,
}) => {
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  return (
    <header className="w-full bg-neutral-900 border-b border-neutral-800 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        
        {/* Left: Brand & Product Info */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
            <Sparkles className="w-5 h-5 text-pink-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Vonage Fashion Week Studio
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-950 text-pink-300 border border-pink-800/80">
                GDG Fashion Week Demo
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">
              Live Video Capture & AI Outfit Consultation (Vonage Learning Server)
            </p>
          </div>
        </div>

        {/* Center: Main Workflow Switcher */}
        <nav className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800">
          <button
            id="tab-fashion-studio"
            type="button"
            onClick={() => onSelectTab('fashion')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'fashion'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-300" />
            <span>Video Capture & Outfit AI</span>
          </button>

          <button
            id="tab-code-export"
            type="button"
            onClick={() => onSelectTab('code')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'code'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vonage API & Node Architecture</span>
            <span className="sm:hidden">API Guide</span>
          </button>
        </nav>

        {/* Right: Device View Selector & Status Pill */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Device View Mode (Dual / iOS / Android) - only visible in simulation tabs */}
          {activeTab !== 'code' && (
            <div className="hidden lg:flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-[11px]">
              <button
                type="button"
                onClick={() => onSelectDeviceMode('dual')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  deviceViewMode === 'dual'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="View iOS and Android devices side-by-side"
              >
                Dual Simulator
              </button>
              <button
                type="button"
                onClick={() => onSelectDeviceMode('ios')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  deviceViewMode === 'ios'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                iOS Only
              </button>
              <button
                type="button"
                onClick={() => onSelectDeviceMode('android')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  deviceViewMode === 'android'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Android Only
              </button>
            </div>
          )}

          {/* Vonage Backend Status Pill */}
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-xs text-neutral-300 transition cursor-pointer"
            title="Click to view Vonage credentials status"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                vonageStatus?.liveConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'
              }`}
            />
            <span className="hidden sm:inline font-medium">
              {vonageStatus?.liveConfigured ? 'Vonage Live API' : 'Sandbox Mode'}
            </span>
            <Info className="w-3.5 h-3.5 text-neutral-500" />
          </button>

          {/* Network Logs button */}
          <button
            id="open-logs-btn"
            type="button"
            onClick={onOpenLogs}
            className="p-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
            title="View Real-Time API Logs"
          >
            <Activity className="w-4 h-4 text-blue-400" />
          </button>
        </div>
      </div>

      {/* Vonage Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  Vonage Service Configuration
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-neutral-400 hover:text-white text-xs font-semibold px-2 py-1 rounded-lg bg-neutral-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs text-neutral-300">
              <p className="leading-relaxed">
                This suite connects your cross-platform React Native app to Vonage's real-time communication APIs:
              </p>

              <div className="space-y-2 font-mono bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <div className="flex justify-between items-center">
                  <span>VONAGE_API_KEY:</span>
                  <span className={vonageStatus?.credentials?.hasApiKey ? 'text-emerald-400 font-bold' : 'text-neutral-500'}>
                    {vonageStatus?.credentials?.hasApiKey ? 'Configured (Live)' : 'Using Sandbox'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>VONAGE_API_SECRET:</span>
                  <span className={vonageStatus?.credentials?.hasApiSecret ? 'text-emerald-400 font-bold' : 'text-neutral-500'}>
                    {vonageStatus?.credentials?.hasApiSecret ? 'Configured' : 'Using Sandbox'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>VONAGE_APPLICATION_ID:</span>
                  <span className={vonageStatus?.credentials?.hasApplicationId ? 'text-emerald-400 font-bold' : 'text-neutral-500'}>
                    {vonageStatus?.credentials?.hasApplicationId ? 'Configured' : 'Using Sandbox'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>BRAND_NAME:</span>
                  <span className="text-white font-bold">{vonageStatus?.credentials?.brandName || 'VonageMobile'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 text-blue-200 leading-relaxed">
                <strong className="block mb-1 text-white">How live calls & SMS work:</strong>
                In Sandbox Mode, the suite generates valid WebRTC sessions and instant OTP codes for zero-cost rapid testing and verification. To connect directly to your live carrier credits, define your credentials in the environment or secrets panel.
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
