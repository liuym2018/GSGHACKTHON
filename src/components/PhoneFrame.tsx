import React from 'react';
import { MobilePlatform } from '../types';
import { Wifi, Battery, Signal, Sparkles } from 'lucide-react';

interface PhoneFrameProps {
  platform: MobilePlatform;
  title: string;
  subtitle?: string;
  isCameraActive?: boolean;
  isMicActive?: boolean;
  notification?: {
    app: string;
    title: string;
    message: string;
    actionText?: string;
    onAction?: () => void;
  } | null;
  children: React.ReactNode;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  platform,
  title,
  subtitle,
  isCameraActive = false,
  isMicActive = false,
  notification,
  children,
}) => {
  const isIOS = platform === 'ios';

  return (
    <div
      id={`device-container-${platform}`}
      className="flex flex-col items-center select-none"
    >
      {/* Device Header label */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${
            isIOS
              ? 'bg-neutral-900 text-white dark:bg-neutral-800'
              : 'bg-emerald-700 text-white'
          }`}
        >
          {isIOS ? ' iOS (Apple iPhone)' : 'Android (Google Pixel / Galaxy)'}
        </span>
        <span className="text-xs text-neutral-500 font-medium">{title}</span>
      </div>

      {/* Physical Device Shell */}
      <div
        id={`phone-shell-${platform}`}
        className={`relative w-[340px] sm:w-[370px] h-[720px] rounded-[50px] p-3 shadow-2xl border transition-all duration-300 ${
          isIOS
            ? 'bg-neutral-950 border-neutral-700 shadow-neutral-950/40'
            : 'bg-neutral-900 border-neutral-700 shadow-neutral-900/40'
        }`}
      >
        {/* Outer Edge Antenna bands & buttons */}
        <div className="absolute -left-[3px] top-28 w-[3px] h-12 bg-neutral-700 rounded-l-sm" />
        <div className="absolute -left-[3px] top-44 w-[3px] h-12 bg-neutral-700 rounded-l-sm" />
        <div className="absolute -right-[3px] top-36 w-[3px] h-16 bg-neutral-700 rounded-r-sm" />

        {/* Screen Bezel and Display Glass */}
        <div className="relative w-full h-full rounded-[42px] overflow-hidden bg-neutral-950 flex flex-col border border-neutral-900 shadow-inner">
          
          {/* Status Bar */}
          <div className="relative z-30 flex items-center justify-between px-6 pt-3 pb-1 text-white text-[11px] font-medium">
            {/* Time */}
            <span className="font-semibold tracking-tight">09:41</span>

            {/* iOS Dynamic Island / Android Punch Hole */}
            {isIOS ? (
              <div
                id="ios-dynamic-island"
                className="absolute left-1/2 -translate-x-1/2 top-2.5 h-[28px] w-[108px] bg-black rounded-full flex items-center justify-between px-2.5 shadow-md border border-neutral-800/60 transition-all"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-neutral-800" />
                </div>
                {/* Privacy indicators */}
                <div className="flex items-center gap-1">
                  {isCameraActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" title="Camera Active" />
                  )}
                  {isMicActive && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-pulse" title="Microphone Active" />
                  )}
                </div>
              </div>
            ) : (
              <div
                id="android-camera-punch"
                className="absolute left-1/2 -translate-x-1/2 top-2.5 w-3.5 h-3.5 rounded-full bg-black border border-neutral-800 flex items-center justify-center"
              >
                {(isCameraActive || isMicActive) && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
            )}

            {/* Right Icons: Signal, WiFi, Battery */}
            <div className="flex items-center gap-1.5">
              <Signal className="w-3 h-3 text-neutral-300" />
              <Wifi className="w-3 h-3 text-neutral-300" />
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-neutral-300">98%</span>
                <Battery className="w-3.5 h-3.5 text-neutral-300" />
              </div>
            </div>
          </div>

          {/* Simulated Incoming OS Push Notification (e.g. SMS Verification Code) */}
          {notification && (
            <div className="absolute top-12 left-3 right-3 z-40 animate-in slide-in-from-top-4 duration-300">
              <div
                id={`notification-banner-${platform}`}
                className={`p-3 rounded-2xl shadow-xl backdrop-blur-md border ${
                  isIOS
                    ? 'bg-neutral-900/90 border-neutral-700 text-white'
                    : 'bg-neutral-800/95 border-emerald-500/30 text-white'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-semibold text-white uppercase text-[10px] tracking-wider">
                      {notification.app}
                    </span>
                  </div>
                  <span className="text-[10px]">now</span>
                </div>
                <div className="font-medium text-xs text-white leading-tight">
                  {notification.title}
                </div>
                <div className="text-[11px] text-neutral-300 mt-0.5 leading-snug">
                  {notification.message}
                </div>
                {notification.actionText && (
                  <button
                    id={`notification-action-btn-${platform}`}
                    type="button"
                    onClick={notification.onAction}
                    className="mt-2 text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    {notification.actionText}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Device Screen Content Area */}
          <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col bg-neutral-900 text-neutral-100">
            {children}
          </div>

          {/* Bottom System Navigation */}
          <div className="relative z-30 w-full py-2 flex justify-center items-center bg-neutral-950">
            {isIOS ? (
              /* iOS Home Indicator Bar */
              <div className="w-32 h-1 bg-white/70 rounded-full" />
            ) : (
              /* Android 3-Button or Modern Pill Gesture Bar */
              <div className="flex items-center justify-center gap-8 w-full py-1">
                <div className="w-3 h-3 border-l-2 border-b-2 border-neutral-400 rotate-45" />
                <div className="w-3.5 h-3.5 rounded-full border-2 border-neutral-400" />
                <div className="w-3 h-3 border-2 border-neutral-400 rounded-xs" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
