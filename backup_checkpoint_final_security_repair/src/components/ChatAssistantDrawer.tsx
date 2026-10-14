import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MMR_ZONES, MASTER_RATE_CARD } from '../data/rateCard';
import { ChatMessage } from '../types';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  MapPin,
  ExternalLink,
  Bot,
  User,
  ArrowRight,
  Calculator,
  Loader2,
} from 'lucide-react';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    content:
      'Hello! I am the Furniture Fix Location & Rate Assistant for the Mumbai Metropolitan Region. You can ask me about coverage in your locality (Diva, Thane, Navi Mumbai, Powai, Andheri, etc.), assembly tariffs from our official 2026 Rate Card, or travel details. How can I help you today?',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

const SUGGESTED_QUESTIONS = [
  'Quote: Queen bed + 3-door wardrobe in Powai',
  'Do you service Hiranandani Estate, Thane?',
  'How much to assemble a hydraulic storage bed?',
  'What are your payment terms?',
];

export const ChatAssistantDrawer: React.FC = () => {
  const {
    isChatDrawerOpen,
    setIsChatDrawerOpen,
    selectedZone,
    setSelectedZone,
    addToCart,
    setIsBookingModalOpen,
  } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatDrawerOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatDrawerOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          userLocation: selectedZone ? { name: selectedZone.name, pincode: selectedZone.pincode } : null,
        }),
      });

      const data = await response.json();

      let groundingLinks: Array<{ title: string; uri: string }> = [];
      if (data.groundingChunks && Array.isArray(data.groundingChunks)) {
        groundingLinks = data.groundingChunks
          .filter((c: any) => c.web && c.web.uri)
          .map((c: any) => ({
            title: c.web.title || 'Source reference',
            uri: c.web.uri,
          }));
      }

      // Check if location was detected to update map
      if (data.detectedLocation) {
        const found = MMR_ZONES.find((z) => z.name === data.detectedLocation.name);
        if (found) {
          setSelectedZone(found);
        }
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply || data.fallbackReply || 'I am ready to assist with your furniture assembly needs.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundingLinks: groundingLinks.length > 0 ? groundingLinks : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content:
          'Furniture Fix serves Mumbai, Thane, and Navi Mumbai with on-site furniture assembly. You can select your item from our Rate Card or submit a booking below with zero advance payment!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyQuote = (serviceId: string) => {
    const item = MASTER_RATE_CARD.find((i) => i.id === serviceId);
    if (item) {
      addToCart(item);
      setIsBookingModalOpen(true);
      setIsChatDrawerOpen(false);
    }
  };

  if (!isChatDrawerOpen) {
    return (
      <button
        onClick={() => setIsChatDrawerOpen(true)}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 bg-slate-900 hover:bg-slate-800 text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl border border-slate-700 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
        aria-label="Open Map & Rate Assistant"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
        <MessageSquare className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform" />
        <span className="font-bold text-xs hidden sm:inline">Ask Map & Rate AI</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <span>Location & Rate Assistant</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h3>
            <span className="text-[11px] text-slate-400 block">
              Grounded with Google Search & MMR Map Data
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsChatDrawerOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-slate-900 text-teal-400 flex items-center justify-center shrink-0 text-xs font-bold border border-slate-800 mt-0.5">
                FF
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-slate-900 text-white rounded-br-xs'
                  : 'bg-white text-slate-800 border border-slate-200 shadow-xs rounded-bl-xs'
              }`}
            >
              <div className="whitespace-pre-line">{msg.content}</div>

              {/* Grounding Citations */}
              {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Verified Grounding Sources:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.groundingLinks.slice(0, 3).map((link, idx) => (
                      <a
                        key={idx}
                        href={link.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-teal-700 hover:text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 hover:underline"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span className="truncate max-w-[150px]">{link.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <span
                className={`text-[9px] mt-1.5 block text-right ${
                  msg.role === 'user' ? 'text-slate-400' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 pl-9">
            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
            <span>Consulting Mumbai map & rate rules...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions (Chips) */}
      <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
          Try:
        </span>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your area, item cost, or slots..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
          <span>Official 2026 Rate Card rules enforced</span>
          <button
            onClick={() => setIsBookingModalOpen(true)}
            className="text-amber-600 hover:underline font-semibold"
          >
            Direct Booking Form →
          </button>
        </div>
      </div>
    </div>
  );
};
