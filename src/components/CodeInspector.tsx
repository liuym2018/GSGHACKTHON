import React, { useState, useEffect } from 'react';
import { REACT_NATIVE_TEMPLATES, CodeTemplate } from '../data/reactNativeTemplates';
import { CodeReviewResult } from '../types';
import { CodeOutputViewer } from './CodeOutputViewer';
import { CodeSuggestionsViewer } from './CodeSuggestionsViewer';
import {
  FileCode,
  Copy,
  Check,
  Smartphone,
  Server,
  Layers,
  Search,
  ExternalLink,
  Terminal,
  Shield,
  Play,
  Sparkles,
  Edit3,
  Eye,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const CodeInspector: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<CodeTemplate>(
    REACT_NATIVE_TEMPLATES[0]
  );
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Inspector Mode Tabs
  const [inspectorMode, setInspectorMode] = useState<'code' | 'output' | 'suggestions'>('code');

  // Editable Code State
  const [currentCode, setCurrentCode] = useState<string>(REACT_NATIVE_TEMPLATES[0].code);
  const [isEditingCode, setIsEditingCode] = useState<boolean>(false);

  // Output Check State
  const [outputLog, setOutputLog] = useState<string>('');
  const [isRunningOutput, setIsRunningOutput] = useState<boolean>(false);
  const [targetEnv, setTargetEnv] = useState<string>('Native Build Simulator');

  // AI Review & Suggestions State
  const [reviewResult, setReviewResult] = useState<CodeReviewResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // When template changes, update currentCode and reset output/review for fresh context
  const handleSelectTemplate = (tpl: CodeTemplate) => {
    setSelectedTemplate(tpl);
    setCurrentCode(tpl.code);
    setIsEditingCode(false);
  };

  const filteredTemplates = REACT_NATIVE_TEMPLATES.filter((tpl) => {
    const matchesCategory =
      activeCategory === 'all' || tpl.category === activeCategory;
    const matchesSearch =
      tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Run Simulated Build & Output
  const handleRunSimulatedOutput = async () => {
    setIsRunningOutput(true);
    setInspectorMode('output');

    try {
      const res = await fetch('/api/code/simulate-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedTemplate.filename,
          category: selectedTemplate.category,
          code: currentCode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOutputLog(data.output);
        setTargetEnv(data.target);
      } else {
        setOutputLog(`[ERROR]: Failed to simulate build: ${data.error}`);
      }
    } catch (err: any) {
      setOutputLog(`[ERROR]: Network request failed: ${err.message}`);
    } finally {
      setIsRunningOutput(false);
    }
  };

  // Analyze Code and Output with AI
  const handleAnalyzeWithAi = async (logToAnalyze?: string) => {
    setIsAnalyzing(true);
    setInspectorMode('suggestions');

    const effectiveLog = logToAnalyze !== undefined ? logToAnalyze : outputLog;

    try {
      const res = await fetch('/api/code/analyze-and-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedTemplate.filename,
          category: selectedTemplate.category,
          code: currentCode,
          outputLog: effectiveLog,
          mode: 'review',
        }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        setReviewResult(data.result);
      }
    } catch (err) {
      console.error('Failed to analyze code with AI', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Check if output has errors
  const outputHasErrors =
    outputLog.toLowerCase().includes('error') ||
    outputLog.toLowerCase().includes('exception') ||
    outputLog.toLowerCase().includes('crash') ||
    outputLog.toLowerCase().includes('413');

  return (
    <div id="code-inspector-container" className="w-full max-w-6xl mx-auto flex flex-col gap-6 p-4 sm:p-6 animate-in fade-in duration-300">
      
      {/* Top Banner / Summary */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/60">
              React Native Cross-Platform Suite
            </span>
            <span className="text-xs text-neutral-400 font-mono">iOS & Android</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-900/60 text-purple-300 border border-purple-700/60 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-300" />
              AI Output Checker & Suggestions
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Vonage Video, SMS & Fashion AI Code
          </h2>
          <p className="text-sm text-neutral-400 max-w-2xl mt-1">
            Production-grade components, native CocoaPods & Manifest configs, live execution output simulator, and automated Gemini AI code reviews with instant suggestions.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleRunSimulatedOutput}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Check Output</span>
          </button>

          <button
            type="button"
            onClick={() => handleAnalyzeWithAi()}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>AI Suggestions</span>
          </button>

          <a
            href="https://developer.vonage.com/en/video/overview"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-semibold text-neutral-200 flex items-center gap-2 transition"
          >
            <span>Vonage Docs</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Quick Architecture Walkthrough Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm mb-1.5">
            <Smartphone className="w-4 h-4" />
            <span>1. Cross-Platform Client</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Uses <code className="text-blue-300 font-mono">opentok-react-native</code> for native WebRTC acceleration on both iOS and Android with zero frame drops.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1.5">
            <Shield className="w-4 h-4" />
            <span>2. Native OS 2FA</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Integrates iOS <code className="text-emerald-300 font-mono">textContentType="oneTimeCode"</code> and Android SMS Retriever API for 1-tap OTP completion.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm mb-1.5">
            <Server className="w-4 h-4" />
            <span>3. AI Styling & Token Server</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Generates OpenTok session IDs, proxies Gemini fashion design outfit checks, and protects Vonage API secrets.
          </p>
        </div>
      </div>

      {/* Main Code & Output & Suggestions Container */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[580px]">
        
        {/* Left Sidebar: File List & Filter */}
        <div className="w-full md:w-80 bg-neutral-900/90 border-r border-neutral-800 p-4 flex flex-col shrink-0">
          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search code files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none text-[11px]">
            {['all', 'react-native', 'ios', 'android', 'backend'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wider transition cursor-pointer shrink-0 ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>

          {/* Files Navigation */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredTemplates.map((tpl) => {
              const isSelected = selectedTemplate.id === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`w-full text-left p-3 rounded-xl transition cursor-pointer flex flex-col gap-1 border ${
                    isSelected
                      ? 'bg-blue-950/60 border-blue-500/60 text-white shadow-sm'
                      : 'bg-neutral-900/60 border-neutral-800/80 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-xs tracking-tight truncate">
                      {tpl.title}
                    </span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold font-mono ${
                        tpl.category === 'react-native'
                          ? 'bg-blue-900/80 text-blue-300'
                          : tpl.category === 'ios'
                          ? 'bg-neutral-800 text-neutral-300'
                          : tpl.category === 'android'
                          ? 'bg-emerald-950 text-emerald-300'
                          : 'bg-purple-950 text-purple-300'
                      }`}
                    >
                      {tpl.category}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-400 truncate">
                    {tpl.filename}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Main Display Area */}
        <div className="flex-1 flex flex-col bg-neutral-950 min-w-0">
          
          {/* Main Mode Navigation Bar: Code / Output / Suggestions */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/80 border-b border-neutral-800 gap-2 flex-wrap">
            
            {/* View Mode Tabs */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setInspectorMode('code')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  inspectorMode === 'code'
                    ? 'bg-neutral-800 text-white shadow-xs border border-neutral-700'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                <span>Source Code</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInspectorMode('output');
                  if (!outputLog) {
                    handleRunSimulatedOutput();
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  inspectorMode === 'output'
                    ? 'bg-neutral-800 text-white shadow-xs border border-neutral-700'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Output & Logs</span>
                {outputLog && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      outputHasErrors ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setInspectorMode('suggestions');
                  if (!reviewResult) {
                    handleAnalyzeWithAi();
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  inspectorMode === 'suggestions'
                    ? 'bg-neutral-800 text-white shadow-xs border border-neutral-700'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Suggestions</span>
                {reviewResult && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      reviewResult.healthScore >= 80
                        ? 'bg-emerald-950 text-emerald-300'
                        : 'bg-amber-950 text-amber-300'
                    }`}
                  >
                    {reviewResult.healthScore}%
                  </span>
                )}
              </button>
            </div>

            {/* Quick Actions on the Right */}
            <div className="flex items-center gap-2">
              {inspectorMode === 'code' && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditingCode(!isEditingCode)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 flex items-center gap-1 transition cursor-pointer"
                    title={isEditingCode ? 'View Readonly' : 'Edit / Customize Code'}
                  >
                    {isEditingCode ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                    <span>{isEditingCode ? 'View' : 'Edit'}</span>
                  </button>

                  <button
                    id="copy-code-btn"
                    type="button"
                    onClick={handleCopy}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleRunSimulatedOutput}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1 transition cursor-pointer"
                title="Run simulated build & terminal output"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Run</span>
              </button>

              <button
                type="button"
                onClick={() => handleAnalyzeWithAi()}
                className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white flex items-center gap-1 transition cursor-pointer"
                title="Run Gemini code review and suggestions"
              >
                <Sparkles className="w-3 h-3 text-yellow-300" />
                <span>Review</span>
              </button>
            </div>
          </div>

          {/* VIEW 1: SOURCE CODE */}
          {inspectorMode === 'code' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Description & File header */}
              <div className="px-5 py-2.5 bg-neutral-900/40 border-b border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                <div className="truncate font-mono">
                  <span className="text-neutral-500">File: </span>
                  <span className="text-neutral-200">{selectedTemplate.filename}</span>
                  <span className="ml-3 text-neutral-400">{selectedTemplate.description}</span>
                </div>
                {isEditingCode && (
                  <span className="text-amber-400 text-[11px] font-semibold uppercase tracking-wider shrink-0">
                    Editing Enabled
                  </span>
                )}
              </div>

              {/* Code Editor or Viewer */}
              {isEditingCode ? (
                <div className="flex-1 p-4 bg-[#0d1117] flex flex-col">
                  <textarea
                    value={currentCode}
                    onChange={(e) => setCurrentCode(e.target.value)}
                    className="flex-1 w-full p-4 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-200 placeholder-neutral-500 focus:outline-hidden focus:border-blue-500 resize-none leading-relaxed"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
                    <span>You can edit this code and then click "Run" to test execution output or "Review" to get AI suggestions.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentCode(selectedTemplate.code);
                        setIsEditingCode(false);
                      }}
                      className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
                    >
                      Reset to Template
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-auto p-4 sm:p-5 font-mono text-xs text-neutral-300 leading-relaxed bg-[#0d1117]">
                  <pre className="whitespace-pre">
                    <code>{currentCode}</code>
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: EXECUTION OUTPUT & LOGS */}
          {inspectorMode === 'output' && (
            <CodeOutputViewer
              filename={selectedTemplate.filename}
              category={selectedTemplate.category}
              outputLog={outputLog}
              isRunning={isRunningOutput}
              targetEnv={targetEnv}
              onRunSimulation={handleRunSimulatedOutput}
              onOutputChange={(newLog) => setOutputLog(newLog)}
              onAnalyzeWithAi={(logToAnalyze) => handleAnalyzeWithAi(logToAnalyze)}
            />
          )}

          {/* VIEW 3: AI SUGGESTIONS & CODE REVIEW */}
          {inspectorMode === 'suggestions' && (
            <CodeSuggestionsViewer
              filename={selectedTemplate.filename}
              category={selectedTemplate.category}
              reviewResult={reviewResult}
              isAnalyzing={isAnalyzing}
              onReAnalyze={() => handleAnalyzeWithAi()}
              onBackToCode={() => setInspectorMode('code')}
              onViewOutput={() => setInspectorMode('output')}
            />
          )}
        </div>
      </div>

      {/* Terminal Quick Installation Guide */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
        <div className="flex items-center gap-2 mb-3 text-sm font-bold text-white">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Quick Install Command for React Native Project</span>
        </div>
        <div className="p-3.5 rounded-xl bg-neutral-950 font-mono text-xs text-emerald-400 overflow-x-auto flex items-center justify-between border border-neutral-800">
          <span>
            npm install opentok-react-native react-native-permissions @vonage/server-sdk
          </span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText('npm install opentok-react-native react-native-permissions @vonage/server-sdk');
            }}
            className="ml-4 text-neutral-400 hover:text-white shrink-0 cursor-pointer"
            title="Copy command"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 text-xs text-neutral-400 leading-relaxed">
          For iOS: Run <code className="text-neutral-200 font-mono bg-neutral-800 px-1.5 py-0.5 rounded">cd ios && pod install</code>. For Android: Runtime permissions are handled automatically by AndroidManifest.xml and <code className="text-neutral-200 font-mono bg-neutral-800 px-1.5 py-0.5 rounded">requestVideoAudioPermissions()</code>.
        </div>
      </div>
    </div>
  );
};
