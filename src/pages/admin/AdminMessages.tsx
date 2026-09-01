import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { MessageSquare, Eye, Flag } from "lucide-react";

export default function AdminMessages() {
  const allConversations = useQuery(api.messages.getConversations);
  const allUsers = useQuery(api.users.getAllUsers);

  const conversations = allConversations ?? [];
  const users = allUsers ?? [];
  const getUser = (id: string) => users.find((u: any) => u._id === id);

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
          </div>
          <div className="divide-y divide-white/[0.03]">
            {conversations.map((c: any) => {
              const buyer = getUser(c.buyerId);
              const seller = getUser(c.sellerId);
              const buyerName = buyer?.name || buyer?.email || "Buyer";
              const sellerName = seller?.name || seller?.businessName || seller?.email || "Seller";
              return (
                <div key={c._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.01] transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-full bg-nx-violet/15 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-nx-violet">{buyerName[0]?.toUpperCase()}</span>
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
                  <button className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
