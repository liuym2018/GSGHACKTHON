import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Bug,
  HelpCircle,
  FileTerminal,
} from 'lucide-react';

interface CodeOutputViewerProps {
  filename: string;
  category: string;
  outputLog: string;
  isRunning: boolean;
  targetEnv: string;
  onRunSimulation: () => void;
  onOutputChange: (newOutput: string) => void;
  onAnalyzeWithAi: (logToAnalyze?: string) => void;
}

const PRESET_OUTPUT_SCENARIOS = [
  {
    id: 'clean',
    title: 'Clean Build & Connect',
    badge: 'Success',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    log: `[10:14:02] INFO: Metro Bundler active on port 8081
[10:14:03] BUNDLE: ./src/VonageVideoCallScreen.tsx ░░░░░░░░░░░░░░░░ 100% (1,428 modules)
[10:14:04] LOG: [NativeModules] Initializing opentok-react-native v0.19.4 bridge
[10:14:04] LOG: [Permissions] Checking CAMERA and RECORD_AUDIO... GRANTED
[10:14:05] LOG: [VonageRTC] Session instantiated with ID: 1_MX40Nz...
[10:14:05] LOG: [VonageRTC] Connecting to relay router over Secure WebRTC (DTLS-SRTP)...
[10:14:06] LOG: [VonageRTC] Session connection established (status: CONNECTED, latency: 26ms)
[10:14:06] LOG: [Publisher] Local camera viewfinder rendered with aspect ratio 16:9
[10:14:07] SUCCESS: Component rendered with zero native bridge bottlenecks.`,
  },
  {
    id: 'ios_nscamera',
    title: 'iOS Crash: Missing NSCameraUsageDescription',
    badge: 'Crash',
    badgeColor: 'bg-rose-950 text-rose-300 border-rose-800',
    log: `[10:14:15] xcodebuild -workspace ios/VonageApp.xcworkspace -scheme VonageApp
[10:14:16] CompileSwift normal arm64
[10:14:17] ** BUILD SUCCEEDED **
[10:14:18] Launching on iPhone 16 Pro (iOS 18.0)
[10:14:19] *** Terminating app due to uncaught exception 'NSInternalInconsistencyException', reason: 'This app has crashed because it attempted to access privacy-sensitive data without a usage description. The app's Info.plist must contain an NSCameraUsageDescription key with a string value explaining to the user how the app uses this data.'
[10:14:19] dyld: terminating with uncaught exception
[10:14:19] Process 49202 exited with code 134 (SIGABRT)`,
  },
  {
    id: 'opentok_1006',
    title: 'OpenTok Error 1006: Session Failed',
    badge: 'WebRTC Err',
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
    log: `[10:14:30] LOG: Initializing OTSession with apiKey: "47291032"
[10:14:31] WARN: [VonageRTC] Connecting to session 1_MX40Nz...
[10:14:32] ERROR: [OTSession error] code: 1006, message: "Session connect failed: The client token has expired or signature is invalid."
[10:14:32] ERROR: [VonageRTC] Handshake aborted. Verify session token expiration time or API secret on your backend token generator.
[10:14:33] WARN: OTSession status shifted to DISCONNECTED.`,
  },
  {
    id: 'android_perm',
    title: 'Android Permission Denied',
    badge: 'Permission',
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
    log: `[10:14:40] ./gradlew :app:assembleDebug
[10:14:42] BUILD SUCCESSFUL
[10:14:43] Starting: Intent { cmp=com.vonage.mobile/.MainActivity }
[10:14:44] WARN: [PermissionsAndroid] User selected 'Deny' on dialog for android.permission.CAMERA
[10:14:45] ERROR: [OTPublisher] Cannot start local video track: SecurityException: Camera service requires CAMERA permission.
[10:14:45] ERROR: Uncaught Promise rejection: [Error: Permissions Denied]`,
  },
  {
    id: 'payload_413',
    title: 'Fashion AI 413 Payload Too Large',
    badge: 'HTTP 413',
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-800',
    log: `[10:14:50] POST /api/fashion/analyze-outfit HTTP/1.1
[10:14:50] Host: localhost:3000
[10:14:50] Content-Length: 6428190
[10:14:51] HTTP/1.1 413 Payload Too Large
[10:14:51] PayloadTooLargeError: request entity too large
[10:14:51]     at readStream (/node_modules/raw-body/index.js:156:17)
[10:14:52] ERROR: [OutfitClient] Base64 image payload (6.4MB) rejected by server body limit.`,
  },
];

