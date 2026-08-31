import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Shield, Search, Eye, CheckCircle2, XCircle, Clock, AlertTriangle, ArrowUpRight, ArrowDownLeft } from "lucide-react";

const escrowTransactions = [
  { id: "ESC-4829", order: "ORD-2901", product: "HP EliteBook 840 G3", buyer: "Edwin Kamau", seller: "TechZone Kenya", amount: "KES 22,000", status: "Funds Secured", delivery: "In Transit", created: "Apr 5, 2025", expectedRelease: "Apr 7, 2025" },
  { id: "ESC-4828", order: "ORD-2900", product: "Samsung Galaxy S23", buyer: "Peter Mwangi", seller: "PhoneWorld", amount: "KES 45,000", status: "Picked Up", delivery: "Picked Up", created: "Apr 5, 2025", expectedRelease: "Apr 6, 2025" },
  { id: "ESC-4827", order: "ORD-2899", product: "Nike Air Max 90", buyer: "Lucy Wambui", seller: "FashionHub KE", amount: "KES 8,500", status: "Released", delivery: "Delivered", created: "Apr 4, 2025", expectedRelease: "Completed" },
  { id: "ESC-4826", order: "ORD-2898", product: "MacBook Pro M3", buyer: "Michael Chen", seller: "TechZone Kenya", amount: "KES 185,000", status: "Seller Processing", delivery: "Preparing", created: "Apr 4, 2025", expectedRelease: "Apr 9, 2025" },
  { id: "ESC-4825", order: "ORD-2897", product: "Toyota Vitz 2019", buyer: "James Odhiambo", seller: "AutoHub Kenya", amount: "KES 1,450,000", status: "Disputed", delivery: "Pending", created: "Apr 3, 2025", expectedRelease: "Under Review" },
];

export default function AdminEscrow() {
  const [tab, setTab] = useState("All");

  const filtered = escrowTransactions.filter(e => {
    if (tab === "Active" && (e.status === "Released" || e.status === "Disputed")) return false;
    if (tab === "Disputed" && e.status !== "Disputed") return false;
    if (tab === "Released" && e.status !== "Released") return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Escrow Management</h1>
        <p className="text-sm text-white/40 mt-1">Monitor and manage all escrow transactions</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total in Escrow", value: "KES 48.3M", color: "#06B6D4" },
          { label: "Active Escrows", value: "1,893", color: "#8B5CF6" },
          { label: "Awaiting Confirmation", value: "542", color: "#F59E0B" },
          { label: "Disputed", value: "23", color: "#EF4444" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-4">
        {["All", "Active", "Disputed", "Released"].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${tab === t ? "bg-nx-violet/10 text-nx-violet" : "text-white/30 hover:text-white/50 bg-[#0A0A12] border border-white/5"}`}>{t}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(escrow => (
          <div key={escrow.id} className="p-5 rounded-xl border border-white/5 bg-[#0A0A12] hover:border-white/10 transition-all">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-mono text-white/50">{escrow.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${escrow.status === "Released" ? "bg-nx-emerald/10 text-nx-emerald" : escrow.status === "Disputed" ? "bg-red-400/10 text-red-400" : escrow.status === "Funds Secured" ? "bg-nx-cyan/10 text-nx-cyan" : "bg-nx-gold/10 text-nx-gold"}`}>
                    {escrow.status}
                  </span>
                </div>
                <p className="text-white/70 font-medium mb-1">{escrow.product}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/30">
                  <span>Buyer: {escrow.buyer}</span>
                  <span>Seller: {escrow.seller}</span>
                  <span>Order: {escrow.order}</span>
                </div>
              </div>

              {/* Escrow Timeline */}
              <div className="hidden lg:flex items-center gap-1 text-[9px] text-white/20">
                {["Paid", "Secured", "Processing", "Delivery", "Confirmed", "Released"].map((step, i) => {
                  const statusMap: Record<string, number> = { "Funds Secured": 1, "Seller Processing": 2, "Picked Up": 3, "In Transit": 3, "Released": 5, "Disputed": 3 };
                  const currentStep = statusMap[escrow.status] ?? 0;
                  const isActive = i <= currentStep;
                  return (
                    <div key={step} className="flex items-center gap-1">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isActive ? i === currentStep ? "bg-nx-violet text-white" : "bg-nx-emerald/20 text-nx-emerald" : "bg-white/5 text-white/10"}`}>
                        {i < currentStep ? <CheckCircle2 className="w-3 h-3" /> : i === currentStep ? <Clock className="w-3 h-3" /> : <span>{i + 1}</span>}
                      </div>
                      {i < 5 && <div className={`w-4 h-px ${isActive ? "bg-nx-violet/40" : "bg-white/5"}`} />}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{escrow.amount}</p>
                  <p className="text-[10px] text-white/25">Release: {escrow.expectedRelease}</p>
                </div>
                <button className="p-2 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
