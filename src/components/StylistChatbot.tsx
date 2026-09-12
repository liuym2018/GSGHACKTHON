import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  MessageSquare,
  HelpCircle,
  Scissors,
  Palette,
  Footprints,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { FashionAnalysisResult, StylistChatMessage } from '../types';

interface StylistChatbotProps {
  analysis: FashionAnalysisResult | null;
  onSelectSuggestion?: (question: string) => void;
}

export const StylistChatbot: React.FC<StylistChatbotProps> = ({
  analysis,
  onSelectSuggestion,
}) => {
  const [messages, setMessages] = useState<StylistChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize or update welcome greeting whenever analysis changes
  useEffect(() => {
    if (analysis) {
      const welcomeMsg: StylistChatMessage = {
        id: 'welcome_' + Date.now(),
        sender: 'stylist',
        text: `Hello! I have reviewed the analysis for "${analysis.styleTitle}" (${analysis.styleArchetype}, rated ${analysis.overallScore}/10). Feel free to ask me anything about footwear pairings, color theory, neckline alterations, or how to style this look for specific events!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: [
          'What shoes or heels pair best with this drape?',
          'What jewelry & accessories complement the neckline?',
          'How can I alter or tailor the hem for better proportions?',
          'How do I restyle this for a black-tie gala?',
        ],
      };
      setMessages([welcomeMsg]);
    } else {
      const fallbackMsg: StylistChatMessage = {
        id: 'welcome_empty',
        sender: 'stylist',
        text: 'Welcome to the Fashion Week AI Consultation! Capture a live video frame or select an outfit preset to begin our personal styling session.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: [
          'How does the outfit analysis critique work?',
          'What fabrics work best for evening silhouettes?',
        ],
      };
      setMessages([fallbackMsg]);
    }
  }, [analysis?.styleTitle, analysis?.overallScore]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: StylistChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/fashion/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          analysis,
          history: messages.slice(-6).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const botReply: StylistChatMessage = {
          id: 'bot_' + Date.now(),
          sender: 'stylist',
          text: data.reply,
          timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedQuestions: data.suggestedQuestions || [],
        };
        setMessages((prev) => [...prev, botReply]);
      } else {
        throw new Error(data.error || 'Failed to get stylist response');
      }
    } catch (err: any) {
      const errorMsg: StylistChatMessage = {
        id: 'err_' + Date.now(),
        sender: 'stylist',
        text: 'My apologies—I encountered a brief connection glitch while reviewing your look. Let us try that again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const latestMessage = messages[messages.length - 1];

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col h-[600px] shadow-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="px-4 py-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
            <Sparkles className="w-4 h-4 text-pink-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white tracking-wide">
                Fashion Director AI Chatbot
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-neutral-400">
              {analysis ? `Discussing: ${analysis.styleTitle}` : 'Interactive Outfit Consultation'}
            </p>
          </div>
        </div>

        {/* Quick Stylist Topic Badges */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleSendMessage('What shoes & footwear elevate this outfit?')}
            className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-medium text-neutral-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
          >
            <Footprints className="w-3 h-3 text-pink-400" />
            <span>Shoes</span>
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('What jewelry & color accents should I pair with this?')}
            className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-medium text-neutral-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
          >
            <Palette className="w-3 h-3 text-amber-400" />
            <span>Colors</span>
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('What tailoring alterations would make this fit sharper?')}
            className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-medium text-neutral-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
          >
            <Scissors className="w-3 h-3 text-rose-400" />
            <span>Alterations</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gradient-to-tr from-pink-600 to-rose-600 text-white shadow-sm shadow-pink-500/20'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>

                <span className="text-[10px] text-neutral-500 mt-1 px-1 font-mono">
                  {msg.timestamp}
                </span>

                {/* Suggested Follow-up Questions from Stylist */}
                {!isUser && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {msg.suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(q)}
                        disabled={isLoading}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-pink-950/60 border border-neutral-800 hover:border-pink-700/60 text-pink-300 hover:text-pink-200 transition text-left cursor-pointer disabled:opacity-50"
                      >
                        ↳ {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Stylist Typing indicator */}
        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-pink-600 to-rose-600 flex items-center justify-center shrink-0 text-white shadow-sm shadow-pink-500/20">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-neutral-950 border border-neutral-800 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-neutral-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-400" />
              <span>Consulting haute couture styling guidelines...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts Bar (if latest bot has questions) */}
      {latestMessage && latestMessage.sender === 'stylist' && latestMessage.suggestedQuestions && latestMessage.suggestedQuestions.length > 0 && (
        <div className="px-4 py-2 bg-neutral-950/70 border-t border-neutral-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-pink-400" />
            Suggestions:
          </span>
          {latestMessage.suggestedQuestions.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="text-[10px] whitespace-nowrap px-2 py-0.5 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer shrink-0 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder={
            analysis
              ? `Ask about footwear, alterations, or event restyling for "${analysis.styleTitle}"...`
              : 'Ask any question about outfit fit, color balance, or fashion trends...'
          }
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-pink-500 transition disabled:opacity-50"
        />

        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!inputMessage.trim() || isLoading}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 text-xs font-bold text-white transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-pink-600/30 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ask Stylist</span>
        </button>
      </div>
    </div>
  );
};
