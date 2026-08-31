import { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { 
  Bot, Send, X, MessageSquare, Sparkles, ChevronDown, 
  Loader2, Shield, HelpCircle, CreditCard, Truck, AlertTriangle 
} from "lucide-react";

const QUICK_ACTIONS = [
  { label: "How does escrow work?", icon: Shield },
  { label: "How do I pay?", icon: CreditCard },
  { label: "Track my delivery", icon: Truck },
  { label: "Report a problem", icon: AlertTriangle },
  { label: "Get help", icon: HelpCircle },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIChat({ panel }: { panel?: "buyer" | "seller" | "admin" }) {
  const { user } = useAuth();
  const chat = useAction(api.ai.chat);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi! I'm NexoraAI, your smart assistant for Nexora Market. I can help you with:
      
• Escrow & payments
• Order tracking
• Seller verification
• Disputes & refunds
• Platform features

What would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastSent, setLastSent] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (content: string) => {
    const now = Date.now();
    if (!content.trim() || isLoading || now - lastSent < 3000) return;

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

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen
            ? "bg-white/10 border border-white/20 rotate-0"
            : "bg-gradient-to-br from-nx-cyan to-nx-violet hover:scale-110"
        }`}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <div className="relative">
            <Bot className="w-6 h-6 text-white" />
            <Sparkles className="w-3 h-3 text-nx-gold absolute -top-1 -right-1" />
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[520px] max-h-[calc(100vh-8rem)] rounded-2xl bg-[#0A0A14] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-nx-cyan/10 to-nx-violet/10 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nx-cyan to-nx-violet flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">NexoraAI</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-white/40">Always available</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <ChevronDown className="w-4 h-4 text-white/40" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
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
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[9px] mt-1.5 ${msg.role === "user" ? "text-nx-cyan/30 text-right" : "text-white/15"}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.04] border border-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-nx-cyan animate-spin" />
                    <span className="text-[12px] text-white/40">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.label)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] text-white/50 hover:text-white/70 hover:bg-white/[0.06] hover:border-white/10 transition-all"
                  >
                    <action.icon className="w-3 h-3" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask NexoraAI anything..."
                disabled={isLoading}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-nx-cyan/30 disabled:opacity-40 transition-colors"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-nx-cyan/20 flex items-center justify-center hover:bg-nx-cyan/30 transition-colors disabled:opacity-30 disabled:hover:bg-nx-cyan/20"
              >
                <Send className="w-4 h-4 text-nx-cyan" />
              </button>
            </div>
            <p className="text-[9px] text-white/15 mt-2 text-center">
              NexoraAI may produce inaccurate information. Verify critical details.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
