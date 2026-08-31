import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Scale, Search, Eye, MessageSquare, AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react";

const disputes = [
  { id: "DSP-182", order: "ORD-2897", product: "Toyota Vitz 2019", buyer: "James Odhiambo", seller: "AutoHub Kenya", amount: "KES 1,450,000", reason: "Vehicle condition mismatch", status: "Under Review", aiRecommendation: "Partial Refund (15%)", evidence: 8, messages: 24, created: "Apr 3, 2025" },
  { id: "DSP-181", order: "ORD-2856", product: "iPhone 14 Pro", buyer: "Lucy Wambui", seller: "PhoneWorld", amount: "KES 65,000", reason: "Received wrong model", status: "Awaiting Evidence", aiRecommendation: "Full Refund", evidence: 3, messages: 12, created: "Apr 1, 2025" },
  { id: "DSP-180", order: "ORD-2834", product: "Laptop Charger", buyer: "Peter Mwangi", seller: "CheapDeals254", amount: "KES 2,500", reason: "Not working upon arrival", status: "Resolved", aiRecommendation: "Full Refund", evidence: 5, messages: 8, created: "Mar 28, 2025" },
  { id: "DSP-179", order: "ORD-2801", product: "Nike Shoes", buyer: "Edwin Kamau", seller: "FashionHub KE", amount: "KES 8,500", reason: "Counterfeit product", status: "Resolved", aiRecommendation: "Full Refund + Seller Warning", evidence: 12, messages: 31, created: "Mar 25, 2025" },
];

export default function AdminDisputes() {
  const [tab, setTab] = useState("All");

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dispute Resolution</h1>
        <p className="text-sm text-white/40 mt-1">AI-assisted dispute management and resolution</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Open Disputes", value: "23", color: "#EF4444" },
          { label: "Under Review", value: "12", color: "#F59E0B" },
          { label: "Resolved This Month", value: "47", color: "#10B981" },
          { label: "Avg Resolution", value: "2.3 days", color: "#8B5CF6" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-4">
        {["All", "Open", "Under Review", "Resolved"].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${tab === t ? "bg-nx-violet/10 text-nx-violet" : "text-white/30 hover:text-white/50 bg-[#0A0A12] border border-white/5"}`}>{t}</button>
        ))}
      </div>

      <div className="space-y-3">
        {disputes.map(d => (
          <div key={d.id} className="p-5 rounded-xl border border-white/5 bg-[#0A0A12] hover:border-white/10 transition-all">
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-mono text-white/50">{d.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${d.status === "Resolved" ? "bg-nx-emerald/10 text-nx-emerald" : d.status === "Under Review" ? "bg-nx-gold/10 text-nx-gold" : "bg-red-400/10 text-red-400"}`}>{d.status}</span>
                </div>
                <p className="text-white/70 font-medium mb-1">{d.product}</p>
                <p className="text-[11px] text-white/30 mb-2">Reason: {d.reason}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/25">
                  <span>Buyer: {d.buyer}</span>
                  <span>Seller: {d.seller}</span>
                  <span className="text-white/40 font-medium">{d.amount}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="p-3 rounded-lg bg-nx-violet/5 border border-nx-violet/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3 h-3 text-nx-violet" />
                    <span className="text-[10px] font-medium text-nx-violet">AI Recommendation</span>
                  </div>
                  <p className="text-xs text-white/60">{d.aiRecommendation}</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-white/25">
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{d.evidence} evidence</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{d.messages} msgs</span>
                </div>
                <div className="flex gap-1.5">
                  <button className="p-2 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                  <button className="p-2 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors"><MessageSquare className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
