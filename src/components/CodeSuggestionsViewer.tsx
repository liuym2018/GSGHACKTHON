import React, { useState } from 'react';
import { CodeReviewResult, CodeSuggestionItem } from '../types';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  RotateCcw,
  Bug,
  Cpu,
  Layers,
  FileCode,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface CodeSuggestionsViewerProps {
  filename: string;
  category: string;
  reviewResult: CodeReviewResult | null;
  isAnalyzing: boolean;
  onReAnalyze: () => void;
  onBackToCode: () => void;
  onViewOutput: () => void;
}

export const CodeSuggestionsViewer: React.FC<CodeSuggestionsViewerProps> = ({
  filename,
  category,
  reviewResult,
  isAnalyzing,
  onReAnalyze,
  onBackToCode,
  onViewOutput,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isAnalyzing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-neutral-950 min-h-[580px] text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-purple-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Analyzing Code & Runtime Output</h3>
        <p className="text-sm text-neutral-400 max-w-md leading-relaxed">
          Gemini Mobile Specialist is evaluating WebRTC streams, native iOS/Android privacy declarations, Vonage token lifecycle, and runtime output...
        </p>
      </div>
    );
  }

  if (!reviewResult) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-neutral-950 min-h-[580px] text-center">
        <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 text-purple-400">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">No AI Analysis Run Yet</h3>
        <p className="text-xs text-neutral-400 max-w-sm mb-5">
          Run an instant diagnosis of <code className="text-blue-300">{filename}</code> and its execution output to receive targeted fixes and production suggestions.
        </p>
        <button
          type="button"
          onClick={onReAnalyze}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white flex items-center gap-2 transition cursor-pointer shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span>Start AI Review</span>
        </button>
      </div>
    );
  }

  const { summary, status, healthScore, outputAnalysis, suggestions, verifiedChecklist } = reviewResult;

  const isPass = status === 'PASS';
  const isWarning = status === 'WARNING';
  const isError = status === 'ERROR';

  return (
    <div id="code-suggestions-viewer" className="flex-1 flex flex-col bg-neutral-950 min-h-[580px] overflow-y-auto">
      
      {/* Top Banner: Score & Executive Summary */}
      <div className="p-5 sm:p-6 bg-neutral-900/90 border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          
          {/* Health Score Circular Badge */}
          <div
            className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center shrink-0 shadow-lg ${
              healthScore >= 85
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                : healthScore >= 70
                ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                : 'bg-rose-950/80 border-rose-500/60 text-rose-300'
            }`}
          >
            <span className="text-lg font-black tracking-tight leading-none">{healthScore}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5 opacity-80">Score</span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  isPass
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : isWarning
                    ? 'bg-amber-950 text-amber-300 border-amber-700'
                    : 'bg-rose-950 text-rose-300 border-rose-700'
                }`}
              >
                {status === 'PASS' ? 'Ready for Production' : status === 'WARNING' ? 'Action Recommended' : 'Critical Issue Detected'}
              </span>
              <span className="text-xs text-neutral-400 font-mono">{filename}</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
              {summary}
            </h3>
          </div>
        </div>

        {/* Top Control Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onReAnalyze}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-Analyze</span>
          </button>
          <button
            type="button"
            onClick={onBackToCode}
            className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-semibold text-neutral-200 transition cursor-pointer"
          >
            Back to Code
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        
        {/* Output Diagnostics Box */}
        <div
          className={`p-4 rounded-xl border ${
            outputAnalysis.hasErrors
              ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
              : 'bg-neutral-900/70 border-neutral-800 text-neutral-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 font-bold text-xs">
              {outputAnalysis.hasErrors ? (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span>Runtime Output Diagnosis</span>
            </div>
            <button
              type="button"
              onClick={onViewOutput}
              className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Inspect Output Logs</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs leading-relaxed text-neutral-300">
            {outputAnalysis.errorDiagnosis}
          </p>
          {outputAnalysis.rootCause && outputAnalysis.rootCause !== 'None' && (
            <div className="mt-2.5 pt-2.5 border-t border-neutral-800/80 text-xs">
              <span className="font-semibold text-neutral-400">Identified Root Cause: </span>
              <span className="font-mono text-amber-300">{outputAnalysis.rootCause}</span>
            </div>
          )}
        </div>

        {/* Actionable Suggestions Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Actionable AI Suggestions & Fixes ({suggestions.length})
              </h4>
            </div>
            <span className="text-[11px] text-neutral-500">Tailored to Vonage Mobile SDK</span>
          </div>

          <div className="space-y-3.5">
            {suggestions.map((sug) => {
              const isCrit = sug.severity === 'critical';
              const isWarn = sug.severity === 'warning';

              return (
                <div
                  key={sug.id}
                  className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          isCrit
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : isWarn
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-blue-950 text-blue-300 border-blue-800'
                        }`}
                      >
                        {sug.severity}
                      </span>
                      <span className="text-[10px] uppercase font-mono text-neutral-400">
                        {sug.type.replace('_', ' ')}
                      </span>
                    </div>

                    {sug.suggestedCode && (
                      <button
                        type="button"
                        onClick={() => handleCopyCode(sug.id, sug.suggestedCode!)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                      >
                        {copiedId === sug.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 text-[11px]">Copied Fix!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-neutral-400" />
                            <span className="text-[11px]">Copy Snippet</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <h5 className="text-xs sm:text-sm font-bold text-white mb-1">
                    {sug.title}
                  </h5>
                  <p className="text-xs text-neutral-300 leading-relaxed mb-3">
                    {sug.description}
                  </p>

                  {sug.suggestedCode && (
                    <div className="p-3 rounded-lg bg-[#0d1117] border border-neutral-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                      <pre className="whitespace-pre">{sug.suggestedCode}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cross-Platform Verification Checklist */}
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Cross-Platform Readiness Checklist
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {verifiedChecklist.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 flex items-start gap-2.5"
              >
                {item.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-semibold text-white">{item.item}</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
