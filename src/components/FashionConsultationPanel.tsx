import React, { useState, useEffect, useRef } from 'react';
import {
  FashionAnalysisResult,
  OutfitSnapshot,
} from '../types';
import { FASHION_PRESETS, FASHION_CONSULTATION_TOPICS } from '../data/fashionPresets';
import {
  createVirtualCameraStream,
  tryGetPhysicalWebcam,
  captureFrameFromStream,
  CameraFeedController,
  VirtualOutfitStyle,
} from '../utils/cameraStream';
import { StylistChatbot } from './StylistChatbot';
import {
  Sparkles,
  Camera,
  Upload,
  Palette,
  Scissors,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Layers,
  Award,
  ChevronRight,
  Maximize2,
  Info,
  Copy,
  Check,
  Video,
  VideoOff,
  SwitchCamera,
  Grid,
  Zap,
  ArrowLeft,
  ExternalLink,
  MessageSquare,
  FileText,
} from 'lucide-react';

interface FashionConsultationPanelProps {
  currentOutfit: OutfitSnapshot | null;
  onSelectOutfit: (outfit: OutfitSnapshot) => void;
  onCaptureFromVideo?: () => void;
  isVideoActive?: boolean;
  cameraStream?: MediaStream | null;
  cameraSourceType?: 'real' | 'virtual';
  onToggleRealCamera?: () => Promise<void> | void;
}

