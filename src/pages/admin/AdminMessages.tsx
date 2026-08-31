import AdminLayout from "./AdminLayout";
import { MessageSquare, Search, Eye, Flag } from "lucide-react";

const conversations = [
  { id: "CON-1201", buyer: "Edwin Kamau", seller: "TechZone Kenya", product: "HP EliteBook 840 G3", lastMessage: "Is the laptop still available?", time: "2 min ago", unread: 2, flagged: false },
  { id: "CON-1200", buyer: "Peter Mwangi", seller: "PhoneWorld", product: "Samsung Galaxy S23", lastMessage: "Can you reduce the price?", time: "15 min ago", unread: 1, flagged: false },
  { id: "CON-1199", buyer: "Lucy Wambui", seller: "CheapDeals254", product: "Phone Charger", lastMessage: "This product seems fake...", time: "1 hour ago", unread: 0, flagged: true },
  { id: "CON-1198", buyer: "Michael Chen", seller: "TechZone Kenya", product: "MacBook Pro M3", lastMessage: "When will it be delivered?", time: "2 hours ago", unread: 0, flagged: false },
];

export default function AdminMessages() {
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Message Monitoring</h1>
        <p className="text-sm text-white/40 mt-1">Monitor buyer-seller communications for disputes and fraud</p>
      </div>
      <div className="rounded-xl border border-white/5 bg-[#0A0A12]">
        <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-nx-cyan" />
          <h3 className="text-sm font-semibold text-white">Recent Conversations</h3>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {conversations.map(c => (
            <div key={c.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.01] transition-colors cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-nx-violet/15 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-nx-violet">{c.buyer[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-xs text-white/60"><span className="text-white/70">{c.buyer}</span> ↔ <span className="text-white/70">{c.seller}</span></p>
                  {c.flagged && <Flag className="w-3 h-3 text-red-400" />}
                </div>
                <p className="text-[11px] text-white/30">{c.product}: {c.lastMessage}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-white/20">{c.time}</p>
                {c.unread > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-nx-violet/20 text-nx-violet font-medium">{c.unread}</span>}
              </div>
              <button className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors"><Eye className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
