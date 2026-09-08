import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import SellerLayout from "./SellerLayout";
import {
  Shield, Clock, Truck, CheckCircle2, AlertTriangle, Package,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  funded: { label: "Funds Secured", color: "text-amber-400", bg: "bg-amber-400/10", icon: Package },
  active: { label: "Processing", color: "text-nx-violet", bg: "bg-nx-violet/10", icon: Package },
  delivery: { label: "In Transit", color: "text-blue-400", bg: "bg-blue-400/10", icon: Truck },
  inspection: { label: "Awaiting Confirmation", color: "text-nx-cyan", bg: "bg-nx-cyan/10", icon: Clock },
  released: { label: "Released", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
  completed: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
  disputed: { label: "Disputed", color: "text-red-400", bg: "bg-red-400/10", icon: AlertTriangle },
  refunded: { label: "Refunded", color: "text-red-400", bg: "bg-red-400/10", icon: AlertTriangle },
  cancelled: { label: "Cancelled", color: "text-white/40", bg: "bg-white/5", icon: Package },
};

const escrowSteps = [
  "Payment received",
  "Funds secured",
  "Seller preparing",
  "Collected by Nexora",
  "In transit",
  "Delivered",
  "Buyer confirmed",
  "Funds released",
];

interface EscrowRow {
  _id: string;
  amount: number;
  status: string;
  title: string;
  transportRequired?: boolean;
  deliveryCounty?: string;
  createdAt: number;
}

export default function SellerEscrow() {
  // Scoped to this seller's escrow orders only — no admin bulk query.
  const escrows = useQuery(api.wallet.getEscrowBySeller);
  const [activeTab, setActiveTab] = useState("All");
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  const myEscrows = (escrows ?? []) as unknown as EscrowRow[];

  const filtered = activeTab === "All" ? myEscrows :
    activeTab === "Active" ? myEscrows.filter(t => t.status !== "released" && t.status !== "completed" && t.status !== "refunded" && t.status !== "cancelled") :
    activeTab === "Awaiting Confirmation" ? myEscrows.filter(t => t.status === "inspection") :
    activeTab === "Released" ? myEscrows.filter(t => t.status === "released" || t.status === "completed") :
    myEscrows.filter(t => t.status === "disputed");

  const totalEscrow = myEscrows.filter(t => t.status !== "released" && t.status !== "completed" && t.status !== "refunded" && t.status !== "cancelled").reduce((s, t) => s + (t.amount || 0), 0);
  const awaitingConfirm = myEscrows.filter(t => t.status === "inspection").length;
  const expectedRelease = myEscrows.filter(t => t.status === "inspection").reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <SellerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Escrow Transactions</h1>
          <p className="text-sm text-white/40 mt-1">Track and manage all escrow-protected transactions</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-amber-400/5 border border-amber-400/10">
            <Shield className="w-5 h-5 text-amber-400 mb-2" />
            <p className="text-xl font-bold text-white">KES {totalEscrow.toLocaleString()}</p>
            <p className="text-[11px] text-white/30 mt-1">Total in Escrow</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <Package className="w-5 h-5 text-nx-violet mb-2" />
            <p className="text-xl font-bold text-white">{myEscrows.filter(t => t.status !== "released" && t.status !== "completed" && t.status !== "refunded").length}</p>
            <p className="text-[11px] text-white/30 mt-1">Active Transactions</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <Clock className="w-5 h-5 text-nx-cyan mb-2" />
            <p className="text-xl font-bold text-white">{awaitingConfirm}</p>
            <p className="text-[11px] text-white/30 mt-1">Awaiting Confirmation</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/10">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
            <p className="text-xl font-bold text-white">KES {expectedRelease.toLocaleString()}</p>
            <p className="text-[11px] text-white/30 mt-1">Expected Release</p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-nx-violet/5 border border-nx-violet/10 flex items-start gap-2">
          <Shield className="w-4 h-4 text-nx-violet shrink-0 mt-0.5" />
          <p className="text-xs text-white/40">
            <span className="text-nx-violet font-medium">Escrow Protection:</span> Funds are securely held until transaction conditions are met. You can only withdraw after release.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {["All", "Active", "Awaiting Confirmation", "Released", "Disputed"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeTab === tab ? "bg-nx-violet/10 text-nx-violet" : "text-white/30 hover:text-white/50"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Escrow list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/30">No escrow transactions yet</p>
            <p className="text-[11px] text-white/15 mt-1">Escrow transactions will appear when buyers purchase your products</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((tx) => {
              const st = statusConfig[tx.status] || statusConfig.funded;
              const StIcon = st.icon;
              const isExpanded = expandedTx === tx._id;
              const completedIdx = escrowSteps.indexOf(
                tx.status === "released" || tx.status === "completed" ? "Funds released" :
                tx.status === "delivery" ? "In transit" :
                tx.status === "inspection" ? "Delivered" :
                tx.status === "active" ? "Seller preparing" :
                tx.status === "funded" ? "Funds secured" :
                "Payment received"
              );
              return (
                <div key={tx._id} className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
                  <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.01]" onClick={() => setExpandedTx(isExpanded ? null : tx._id)}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${st.bg}`}>
                      <StIcon className={`w-5 h-5 ${st.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color} ${st.bg}`}>{st.label}</span>
                        {tx.transportRequired && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-nx-cyan/10 text-nx-cyan">Transport</span>}
                      </div>
                      <p className="text-sm text-white truncate">{tx.title}</p>
                      <p className="text-xs text-white/30 mt-0.5">{tx.deliveryCounty}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white">KES {tx.amount.toLocaleString()}</p>
                      <p className="text-[10px] text-white/25 mt-1">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-4">
                      <p className="text-xs font-medium text-white/50 mb-3">Escrow Timeline</p>
                      <div className="space-y-2">
                        {escrowSteps.map((step, i) => {
                          const isComplete = i <= completedIdx;
                          const isCurrent = i === completedIdx;
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isComplete ? "bg-emerald-400/10" : "bg-white/5"}`}>
                                {isComplete ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <div className="w-2 h-2 rounded-full bg-white/10" />}
                              </div>
                              <span className={`text-xs ${isComplete ? (isCurrent ? "text-white/80 font-medium" : "text-white/60") : "text-white/25"}`}>{step}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