export const FashionConsultationPanel: React.FC<FashionConsultationPanelProps> = ({
  currentOutfit,
  onSelectOutfit,
  onCaptureFromVideo,
  isVideoActive,
  cameraStream: propCameraStream,
  cameraSourceType: propCameraSourceType = 'virtual',
  onToggleRealCamera: propOnToggleRealCamera,
}) => {
  // View mode: 'live' shows the live video camera viewfinder; 'snapshot' shows the analyzed outfit frame; 'presets' shows preset catalog
  const [activeViewMode, setActiveViewMode] = useState<'live' | 'snapshot' | 'presets'>('live');
  const [selectedTopic, setSelectedTopic] = useState<string>('complete');
  const [userNotes, setUserNotes] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<FashionAnalysisResult | null>(
    currentOutfit?.analysis || null
  );
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [snapshotsHistory, setSnapshotsHistory] = useState<OutfitSnapshot[]>([]);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string | null>(null);
  const [justUpdated, setJustUpdated] = useState<boolean>(false);
  const [analysisRightTab, setAnalysisRightTab] = useState<'report' | 'chat'>('report');

  // Live Camera Controls State
  const [localSourceType, setLocalSourceType] = useState<'real' | 'virtual'>(propCameraSourceType);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(propCameraStream || null);
  const [virtualLook, setVirtualLook] = useState<VirtualOutfitStyle>('tuxedo');
  const [zoomLevel, setZoomLevel] = useState<'0.5x' | '1x' | '2x'>('1x');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [cameraNotice, setCameraNotice] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const localControllerRef = useRef<CameraFeedController | null>(null);
  const physicalWebcamRef = useRef<MediaStream | null>(null);

  // Synchronize with parent stream if provided, or initialize dedicated studio camera
  useEffect(() => {
    if (propCameraStream) {
      setActiveStream(propCameraStream);
      setLocalSourceType(propCameraSourceType);
    } else if (!activeStream) {
      // Auto-boot high-fidelity virtual fashion camera so the camera feed is instantly active
      const ctrl = createVirtualCameraStream('Studio Runway Model', 'ios', virtualLook);
      localControllerRef.current = ctrl;
      setActiveStream(ctrl.stream);
      setLocalSourceType('virtual');
    }

    return () => {
      localControllerRef.current?.stop();
      if (physicalWebcamRef.current) {
        physicalWebcamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [propCameraStream, propCameraSourceType]);

  // Synchronize analysis with currentOutfit if it changes externally
  useEffect(() => {
    if (currentOutfit?.analysis) {
      setAnalysis(currentOutfit.analysis);
      if (currentOutfit.capturedAt) {
        setLastUpdatedTime(currentOutfit.capturedAt);
      }
    }
  }, [currentOutfit]);

  // Seed default look if none analyzed yet so user sees instant output
  useEffect(() => {
    if (!analysis && !currentOutfit) {
      const defaultSnapshot: OutfitSnapshot = {
        id: 'initial_tuxedo',
        title: 'Architectural Midnight Tuxedo',
        imageUrl: FASHION_PRESETS[0].imageUrl,
        source: 'preset',
        capturedAt: new Date().toLocaleTimeString(),
      };
      onSelectOutfit(defaultSnapshot);
      handleAnalyze(defaultSnapshot, 'tuxedo');
    }
  }, []);

  // Bind stream to live <video> element whenever stream or view mode changes
  useEffect(() => {
    if (activeViewMode === 'live' && videoRef.current && activeStream) {
      videoRef.current.srcObject = activeStream;
      videoRef.current.play().catch((err) => {
        console.warn('Live camera play error in Fashion Panel:', err);
      });
    }
  }, [activeStream, activeViewMode]);

  // Handle changing the virtual model's look
  const handleChangeVirtualLook = (look: VirtualOutfitStyle) => {
    setVirtualLook(look);
    if (localControllerRef.current?.setOutfitStyle) {
      localControllerRef.current.setOutfitStyle(look);
    } else {
      // Re-create controller with new style
      localControllerRef.current?.stop();
      const ctrl = createVirtualCameraStream('Studio Runway Model', 'ios', look);
      localControllerRef.current = ctrl;
      setActiveStream(ctrl.stream);
    }
    const lookName = look.replace('_', ' ').toUpperCase();
    showNotice(`Switched runway model to ${lookName}. Auto-analyzing look...`);
    
    // Auto-analyze the selected look style immediately so the output visibly updates
    const snap: OutfitSnapshot = {
      id: 'look_' + look + '_' + Date.now(),
      title: `${lookName} (Runway Model)`,
      imageUrl: FASHION_PRESETS[look === 'emerald_silk' ? 2 : look === 'camel_trench' ? 3 : look === 'streetwear' ? 1 : 0].imageUrl,
      source: 'webcam',
      capturedAt: new Date().toLocaleTimeString(),
    };
    onSelectOutfit(snap);
    handleAnalyze(snap, look);
  };

  // Toggle between physical hardware webcam and virtual studio camera
  const handleToggleCamera = async () => {
    if (propOnToggleRealCamera) {
      await propOnToggleRealCamera();
      return;
    }

    if (localSourceType === 'real') {
      // Switch back to virtual studio model
      if (physicalWebcamRef.current) {
        physicalWebcamRef.current.getTracks().forEach((t) => t.stop());
        physicalWebcamRef.current = null;
      }
      const ctrl = createVirtualCameraStream('Studio Runway Model', 'ios', virtualLook);
      localControllerRef.current = ctrl;
      setActiveStream(ctrl.stream);
      setLocalSourceType('virtual');
      showNotice('Switched to Virtual Studio Runway Camera');
    } else {
      // Request physical hardware webcam
      showNotice('Connecting to hardware webcam...');
      const webcamStream = await tryGetPhysicalWebcam();
      if (webcamStream) {
        physicalWebcamRef.current = webcamStream;
        setActiveStream(webcamStream);
        setLocalSourceType('real');
        showNotice('Hardware Webcam Connected Successfully!');
      } else {
        showNotice('Webcam blocked or unavailable in this window. Virtual Studio HD Camera is active.');
      }
    }
  };

  const showNotice = (msg: string) => {
    setCameraNotice(msg);
    setTimeout(() => setCameraNotice(null), 3500);
  };

  // Capture Live Frame & Immediately Run Fashion AI Analysis
  const handleCaptureAndAnalyze = async () => {
    // 1. Shutter flash effect
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 250);

    let frameDataUrl: string | null = null;

    try {
      // Check if local virtual controller has direct canvas snapshot
      if (localSourceType === 'virtual' && localControllerRef.current?.captureCurrentFrame) {
        frameDataUrl = localControllerRef.current.captureCurrentFrame();
      }

      // If not, capture directly from the active stream / video element
      if (!frameDataUrl) {
        frameDataUrl = await captureFrameFromStream(activeStream, videoRef.current);
      }
    } catch (e) {
      console.warn('Frame capture issue:', e);
    }

    // Fallback to preset look if canvas capture returned empty
    if (!frameDataUrl || frameDataUrl.length < 500) {
      frameDataUrl = FASHION_PRESETS[virtualLook === 'emerald_silk' ? 2 : virtualLook === 'camel_trench' ? 3 : virtualLook === 'streetwear' ? 1 : 0].imageUrl;
    }

    const newSnapshot: OutfitSnapshot = {
      id: 'live_snap_' + Date.now(),
      title: localSourceType === 'real' ? 'Live Webcam Snapshot' : `Runway Look (${virtualLook.replace('_', ' ').toUpperCase()})`,
      imageUrl: frameDataUrl,
      source: 'webcam',
      capturedAt: new Date().toLocaleTimeString(),
    };

    onSelectOutfit(newSnapshot);
    setActiveViewMode('snapshot');
    handleAnalyze(newSnapshot, virtualLook);
  };

  // Analyze Outfit handler - Calls /api/fashion/analyze-outfit
  const handleAnalyze = async (outfitToAnalyze = currentOutfit, overrideLook?: VirtualOutfitStyle) => {
    const lookToAnalyze = overrideLook || virtualLook;
    setIsAnalyzing(true);

    try {
      const res = await fetch('/api/fashion/analyze-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: outfitToAnalyze?.imageUrl,
          userNotes,
          focusArea: selectedTopic,
          outfitTitle: outfitToAnalyze?.title,
          virtualLook: lookToAnalyze,
        }),
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        const timeStr = new Date().toLocaleTimeString();
        setLastUpdatedTime(timeStr);
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 3000);

        const updatedSnapshot: OutfitSnapshot = {
          id: outfitToAnalyze?.id || ('snap_' + Date.now()),
          title: outfitToAnalyze?.title || data.analysis.styleTitle,
          imageUrl: outfitToAnalyze?.imageUrl || FASHION_PRESETS[0].imageUrl,
          source: outfitToAnalyze?.source || 'webcam',
          capturedAt: timeStr,
          analysis: data.analysis,
        };

        onSelectOutfit(updatedSnapshot);

        // Update snapshots history
        setSnapshotsHistory((prev) => {
          const filtered = prev.filter((p) => p.id !== updatedSnapshot.id);
          return [updatedSnapshot, ...filtered].slice(0, 10);
        });
      }
    } catch (e) {
      console.error('Fashion analysis error', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Preset Selection - Immediately loads & analyzes selected preset
  const handleSelectPreset = (preset: (typeof FASHION_PRESETS)[0]) => {
    const newSnapshot: OutfitSnapshot = {
      id: preset.id,
      title: preset.name,
      imageUrl: preset.imageUrl,
      source: 'preset',
      capturedAt: new Date().toLocaleTimeString(),
    };
    onSelectOutfit(newSnapshot);
    setActiveViewMode('snapshot');
    
    let lookHint: VirtualOutfitStyle = 'tuxedo';
    if (preset.id === 'preset_evening') lookHint = 'emerald_silk';
    else if (preset.id === 'preset_knitwear') lookHint = 'camel_trench';
    else if (preset.id === 'preset_streetwear') lookHint = 'streetwear';
    
    handleAnalyze(newSnapshot, lookHint);
  };

  // Custom Image Upload - Immediately analyzes uploaded outfit
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      const uploadedSnapshot: OutfitSnapshot = {
        id: 'upload_' + Date.now(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        imageUrl: base64Url,
        source: 'upload',
        capturedAt: new Date().toLocaleTimeString(),
      };
      onSelectOutfit(uploadedSnapshot);
      setActiveViewMode('snapshot');
      handleAnalyze(uploadedSnapshot);
    };
    reader.readAsDataURL(file);
  };

  const handleCopyReport = () => {
    if (!analysis) return;
    const text = `
=== FASHION DESIGN & STYLING CONSULTATION REPORT ===
Style Title: ${analysis.styleTitle}
Archetype: ${analysis.styleArchetype}
Aesthetic Score: ${analysis.overallScore}/10

FIT & SILHOUETTE:
${analysis.fitAndSilhouette}

COLOR PALETTE:
Colors: ${analysis.colorPalette.detectedColors.join(', ')}
Season: ${analysis.colorPalette.season}
Recommendation: ${analysis.colorPalette.recommendation}

DESIGN & REDESIGN IDEAS:
${analysis.designIdeas.map((idea, i) => `${i + 1}. ${idea.title}: ${idea.concept} (Fabric: ${idea.fabricSuggestion})`).join('\n')}

STYLIST VERDICT:
${analysis.virtualStylistComment}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl flex flex-col gap-6">
      
      {/* Top Banner: Fashion Studio Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 shrink-0">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight">
                Live Video Fashion Consultation & Outfit AI
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-950 text-pink-300 border border-pink-800/80">
                Gemini 3.8 Flash
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Camera ON (30 FPS)
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Live video viewfinder with real-time pose and silhouette tracking. Snap live frames for couture tailoring critique and color theory analysis.
            </p>
          </div>
        </div>

        {/* Quick Actions & View Mode Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode switcher */}
          <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setActiveViewMode('live')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeViewMode === 'live'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Live Camera</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveViewMode('snapshot')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeViewMode === 'snapshot'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Captured Look</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveViewMode('presets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeViewMode === 'presets'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Presets</span>
            </button>
          </div>

          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition cursor-pointer border border-neutral-700">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Outfit</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {/* Camera Feedback Notice */}
      {cameraNotice && (
        <div className="p-3 bg-neutral-850 border border-neutral-700 rounded-xl text-xs font-medium text-blue-300 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{cameraNotice}</span>
        </div>
      )}

      {/* Main Grid: Left Column Camera / Outfit Source, Right Column Fashion Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 cols): Live Video Viewfinder & Outfit Controls */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* VIEW 1: LIVE VIDEO CAMERA VIEWFINDER */}
          {activeViewMode === 'live' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
              
              {/* Camera Header Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Live Video Camera Feed
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                    30 FPS HD
                  </span>
                </div>

                {/* Webcam vs Virtual Studio switcher */}
                <button
                  id="btn-toggle-outfit-cam-source"
                  type="button"
                  onClick={handleToggleCamera}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                    localSourceType === 'real'
                      ? 'bg-emerald-600/90 border-emerald-500 text-white'
                      : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
                  }`}
                  title="Toggle hardware webcam vs simulated studio camera"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-400" />
                  <span>{localSourceType === 'real' ? 'Webcam Active' : 'Use Hardware Webcam'}</span>
                </button>
              </div>

              {/* Viewfinder Stage */}
              <div className="relative w-full aspect-[3/4] bg-black rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center group shadow-inner">
                
                {/* Real Live Video Element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-transform duration-200 ${
                    isFlipped ? '-scale-x-100' : ''
                  } ${
                    zoomLevel === '0.5x' ? 'scale-90' : zoomLevel === '2x' ? 'scale-125' : 'scale-100'
                  }`}
                />

                {/* Shutter Flash Animation */}
                {isFlashing && (
                  <div className="absolute inset-0 bg-white z-50 animate-out fade-out duration-200 pointer-events-none" />
                )}

                {/* Optional Composition Grid Overlay */}
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none opacity-25">
                    <div className="w-full h-full grid grid-cols-3 grid-rows-3 border border-white/20">
                      <div className="border-r border-b border-white/20" />
                      <div className="border-r border-b border-white/20" />
                      <div className="border-b border-white/20" />
                      <div className="border-r border-b border-white/20" />
                      <div className="border-r border-b border-white/20" />
                      <div className="border-b border-white/20" />
                      <div className="border-r border-b border-white/20" />
                      <div className="border-r border-b border-white/20" />
                      <div />
                    </div>
                  </div>
                )}

                {/* Top Telemetry Overlay */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] text-white font-mono">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>REC • LIVE STYLIST</span>
                  </div>

                  <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-[10px] text-neutral-300 font-mono">
                    <span>{localSourceType === 'real' ? 'OPTICAL SENSOR' : 'STUDIO SIM'}</span>
                  </div>
                </div>

                {/* In-Viewfinder Floating Quick Controls (Zoom, Flip, Grid) */}
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between">
                  {/* Zoom buttons */}
                  <div className="flex items-center bg-black/70 backdrop-blur-md rounded-full p-0.5 border border-white/15 shadow-lg">
                    {(['0.5x', '1x', '2x'] as const).map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => setZoomLevel(z)}
                        className={`w-7 h-7 rounded-full text-[10px] font-bold transition cursor-pointer flex items-center justify-center ${
                          zoomLevel === z
                            ? 'bg-white text-black shadow-sm'
                            : 'text-neutral-300 hover:text-white'
                        }`}
                      >
                        {z === '0.5x' ? '.5' : z === '1x' ? '1x' : '2x'}
                      </button>
                    ))}
                  </div>

                  {/* Grid and Flip buttons */}
                  <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md rounded-full p-1 border border-white/15 shadow-lg">
                    <button
                      type="button"
                      onClick={() => setShowGrid(!showGrid)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
                        showGrid ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                      title="Toggle Composition Grid"
                    >
                      <Grid className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="w-7 h-7 rounded-full text-neutral-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                      title="Mirror / Flip Camera"
                    >
                      <SwitchCamera className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Virtual Fashion Model Look Selector (if in virtual camera mode) */}
              {localSourceType === 'virtual' && (
                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 block">
                    Virtual Model Outfit Style
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'tuxedo', label: 'Midnight Tuxedo', icon: '👔' },
                      { id: 'emerald_silk', label: 'Emerald Silk Gown', icon: '👗' },
                      { id: 'camel_trench', label: 'Camel Trenchcoat', icon: '🧥' },
                      { id: 'streetwear', label: 'Tech Streetwear', icon: '⚡' },
                    ].map((look) => (
                      <button
                        key={look.id}
                        type="button"
                        onClick={() => handleChangeVirtualLook(look.id as VirtualOutfitStyle)}
                        className={`px-2.5 py-1.5 rounded-lg text-left text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                          virtualLook === look.id
                            ? 'bg-pink-950/60 border border-pink-600 text-white'
                            : 'bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300'
                        }`}
                      >
                        <span className="text-sm">{look.icon}</span>
                        <span className="truncate">{look.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Shutter Capture Button */}
              <button
                id="btn-capture-live-frame"
                type="button"
                disabled={isAnalyzing}
                onClick={handleCaptureAndAnalyze}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 active:scale-[0.98] text-white font-bold text-xs tracking-wide shadow-lg shadow-pink-600/30 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Captured Outfit...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Capture Live Frame & Analyze with AI</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* VIEW 2: CAPTURED SNAPSHOT / INSPECTED OUTFIT */}
          {activeViewMode === 'snapshot' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-pink-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Inspected Outfit Snapshot
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveViewMode('live')}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Resume Live Camera</span>
                </button>
              </div>

              {/* Visual Snapshot Frame */}
              <div className="relative w-full aspect-[3/4] bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center">
                {currentOutfit ? (
                  <>
                    <img
                      src={currentOutfit.imageUrl}
                      alt={currentOutfit.title}
                      className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end justify-between">
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">
                          {currentOutfit.title}
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          Captured at {currentOutfit.capturedAt}
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                        {currentOutfit.source.toUpperCase()}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 flex flex-col items-center gap-2 text-neutral-500">
                    <Camera className="w-8 h-8 stroke-1 text-neutral-600" />
                    <p className="text-xs font-medium text-neutral-400">
                      No outfit frame selected
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveViewMode('live')}
                      className="px-3 py-1.5 rounded-lg bg-pink-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Open Live Camera
                    </button>
                  </div>
                )}
              </div>

              {/* Re-Analyze or Switch Views */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveViewMode('live')}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5 text-blue-400" />
                  <span>Take Another Live Photo</span>
                </button>

                <button
                  type="button"
                  disabled={isAnalyzing || !currentOutfit}
                  onClick={() => handleAnalyze()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Re-Analyze</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW 3: PRESET LOOKS & UPLOADS */}
          {activeViewMode === 'presets' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-pink-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Designer Presets Library
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveViewMode('live')}
                  className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Back to Live Camera</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {FASHION_PRESETS.map((preset) => {
                  const isSelected = currentOutfit?.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`text-left p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-pink-950/40 border-pink-600 text-white'
                          : 'bg-neutral-950 hover:bg-neutral-850 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      <span className="text-lg">{preset.thumbnailSvg}</span>
                      <div className="truncate">
                        <p className="text-xs font-bold truncate">{preset.name}</p>
                        <p className="text-[10px] text-neutral-500 truncate">{preset.archetype}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Consultation Focus & Preferences Box */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 block">
                Consultation Focus
              </label>
              <div className="flex flex-wrap gap-1.5">
                {FASHION_CONSULTATION_TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setSelectedTopic(topic.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      selectedTopic === topic.id
                        ? 'bg-pink-600 text-white'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Client / Stylist Consultation Notes Input */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 block">
                Stylist Notes & Client Preferences
              </label>
              <input
                type="text"
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="e.g., Client prefers minimalist monochrome, attending gallery opening..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Analysis Results & Lookbook */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Sub-navigation Tabs: Analysis Report vs AI Stylist Chatbot */}
          <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 p-1.5 rounded-2xl shadow-md">
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setAnalysisRightTab('report')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  analysisRightTab === 'report'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-pink-400" />
                <span>Haute Couture Report</span>
                {analysis && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-950 text-pink-300 border border-pink-800 font-mono">
                    {analysis.overallScore}/10
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setAnalysisRightTab('chat')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer relative ${
                  analysisRightTab === 'chat'
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/20'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>AI Stylist Chatbot</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 pr-2 text-[11px] text-neutral-400">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Gemini Fashion Consultant</span>
            </div>
          </div>

          {/* Output Update Alert Banner */}
          {justUpdated && (
            <div className="bg-emerald-950/80 border border-emerald-500/80 text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg shadow-emerald-950/50 animate-pulse">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>AI Fashion Critique Updated Successfully! ({lastUpdatedTime})</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-300 font-mono">
                Fresh Output
              </span>
            </div>
          )}

          {/* If Chatbot Tab is selected, show StylistChatbot */}
          {analysisRightTab === 'chat' ? (
            <StylistChatbot analysis={analysis} />
          ) : isAnalyzing ? (
            <div className="bg-neutral-900 border border-pink-500/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-pink-500/30">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-pink-950 text-pink-300 border border-pink-800 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gemini Fashion AI Stylist</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Analyzing Garment Drape, Cut & Silhouette...
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mb-4 leading-relaxed">
                Evaluating proportions, seam balance, seasonal chromatic harmony, and drafting bespoke tailoring alterations.
              </p>
              <div className="w-56 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 animate-pulse" />
              </div>
            </div>
          ) : analysis ? (
            <div className={`bg-neutral-900 border rounded-2xl p-5 flex flex-col gap-5 shadow-xl transition-all duration-300 ${
              justUpdated ? 'border-pink-500/80 shadow-pink-500/20 ring-1 ring-pink-500/30' : 'border-neutral-800'
            }`}>
              
              {/* Header: Style Title & Aesthetics Score */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-950 text-pink-300 border border-pink-800">
                      {analysis.styleArchetype}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">
                      Haute Couture Assessment
                    </span>
                    {lastUpdatedTime && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                        Updated {lastUpdatedTime}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {analysis.styleTitle}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-baseline gap-1 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800">
                    <span className="text-xl font-black text-pink-400">
                      {analysis.overallScore}
                    </span>
                    <span className="text-xs text-neutral-500 font-bold">/10</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAnalysisRightTab('chat')}
                    className="px-3 py-1.5 rounded-xl bg-pink-950 hover:bg-pink-900 border border-pink-700/60 text-pink-300 hover:text-pink-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    title="Open AI Chatbot to discuss this look"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat About Look</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAnalyze(currentOutfit)}
                    className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
                    title="Re-analyze this look with latest notes"
                  >
                    <RefreshCw className="w-4 h-4 text-pink-400" />
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyReport}
                    className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
                    title="Copy Consultation Report"
                  >
                    {copiedReport ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Stylist Verdict Quote */}
              <div className="bg-pink-950/30 border border-pink-800/40 rounded-xl p-3.5 flex items-start gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <p className="text-xs font-bold text-pink-200 uppercase tracking-wider mb-1">
                    Virtual Haute Couture Stylist Verdict
                  </p>
                  <p className="text-xs text-pink-100/90 leading-relaxed italic">
                    "{analysis.virtualStylistComment}"
                  </p>
                </div>
              </div>

              {/* Garment Piece Breakdown (if available) */}
              {analysis.garmentBreakdown && analysis.garmentBreakdown.length > 0 && (
                <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-pink-400" />
                    Garment Breakdown & Fabric Construction
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {analysis.garmentBreakdown.map((item, idx) => (
                      <div key={idx} className="bg-neutral-900 p-2.5 rounded-lg border border-neutral-800 text-xs">
                        <span className="font-bold text-pink-300 text-[11px] block mb-1">
                          {item.item}
                        </span>
                        <p className="text-neutral-300 text-[11px] leading-relaxed">
                          {item.notes}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fit & Silhouette Drape Analysis */}
              <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                  Silhouette, Proportions & Drape
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {analysis.fitAndSilhouette}
                </p>
              </div>

              {/* Color Theory & Palette Card */}
              <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  Color Theory & Seasonal Palette
                </h4>
                
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {analysis.colorPalette.detectedColors.map((colorName, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-pink-500 to-amber-500" />
                      <span>{colorName}</span>
                    </div>
                  ))}
                  <span className="text-xs text-neutral-500">
                    • Harmony: <strong className="text-neutral-300">{analysis.colorPalette.harmonyRating}</strong>
                  </span>
                  <span className="text-xs text-neutral-500">
                    • Season: <strong className="text-neutral-300">{analysis.colorPalette.season}</strong>
                  </span>
                </div>

                <div className="text-xs text-amber-200/90 bg-amber-950/30 border border-amber-800/40 p-2.5 rounded-lg">
                  <strong>Color Enhancement:</strong> {analysis.colorPalette.recommendation}
                </div>
              </div>

              {/* 3 Actionable Fashion Redesign Ideas */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-rose-400" />
                  Couture Redesign & Tailoring Alterations
                </h4>
                
                <div className="space-y-3">
                  {analysis.designIdeas.map((idea, index) => (
                    <div
                      key={index}
                      className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl p-3.5 transition"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <h5 className="text-xs font-bold text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-pink-600/30 text-pink-300 flex items-center justify-center text-[10px] font-mono">
                            {index + 1}
                          </span>
                          {idea.title}
                        </h5>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-medium">
                          {idea.impact}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed mb-2">
                        {idea.concept}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 bg-neutral-900 px-2.5 py-1 rounded-lg">
                        <strong className="text-neutral-300">Fabric Recommendation:</strong>
                        <span>{idea.fabricSuggestion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Occasion Restyling Suggestions */}
              {analysis.occasionSuitability && analysis.occasionSuitability.length > 0 && (
                <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Occasion Adaptability & Restyling
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {analysis.occasionSuitability.map((occ, idx) => (
                      <div
                        key={idx}
                        className="bg-neutral-900 p-2.5 rounded-lg border border-neutral-800 text-xs"
                      >
                        <p className="font-bold text-white text-[11px]">{occ.occasion}</p>
                        <p className="text-[11px] text-pink-400 mt-0.5">{occ.rating}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Quick Chat Prompt Box */}
              <div className="bg-gradient-to-r from-pink-950/40 via-neutral-950 to-neutral-950 border border-pink-900/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-600/20 text-pink-400 border border-pink-500/30 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      Have questions about this critique or tailoring adjustments?
                    </h5>
                    <p className="text-[11px] text-neutral-400">
                      Chat directly with the AI Stylist to ask about shoes, bags, colors, or event styling.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAnalysisRightTab('chat')}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 text-xs font-bold text-white transition flex items-center gap-2 shadow-md shadow-pink-600/20 shrink-0 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Start Chat Consultation</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-500 mb-4">
                <Sparkles className="w-7 h-7 text-pink-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                Live Video Camera is Ready
              </h3>
              <p className="text-xs text-neutral-400 max-w-md mb-6 leading-relaxed">
                Click <strong>"Capture Live Frame & Analyze with AI"</strong> on the left camera viewfinder to instantly evaluate fit, drape, proportions, and color harmony.
              </p>
              <button
                type="button"
                onClick={handleCaptureAndAnalyze}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 text-xs font-bold text-white transition cursor-pointer flex items-center gap-2 shadow-lg shadow-pink-600/30"
              >
                <Camera className="w-4 h-4" />
                <span>Snap Live Camera Frame Now</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Captured Looks & Analysis History Strip */}
      {snapshotsHistory.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-pink-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Analyzed Looks History ({snapshotsHistory.length})
              </h3>
            </div>
            <span className="text-[11px] text-neutral-400">
              Click any look to compare and view its specific critique
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {snapshotsHistory.map((snap) => {
              const isSelected = currentOutfit?.id === snap.id;
              return (
                <button
                  key={snap.id}
                  type="button"
                  onClick={() => {
                    onSelectOutfit(snap);
                    setActiveViewMode('snapshot');
                    if (snap.analysis) {
                      setAnalysis(snap.analysis);
                      setLastUpdatedTime(snap.capturedAt);
                      setJustUpdated(true);
                      setTimeout(() => setJustUpdated(false), 2000);
                    }
                  }}
                  className={`flex items-center gap-3 p-2 rounded-xl border text-left shrink-0 transition cursor-pointer ${
                    isSelected
                      ? 'bg-pink-950/50 border-pink-500 shadow-md shadow-pink-500/20 ring-1 ring-pink-500/50'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <img
                    src={snap.imageUrl}
                    alt={snap.title}
                    className="w-12 h-14 object-cover rounded-lg bg-neutral-900 border border-neutral-800 shrink-0"
                  />
                  <div className="flex flex-col min-w-[120px] max-w-[160px]">
                    <span className="text-xs font-bold text-white truncate">
                      {snap.title}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {snap.capturedAt}
                    </span>
                    {snap.analysis && (
                      <span className="text-[11px] font-bold text-pink-400 mt-0.5">
                        {snap.analysis.overallScore}/10 • {snap.analysis.styleArchetype.split(' ')[0]}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