export const CodeOutputViewer: React.FC<CodeOutputViewerProps> = ({
  filename,
  category,
  outputLog,
  isRunning,
  targetEnv,
  onRunSimulation,
  onOutputChange,
  onAnalyzeWithAi,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(outputLog);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasErrors =
    outputLog.toLowerCase().includes('error') ||
    outputLog.toLowerCase().includes('exception') ||
    outputLog.toLowerCase().includes('failed') ||
    outputLog.toLowerCase().includes('crash') ||
    outputLog.toLowerCase().includes('413');

  return (
    <div id="code-output-viewer" className="flex-1 flex flex-col bg-neutral-950 min-h-[580px]">
      
      {/* Target & Status Sub-bar */}
      <div className="px-5 py-3.5 bg-neutral-900/80 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-neutral-800 text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white font-mono">{targetEnv || 'Native Build Simulator'}</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  hasErrors
                    ? 'bg-rose-950 text-rose-300 border-rose-800'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                }`}
              >
                {hasErrors ? 'Issues Detected' : 'Healthy Output'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Simulating compilation, bundle resolution & WebRTC logs for <code className="text-blue-300">{filename}</code>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRunSimulation}
            disabled={isRunning}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-sm"
          >
            {isRunning ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Build & Check</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onAnalyzeWithAi(outputLog)}
            className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>AI Review & Suggestions</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 flex items-center gap-1.5 transition cursor-pointer"
            title="Copy Output"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Preset Simulation Scenarios Picker */}
      <div className="px-5 py-2.5 bg-neutral-900/40 border-b border-neutral-800 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <FileTerminal className="w-3.5 h-3.5 text-neutral-500" />
          Test Scenarios:
        </span>
        {PRESET_OUTPUT_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            onClick={() => {
              onOutputChange(scenario.log);
              onAnalyzeWithAi(scenario.log);
            }}
            className="px-2.5 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/70 text-neutral-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer shrink-0 text-[11px]"
          >
            <span>{scenario.title}</span>
            <span className={`text-[9px] px-1 py-0.2 rounded border font-mono ${scenario.badgeColor}`}>
              {scenario.badge}
            </span>
          </button>
        ))}
      </div>

      {/* Terminal Display or Custom Paste Editor */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className="flex items-center justify-between px-5 py-1.5 bg-[#090d13] border-b border-neutral-800 text-[11px] text-neutral-400">
          <span className="font-mono flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
            <span className="ml-2 text-neutral-300">Terminal Output Stream</span>
          </span>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer font-sans"
          >
            {isEditing ? 'View Formatted Console' : 'Paste Custom Output / Logs'}
          </button>
        </div>

        {isEditing ? (
          <div className="flex-1 p-4 bg-[#0d1117] flex flex-col">
            <textarea
              value={outputLog}
              onChange={(e) => onOutputChange(e.target.value)}
              placeholder="Paste your React Native build output, Xcode error, or Android logcat here..."
              className="flex-1 w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:outline-hidden focus:border-blue-500 resize-none leading-relaxed"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
              <span>Paste compiler output or console logs to get targeted AI diagnostic fixes</span>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  onAnalyzeWithAi(outputLog);
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer"
              >
                Analyze Pasted Output
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-4 sm:p-5 font-mono text-xs leading-relaxed bg-[#0d1117] select-text">
            {outputLog.split('\n').map((line, idx) => {
              const isError =
                line.includes('ERROR') ||
                line.includes('SIGABRT') ||
                line.includes('Terminating') ||
                line.includes('Exception') ||
                line.includes('413') ||
                line.includes('PayloadTooLarge');
              const isWarn = line.includes('WARN');
              const isSuccess = line.includes('SUCCESS') || line.includes('SUCCEEDED');
              const isBundle = line.includes('BUNDLE') || line.includes('INFO');

              return (
                <div
                  key={idx}
                  className={`py-0.5 flex gap-2 font-mono ${
                    isError
                      ? 'text-rose-400 font-semibold bg-rose-950/20 px-1 -mx-1 rounded'
                      : isWarn
                      ? 'text-amber-300'
                      : isSuccess
                      ? 'text-emerald-400 font-semibold'
                      : isBundle
                      ? 'text-blue-300'
                      : 'text-neutral-300'
                  }`}
                >
                  <span className="text-neutral-600 select-none w-7 text-right shrink-0">{idx + 1}</span>
                  <span className="flex-1 whitespace-pre-wrap">{line}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Hint Banner */}
      <div className="px-5 py-3 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          {hasErrors ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>
            {hasErrors
              ? 'Potential native/API failure detected in output. Click "AI Review & Suggestions" for solution.'
              : 'All modules bundled cleanly. Click "AI Review & Suggestions" to inspect production best practices.'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onAnalyzeWithAi(outputLog)}
          className="text-xs font-semibold text-purple-300 hover:text-purple-200 cursor-pointer flex items-center gap-1 underline"
        >
          <span>Get AI suggestions for this output</span>
          <span>&rarr;</span>
        </button>
      </div>
    </div>
  );
};
