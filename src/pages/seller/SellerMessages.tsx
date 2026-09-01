import SellerLayout from "./SellerLayout";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Send, Search, CheckCheck, Check, Package, Star, Verified, Loader2, MessageSquare,
} from "lucide-react";

export default function SellerMessages() {
  const conversations = useQuery(api.messages.getConversations);
  const sendMessage = useMutation(api.messages.sendMessage);
  const markRead = useMutation(api.messages.markRead);
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConvo = conversations?.find((c) => c._id === selectedConvoId);

  const filtered = (conversations ?? []).filter(
    (c) =>
      c.otherUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.listingTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConvoId || sending) return;
    setSending(true);
    try {
      await sendMessage({ conversationId: selectedConvoId as any, content: newMessage.trim() });
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send:", err);
    } finally {
      setSending(false);
    }
  };

  const handleSelectConvo = async (convoId: string) => {
    setSelectedConvoId(convoId);
    try {
      await markRead({ conversationId: convoId as any });
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  if (conversations === undefined) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-nx-violet animate-spin" />
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="flex h-[calc(100vh-8rem)] rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
        {/* Conversations list */}
        <div className={`w-full sm:w-[340px] border-r border-white/5 flex flex-col ${selectedConvoId ? "hidden sm:flex" : "flex"}`}>
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/30">No conversations yet</p>
                <p className="text-[11px] text-white/15 mt-1">When buyers contact you about your products, conversations will appear here.</p>
              </div>
            ) : (
              filtered.map((convo) => {
                const isBuyer = convo.isBuyer;
                const unread = isBuyer ? 0 : convo.unreadSeller;
                return (
                  <button key={convo._id} onClick={() => handleSelectConvo(convo._id)}
                    className={`w-full text-left p-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${
                      selectedConvoId === convo._id ? "bg-nx-violet/5 border-l-2 border-l-nx-violet" : ""
                    }`}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-nx-violet/10 flex items-center justify-center shrink-0 text-nx-violet text-sm font-bold">
                        {convo.otherUserName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-white truncate">{convo.otherUserName}</span>
                            <Verified className="w-3 h-3 text-nx-cyan shrink-0" />
                          </div>
                        </div>
                        <p className="text-[11px] text-nx-violet/60 truncate">{convo.listingTitle}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-white/30 truncate pr-2">{convo.lastMessage}</p>
                          {unread > 0 && (
                            <span className="w-5 h-5 rounded-full bg-nx-violet flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat view */}
        {activeConvo ? (
          <div className={`flex-1 flex flex-col ${selectedConvoId ? "flex" : "hidden sm:flex"}`}>
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
              <button onClick={() => setSelectedConvoId(null)} className="sm:hidden p-1 text-white/40">←</button>
              <div className="w-9 h-9 rounded-full bg-nx-violet/10 flex items-center justify-center text-nx-violet text-sm font-bold">
                {activeConvo.otherUserName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-white">{activeConvo.otherUserName}</span>
                  <Verified className="w-3 h-3 text-nx-cyan" />
                </div>
                <p className="text-[11px] text-white/30 truncate">Re: {activeConvo.listingTitle} • KES {activeConvo.listingPrice.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex justify-center">
                <div className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5">
                  <p className="text-[11px] text-white/30">
                    Conversation about <span className="text-nx-violet/60">{activeConvo.listingTitle}</span> • KES {activeConvo.listingPrice.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-white/15">Messages will appear here once you start chatting</p>
              </div>
            </div>

            <div className="p-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/30" />
                <button onClick={handleSend} disabled={!newMessage.trim() || sending}
                  className="p-2.5 rounded-lg bg-nx-violet text-white hover:bg-nx-violet/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
