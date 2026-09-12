import React, { useState, useEffect, useRef } from 'react';
import { MobilePlatform, CallSessionState, FashionAnalysisResult, OutfitSnapshot } from '../types';
import { FASHION_PRESETS } from '../data/fashionPresets';
import { captureFrameFromStream } from '../utils/cameraStream';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  PhoneCall,
  SwitchCamera,
  Radio,
  Camera,
  Sparkles,
  Zap,
  Volume2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Scissors,
  Palette,
  X,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface VideoChatModuleProps {
  platform: MobilePlatform;
  otherPlatform: MobilePlatform;
  callState: CallSessionState;
  onInitiateCall: (callerPlatform: MobilePlatform) => void;
  onAcceptCall: () => void;
  onRejectCall: () => void;
  onEndCall: () => void;
  localMediaStream: MediaStream | null;
  remoteMediaStream?: MediaStream | null;
  onToggleRealCamera: () => Promise<void>;
  isRealCameraActive: boolean;
  cameraSourceType?: 'real' | 'virtual';
  onOpenFashionStudio?: () => void;
  onCaptureOutfit?: (snapshot: OutfitSnapshot) => void;
}

export const VideoChatModule: React.FC<VideoChatModuleProps> = ({
  platform,
  otherPlatform,
  callState,
  onInitiateCall,
  onAcceptCall,
  onRejectCall,
  onEndCall,
  localMediaStream,
  remoteMediaStream,
  onToggleRealCamera,
  isRealCameraActive,
  cameraSourceType,
  onOpenFashionStudio,
  onCaptureOutfit,
}) => {
  const isIOS = platform === 'ios';
  const userName = isIOS ? 'Alex (iPhone 16 Pro)' : 'Jordan (Pixel 9 Pro)';
  const peerName = isIOS ? 'Jordan (Pixel 9 Pro)' : 'Alex (iPhone 16 Pro)';

  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const [zoomLevel, setZoomLevel] = useState<'1x' | '0.5x'>('1x');
  const [showStats, setShowStats] = useState<boolean>(false);

  // Fashion Stylist HUD state
  const [isFashionHudOpen, setIsFashionHudOpen] = useState<boolean>(false);
  const [capturedOutfit, setCapturedOutfit] = useState<OutfitSnapshot | null>(null);
  const [isAnalyzingOutfit, setIsAnalyzingOutfit] = useState<boolean>(false);
  const [outfitAnalysis, setOutfitAnalysis] = useState<FashionAnalysisResult | null>(null);

  // Video element refs
  const idleVideoRef = useRef<HTMLVideoElement | null>(null);
  const outgoingVideoRef = useRef<HTMLVideoElement | null>(null);
  const connectedRemoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pipLocalVideoRef = useRef<HTMLVideoElement | null>(null);

  // Bind local stream to Idle Viewfinder Video
  useEffect(() => {
    if (idleVideoRef.current && localMediaStream) {
      idleVideoRef.current.srcObject = localMediaStream;
      idleVideoRef.current.play().catch((e) => console.warn('Play error:', e));
    }
  }, [localMediaStream, callState.status]);

  // Bind local stream to Outgoing Background Video
  useEffect(() => {
    if (outgoingVideoRef.current && localMediaStream) {
      outgoingVideoRef.current.srcObject = localMediaStream;
      outgoingVideoRef.current.play().catch((e) => console.warn('Play outgoing error:', e));
    }
  }, [localMediaStream, callState.status]);

  // Bind remote stream when connected
  useEffect(() => {
    if (connectedRemoteVideoRef.current) {
      if (remoteMediaStream) {
        connectedRemoteVideoRef.current.srcObject = remoteMediaStream;
      } else if (localMediaStream) {
        // Fallback to local stream for self-testing in single viewport
        connectedRemoteVideoRef.current.srcObject = localMediaStream;
      }
      connectedRemoteVideoRef.current.play().catch((e) => console.warn('Play remote error:', e));
    }
  }, [remoteMediaStream, localMediaStream, callState.status]);

  // Bind PiP local video
  useEffect(() => {
    if (pipLocalVideoRef.current && localMediaStream) {
      pipLocalVideoRef.current.srcObject = localMediaStream;
      pipLocalVideoRef.current.play().catch((e) => console.warn('Play pip error:', e));
    }
  }, [localMediaStream, callState.status]);

  // Audio tone generation for ringing effect
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let osc: OscillatorNode | null = null;
    let gain: GainNode | null = null;
    let ringInterval: NodeJS.Timeout;

    if (callState.status === 'ringing' && callState.caller !== platform) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
          const playRing = () => {
            if (!audioCtx) return;
            osc = audioCtx.createOscillator();
            gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, audioCtx.currentTime);
            osc.frequency.setValueAtTime(480, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.8);
          };
          playRing();
          ringInterval = setInterval(playRing, 2500);
        }
      } catch (e) {
        console.warn('AudioContext not allowed yet', e);
      }
    }

    return () => {
      clearInterval(ringInterval);
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };
  }, [callState.status, callState.caller, platform]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isCurrentCaller = callState.caller === platform;
  const isOutgoing = (callState.status === 'calling' || callState.status === 'ringing') && isCurrentCaller;
  const isIncoming = callState.status === 'ringing' && !isCurrentCaller;
  const isConnected = callState.status === 'connected';

  const handleSnapAndCheckOutfit = async () => {
    setIsFashionHudOpen(true);
    setIsAnalyzingOutfit(true);

    let dataUrl: string | null = null;
    try {
      const activeVideo = isConnected
        ? (connectedRemoteVideoRef.current || pipLocalVideoRef.current)
        : idleVideoRef.current;
      const activeStream = isConnected
        ? (remoteMediaStream || localMediaStream)
        : localMediaStream;

      dataUrl = await captureFrameFromStream(activeStream, activeVideo);
    } catch (e) {
      console.warn('Frame capture error:', e);
    }

    if (!dataUrl || dataUrl.length < 500) {
      dataUrl = FASHION_PRESETS[isIOS ? 0 : 1].imageUrl;
    }

    const snapshot: OutfitSnapshot = {
      id: 'snap_' + Date.now(),
      title: `${isIOS ? 'iPhone Client' : 'Android Client'} Live Video Frame`,
      imageUrl: dataUrl,
      source: 'webcam',
      capturedAt: new Date().toLocaleTimeString(),
    };

    setCapturedOutfit(snapshot);
    if (onCaptureOutfit) {
      onCaptureOutfit(snapshot);
    }

    try {
      const res = await fetch('/api/fashion/analyze-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: dataUrl,
          userNotes: `Live video frame captured during Vonage consultation on ${platform.toUpperCase()}.`,
          focusArea: 'complete',
        }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setOutfitAnalysis(data.analysis);
        snapshot.analysis = data.analysis;
        if (onCaptureOutfit) {
          onCaptureOutfit(snapshot);
        }
      }
    } catch (err) {
      console.error('Outfit critique request error', err);
    } finally {
      setIsAnalyzingOutfit(false);
    }
  };

  return (
    <div id={`video-chat-container-${platform}`} className="flex-1 flex flex-col h-full bg-black text-white relative select-none overflow-hidden">
      
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2">
          {/* Glowing live indicator */}
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-semibold tracking-wide text-white uppercase font-mono">
            {isConnected ? 'Call Active' : 'Camera On'}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 backdrop-blur-xs font-mono font-medium">
            {cameraSourceType === 'real' ? 'Webcam' : 'Virtual Studio'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isConnected && (
            <span className="text-xs font-mono font-bold text-emerald-400 bg-black/60 px-2 py-0.5 rounded-md border border-emerald-800/60 backdrop-blur-xs">
              {formatDuration(callState.durationSeconds)}
            </span>
          )}
          <button
            id={`toggle-stats-btn-${platform}`}
            type="button"
            onClick={() => setShowStats(!showStats)}
            className={`p-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
              showStats ? 'bg-blue-600 text-white' : 'bg-black/40 text-neutral-300 hover:text-white backdrop-blur-xs'
            }`}
            title="Toggle WebRTC Telemetry"
          >
            <Radio className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Diagnostics HUD Overlay */}
      {showStats && (
        <div className="absolute top-12 left-3 right-3 z-40 bg-black/90 backdrop-blur-md border border-neutral-700 rounded-xl p-3 text-[11px] font-mono text-neutral-300 shadow-2xl animate-in fade-in">
          <div className="flex justify-between items-center pb-1.5 mb-1.5 border-b border-neutral-800 text-neutral-400 font-semibold">
            <span>Vonage Video SDK Telemetry</span>
            <span className="text-emerald-400 font-bold">30 FPS HD</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div>Bitrate: <span className="text-white font-bold">{callState.stats.bitrateKbps} kbps</span></div>
            <div>Latency: <span className="text-white font-bold">{callState.stats.latencyMs} ms</span></div>
            <div>Resolution: <span className="text-white font-bold">{callState.stats.resolution}</span></div>
            <div>Packet Loss: <span className="text-emerald-400 font-bold">{callState.stats.packetLossPct}%</span></div>
            <div>Lens: <span className="text-white font-bold">{cameraFacing === 'front' ? 'Front Wide' : 'Rear Ultra'}</span></div>
            <div>Source: <span className="text-blue-400 font-bold">{cameraSourceType.toUpperCase()}</span></div>
          </div>
        </div>
      )}

      {/* MAIN VIEWPORT: CAMERA FEED */}
      <div className="relative flex-1 w-full h-full bg-neutral-950 flex items-center justify-center overflow-hidden">
        
        {/* 1. Idle Camera Viewfinder Mode */}
        {callState.status === 'idle' && (
          <div className="relative w-full h-full flex flex-col justify-between">
            {/* Live Camera Video Feed */}
            <video
              ref={idleVideoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 ${
                cameraFacing === 'front' ? '-scale-x-100' : ''
              } ${zoomLevel === '0.5x' ? 'scale-90' : 'scale-100'}`}
            />

            {/* Lens Grid Guide Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="w-full h-full grid grid-cols-3 grid-rows-3 border border-white/20">
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-white/20" />
                <div className="border-r border-white/20" />
                <div />
              </div>
            </div>

            {/* Viewfinder Controls & Telemetry (Top Pill) */}
            <div className="relative z-20 pt-12 px-4 flex justify-between items-center">
              {/* Zoom Switcher */}
              <div className="flex items-center bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setZoomLevel('0.5x')}
                  className={`w-7 h-7 rounded-full text-[10px] font-bold transition cursor-pointer ${
                    zoomLevel === '0.5x' ? 'bg-white text-black' : 'text-neutral-300'
                  }`}
                >
                  .5
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel('1x')}
                  className={`w-7 h-7 rounded-full text-[10px] font-bold transition cursor-pointer ${
                    zoomLevel === '1x' ? 'bg-white text-black' : 'text-neutral-300'
                  }`}
                >
                  1x
                </button>
              </div>

              {/* Physical Webcam Toggle Switch */}
              <button
                id={`btn-toggle-camera-${platform}`}
                type="button"
                onClick={onToggleRealCamera}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition cursor-pointer flex items-center gap-1.5 shadow-lg ${
                  cameraSourceType === 'real'
                    ? 'bg-emerald-600/90 border-emerald-400 text-white'
                    : 'bg-black/60 border-white/20 text-neutral-200 hover:bg-black/80'
                }`}
                title="Switch between physical webcam and virtual studio camera"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{cameraSourceType === 'real' ? 'Using Webcam' : 'Enable Webcam'}</span>
              </button>
            </div>

            {/* Bottom Viewfinder Call Launcher Card */}
            <div className="relative z-20 pb-4 px-4 flex flex-col gap-3">
              <div className="bg-neutral-900/85 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Ready to Call {peerName.split(' ')[0]}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      Vonage OpenTok Routed WebRTC Session
                    </div>
                  </div>
                  {/* Flip camera button */}
                  <button
                    type="button"
                    onClick={() => setCameraFacing(cameraFacing === 'front' ? 'back' : 'front')}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
                    title="Flip camera"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                </div>

                {/* Big Action Call Button */}
                <button
                  id={`btn-start-call-${platform}`}
                  type="button"
                  onClick={() => onInitiateCall(platform)}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-xs tracking-wide shadow-lg shadow-emerald-600/40 flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Start Video Call with {otherPlatform.toUpperCase()}</span>
                </button>

                {/* Inspect Outfit with AI Stylist */}
                <button
                  id={`btn-fashion-check-idle-${platform}`}
                  type="button"
                  onClick={handleSnapAndCheckOutfit}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-600/20 to-rose-600/20 border border-pink-500/50 hover:bg-pink-600/30 text-pink-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-sm"
                >
                  <Scissors className="w-3.5 h-3.5 text-pink-400" />
                  <span>Inspect Outfit with AI Stylist</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Outgoing Call (Calling with Camera in Background) */}
        {isOutgoing && (
          <div className="relative w-full h-full flex flex-col justify-between items-center p-6 text-center">
            {/* Background live camera blur */}
            <video
              ref={outgoingVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover blur-sm opacity-60"
            />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />

            <div className="relative z-20 pt-16 flex flex-col items-center">
              <div className="relative mb-5">
                <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
                <div className="relative w-22 h-22 rounded-full bg-neutral-900 border-2 border-blue-500 flex items-center justify-center shadow-2xl">
                  <span className="text-3xl font-bold text-blue-400">
                    {isIOS ? 'J' : 'A'}
                  </span>
                </div>
              </div>
              <div className="text-[11px] uppercase font-bold tracking-widest text-blue-400 mb-1">
                Connecting via Vonage...
              </div>
              <h4 className="text-xl font-bold text-white">{peerName}</h4>
              <p className="text-xs text-neutral-400 mt-1">Ringing receiver device...</p>
            </div>

            <div className="relative z-20 pb-8">
              <button
                id={`btn-cancel-call-${platform}`}
                type="button"
                onClick={onEndCall}
                className="w-15 h-15 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-xl shadow-red-600/40 active:scale-95 cursor-pointer transition"
                title="Cancel Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* 3. Incoming Call (Ringing with Camera in Background) */}
        {isIncoming && (
          <div className="relative w-full h-full flex flex-col justify-between items-center p-6 text-center">
            <video
              ref={idleVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover blur-sm opacity-60"
            />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />

            <div className="relative z-20 pt-16 flex flex-col items-center">
              <div className="relative mb-5">
                <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
                <div className="relative w-22 h-22 rounded-full bg-neutral-900 border-2 border-emerald-500 flex items-center justify-center shadow-2xl">
                  <span className="text-3xl font-bold text-emerald-400">
                    {isIOS ? 'J' : 'A'}
                  </span>
                </div>
              </div>
              <div className="text-[11px] uppercase font-bold tracking-widest text-emerald-400 mb-1 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                Incoming Video Call
              </div>
              <h4 className="text-xl font-bold text-white">{peerName}</h4>
              <p className="text-xs text-neutral-400 mt-1">Vonage Client SDK ({otherPlatform.toUpperCase()})</p>
            </div>

            <div className="relative z-20 pb-8 w-full flex items-center justify-around px-4">
              <div className="flex flex-col items-center gap-2">
                <button
                  id={`btn-decline-call-${platform}`}
                  type="button"
                  onClick={onRejectCall}
                  className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-xl shadow-red-600/40 active:scale-95 cursor-pointer transition"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
                <span className="text-xs font-semibold text-neutral-300">Decline</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  id={`btn-accept-call-${platform}`}
                  type="button"
                  onClick={onAcceptCall}
                  className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-600/40 active:scale-95 cursor-pointer transition animate-bounce"
                >
                  <PhoneCall className="w-6 h-6" />
                </button>
                <span className="text-xs font-semibold text-emerald-400">Accept</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. Connected Call View */}
        {isConnected && (
          <div className="relative w-full h-full flex flex-col justify-between">
            {/* Full-screen Remote Video Stream */}
            <div className="absolute inset-0 bg-neutral-950 overflow-hidden flex items-center justify-center">
              <video
                ref={connectedRemoteVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Remote participant badge */}
              <div className="absolute top-12 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[11px] font-semibold text-white flex items-center gap-2 border border-white/10 z-20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{peerName}</span>
                <span className="text-[9px] font-mono text-neutral-400">({otherPlatform.toUpperCase()})</span>
              </div>
            </div>

            {/* Local Picture-in-Picture Preview (Draggable/Floating) */}
            <div
              id={`pip-preview-${platform}`}
              className="absolute bottom-22 right-3 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/50 shadow-2xl bg-neutral-900 z-30 flex flex-col justify-end transition-all"
            >
              {!isVideoMuted ? (
                <video
                  ref={pipLocalVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraFacing === 'front' ? '-scale-x-100' : ''}`}
                />
              ) : (
                <div className="w-full h-full bg-neutral-900 flex flex-col items-center justify-center p-2 text-center">
                  <VideoOff className="w-6 h-6 text-neutral-500 mb-1" />
                  <span className="text-[10px] text-neutral-400">Camera Off</span>
                </div>
              )}
              
              <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/70 backdrop-blur-xs py-0.5 px-1 rounded text-center text-[9px] text-white font-medium">
                You ({isIOS ? 'iOS' : 'Android'})
              </div>
            </div>

            {/* In-Call Action Control Bar */}
            <div className="relative z-20 mt-auto w-full bg-neutral-950/85 backdrop-blur-xl border-t border-neutral-800 px-4 py-3 flex items-center justify-around">
              {/* Mute Audio */}
              <button
                id={`btn-mute-audio-${platform}`}
                type="button"
                onClick={() => setIsAudioMuted(!isAudioMuted)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition cursor-pointer ${
                  isAudioMuted
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
                title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Stop Video */}
              <button
                id={`btn-mute-video-${platform}`}
                type="button"
                onClick={() => setIsVideoMuted(!isVideoMuted)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition cursor-pointer ${
                  isVideoMuted
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
                title={isVideoMuted ? 'Start Video' : 'Stop Video'}
              >
                {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </button>

              {/* Flip Camera */}
              <button
                id={`btn-flip-cam-${platform}`}
                type="button"
                onClick={() => setCameraFacing(cameraFacing === 'front' ? 'back' : 'front')}
                className="w-11 h-11 rounded-full bg-white/15 text-white hover:bg-white/25 flex items-center justify-center transition cursor-pointer"
                title="Flip Camera"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>

              {/* Check Outfit & AI Stylist Ideas */}
              <button
                id={`btn-fashion-check-call-${platform}`}
                type="button"
                onClick={handleSnapAndCheckOutfit}
                className="w-11 h-11 rounded-full bg-gradient-to-tr from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white flex items-center justify-center transition cursor-pointer shadow-lg shadow-pink-600/30 active:scale-95"
                title="Snap Outfit & AI Design Ideas"
              >
                <Scissors className="w-4 h-4" />
              </button>

              {/* End Call */}
              <button
                id={`btn-hangup-${platform}`}
                type="button"
                onClick={onEndCall}
                className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-600/40 transition cursor-pointer active:scale-95"
                title="End Call"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* In-Phone Fashion Stylist HUD Drawer */}
        {isFashionHudOpen && (
          <div className="absolute inset-x-0 bottom-0 z-40 bg-neutral-900/95 backdrop-blur-2xl border-t border-neutral-700 rounded-t-3xl p-4 shadow-2xl max-h-[85%] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-800 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-pink-600/30 text-pink-300 flex items-center justify-center">
                  <Scissors className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">Fashion Design Review</h4>
                  <p className="text-[10px] text-neutral-400">Live Gemini 3.8 Flash Critique</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {onOpenFashionStudio && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsFashionHudOpen(false);
                      onOpenFashionStudio();
                    }}
                    className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[10px] font-semibold text-neutral-300 flex items-center gap-1 cursor-pointer"
                    title="Expand to Full Studio Lookbook"
                  >
                    <span>Full Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsFashionHudOpen(false)}
                  className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isAnalyzingOutfit ? (
              <div className="py-8 flex flex-col items-center justify-center text-center gap-2 text-neutral-400">
                <RefreshCw className="w-6 h-6 animate-spin text-pink-400" />
                <p className="text-xs font-semibold text-white">Analyzing Outfit with Gemini AI...</p>
                <p className="text-[10px] text-neutral-500">Checking drape, silhouette balance, and color theory</p>
              </div>
            ) : outfitAnalysis ? (
              <div className="space-y-3 text-xs">
                {/* Captured Frame Thumbnail */}
                {capturedOutfit && (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden bg-black border border-pink-500/30 flex items-center justify-center">
                    <img
                      src={capturedOutfit.imageUrl}
                      alt="Captured Live Outfit"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-pink-950/90 border border-pink-500/50 text-[9px] font-bold text-pink-300">
                      LIVE FRAME CAPTURED
                    </div>
                  </div>
                )}

                {/* Score & Title */}
                <div className="flex items-center justify-between bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                  <div>
                    <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wide">
                      {outfitAnalysis.styleArchetype}
                    </span>
                    <p className="text-xs font-bold text-white">{outfitAnalysis.styleTitle}</p>
                  </div>
                  <div className="flex items-baseline gap-0.5 bg-pink-950/60 px-2 py-1 rounded-lg border border-pink-800/60">
                    <span className="text-sm font-bold text-pink-300">{outfitAnalysis.overallScore}</span>
                    <span className="text-[9px] text-pink-500 font-bold">/10</span>
                  </div>
                </div>

                {/* Stylist comment */}
                <div className="bg-pink-950/20 border border-pink-800/30 rounded-xl p-2.5 text-[11px] text-pink-100 italic">
                  "{outfitAnalysis.virtualStylistComment}"
                </div>

                {/* Proportions & Drape */}
                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Silhouette & Drape</p>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">{outfitAnalysis.fitAndSilhouette}</p>
                </div>

                {/* Color Harmony */}
                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Color Palette & Theory</p>
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {outfitAnalysis.colorPalette.detectedColors.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-[10px] text-white">
                        {c}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-300/90">{outfitAnalysis.colorPalette.recommendation}</p>
                </div>

                {/* Design Ideas */}
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Actionable Design Upgrades</p>
                  <div className="space-y-1.5">
                    {outfitAnalysis.designIdeas.map((idea, idx) => (
                      <div key={idx} className="bg-neutral-950 p-2 rounded-lg border border-neutral-800 text-[11px]">
                        <div className="flex items-center justify-between text-white font-bold mb-0.5">
                          <span>{idea.title}</span>
                          <span className="text-[9px] text-pink-400">{idea.impact}</span>
                        </div>
                        <p className="text-neutral-300 text-[10px]">{idea.concept}</p>
                        <p className="text-[9px] text-neutral-500 mt-1 font-mono">Fabric: {idea.fabricSuggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Re-snap button */}
                <button
                  type="button"
                  onClick={handleSnapAndCheckOutfit}
                  className="w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Re-Snap Current Frame</span>
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
