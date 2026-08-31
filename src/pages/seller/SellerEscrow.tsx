import { useState } from "react";
import SellerLayout from "./SellerLayout";
import {
  Shield, Clock, Truck, CheckCircle2, AlertTriangle, Package, ArrowRight,
  Eye, Filter,
} from "lucide-react";

const escrowTransactions = [
  { id: "NX-20485", product: "HP EliteBook 840 G3", buyer: "John Kamau", amount: 22000, status: "in_transit", paymentDate: "Jan 28", delivery: "In Transit", expectedRelease: "After buyer confirmation", timeline: ["Payment received", "Funds secured", "Seller preparing", "Collected by Nexora", "In transit"], buyerVerified: true },
  { id: "NX-20482", product: "iPhone 15 Pro Max", buyer: "Sarah Wanjiku", amount: 142000, status: "preparing", paymentDate: "Jan 27", delivery: "Awaiting Collection", expectedRelease: "After delivery + confirmation", timeline: ["Payment received", "Funds secured", "Preparing product"], buyerVerified: true },
  { id: "NX-20479", product: "Samsung Galaxy S24", buyer: "Peter Otieno", amount: 165000, status: "awaiting", paymentDate: "Jan 26", delivery: "Delivered", expectedRelease: "Awaiting buyer confirmation", timeline: ["Payment received", "Funds secured", "Seller preparing", "Collected by Nexora", "In transit", "Delivered"], buyerVerified: true },
  { id: "NX-20475", product: "Nike Air Max 90", buyer: "Grace Muthoni", amount: 12500, status: "released", paymentDate: "Jan 25", delivery: "Confirmed", expectedRelease: "Released", timeline: ["Payment received", "Funds secured", "Seller preparing", "Collected by Nexora", "In transit", "Delivered", "Buyer confirmed", "Funds released"], buyerVerified: true },
  { id: "NX-20470", product: "Sony WH-1000XM5", buyer: "David Kimani", amount: 38000, status: "disputed", paymentDate: "Jan 24", delivery: "Dispute", expectedRelease: "Under review", timeline: ["Payment received", "Funds secured", "Seller preparing", "Collected by Nexora", "Delivered", "Dispute opened"], buyerVerified: false },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  preparing: { label: "Preparing", color: "text-amber-400", bg: "bg-amber-400/10", icon: Package },
  in_transit: { label: "In Transit", color: "text-blue-400", bg: "bg-blue-400/10", icon: Truck },
  awaiting: { label: "Awaiting Confirmation", color: "text-nx-cyan", bg: "bg-nx-cyan/10", icon: Clock },
  released: { label: "Released", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
  disputed: { label: "Disputed", color: "text-red-400", bg: "bg-red-400/10", icon: AlertTriangle },
};

const tabs = ["All", "Active", "Awaiting Delivery", "Awaiting Confirmation", "Released", "Disputed"];

export default function SellerEscrow() {
  const [activeTab, setActiveTab] = useState("All");
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  const filtered = activeTab === "All" ? escrowTransactions :
    activeTab === "Active" ? escrowTransactions.filter(t => t.status !== "released") :
    activeTab === "Awaiting Delivery" ? escrowTransactions.filter(t => t.status === "preparing" || t.status === "in_transit") :
    activeTab === "Awaiting Confirmation" ? escrowTransactions.filter(t => t.status === "awaiting") :
    activeTab === "Released" ? escrowTransactions.filter(t => t.status === "released") :
    escrowTransactions.filter(t => t.status === "disputed");

  const totalEscrow = escrowTransactions.filter(t => t.status !== "released").reduce((s, t) => s + t.amount, 0);
  const awaitingConfirm = escrowTransactions.filter(t => t.status === "awaiting").length;
  const expectedRelease = escrowTransactions.filter(t => t.status === "awaiting").reduce((s, t) => s + t.amount, 0);

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Escrow Transactions</h1>
          <p className="text-sm text-white/40 mt-1">Track and manage all escrow-protected transactions</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-amber-400/5 border border-amber-400/10">
            <Shield className="w-5 h-5 text-amber-400 mb-2" />
            <p className="text-xl font-bold text-white">KSh {totalEscrow.toLocaleString()}</p>
            <p className="text-[11px] text-white/30 mt-1">Total in Escrow</p>
            <p className="text-[10px] text-amber-400/60 mt-2">🔒 Funds securely held</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <Package className="w-5 h-5 text-nx-violet mb-2" />
            <p className="text-xl font-bold text-white">{escrowTransactions.filter(t => t.status !== "released").length}</p>
            <p className="text-[11px] text-white/30 mt-1">Active Transactions</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <Clock className="w-5 h-5 text-nx-cyan mb-2" />
            <p className="text-xl font-bold text-white">{awaitingConfirm}</p>
            <p className="text-[11px] text-white/30 mt-1">Awaiting Confirmation</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/10">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
            <p className="text-xl font-bold text-white">KSh {expectedRelease.toLocaleString()}</p>
            <p className="text-[11px] text-white/30 mt-1">Expected Release</p>
          </div>
        </div>

        {/* Tooltip */}
        <div className="p-3 rounded-lg bg-nx-violet/5 border border-nx-violet/10 flex items-start gap-2">
          <Shield className="w-4 h-4 text-nx-violet shrink-0 mt-0.5" />
          <p className="text-xs text-white/40">
            <span className="text-nx-violet font-medium">Escrow Protection:</span> Funds in escrow are securely held until the applicable transaction conditions are satisfied. You can only withdraw funds after they are released.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeTab === tab ? "bg-nx-violet/10 text-nx-violet" : "text-white/30 hover:text-white/50"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Escrow transactions */}
        <div className="space-y-3">
          {filtered.map((tx) => {
            const st = statusConfig[tx.status];
            const isExpanded = expandedTx === tx.id;
            return (
              <div key={tx.id} className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
                <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.01]" onClick={() => setExpandedTx(isExpanded ? null : tx.id)}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${st.bg}`}>
                    <st.icon className={`w-5 h-5 ${st.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-white/40 font-mono">{tx.id}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color} ${st.bg}`}>{st.label}</span>
                      {tx.buyerVerified && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400">✓ Verified</span>}
                    </div>
                    <p className="text-sm text-white truncate">{tx.product}</p>
                    <p className="text-xs text-white/30 mt-0.5">{tx.buyer} • {tx.paymentDate}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">KSh {tx.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-white/25 mt-1">Release: {tx.expectedRelease}</p>
                  </div>
                </div>

                {/* Expanded timeline */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-4">
                    <p className="text-xs font-medium text-white/50 mb-3">Escrow Timeline</p>
                    <div className="space-y-2">
                      {tx.timeline.map((step, i) => {
                        const isLast = i === tx.timeline.length - 1;
                        const isComplete = i < tx.timeline.length - 1;
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isComplete ? "bg-emerald-400/10" : isLast ? "bg-nx-cyan/10" : "bg-white/5"}`}>
                              {isComplete ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : isLast ? <div className="w-2 h-2 rounded-full bg-nx-cyan animate-pulse" /> : <div className="w-2 h-2 rounded-full bg-white/10" />}
                            </div>
                            <span className={`text-xs ${isComplete ? "text-white/60" : isLast ? "text-white/80 font-medium" : "text-white/25"}`}>{step}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-white/30">
                      <span className="font-mono">{tx.id}</span>
                      <span>•</span>
                      <span>Escrow: KSh {tx.amount.toLocaleString()}</span>
                      <span>•</span>
                      <span>Delivery: {tx.delivery}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </SellerLayout>
  );
}
