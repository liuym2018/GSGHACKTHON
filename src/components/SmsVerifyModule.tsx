import React, { useState, useEffect, useRef } from 'react';
import { MobilePlatform, VerificationState, CountryItem } from '../types';
import { COUNTRIES } from '../data/countries';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Send,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ChevronDown,
  ArrowRight,
  MessageSquare,
  KeyRound,
} from 'lucide-react';

interface SmsVerifyModuleProps {
  platform: MobilePlatform;
  onVerificationSuccess?: (phoneNumber: string) => void;
  onTriggerNotification?: (notification: {
    app: string;
    title: string;
    message: string;
    actionText?: string;
    onAction?: () => void;
  }) => void;
}

export const SmsVerifyModule: React.FC<SmsVerifyModuleProps> = ({
  platform,
  onVerificationSuccess,
  onTriggerNotification,
}) => {
  const isIOS = platform === 'ios';

  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState<string>('4155552671');
  const [showCountryModal, setShowCountryModal] = useState<boolean>(false);
  const [countrySearch, setCountrySearch] = useState<string>('');

  const [state, setState] = useState<VerificationState>({
    phoneNumber: '4155552671',
    countryCode: '+1',
    formattedNumber: '+1 415 555 2671',
    requestId: null,
    status: 'idle',
    otpCode: ['', '', '', '', '', ''],
    expiresAt: null,
    resendCooldown: 0,
    attemptsRemaining: 5,
    errorMessage: null,
    autoReadTriggered: false,
  });

  const otpInputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Resend cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (state.resendCooldown > 0) {
      timer = setInterval(() => {
        setState((prev) => ({
          ...prev,
          resendCooldown: Math.max(0, prev.resendCooldown - 1),
        }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [state.resendCooldown]);

  // Request SMS verification from backend API
  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 6) {
      setState((prev) => ({ ...prev, errorMessage: 'Please enter a valid phone number.' }));
      return;
    }

    setState((prev) => ({ ...prev, status: 'requesting', errorMessage: null }));

    try {
      const response = await fetch('/api/vonage/sms/verify/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          countryCode: selectedCountry.dialCode,
          brand: 'VonageDemo',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setState((prev) => ({
          ...prev,
          status: 'pending',
          requestId: data.requestId,
          sandboxCode: data.sandboxCode,
          expiresAt: data.expiresAt,
          resendCooldown: 45,
          otpCode: ['', '', '', '', '', ''],
          errorMessage: null,
        }));

        // Focus first OTP input
        setTimeout(() => {
          otpInputsRef.current[0]?.focus();
        }, 200);

        // Simulate native OS notification
        if (onTriggerNotification) {
          const simulatedCode = data.sandboxCode || '782941';
          onTriggerNotification({
            app: isIOS ? 'Messages' : 'Google Messages',
            title: isIOS ? 'Vonage Verification' : 'Your Verification Code',
            message: `${simulatedCode} is your Vonage verification code for ${selectedCountry.dialCode} ${phoneNumber}.`,
            actionText: isIOS ? `Autofill ${simulatedCode}` : `Copy code ${simulatedCode}`,
            onAction: () => {
              autoFillCode(simulatedCode);
            },
          });
        }
      } else {
        setState((prev) => ({
          ...prev,
          status: 'failed',
          errorMessage: data.error || 'Failed to dispatch verification SMS.',
        }));
      }
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        status: 'failed',
        errorMessage: err.message || 'Network error requesting SMS code.',
      }));
    }
  };

  // Verify submitted OTP code
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || state.otpCode.join('');
    if (code.length < 6) {
      setState((prev) => ({ ...prev, errorMessage: 'Please enter all 6 digits.' }));
      return;
    }

    if (!state.requestId) {
      setState((prev) => ({ ...prev, errorMessage: 'No active request found. Please request a new code.' }));
      return;
    }

    setState((prev) => ({ ...prev, status: 'verifying', errorMessage: null }));

    try {
      const response = await fetch('/api/vonage/sms/verify/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: state.requestId,
          code,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setState((prev) => ({
          ...prev,
          status: 'verified',
          errorMessage: null,
        }));

        // Trigger confetti celebration
        try {
          confetti({
            particleCount: 60,
            spread: 50,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore if canvas not ready
        }

        if (onVerificationSuccess) {
          onVerificationSuccess(`${selectedCountry.dialCode}${phoneNumber}`);
        }
      } else {
        setState((prev) => ({
          ...prev,
          status: 'failed',
          attemptsRemaining: data.remainingAttempts ?? prev.attemptsRemaining - 1,
          errorMessage: data.error || 'Incorrect verification code. Please check and try again.',
        }));
      }
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        status: 'failed',
        errorMessage: err.message || 'Network error during verification.',
      }));
    }
  };

  // Auto-fill helper (used by simulated notification or one-click sandbox test)
  const autoFillCode = (code: string) => {
    const digits = code.slice(0, 6).split('');
    setState((prev) => ({
      ...prev,
      otpCode: digits,
      errorMessage: null,
    }));
    handleVerifyOtp(code);
  };

  // Handle single digit typing
  const handleDigitChange = (index: number, value: string) => {
    // Handle paste event
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 6) {
      autoFillCode(cleaned);
      return;
    }

    const singleDigit = cleaned.slice(-1);
    const newOtp = [...state.otpCode];
    newOtp[index] = singleDigit;

    setState((prev) => ({ ...prev, otpCode: newOtp, errorMessage: null }));

    // Move to next field if filled
    if (singleDigit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto verify if last digit entered
    if (singleDigit && index === 5) {
      const completeCode = newOtp.join('');
      if (completeCode.length === 6) {
        handleVerifyOtp(completeCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !state.otpCode[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Reset to phone input
  const handleReset = () => {
    setState({
      phoneNumber,
      countryCode: selectedCountry.dialCode,
      formattedNumber: `${selectedCountry.dialCode} ${phoneNumber}`,
      requestId: null,
      status: 'idle',
      otpCode: ['', '', '', '', '', ''],
      expiresAt: null,
      resendCooldown: 0,
      attemptsRemaining: 5,
      errorMessage: null,
      autoReadTriggered: false,
    });
  };

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dialCode.includes(countrySearch)
  );

  return (
    <div id={`sms-verify-container-${platform}`} className="flex-1 flex flex-col h-full bg-neutral-900 text-white relative select-none">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 z-20">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold tracking-wide text-neutral-200">
            Vonage Verify 2FA
          </span>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/60">
          {isIOS ? 'iOS Keychain / OTP' : 'Android SMS Retriever'}
        </span>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col justify-center">
        
        {/* VIEW 1: ENTER PHONE NUMBER */}
        {(state.status === 'idle' || state.status === 'requesting') && (
          <div className="flex flex-col animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">
              Verify your mobile
            </h3>
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              Vonage SMS Verify delivers carrier-grade one-time passcodes with fraud protection.
            </p>

            {/* Error banner */}
            {state.errorMessage && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{state.errorMessage}</span>
              </div>
            )}

            {/* Phone input with country code picker */}
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">
                Mobile Number
              </label>
              <div className="flex items-center rounded-xl bg-neutral-950 border border-neutral-700 focus-within:border-blue-500 transition overflow-hidden">
                {/* Country Code Trigger */}
                <button
                  id={`country-selector-${platform}`}
                  type="button"
                  onClick={() => setShowCountryModal(true)}
                  className="flex items-center gap-1.5 px-3 py-3 bg-neutral-800/60 hover:bg-neutral-800 text-xs font-semibold text-neutral-200 border-r border-neutral-700 transition cursor-pointer shrink-0"
                >
                  <span className="text-base">{selectedCountry.flag}</span>
                  <span>{selectedCountry.dialCode}</span>
                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                </button>

                {/* Number Input */}
                <input
                  id={`phone-input-${platform}`}
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="555-0199"
                  className="flex-1 px-3 py-3 bg-transparent text-sm font-medium text-white placeholder-neutral-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              id={`btn-send-sms-${platform}`}
              type="button"
              disabled={state.status === 'requesting'}
              onClick={handleSendCode}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.99] mt-2"
            >
              {state.status === 'requesting' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending SMS via Vonage...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Verification Code</span>
                </>
              )}
            </button>

            {/* Platform Feature Highlight Card */}
            <div className="mt-8 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 text-neutral-400 text-[11px] leading-relaxed">
              <span className="font-semibold text-neutral-200 block mb-1">
                {isIOS ? ' iOS Integration Note:' : '🤖 Android Integration Note:'}
              </span>
              {isIOS
                ? 'Sets textContentType="oneTimeCode" in React Native so iOS automatically suggests the Vonage SMS code directly from the keyboard QuickType strip.'
                : 'Supports the SMS Retriever API without SMS reading permissions; listens for Vonage verification broadcast with 100% user consent.'}
            </div>
          </div>
        )}

        {/* VIEW 2: ENTER OTP PIN */}
        {(state.status === 'pending' || state.status === 'verifying' || state.status === 'failed') && (
          <div className="flex flex-col animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">
              Enter 6-digit code
            </h3>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              Sent to <span className="text-white font-semibold">{selectedCountry.dialCode} {phoneNumber}</span>
            </p>

            {/* Error banner */}
            {state.errorMessage && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{state.errorMessage}</span>
              </div>
            )}

            {/* Sandbox Quick-Test Assist Pill */}
            {state.sandboxCode && (
              <div className="mb-4 p-2.5 rounded-xl bg-blue-950/60 border border-blue-800/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <span className="text-blue-200 font-medium">Sandbox SMS Code: </span>
                    <span className="font-mono font-bold text-white tracking-widest">{state.sandboxCode}</span>
                  </div>
                </div>
                <button
                  id={`btn-fill-sandbox-code-${platform}`}
                  type="button"
                  onClick={() => autoFillCode(state.sandboxCode!)}
                  className="px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-[11px] font-semibold text-white cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>
            )}

            {/* 6 Digit Input Boxes */}
            <div className="flex items-center justify-between gap-1.5 my-3">
              {state.otpCode.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputsRef.current[idx] = el)}
                  id={`otp-digit-${platform}-${idx}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-11 h-13 rounded-xl border text-center text-xl font-mono font-bold transition ${
                    digit
                      ? 'bg-blue-950/40 border-blue-500 text-white shadow-sm'
                      : 'bg-neutral-950 border-neutral-700 text-neutral-300 focus:border-blue-400 focus:bg-neutral-900'
                  }`}
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              id={`btn-verify-otp-${platform}`}
              type="button"
              disabled={state.status === 'verifying' || state.otpCode.join('').length < 6}
              onClick={() => handleVerifyOtp()}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.99] mt-3"
            >
              {state.status === 'verifying' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Checking with Vonage...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify Passcode</span>
                </>
              )}
            </button>

            {/* Resend and Edit Number options */}
            <div className="flex items-center justify-between mt-5 text-xs text-neutral-400">
              <button
                id={`btn-resend-sms-${platform}`}
                type="button"
                disabled={state.resendCooldown > 0}
                onClick={handleSendCode}
                className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 disabled:text-neutral-500 cursor-pointer disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {state.resendCooldown > 0
                  ? `Resend in ${state.resendCooldown}s`
                  : 'Resend SMS code'}
              </button>

              <button
                id={`btn-change-number-${platform}`}
                type="button"
                onClick={handleReset}
                className="text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                Change number
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: VERIFICATION SUCCESS */}
        {state.status === 'verified' && (
          <div className="flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mb-4 shadow-xl shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-bold text-white mb-1">
              Phone Verified!
            </h3>
            <p className="text-xs text-neutral-400 mb-6 max-w-[240px]">
              Vonage carrier verification completed for{' '}
              <span className="text-emerald-400 font-semibold">{selectedCountry.dialCode} {phoneNumber}</span>.
            </p>

            <div className="w-full bg-neutral-950/80 rounded-xl p-3 border border-neutral-800 text-left mb-6 text-xs text-neutral-300 space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-neutral-500">Security Provider:</span>
                <span className="text-emerald-400 font-bold">Vonage Verify</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Device Platform:</span>
                <span className="text-white font-semibold">{isIOS ? 'iOS (Apple)' : 'Android'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Status:</span>
                <span className="text-emerald-400 font-bold">SUCCESS (200 OK)</span>
              </div>
            </div>

            <button
              id={`btn-verify-done-${platform}`}
              type="button"
              onClick={handleReset}
              className="w-full py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm cursor-pointer transition flex items-center justify-center gap-2"
            >
              <span>Test Another Number</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Country Selection Modal */}
      {showCountryModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in">
          <div className="w-full max-h-[80%] bg-neutral-900 rounded-t-3xl border-t border-neutral-700 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-white">Select Country Code</span>
              <button
                type="button"
                onClick={() => setShowCountryModal(false)}
                className="text-xs font-semibold text-neutral-400 hover:text-white px-2 py-1 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <input
              type="text"
              placeholder="Search country or dial code..."
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-xs text-white placeholder-neutral-500 mb-3 focus:outline-hidden"
              autoFocus
            />

            <div className="flex-1 overflow-y-auto divide-y divide-neutral-800">
              {filteredCountries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setSelectedCountry(c);
                    setShowCountryModal(false);
                  }}
                  className="w-full flex items-center justify-between py-2.5 px-2 hover:bg-neutral-800/80 rounded-lg text-left transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{c.flag}</span>
                    <span className="text-xs font-medium text-neutral-200">{c.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-400">{c.dialCode}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
