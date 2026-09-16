import { useState, useRef, useEffect, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  Bot, Send, X, Sparkles, Loader2, Mic, MicOff,
  Shield, HelpCircle, CreditCard, Truck, AlertTriangle,
  Search, ShoppingCart, Package, BarChart3, Settings,
  MessageSquare, TrendingUp, RotateCcw, Volume2, VolumeX,
} from "lucide-react";

// Role-specific quick actions
const BUYER_ACTIONS = [
  { label: "Find Products", icon: Search, prompt: "Help me find products on Nexora" },
  { label: "Track Order", icon: Truck, prompt: "Where is my order? Show my recent orders" },
  { label: "How Escrow Works", icon: Shield, prompt: "How does escrow work?" },
  { label: "Pay with M-Pesa", icon: CreditCard, prompt: "How do I pay with M-Pesa?" },
  { label: "Find Deals", icon: TrendingUp, prompt: "Show me the best deals on Nexora right now" },
  { label: "Report Problem", icon: AlertTriangle, prompt: "I have a problem with my order" },
];

const SELLER_ACTIONS = [
  { label: "Create Listing", icon: Package, prompt: "Help me create a new product listing" },
  { label: "Check Sales", icon: BarChart3, prompt: "How are my sales performing?" },
  { label: "Manage Orders", icon: ShoppingCart, prompt: "Show my pending orders" },
  { label: "Price Advice", icon: TrendingUp, prompt: "How should I price my products?" },
  { label: "Improve Listings", icon: Sparkles, prompt: "How can I improve my product listings?" },
  { label: "Withdraw Earnings", icon: CreditCard, prompt: "How do I withdraw my earnings?" },
];

const ADMIN_ACTIONS = [
  { label: "Platform Report", icon: BarChart3, prompt: "Give me a platform performance summary" },
  { label: "Risk Alerts", icon: Shield, prompt: "Show any suspicious activity or fraud alerts" },
  { label: "Disputes", icon: AlertTriangle, prompt: "Show unresolved disputes" },
  { label: "Seller Analytics", icon: TrendingUp, prompt: "Which sellers are performing best?" },
  { label: "Revenue", icon: CreditCard, prompt: "Show revenue and payment summary" },
  { label: "Settings", icon: Settings, prompt: "Show platform settings and configuration" },
];

const VISITOR_ACTIONS = [
  { label: "How Escrow Works", icon: Shield, prompt: "How does escrow work?" },
  { label: "Start Buying", icon: ShoppingCart, prompt: "How do I start buying on Nexora?" },
  { label: "Start Selling", icon: Package, prompt: "How do I start selling on Nexora?" },
  { label: "Payment Methods", icon: CreditCard, prompt: "What payment methods are available?" },
  { label: "Delivery Info", icon: Truck, prompt: "How does delivery work?" },
  { label: "Get Help", icon: HelpCircle, prompt: "What can you help me with?" },
];

// Services & Transport panel — providers and customers (#53/#54)
const SERVICES_ACTIONS = [
  { label: "Offer a Service", icon: Settings, prompt: "How do I register as a service provider on Nexora?" },
  { label: "Book a Fundi", icon: Search, prompt: "How do I find and book a plumber, electrician or fundi near me?" },
  { label: "Transport / Boda", icon: Truck, prompt: "How do boda, matatu and delivery trips work on Nexora?" },
  { label: "Escrow for Jobs", icon: Shield, prompt: "How is my service payment protected by escrow?" },
  { label: "Do I Need Documents?", icon: HelpCircle, prompt: "Do I need documents to register as a service provider?" },
  { label: "Bei ni ngapi?", icon: CreditCard, prompt: "Ada za huduma ni ngapi? Service fees ni ngapi kwa muuzaji wa huduma?" },
];

