export interface CodeTemplate {
  id: string;
  title: string;
  category: 'react-native' | 'ios' | 'android' | 'backend';
  filename: string;
  language: string;
  description: string;
  code: string;
}

export const REACT_NATIVE_TEMPLATES: CodeTemplate[] = [
  {
    id: 'rn-video-component',
    title: 'Vonage Video Call Screen',
    category: 'react-native',
    filename: 'src/screens/VonageVideoCallScreen.tsx',
    language: 'typescript',
    description: 'Cross-platform React Native screen with local preview, remote participant grid, camera flip, audio toggle, and native lifecycle management.',
    code: `import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
// Uses the official Vonage OpenTok React Native SDK
import { OTSession, OTPublisher, OTSubscriber, OTView } from 'opentok-react-native';
import { requestVideoAudioPermissions } from '../utils/permissions';

const { width, height } = Dimensions.get('window');

interface Props {
  route: {
    params: {
      apiKey: string;
      sessionId: string;
      token: string;
      userName: string;
    };
  };
  navigation: any;
}

export const VonageVideoCallScreen: React.FC<Props> = ({ route, navigation }) => {
  const { apiKey, sessionId, token, userName } = route.params;

  const [hasPermissions, setHasPermissions] = useState<boolean>(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const [streamProperties, setStreamProperties] = useState<{ [id: string]: any }>({});
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState<boolean>(true);

  const otSessionRef = useRef<any>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const init = async () => {
      const granted = await requestVideoAudioPermissions();
      if (!granted) {
        Alert.alert(
          'Permissions Required',
          'Camera and Microphone permissions are required to start a Vonage video call.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }
      setHasPermissions(true);
    };

    init();

    timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const sessionEventHandlers = {
    streamCreated: (event: any) => {
      console.log('[Vonage] Remote stream created:', event.streamId);
      setIsConnecting(false);
      setStreamProperties((prev) => ({
        ...prev,
        [event.streamId]: {
          subscribeToAudio: true,
          subscribeToVideo: true,
        },
      }));
    },
    streamDestroyed: (event: any) => {
      console.log('[Vonage] Remote stream ended:', event.streamId);
      setStreamProperties((prev) => {
        const next = { ...prev };
        delete next[event.streamId];
        return next;
      });
    },
    sessionConnected: () => {
      console.log('[Vonage] Connected to Session:', sessionId);
      setIsConnecting(false);
    },
    sessionDisconnected: () => {
      console.log('[Vonage] Disconnected from Session');
    },
    error: (error: any) => {
      console.error('[Vonage] Session Error:', error);
      Alert.alert('Call Error', error.message || 'Vonage video session error');
    },
  };

  const publisherEventHandlers = {
    streamCreated: (event: any) => {
      console.log('[Vonage] Local stream published successfully');
    },
    streamDestroyed: (event: any) => {
      console.log('[Vonage] Local stream stopped');
    },
    error: (error: any) => {
      console.error('[Vonage] Publisher Error:', error);
    },
  };

  const toggleAudio = () => setIsAudioEnabled((prev) => !prev);
  const toggleVideo = () => setIsVideoEnabled((prev) => !prev);
  const flipCamera = () => setCameraPosition((prev) => (prev === 'front' ? 'back' : 'front'));

  const endCall = () => {
    if (otSessionRef.current) {
      otSessionRef.current.disconnect();
    }
    navigation.goBack();
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return \`\${mins.toString().padStart(2, '0')}:\${rem.toString().padStart(2, '0')}\`;
  };

  if (!hasPermissions) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.statusText}>Requesting Camera & Mic Permissions...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      {/* Top Bar with Status & Timer */}
      <View style={styles.topBar}>
        <View style={styles.roomTag}>
          <View style={styles.liveDot} />
          <Text style={styles.roomText}>Vonage HD Live</Text>
        </View>
        <Text style={styles.timerText}>{formatTime(callDuration)}</Text>
      </View>

      {/* Video Viewport Container */}
      <View style={styles.viewport}>
        <OTSession
          ref={otSessionRef}
          apiKey={apiKey}
          sessionId={sessionId}
          token={token}
          eventHandlers={sessionEventHandlers}
        >
          {/* Remote Subscribers (Full Screen or Split Grid) */}
          <OTSubscriber
            style={styles.remoteVideo}
            streamProperties={streamProperties}
          />

          {/* Local Publisher (Floating Picture-in-Picture) */}
          <View style={styles.localPreviewContainer}>
            <OTPublisher
              style={styles.localVideo}
              properties={{
                publishAudio: isAudioEnabled,
                publishVideo: isVideoEnabled,
                cameraPosition: cameraPosition,
                resolution: '1280x720',
                frameRate: 30,
              }}
              eventHandlers={publisherEventHandlers}
            />
            <Text style={styles.localNameBadge}>{userName} (You)</Text>
          </View>
        </OTSession>
      </View>

      {/* In-Call Action Control Bar */}
      <View style={styles.controlsBar}>
        <TouchableOpacity
          onPress={toggleAudio}
          style={[styles.btnAction, !isAudioEnabled && styles.btnActionOff]}
        >
          <Text style={styles.btnText}>{isAudioEnabled ? 'Mute' : 'Unmute'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleVideo}
          style={[styles.btnAction, !isVideoEnabled && styles.btnActionOff]}
        >
          <Text style={styles.btnText}>{isVideoEnabled ? 'Stop Cam' : 'Start Cam'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={flipCamera} style={styles.btnAction}>
          <Text style={styles.btnText}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={endCall} style={styles.btnEndCall}>
          <Text style={styles.btnEndCallText}>End</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0B0F19',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 10,
  },
  roomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  roomText: {
    color: '#F9FAFB',
    fontSize: 12,
    fontWeight: '600',
  },
  timerText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statusText: {
    color: '#9CA3AF',
    fontSize: 15,
  },
  viewport: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#111827',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
  localPreviewContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 110,
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: '#1F2937',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  localNameBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#FFF',
    fontSize: 10,
    textAlign: 'center',
    borderRadius: 4,
    paddingVertical: 2,
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  btnAction: {
    width: 64,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnActionOff: {
    backgroundColor: '#EF4444',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  btnEndCall: {
    width: 64,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnEndCallText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
`
  },
  {
    id: 'rn-sms-verify',
    title: 'Vonage SMS Verification Screen',
    category: 'react-native',
    filename: 'src/screens/VonageSmsVerifyScreen.tsx',
    language: 'typescript',
    description: 'Cross-platform SMS verification screen supporting iOS textContentType="oneTimeCode" auto-fill and Android SMS Retriever API for 1-tap OTP completion.',
    code: `import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';

const API_BASE_URL = 'https://your-backend-api.com/api/vonage';

interface Props {
  navigation: any;
  onVerificationSuccess: (phoneNumber: string) => void;
}

export const VonageSmsVerifyScreen: React.FC<Props> = ({ navigation, onVerificationSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('+1');
  const [step, setStep] = useState<'PHONE_INPUT' | 'OTP_INPUT'>('PHONE_INPUT');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(5);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Request SMS verification code from backend
  const handleRequestVerification = async () => {
    if (!phoneNumber || phoneNumber.replace(/\\D/g, '').length < 7) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(\`\${API_BASE_URL}/sms/verify/request\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          countryCode,
          brand: 'MyReactNativeApp',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setRequestId(data.requestId);
        setStep('OTP_INPUT');
        setCooldown(60); // 60s cooldown
        // Focus first OTP input
        setTimeout(() => inputRefs.current[0]?.focus(), 300);
      } else {
        Alert.alert('Request Failed', data.error || 'Could not send verification SMS.');
      }
    } catch (err: any) {
      Alert.alert('Network Error', err.message || 'Failed to reach verification server.');
    } finally {
      setLoading(false);
    }
  };

  // Check the OTP code against backend
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const finalCode = codeToVerify || otpCode.join('');
    if (finalCode.length < 6) {
      Alert.alert('Incomplete Code', 'Please enter all 6 digits of the code.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(\`\${API_BASE_URL}/sms/verify/check\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          code: finalCode,
        }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Phone number successfully verified with Vonage!', [
          {
            text: 'Continue',
            onPress: () => {
              if (onVerificationSuccess) {
                onVerificationSuccess(\`\${countryCode}\${phoneNumber}\`);
              }
            },
          },
        ]);
      } else {
        if (data.remainingAttempts !== undefined) {
          setAttemptsRemaining(data.remainingAttempts);
        }
        Alert.alert('Verification Failed', data.error || 'Incorrect verification code.');
      }
    } catch (err: any) {
      Alert.alert('Network Error', err.message || 'Failed to verify code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle individual digit input and auto-advance
  const handleDigitChange = (val: string, index: number) => {
    // Check if user pasted full 6-digit code
    const cleaned = val.replace(/\\D/g, '');
    if (cleaned.length >= 6) {
      const newOtp = cleaned.slice(0, 6).split('');
      setOtpCode(newOtp);
      inputRefs.current[5]?.focus();
      handleVerifyOtp(cleaned.slice(0, 6));
      return;
    }

    const singleDigit = cleaned.slice(-1);
    const updated = [...otpCode];
    updated[index] = singleDigit;
    setOtpCode(updated);

    if (singleDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.card}>
          <Text style={styles.badge}>Vonage Verify 2FA</Text>
          <Text style={styles.title}>
            {step === 'PHONE_INPUT' ? 'Enter Mobile Number' : 'Enter Verification Code'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'PHONE_INPUT'
              ? 'We will send a one-time SMS verification code to secure your account.'
              : \`Sent to \${countryCode} \${phoneNumber}. The code expires in 5 minutes.\`}
          </Text>

          {step === 'PHONE_INPUT' ? (
            <View style={styles.formGroup}>
              <View style={styles.phoneRow}>
                <View style={styles.countryPill}>
                  <Text style={styles.countryText}>{countryCode}</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="555-0199"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  textContentType="telephoneNumber"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.btnDisabled]}
                onPress={handleRequestVerification}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.btnText}>Send SMS Code</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formGroup}>
              {/* 6-Digit PIN Field with iOS textContentType="oneTimeCode" */}
              <View style={styles.otpRow}>
                {otpCode.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={(ref) => (inputRefs.current[idx] = ref)}
                    style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                    keyboardType="number-pad"
                    maxLength={idx === 0 ? 6 : 1}
                    value={digit}
                    onChangeText={(val) => handleDigitChange(val, idx)}
                    onKeyPress={(e) => handleKeyPress(e, idx)}
                    textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : undefined}
                    autoComplete={Platform.OS === 'android' ? 'sms-otp' : undefined}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (loading || otpCode.join('').length < 6) && styles.btnDisabled,
                ]}
                onPress={() => handleVerifyOtp()}
                disabled={loading || otpCode.join('').length < 6}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.btnText}>Verify & Proceed</Text>
                )}
              </TouchableOpacity>

              {/* Resend button & countdown */}
              <View style={styles.resendRow}>
                {cooldown > 0 ? (
                  <Text style={styles.cooldownText}>Resend code in {cooldown}s</Text>
                ) : (
                  <TouchableOpacity onPress={handleRequestVerification}>
                    <Text style={styles.resendLink}>Resend SMS Code</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.changeNumberBtn}
                onPress={() => {
                  setStep('PHONE_INPUT');
                  setOtpCode(['', '', '', '', '', '']);
                }}
              >
                <Text style={styles.changeNumberText}>Edit Phone Number</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 24 },
  formGroup: { width: '100%' },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  countryPill: {
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  countryText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  phoneInput: {
    flex: 1,
    height: 52,
    fontSize: 16,
    paddingLeft: 12,
    color: '#0F172A',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpBox: {
    width: 44,
    height: 54,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  otpBoxFilled: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  resendRow: { alignItems: 'center', marginTop: 16 },
  cooldownText: { fontSize: 13, color: '#94A3B8' },
  resendLink: { fontSize: 14, color: '#2563EB', fontWeight: '600' },
  changeNumberBtn: { alignItems: 'center', marginTop: 16 },
  changeNumberText: { fontSize: 13, color: '#64748B' },
});
`
  },
  {
    id: 'rn-permissions',
    title: 'Cross-Platform Permissions Handler',
    category: 'react-native',
    filename: 'src/utils/permissions.ts',
    language: 'typescript',
    description: 'Unified cross-platform helper handling Android runtime permissions (CAMERA & RECORD_AUDIO) and iOS permission statuses.',
    code: `import { Platform, PermissionsAndroid, Alert } from 'react-native';

/**
 * Requests Camera and Microphone permissions cross-platform.
 * Supports iOS & Android runtime permission flows.
 */
export async function requestVideoAudioPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      const userResponses = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);

      const cameraGranted =
        userResponses[PermissionsAndroid.PERMISSIONS.CAMERA] ===
        PermissionsAndroid.RESULTS.GRANTED;
      const micGranted =
        userResponses[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
        PermissionsAndroid.RESULTS.GRANTED;

      if (!cameraGranted || !micGranted) {
        console.warn('[Permissions] Camera or Audio permission rejected on Android');
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Permissions] Android permission request error:', err);
      return false;
    }
  } else if (Platform.OS === 'ios') {
    // On iOS, the native Vonage OpenTok SDK prompts automatically
    // when accessing the camera/mic using Info.plist strings:
    // NSCameraUsageDescription and NSMicrophoneUsageDescription.
    // If using 'react-native-permissions':
    /*
    import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
    const cameraStatus = await request(PERMISSIONS.IOS.CAMERA);
    const micStatus = await request(PERMISSIONS.IOS.MICROPHONE);
    return cameraStatus === RESULTS.GRANTED && micStatus === RESULTS.GRANTED;
    */
    return true;
  }
  return false;
}
`
  },
  {
    id: 'ios-config',
    title: 'iOS Configuration (Info.plist & Podfile)',
    category: 'ios',
    filename: 'ios/Podfile & Info.plist',
    language: 'xml',
    description: 'Essential Info.plist usage descriptions, Background Audio/VoIP modes, and CocoaPods dependencies for Vonage Video on iOS.',
    code: `<!-- 1. ios/YourApp/Info.plist -->
<!-- Add Camera, Microphone permissions and optional VoIP background modes -->
<dict>
  <!-- Camera Permission for Vonage Video -->
  <key>NSCameraUsageDescription</key>
  <string>This app requires access to your camera for real-time video calling with other participants.</string>

  <!-- Microphone Permission for Vonage Video -->
  <key>NSMicrophoneUsageDescription</key>
  <string>This app requires access to your microphone for real-time voice communication during video calls.</string>

  <!-- Background Modes for uninterrupted audio during calls (Optional) -->
  <key>UIBackgroundModes</key>
  <array>
    <string>audio</string>
    <string>voip</string>
  </array>
</dict>

<!-- 2. ios/Podfile -->
target 'YourApp' do
  config = use_native_modules!
  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true
  )

  # Official Vonage / OpenTok CocoaPod
  pod 'OpenTok', '~> 2.26.0'

  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false
    )
    # Enable WebRTC bitcode disabling if required
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['ENABLE_BITCODE'] = 'NO'
      end
    end
  end
end
`
  },
  {
    id: 'android-config',
    title: 'Android Configuration (Manifest & Gradle)',
    category: 'android',
    filename: 'android/app/src/main/AndroidManifest.xml',
    language: 'xml',
    description: 'Android hardware feature declarations, runtime permissions, audio focus, and ProGuard keep rules for Vonage WebRTC.',
    code: `<!-- 1. android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.yourapp">

    <!-- Essential Camera and Audio Permissions -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

    <!-- Declare camera hardware features (optional: false allows devices without flash/autofocus) -->
    <uses-feature android:name="android.hardware.camera" android:required="true" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:allowBackup="false"
        android:theme="@style/AppTheme">
        <!-- Activities -->
    </application>
</manifest>

<!-- 2. android/app/proguard-rules.pro -->
# Keep Vonage OpenTok and WebRTC classes during release minification
-keep class com.opentok.** { *; }
-keep class org.webrtc.** { *; }
-dontwarn com.opentok.**
-dontwarn org.webrtc.**
`
  },
  {
    id: 'backend-service',
    title: 'Node.js Vonage Server Service',
    category: 'backend',
    filename: 'server/vonageService.ts',
    language: 'typescript',
    description: 'Server-side API routes for generating Vonage Video session IDs, secure client JWT tokens, and initiating Vonage SMS verification requests.',
    code: `import express from 'express';
import OpenTok from 'opentok';

const app = express();
app.use(express.json());

const API_KEY = process.env.VONAGE_API_KEY!;
const API_SECRET = process.env.VONAGE_API_SECRET!;
const opentok = new OpenTok(API_KEY, API_SECRET);

// Cache sessions in database or memory
const rooms = new Map<string, string>();

/**
 * Endpoint to join or create a video room
 */
app.post('/api/vonage/video/session', (req, res) => {
  const { roomId = 'default-room', userName = 'User', role = 'publisher' } = req.body;

  let sessionId = rooms.get(roomId);

  const sendTokenResponse = (sessId: string) => {
    // Generate secure client token
    const token = opentok.generateToken(sessId, {
      role: role as OpenTok.Role,
      expireTime: Math.floor(Date.now() / 1000) + 24 * 3600, // 24 hours
      data: JSON.stringify({ name: userName, platform: req.body.platform || 'mobile' }),
    });

    res.json({
      success: true,
      apiKey: API_KEY,
      sessionId: sessId,
      token,
      roomId,
    });
  };

  if (!sessionId) {
    // Create new routed session for multi-party WebRTC calls
    opentok.createSession({ mediaMode: 'routed' }, (err, session) => {
      if (err || !session) {
        return res.status(500).json({ success: false, error: err?.message || 'Session creation failed' });
      }
      sessionId = session.sessionId;
      rooms.set(roomId, sessionId);
      sendTokenResponse(sessionId);
    });
  } else {
    sendTokenResponse(sessionId);
  }
});

/**
 * Endpoint to initiate Vonage Verify SMS
 */
app.post('/api/vonage/sms/verify/request', async (req, res) => {
  const { phoneNumber, countryCode, brand = 'MyMobileApp' } = req.body;
  const cleanPhone = (countryCode + phoneNumber.replace(/\\D/g, '')).replace(/^\\++/, '');

  try {
    const params = new URLSearchParams({
      api_key: API_KEY,
      api_secret: API_SECRET,
      number: cleanPhone,
      brand,
      code_length: '6',
    });

    const vonageRes = await fetch('https://api.nexmo.com/verify/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const result = await vonageRes.json();

    if (result.status === '0') {
      res.json({ success: true, requestId: result.request_id });
    } else {
      res.status(400).json({ success: false, error: result.error_text });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Endpoint to check OTP code
 */
app.post('/api/vonage/sms/verify/check', async (req, res) => {
  const { requestId, code } = req.body;

  try {
    const params = new URLSearchParams({
      api_key: API_KEY,
      api_secret: API_SECRET,
      request_id: requestId,
      code: code.trim(),
    });

    const vonageRes = await fetch('https://api.nexmo.com/verify/check/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const result = await vonageRes.json();

    if (result.status === '0') {
      res.json({ success: true, status: 'VERIFIED' });
    } else {
      res.status(400).json({ success: false, error: result.error_text });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
`
  },
  {
    id: 'rn-fashion-consultation',
    title: 'Fashion Design & Outfit AI Screen',
    category: 'react-native',
    filename: 'src/screens/FashionConsultationScreen.tsx',
    language: 'typescript',
    description: 'React Native screen capturing live outfit frames during Vonage video calls, sending to Gemini AI backend, and presenting color palette analysis & tailoring ideas.',
    code: `import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
// Tip: use react-native-image-picker or captureFrame from opentok-react-native
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

interface FashionAnalysis {
  styleTitle: string;
  styleArchetype: string;
  overallScore: number;
  fitAndSilhouette: string;
  colorPalette: {
    detectedColors: string[];
    season: string;
    recommendation: string;
  };
  designIdeas: Array<{
    title: string;
    concept: string;
    fabricSuggestion: string;
    impact: string;
  }>;
  virtualStylistComment: string;
}

export const FashionConsultationScreen: React.FC = () => {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<FashionAnalysis | null>(null);

  // Take photo or capture from live video feed
  const handleSnapOutfit = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      includeBase64: true,
      maxWidth: 800,
      maxHeight: 1000,
      quality: 0.8,
    });

    if (result.assets && result.assets[0]) {
      const asset = result.assets[0];
      setPhotoUri(asset.uri || null);
      if (asset.base64) {
        const fullBase64 = \`data:\${asset.type || 'image/jpeg'};base64,\${asset.base64}\`;
        setPhotoBase64(fullBase64);
        analyzeOutfit(fullBase64);
      }
    }
  };

  const analyzeOutfit = async (base64Img: string) => {
    setIsAnalyzing(true);
    try {
      // Connects to your backend proxy server
      const response = await fetch('https://your-api-host.com/api/fashion/analyze-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Img,
          userNotes: 'Client consulting during Vonage live styling call.',
          focusArea: 'complete',
        }),
      });
      const data = await response.json();
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
      } else {
        Alert.alert('Analysis Failed', data.error || 'Could not analyze outfit');
      }
    } catch (err: any) {
      Alert.alert('Network Error', err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>AI Fashion Design Consultation</Text>
        <Text style={styles.subtitle}>Vonage Live Outfit Inspection & Stylist Assistant</Text>

        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>No outfit captured yet</Text>
          </View>
        )}

        <TouchableOpacity style={styles.snapButton} onPress={handleSnapOutfit} activeOpacity={0.8}>
          <Text style={styles.snapButtonText}>📸 Capture Outfit Frame</Text>
        </TouchableOpacity>

        {isAnalyzing && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#ec4899" />
            <Text style={styles.loadingText}>Gemini AI analyzing silhouette & color theory...</Text>
          </View>
        )}

        {analysis && !isAnalyzing && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.archetypeBadge}>{analysis.styleArchetype}</Text>
              <Text style={styles.scoreBadge}>{analysis.overallScore}/10 Aesthetic Score</Text>
            </View>

            <Text style={styles.outfitTitle}>{analysis.styleTitle}</Text>
            <Text style={styles.quote}>"{analysis.virtualStylistComment}"</Text>

            <Text style={styles.sectionHeader}>Drape & Silhouette</Text>
            <Text style={styles.bodyText}>{analysis.fitAndSilhouette}</Text>

            <Text style={styles.sectionHeader}>Color Harmony & Palette</Text>
            <View style={styles.tagContainer}>
              {analysis.colorPalette.detectedColors.map((c, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{c}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.subText}>{analysis.colorPalette.recommendation}</Text>

            <Text style={styles.sectionHeader}>Design Modification Ideas</Text>
            {analysis.designIdeas.map((idea, index) => (
              <View key={index} style={styles.ideaBox}>
                <Text style={styles.ideaTitle}>• {idea.title} ({idea.impact})</Text>
                <Text style={styles.bodyText}>{idea.concept}</Text>
                <Text style={styles.fabricText}>Fabric suggestion: {idea.fabricSuggestion}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  scroll: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#ffffff', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#a1a1aa', textAlign: 'center', marginBottom: 16 },
  placeholderContainer: { height: 260, backgroundColor: '#18181b', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#71717a', fontSize: 14 },
  previewImage: { height: 260, width: '100%', borderRadius: 16, backgroundColor: '#27272a' },
  snapButton: { backgroundColor: '#db2777', padding: 14, borderRadius: 12, alignItems: 'center', marginVertical: 14 },
  snapButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  loadingBox: { padding: 24, alignItems: 'center' },
  loadingText: { color: '#f472b6', marginTop: 10, fontSize: 13 },
  card: { backgroundColor: '#18181b', borderRadius: 16, padding: 16, marginTop: 10, borderWidth: 1, borderColor: '#27272a' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  archetypeBadge: { color: '#f472b6', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  scoreBadge: { color: '#34d399', fontSize: 12, fontWeight: '700' },
  outfitTitle: { color: '#ffffff', fontSize: 17, fontWeight: '700', marginBottom: 4 },
  quote: { color: '#fbcfe8', fontStyle: 'italic', fontSize: 13, marginBottom: 12 },
  sectionHeader: { color: '#ffffff', fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  bodyText: { color: '#d4d4d8', fontSize: 13, lineHeight: 18 },
  subText: { color: '#fbbf24', fontSize: 12, marginTop: 4 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 },
  tag: { backgroundColor: '#27272a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagText: { color: '#e4e4e7', fontSize: 12 },
  ideaBox: { backgroundColor: '#09090b', padding: 10, borderRadius: 10, marginTop: 8, borderWidth: 1, borderColor: '#27272a' },
  ideaTitle: { color: '#f472b6', fontWeight: '700', fontSize: 13, marginBottom: 2 },
  fabricText: { color: '#94a3b8', fontSize: 11, marginTop: 4, fontStyle: 'italic' },
});
`
  }
];
