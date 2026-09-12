import React, { useState, useEffect, useRef } from 'react';
import {
  MobilePlatform,
  DeviceViewMode,
  ActiveTab,
  CallSessionState,
  VonageStatusResponse,
  OutfitSnapshot,
} from './types';
import { PhoneFrame } from './components/PhoneFrame';
import { VideoChatModule } from './components/VideoChatModule';
import { SmsVerifyModule } from './components/SmsVerifyModule';
import { FashionConsultationPanel } from './components/FashionConsultationPanel';
import { CodeInspector } from './components/CodeInspector';
import { ApiLogsDrawer } from './components/ApiLogsDrawer';
import { Header } from './components/Header';
import {
  createVirtualCameraStream,
  tryGetPhysicalWebcam,
  CameraFeedController,
} from './utils/cameraStream';
import {
  Video,
  ShieldCheck,
  Camera,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('fashion');
  const [deviceViewMode, setDeviceViewMode] = useState<DeviceViewMode>('dual');
  const [vonageStatus, setVonageStatus] = useState<VonageStatusResponse | null>(null);
  const [isLogsOpen, setIsLogsOpen] = useState<boolean>(false);

  // Camera Streams
  const [iosStream, setIosStream] = useState<MediaStream | null>(null);
  const [androidStream, setAndroidStream] = useState<MediaStream | null>(null);
  const [cameraSourceType, setCameraSourceType] = useState<'real' | 'virtual'>('virtual');
  const [cameraFeedbackMessage, setCameraFeedbackMessage] = useState<string | null>(null);
  const [currentOutfit, setCurrentOutfit] = useState<OutfitSnapshot | null>(null);

  const iosControllerRef = useRef<CameraFeedController | null>(null);
  const androidControllerRef = useRef<CameraFeedController | null>(null);
  const physicalWebcamRef = useRef<MediaStream | null>(null);

  // Cross-device notification simulations
  const [iosNotification, setIosNotification] = useState<{
    app: string;
    title: string;
    message: string;
    actionText?: string;
    onAction?: () => void;
  } | null>(null);

  const [androidNotification, setAndroidNotification] = useState<{
    app: string;
    title: string;
    message: string;
    actionText?: string;
    onAction?: () => void;
  } | null>(null);

  // Video Call State
  const [callState, setCallState] = useState<CallSessionState>({
    roomId: 'mobile-cross-platform-room',
    sessionId: '',
    token: '',
    status: 'idle',
    caller: 'ios',
    durationSeconds: 0,
    stats: {
      bitrateKbps: 1840,
      latencyMs: 38,
      resolution: '1280x720 (720p HD)',
      framerate: 30,
      packetLossPct: 0.0,
    },
  });

  // Call duration counter
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callState.status === 'connected') {
      timer = setInterval(() => {
        setCallState((prev) => ({
          ...prev,
          durationSeconds: prev.durationSeconds + 1,
          stats: {
            ...prev.stats,
            bitrateKbps: Math.floor(1750 + Math.random() * 150),
            latencyMs: Math.floor(32 + Math.random() * 12),
          },
        }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callState.status]);

  // Initialize camera feeds on mount (Guaranteed camera is immediately ON!)
  useEffect(() => {
    // 1. Create simulated high-fidelity mobile camera feeds for both devices
    const iosCtrl = createVirtualCameraStream('Alex iPhone Camera', 'ios');
    const androidCtrl = createVirtualCameraStream('Jordan Pixel Camera', 'android');

    iosControllerRef.current = iosCtrl;
    androidControllerRef.current = androidCtrl;

    setIosStream(iosCtrl.stream);
    setAndroidStream(androidCtrl.stream);

    // 2. Fetch Vonage server configuration
    fetch('/api/vonage/status')
      .then((res) => res.json())
      .then((data) => setVonageStatus(data))
      .catch((e) => console.warn('Vonage status check error', e));

    return () => {
      iosCtrl.stop();
      androidCtrl.stop();
      if (physicalWebcamRef.current) {
        physicalWebcamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Handle Physical Webcam Switch
  const handleToggleRealCamera = async () => {
    if (cameraSourceType === 'real') {
      // Switch back to virtual studio camera
      if (physicalWebcamRef.current) {
        physicalWebcamRef.current.getTracks().forEach((t) => t.stop());
        physicalWebcamRef.current = null;
      }

      const iosCtrl = createVirtualCameraStream('Alex iPhone Camera', 'ios');
      const androidCtrl = createVirtualCameraStream('Jordan Pixel Camera', 'android');

      iosControllerRef.current?.stop();
      androidControllerRef.current?.stop();

      iosControllerRef.current = iosCtrl;
      androidControllerRef.current = androidCtrl;

      setIosStream(iosCtrl.stream);
      setAndroidStream(androidCtrl.stream);
      setCameraSourceType('virtual');
      showFeedback('Switched to High-Fidelity Virtual Studio Camera');
      return;
    }

    // Attempt to request physical hardware webcam
    showFeedback('Requesting hardware webcam permission...');
    const webcamStream = await tryGetPhysicalWebcam();

    if (webcamStream) {
      physicalWebcamRef.current = webcamStream;
      setIosStream(webcamStream);
      setCameraSourceType('real');
      showFeedback('Physical Webcam Connected Successfully!');
    } else {
      showFeedback('Webcam blocked or unavailable in this window. Virtual Studio HD camera is active.');
    }
  };

  const showFeedback = (msg: string) => {
    setCameraFeedbackMessage(msg);
    setTimeout(() => {
      setCameraFeedbackMessage(null);
    }, 4000);
  };

  // Video Call Flow Handlers
  const handleInitiateCall = async (callerPlatform: MobilePlatform) => {
    try {
      const res = await fetch('/api/vonage/video/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: 'rn-cross-platform-demo',
          participantName: callerPlatform === 'ios' ? 'Alex (iPhone)' : 'Jordan (Android)',
          platform: callerPlatform,
        }),
      });
      const data = await res.json();

      setCallState((prev) => ({
        ...prev,
        status: 'ringing',
        caller: callerPlatform,
        sessionId: data.sessionId,
        token: data.token,
        durationSeconds: 0,
      }));

      // Trigger incoming call push notification on the other device
      const receiverPlatform = callerPlatform === 'ios' ? 'android' : 'ios';
      const callerLabel = callerPlatform === 'ios' ? 'Alex (iPhone 16)' : 'Jordan (Pixel 9)';

      if (receiverPlatform === 'ios') {
        setIosNotification({
          app: 'Phone',
          title: 'Incoming Vonage Video Call',
          message: `${callerLabel} is calling via OpenTok Session...`,
          actionText: 'Answer Call',
          onAction: () => handleAcceptCall(),
        });
      } else {
        setAndroidNotification({
          app: 'Telecom',
          title: 'Incoming Video Call',
          message: `${callerLabel} (Vonage Client SDK)`,
          actionText: 'Tap to Answer',
          onAction: () => handleAcceptCall(),
        });
      }
    } catch (e) {
      console.error('Call initiation error', e);
    }
  };

  const handleAcceptCall = () => {
    setCallState((prev) => ({
      ...prev,
      status: 'connected',
    }));
    setIosNotification(null);
    setAndroidNotification(null);
  };

  const handleRejectCall = () => {
    setCallState((prev) => ({
      ...prev,
      status: 'idle',
      durationSeconds: 0,
    }));
    setIosNotification(null);
    setAndroidNotification(null);
  };

  const handleEndCall = () => {
    setCallState((prev) => ({
      ...prev,
      status: 'idle',
      durationSeconds: 0,
    }));
    setIosNotification(null);
    setAndroidNotification(null);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        deviceViewMode={deviceViewMode}
        onSelectDeviceMode={setDeviceViewMode}
        vonageStatus={vonageStatus}
        onOpenLogs={() => setIsLogsOpen(true)}
      />

      {/* Camera Feedback Toast */}
      {cameraFeedbackMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 backdrop-blur-md border border-neutral-700 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Camera className="w-3.5 h-3.5 text-blue-400" />
          <span>{cameraFeedbackMessage}</span>
        </div>
      )}

      {/* Main Body View */}
      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8">
        
        {/* TAB 1 & 2: DUAL / SINGLE MOBILE SIMULATOR */}
        {(activeTab === 'video' || activeTab === 'sms') && (
          <div className="w-full max-w-6xl flex flex-col items-center">
            
            {/* Camera Status & Context Sub-bar */}
            <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                  {activeTab === 'video' ? <Video className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white">
                      {activeTab === 'video'
                        ? 'Live Cross-Platform Video Chat (iOS ↔ Android)'
                        : 'Carrier SMS 2FA Passcode Verification'}
                    </h2>
                    {activeTab === 'video' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Camera ON (30 FPS)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {activeTab === 'video'
                      ? 'Live camera viewfinders active. Click "Start Video Call" to connect iOS and Android via Vonage OpenTok WebRTC.'
                      : 'Test carrier SMS dispatch, iOS textContentType="oneTimeCode" QuickType, and Android SMS Retriever.'}
                  </p>
                </div>
              </div>

              {/* Top Sub-bar Actions */}
              {activeTab === 'video' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('fashion')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/50 text-pink-200 flex items-center gap-1.5 shrink-0 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span>Outfit AI Studio</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleRealCamera}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-2 shrink-0 ${
                      cameraSourceType === 'real'
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-neutral-800 hover:bg-neutral-750 border-neutral-700 text-neutral-200'
                    }`}
                    title="Toggle between physical webcam and simulated camera"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-400" />
                    <span>{cameraSourceType === 'real' ? 'Using Hardware Webcam' : 'Use Hardware Webcam'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Devices Container */}
            <div className="w-full flex flex-wrap justify-center items-center gap-8 lg:gap-16 py-2">
              
              {/* iOS Mobile Device Simulator */}
              {(deviceViewMode === 'dual' || deviceViewMode === 'ios') && (
                <PhoneFrame
                  platform="ios"
                  title="Apple iPhone 16 Pro"
                  subtitle="iOS 18 Native Client"
                  isCameraActive={true}
                  isMicActive={callState.status === 'connected'}
                  notification={iosNotification}
                >
                  {activeTab === 'video' ? (
                    <VideoChatModule
                      platform="ios"
                      otherPlatform="android"
                      callState={callState}
                      onInitiateCall={handleInitiateCall}
                      onAcceptCall={handleAcceptCall}
                      onRejectCall={handleRejectCall}
                      onEndCall={handleEndCall}
                      localMediaStream={iosStream}
                      remoteMediaStream={androidStream}
                      onToggleRealCamera={handleToggleRealCamera}
                      isRealCameraActive={cameraSourceType === 'real'}
                      cameraSourceType={cameraSourceType}
                      onOpenFashionStudio={() => setActiveTab('fashion')}
                      onCaptureOutfit={(snapshot) => setCurrentOutfit(snapshot)}
                    />
                  ) : (
                    <SmsVerifyModule
                      platform="ios"
                      onTriggerNotification={(notif) => setIosNotification(notif)}
                    />
                  )}
                </PhoneFrame>
              )}

              {/* Android Mobile Device Simulator */}
              {(deviceViewMode === 'dual' || deviceViewMode === 'android') && (
                <PhoneFrame
                  platform="android"
                  title="Google Pixel 9 Pro"
                  subtitle="Android 15 Native Client"
                  isCameraActive={true}
                  isMicActive={callState.status === 'connected'}
                  notification={androidNotification}
                >
                  {activeTab === 'video' ? (
                    <VideoChatModule
                      platform="android"
                      otherPlatform="ios"
                      callState={callState}
                      onInitiateCall={handleInitiateCall}
                      onAcceptCall={handleAcceptCall}
                      onRejectCall={handleRejectCall}
                      onEndCall={handleEndCall}
                      localMediaStream={androidStream}
                      remoteMediaStream={iosStream}
                      onToggleRealCamera={handleToggleRealCamera}
                      isRealCameraActive={cameraSourceType === 'real'}
                      cameraSourceType={cameraSourceType}
                      onOpenFashionStudio={() => setActiveTab('fashion')}
                      onCaptureOutfit={(snapshot) => setCurrentOutfit(snapshot)}
                    />
                  ) : (
                    <SmsVerifyModule
                      platform="android"
                      onTriggerNotification={(notif) => setAndroidNotification(notif)}
                    />
                  )}
                </PhoneFrame>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FASHION CONSULTATION & AI OUTFIT DESIGN STUDIO */}
        {activeTab === 'fashion' && (
          <div className="w-full max-w-6xl">
            <FashionConsultationPanel
              currentOutfit={currentOutfit}
              onSelectOutfit={(outfit) => setCurrentOutfit(outfit)}
              onCaptureFromVideo={() => setActiveTab('video')}
              isVideoActive={callState.status === 'connected'}
              cameraStream={iosStream || androidStream}
              cameraSourceType={cameraSourceType}
              onToggleRealCamera={handleToggleRealCamera}
            />
          </div>
        )}

        {/* TAB 3: CODE INSPECTOR & REACT NATIVE EXPORT */}
        {activeTab === 'code' && <CodeInspector />}
      </main>

      {/* Network & Audit Logs Drawer */}
      <ApiLogsDrawer
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
      />
    </div>
  );
}
