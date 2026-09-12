export type MobilePlatform = 'ios' | 'android';
export type DeviceViewMode = 'dual' | 'ios' | 'android';
export type ActiveTab = 'video' | 'fashion' | 'sms' | 'code' | 'logs';

export interface ColorPaletteAnalysis {
  detectedColors: string[];
  season: string;
  harmonyRating: string;
  recommendation: string;
}

export interface GarmentBreakdownItem {
  item: string;
  notes: string;
}

export interface DesignIdeaItem {
  title: string;
  concept: string;
  fabricSuggestion: string;
  impact: string;
}

export interface OccasionItem {
  occasion: string;
  rating: string;
}

export interface FashionAnalysisResult {
  styleTitle: string;
  styleArchetype: string;
  overallScore: number;
  fitAndSilhouette: string;
  colorPalette: ColorPaletteAnalysis;
  garmentBreakdown: GarmentBreakdownItem[];
  designIdeas: DesignIdeaItem[];
  occasionSuitability: OccasionItem[];
  virtualStylistComment: string;
}

export interface OutfitSnapshot {
  id: string;
  imageUrl: string;
  capturedAt: string;
  source: 'webcam' | 'preset' | 'upload';
  title: string;
  analysis?: FashionAnalysisResult;
}

export interface Participant {
  id: string;
  name: string;
  platform: MobilePlatform;
  role: 'caller' | 'receiver';
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isSpeaking: boolean;
  avatarColor: string;
}

export interface CallSessionState {
  roomId: string;
  sessionId: string;
  token: string;
  status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  caller: MobilePlatform;
  durationSeconds: number;
  stats: {
    bitrateKbps: number;
    latencyMs: number;
    resolution: string;
    framerate: number;
    packetLossPct: number;
  };
}

export interface VerificationState {
  phoneNumber: string;
  countryCode: string;
  formattedNumber: string;
  requestId: string | null;
  status: 'idle' | 'requesting' | 'pending' | 'verifying' | 'verified' | 'failed' | 'expired';
  otpCode: string[];
  sandboxCode?: string;
  expiresAt: number | null;
  resendCooldown: number;
  attemptsRemaining: number;
  errorMessage: string | null;
  autoReadTriggered: boolean;
}

export interface CountryItem {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
  format: string;
}

export interface VonageStatusResponse {
  liveConfigured: boolean;
  credentials: {
    hasApiKey: boolean;
    hasApiSecret: boolean;
    hasApplicationId: boolean;
    hasPrivateKey: boolean;
    brandName: string;
    smsSender: string;
  };
  capabilities: {
    videoChat: boolean;
    smsVerifyV2: boolean;
    smsDispatch: boolean;
    crossPlatformRn: boolean;
  };
}

export interface ApiLogItem {
  id: string;
  timestamp: string;
  service: 'VIDEO' | 'SMS_VERIFY' | 'SMS_DISPATCH' | 'FASHION_AI' | 'SYSTEM' | 'CODE_AI';
  action: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  details: Record<string, any>;
}

export interface CodeSuggestionItem {
  id: string;
  type: 'bug_fix' | 'permission' | 'webrtc_performance' | 'security' | 'best_practice';
  severity: 'critical' | 'warning' | 'recommendation';
  title: string;
  description: string;
  suggestedCode?: string;
}

export interface ChecklistVerificationItem {
  item: string;
  passed: boolean;
  detail: string;
}

export interface CodeReviewResult {
  summary: string;
  status: 'PASS' | 'WARNING' | 'ERROR';
  healthScore: number;
  outputAnalysis: {
    hasErrors: boolean;
    errorDiagnosis: string;
    rootCause?: string;
  };
  suggestions: CodeSuggestionItem[];
  verifiedChecklist: ChecklistVerificationItem[];
}

export interface StylistChatMessage {
  id: string;
  sender: 'user' | 'stylist';
  text: string;
  timestamp: string;
  suggestedQuestions?: string[];
}
