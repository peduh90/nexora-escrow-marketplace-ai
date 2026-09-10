import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { MessageSquare, Eye, ChevronUp } from "lucide-react";
import { useState } from "react";

export default function AdminMessages() {
  // REAL platform-wide conversation feed. (Previously this used the
  // session-scoped messages.getConversations, which only ever returns the
  // ADMIN'S OWN chats — so the page was permanently empty for everyone else.)
  const allConversations = useQuery(api.admin.getAllConversations);
  const allUsers = useQuery(api.admin.getAllUsers);
  const allMessages = useQuery(api.admin.getAllMessages);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const conversations = allConversations ?? [];
  const users = allUsers ?? [];
  const getUser = (id: string) => users.find((u: any) => u._id === id);
  const flagged = conversations.filter((c: any) => c.flagged);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Message Monitoring</h1>
        <p className="text-sm text-white/40 mt-1">Monitor buyer-seller communications for disputes and fraud</p>
      </div>
      {conversations.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <MessageSquare className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No conversations yet</p>
          <p className="text-[11px] text-white/15 mt-1">Buyer-seller messages will appear here</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12]">
          <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-nx-cyan" />
            <h3 className="text-sm font-semibold text-white">Recent Conversations</h3>
            <span className="ml-auto text-[10px] text-white/30">{conversations.length} total</span>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {conversations.map((c: any) => {
              const buyer = getUser(c.buyerId);
              const seller = getUser(c.sellerId);
              const buyerName = buyer?.name || buyer?.email || "Buyer";
              const sellerName = seller?.name || seller?.businessName || seller?.email || "Seller";
              const isExpanded = expandedId === c._id;
              const thread = (allMessages ?? [])
                .filter((m: any) =>
                  (m.senderId === c.buyerId && m.receiverId === c.sellerId) ||
                  (m.senderId === c.sellerId && m.receiverId === c.buyerId)
                )
                .sort((a: any, b: any) => a.createdAt - b.createdAt);
              return (
                <div key={c._id} className="px-5 py-3.5 hover:bg-white/[0.01] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-nx-violet/15 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-nx-violet">{buyerName[0]?.toUpperCase() || "?"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs text-white/60">
                          <span className="text-white/70">{buyerName}</span> ↔ <span className="text-white/70">{sellerName}</span>
                        </p>
                      </div>
                      <p className="text-[11px] text-white/30 truncate">{c.lastMessage}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {c.unreadBuyer > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-nx-violet/20 text-nx-violet font-medium">{c.unreadBuyer}</span>}
                    </div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : c._id)}
                      className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors"
                      title={isExpanded ? "Hide conversation" : "View conversation"}
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 ml-12 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <p className="text-[10px] uppercase tracking-wider text-white/25 mb-2">
                        Message thread ({thread.length} {thread.length === 1 ? "message" : "messages"})
                      </p>
                      {thread.length === 0 ? (
                        <p className="text-xs text-white/25">No individual messages recorded yet — only the conversation summary.</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {thread.map((m: any) => (
                            <div key={m._id} className="flex items-start gap-2">
                              <span className={`text-[10px] font-semibold shrink-0 w-14 ${m.senderId === c.buyerId ? "text-nx-cyan" : "text-nx-violet"}`}>
                                {m.senderId === c.buyerId ? "Buyer" : "Seller"}
                              </span>
                              <p className="text-[11px] text-white/60 flex-1">{m.content}</p>
                              <span className="text-[9px] text-white/15 shrink-0">{new Date(m.createdAt).toLocaleTimeString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
