import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Send, Paperclip, Image, Shield, Star, MoreVertical, Phone, Video, Info, MapPin, Clock, CheckCheck, MessageCircle } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { getWhatsAppSupportUrl, getWhatsAppSellerUrl, openWhatsApp, WHATSAPP_CONFIG } from "@/lib/whatsapp";

export default function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [message, setMessage] = useState("");
  const [showProductCard, setShowProductCard] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  const conversations = useQuery(api.messages.getConversations);

  const activeConvo = conversations?.find((c: any) => c._id === conversationId);

  const messages = useQuery(
    api.messages.getMessages,
    conversationId ? { conversationId: conversationId as any } : ("skip" as any)
  );

  const product = useQuery(
    api.listings.getListing,
    activeConvo?.listingId ? { listingId: activeConvo.listingId } : ("skip" as any)
  );

  // otherUserName comes enriched from getConversations
  const otherUserName = activeConvo?.otherUserName || "User";
  const otherUserImage = activeConvo?.otherUserImage;
  const otherUserVerified = false;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  useEffect(() => {
    if (conversationId && user) {
      markReadMutation({ conversationId: conversationId as any }).catch(() => {});
    }
  }, [conversationId, user]);

  const sendMessageMutation = useMutation(api.messages.sendMessage);
  const markReadMutation = useMutation(api.messages.markRead);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || !conversationId || !user || sending) return;
    const content = message.trim();
    setMessage("");
    setSending(true);
    try {
      await sendMessageMutation({
        conversationId: conversationId as any,
        content,
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessage(content);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000 && d.getDate() === now.getDate()) return "Today";
    if (diff < 172800000) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-nx-bg flex flex-col">
      {/* Header */}
      <div className="bg-nx-card border-b border-nx-border px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-full bg-nx-violet/20 border border-nx-violet/30 flex items-center justify-center text-nx-violet font-bold text-sm">
              {otherUserName?.charAt(0) || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm">
                  {otherUserName || "User"}
                </span>
                {otherUserVerified && (
                  <span className="px-1.5 py-0.5 rounded bg-nx-emerald/10 text-nx-emerald text-[10px] font-semibold border border-nx-emerald/20">
                    ✓ Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                <span className="w-1.5 h-1.5 rounded-full bg-nx-emerald animate-pulse" />
                Online
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openWhatsApp(getWhatsAppSupportUrl(`I need help with my conversation about: ${activeConvo?.listingTitle || 'general inquiry'}`))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
              title="Contact Support via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Support</span>
            </button>
            <button className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-nx-blue transition-colors">
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Conversation List */}
        <div className="hidden lg:flex flex-col w-80 border-r border-nx-border bg-nx-card/50">
          <div className="p-4 border-b border-nx-border">
            <h2 className="text-lg font-bold text-white mb-3">Messages</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full bg-nx-bg border border-nx-border rounded-lg pl-4 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-nx-violet/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {(!conversations || conversations.length === 0) ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-nx-violet/10 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-nx-violet" />
                </div>
                <p className="text-white/40 text-sm">No conversations yet</p>
                <p className="text-white/20 text-xs mt-1">
                  Start chatting with a seller from a product page
                </p>
              </div>
            ) : (
              conversations.map((convo: any) => {
                const isActive = convo._id === conversationId;
                return (
                  <button
                    key={convo._id}
                    onClick={() => navigate(`/chat/${convo._id}`)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-white/[0.02] transition-colors border-b border-nx-border/30 ${
                      isActive ? "bg-nx-violet/[0.05] border-l-2 border-l-nx-violet" : ""
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full bg-nx-violet/15 flex items-center justify-center text-nx-violet font-bold text-sm shrink-0">
                      {convo.otherUserName?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-sm truncate">
                          {convo.otherUserName || "User"}
                        </span>
                        <span className="text-[10px] text-white/30 ml-2">
                          {convo.lastMessageTime ? formatTime(convo.lastMessageTime) : ""}
                        </span>
                      </div>
                      {convo.productTitle && (
                        <p className="text-[10px] text-nx-violet/60 truncate mt-0.5">
                          📦 {convo.productTitle}
                        </p>
                      )}
                      <p className="text-xs text-white/40 truncate mt-0.5">
                        {convo.lastMessage || "No messages yet"}
                      </p>
                    </div>
                    {convo.unreadCount > 0 && (
                      <div className="w-5 h-5 rounded-full bg-nx-violet flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-white">{convo.unreadCount}</span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-nx-bg/50">
          {!conversationId ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-nx-violet/10 flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-12 h-12 text-nx-violet/40" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Nexora Secure Chat
                </h3>
                <p className="text-white/40 text-sm max-w-md">
                  All conversations are encrypted and monitored for your safety.
                  Never share sensitive information outside the platform.
                </p>
                <div className="mt-6 flex items-center justify-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-nx-emerald">🔒</div>
                    <p className="text-[11px] text-white/40 mt-1">Encrypted</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-nx-blue">🛡️</div>
                    <p className="text-[11px] text-white/40 mt-1">Monitored</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-nx-violet">✓</div>
                    <p className="text-[11px] text-white/40 mt-1">Verified</p>
                  </div>
                </div>

                {/* WhatsApp Contact Support */}
                <div className="mt-8 space-y-3">
                  <p className="text-white/30 text-xs mb-3">Need help? Contact us directly:</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => openWhatsApp(getWhatsAppSupportUrl())}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-all hover:scale-105"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp Support
                    </button>
                    <a
                      href={`tel:${WHATSAPP_CONFIG.phoneNumber}`}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-nx-blue/10 border border-nx-blue/20 text-nx-blue text-sm font-semibold hover:bg-nx-blue/20 transition-all hover:scale-105"
                    >
                      <Phone className="w-4 h-4" />
                      Call Us
                    </a>
                  </div>
                  <p className="text-[10px] text-white/15 mt-2">
                    📞 {WHATSAPP_CONFIG.displayNumber} • Available 24/7
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Product Card in Chat */}
              {showProductCard && product && (
                <div className="px-4 pt-3">
                  <div className="bg-nx-card border border-nx-border rounded-xl p-3 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg bg-nx-border overflow-hidden shrink-0">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20 text-lg">
                          📷
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">
                        {product.title}
                      </p>
                      <p className="text-nx-emerald font-bold text-sm mt-0.5">
                        KSh {product.price?.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/product/${product._id}`)}
                      className="px-3 py-1.5 rounded-lg bg-nx-violet/10 text-nx-violet text-xs font-semibold hover:bg-nx-violet/20 transition-colors border border-nx-violet/20"
                    >
                      View
                    </button>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages?.map((msg: any) => {
                  const isMe = msg.senderId === user?._id;
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                          isMe
                            ? "bg-nx-violet text-white rounded-br-md"
                            : "bg-nx-card border border-nx-border text-white rounded-bl-md"
                        }`}
                      >
                        {msg.type === "image" && msg.imageUrl && (
                          <div className="mb-2 rounded-lg overflow-hidden">
                            <img
                              src={msg.imageUrl}
                              alt="Shared"
                              className="w-full max-w-xs"
                            />
                          </div>
                        )}
                        {msg.type === "offer" && (
                          <div className="mb-2 p-2 rounded-lg bg-nx-emerald/10 border border-nx-emerald/20">
                            <div className="flex items-center gap-1 text-nx-emerald text-xs font-semibold">
                              💰 Offer: KSh {msg.offerAmount?.toLocaleString()}
                            </div>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <div
                          className={`flex items-center gap-1 mt-1 ${
                            isMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span className="text-[10px] opacity-50">
                            {formatTime(msg._creationTime)}
                          </span>
                          {isMe && (
                            <CheckCheck className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Action Buttons */}
              <div className="px-4 py-2 border-t border-nx-border/30">
                <div className="flex items-center gap-2 mb-2">
                  {product && (
                    <>
                      <button
                        onClick={() => navigate(`/product/${product._id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nx-emerald/10 text-nx-emerald text-xs font-semibold hover:bg-nx-emerald/20 transition-colors border border-nx-emerald/20"
                      >
                        🛒 Buy Now
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nx-blue/10 text-nx-blue text-xs font-semibold hover:bg-nx-blue/20 transition-colors border border-nx-blue/20">
                        💰 Make Offer
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Message Input */}
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 bg-nx-card border border-nx-border rounded-xl p-2">
                  <button className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-colors">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.03] transition-colors">
                    <Image className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none px-2"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim()}
                    className="p-2.5 rounded-lg bg-nx-emerald text-white hover:bg-nx-emerald/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[10px] text-white/20 mt-2 text-center">
                  🔒 Messages are encrypted. Never share payment info outside the platform.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