// Marketplace / community / general public pages
const MARKET_ACTIONS = [
  { label: "Find Products", icon: Search, prompt: "Help me find products on Nexora" },
  { label: "Post a Request", icon: MessageSquare, prompt: "How do I post what I need on the community board?" },
  { label: "How Escrow Works", icon: Shield, prompt: "How does escrow work?" },
  { label: "Wholesale / Bulk", icon: Package, prompt: "How does wholesale and bulk buying work on Nexora?" },
  { label: "Pay with M-Pesa", icon: CreditCard, prompt: "How do I pay with M-Pesa?" },
  { label: "Nisaidie", icon: HelpCircle, prompt: "Nisaidie — nataka kuanza kununua kwenye Nexora, nianzie hatua kwa hatua." },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type ChatPanel = "buyer" | "seller" | "admin" | "freelance" | "services" | "market" | "general" | "ai_tasker";

export default function AIChat({ panel, stacked }: { panel?: ChatPanel; stacked?: boolean }) {
  const { user } = useAuth();
  const chat = useAction(api.ai.chat);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastSent, setLastSent] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  // Voice input language (#54 voice-first commerce): rotate EN → SW → mixed.
  const [voiceLang, setVoiceLang] = useState<"en-KE" | "sw-KE">("en-KE");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Determine quick actions based on panel/role — every surface gets the
  // assistant that fits it (services, marketplace, dashboards…).
  const quickActions = panel === "seller" ? SELLER_ACTIONS
    : panel === "admin" ? ADMIN_ACTIONS
    : panel === "services" ? SERVICES_ACTIONS
    : panel === "market" ? MARKET_ACTIONS
    : user?.role === "seller" ? SELLER_ACTIONS
    : user?.role === "admin" ? ADMIN_ACTIONS
    : user?.role === "buyer" || user?.role === "creator" ? BUYER_ACTIONS
    : VISITOR_ACTIONS;

  // Initialize welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome = panel === "seller"
        ? "Hey! 👋 I'm your NexoraAI selling copilot. I can help you create listings, analyze pricing, manage orders, and grow your store.\n\nUnaweza kuuliza kwa Kiswahili pia! What do you need help with?"
        : panel === "admin"
        ? "🛡️ NexoraAI Command Center active. I can help you monitor the platform, resolve disputes, analyze performance, and manage operations.\n\nWhat would you like to review?"
        : panel === "services"
        ? "Hey! 👋 Welcome to Nexora Services & Transport. I can help you register as a provider, book a fundi, arrange boda/delivery, and keep every job escrow-protected.\n\nKaribu! Uliza kwa Kiswahili au English — what do you need?"
        : panel === "market"
        ? "Hey! 👋 I'm NexoraAI — I can help you find products, post what you need, buy in bulk, and pay safely with escrow.\n\nKaribu! Uliza kwa Kiswahili au English — what are you looking for?"
        : "Hey! 👋 I'm NexoraAI — your smart marketplace assistant. I can help you find products, compare prices, track orders, and more.\n\nKaribu! Unaweza kuuliza kwa Kiswahili, Sheng au English.\n\nWhat are you looking for?";
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: welcome,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, messages.length, panel]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  // Scroll detection for "scroll to bottom" button
  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setShowScrollBtn(!atBottom);
  }, []);

  // (Re)build the recognizer whenever the chosen voice language changes.
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }
    setSpeechSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    // sw-KE captures Kiswahili; en-KE captures Kenyan English.
    // Sheng and code-switched speech is handled by whichever mode matches better.
    recognition.lang = voiceLang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
      if (event.results[event.resultIndex].isFinal) {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === "not-allowed") {
        setVoiceError("Microphone access denied. Please allow microphone in your browser settings.");
      } else if (event.error === "no-speech") {
        setVoiceError("No speech detected. Try again.");
      } else {
        setVoiceError("Voice recognition error. Please try again.");
      }
      setTimeout(() => setVoiceError(""), 3000);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [voiceLang]);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setVoiceError("");
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        // Already started
      }
    }
  };

  const sendMessage = async (content: string) => {
    const now = Date.now();
    if (!content.trim() || isLoading || now - lastSent < 2000) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setLastSent(now);

    // Stop voice if listening
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    try {
      const response = await chat({
        messages: [
          ...messages.filter((m) => m.id !== "welcome").map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
          { role: "user", content: content.trim() },
        ],
        userRole: user?.role,
        context: panel ? `User is in the ${panel} panel` : undefined,
      });

      setMessages((prev) => [...prev, {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <>
      {/* Floating Chat Button - shifts up when WhatsApp button is present */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          stacked ? "bottom-40 max-md:bottom-44" : (panel === "buyer" || panel === "seller") ? "bottom-22" : "bottom-6"
        } ${
          isOpen
            ? "bg-white/10 border border-white/20"
            : "bg-gradient-to-br from-nx-cyan to-nx-violet hover:scale-110 hover:shadow-[0_0_30px_rgba(0,180,216,0.3)]"
        }`}
        aria-label="AI Assistant"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <div className="relative">
            <Bot className="w-6 h-6 text-white" />
            <Sparkles className="w-3 h-3 text-nx-gold absolute -top-1 -right-1 animate-pulse" />
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] h-[560px] max-h-[calc(100vh-8rem)] rounded-2xl bg-[#0A0A14] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden ${
          stacked ? "bottom-[13.5rem] max-md:bottom-[15rem]" : (panel === "buyer" || panel === "seller") ? "bottom-[12rem]" : "bottom-24"
        }`}>
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-nx-cyan/10 to-nx-violet/10 border-b border-white/5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nx-cyan to-nx-violet flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">NexoraAI</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-white/40">Online • AI Powered</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Voice language toggle (#54): English ⇄ Kiswahili */}
                {speechSupported && (
                  <button
                    onClick={() => setVoiceLang((l) => (l === "en-KE" ? "sw-KE" : "en-KE"))}
                    className="px-1.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/10 text-[9px] font-bold tracking-wide transition-colors"
                    title="Voice input language: English ⇄ Kiswahili"
                  >
                    {voiceLang === "en-KE" ? "🇰🇪 SW" : "🇬🇧 EN"}
                  </button>
                )}
                <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" title="Clear chat">
                  <RotateCcw className="w-4 h-4 text-white/30 hover:text-white/60" />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <X className="w-4 h-4 text-white/30 hover:text-white/60" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
          >
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-nx-cyan/15 text-white border border-nx-cyan/10 rounded-br-md"
                      : "bg-white/[0.04] text-white/80 border border-white/5 rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1 mb-1.5">
                      <Bot className="w-3 h-3 text-nx-cyan" />
                      <span className="text-[10px] text-nx-cyan font-medium">NexoraAI</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                  <p className={`text-[9px] mt-1.5 ${msg.role === "user" ? "text-nx-cyan/30 text-right" : "text-white/15"}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.04] border border-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-nx-cyan/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-nx-cyan/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-nx-cyan/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-[11px] text-white/30">NexoraAI is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom */}
          {showScrollBtn && (
            <button
              onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="absolute bottom-28 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
            >
              <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          )}

          {/* Quick Actions (show when few messages) */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 shrink-0">
              <div className="flex flex-wrap gap-1.5">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] text-white/50 hover:text-white/80 hover:bg-white/[0.06] hover:border-white/10 transition-all"
                  >
                    <action.icon className="w-3 h-3" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Voice error */}
          {voiceError && (
            <div className="px-4 py-1.5 text-[11px] text-amber-400/80 bg-amber-400/5 border-t border-amber-400/10 shrink-0">
              {voiceError}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-white/5 bg-white/[0.01] shrink-0">
            <div className="flex items-center gap-2">
              {/* Voice button */}
              {speechSupported && (
                <button
                  onClick={toggleVoice}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                    isListening
                      ? "bg-red-500/20 border border-red-500/30 animate-pulse"
                      : "bg-white/[0.03] border border-white/5 hover:bg-white/[0.06]"
                  }`}
                  title={isListening ? "Stop listening" : "Voice input"}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4 text-red-400" />
                  ) : (
                    <Mic className="w-4 h-4 text-white/40" />
                  )}
                </button>
              )}

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : "Ask NexoraAI anything... (Kiswahili/Sheng/English)"}
                disabled={isLoading}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-nx-cyan/30 disabled:opacity-40 transition-colors"
              />

              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-nx-cyan/20 flex items-center justify-center hover:bg-nx-cyan/30 transition-colors disabled:opacity-30 shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 text-nx-cyan animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-nx-cyan" />
                )}
              </button>
            </div>
            <p className="text-[9px] text-white/15 mt-2 text-center">
              NexoraAI may make mistakes. Verify important details. 🇰🇪 · Uliza kwa Kiswahili, Sheng au English
            </p>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Simple markdown-to-HTML formatter for AI responses
 */
function formatMessage(text: string): string {
  return text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-white/5 text-nx-cyan text-[12px]">$1</code>')
    // Numbered lists
    .replace(/^(\d+)\.\s+(.+)/gm, '<div class="flex gap-2 my-0.5"><span class="text-nx-cyan/60 shrink-0">$1.</span><span>$2</span></div>')
    // Bullet lists
    .replace(/^[•\-]\s+(.+)/gm, '<div class="flex gap-2 my-0.5"><span class="text-nx-cyan/40 shrink-0">•</span><span>$1</span></div>')
    // Headers
    .replace(/^### (.*$)/gm, '<div class="text-white font-bold text-[14px] mt-2 mb-1">$1</div>')
    .replace(/^## (.*$)/gm, '<div class="text-white font-bold text-[15px] mt-3 mb-1">$1</div>')
    // Horizontal rule
    .replace(/^---$/gm, '<div class="border-t border-white/5 my-2" />');
}
