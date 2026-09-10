import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { Shield, Search, Eye, ChevronUp } from "lucide-react";

export default function AdminEscrow() {
  const allEscrows = useQuery(api.admin.getAllEscrows);
  const allUsers = useQuery(api.admin.getAllUsers);
  const [tab, setTab] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const escrows = allEscrows ?? [];
  const users = allUsers ?? [];

  const getUser = (id: string) => users.find((u: any) => u._id === id);

  const filtered = escrows.filter((e: any) => {
    if (tab === "Active" && (e.status === "completed" || e.status === "released" || e.status === "refunded" || e.status === "cancelled")) return false;
    if (tab === "Disputed" && e.status !== "disputed") return false;
    if (tab === "Released" && e.status !== "released" && e.status !== "completed") return false;
    return true;
  });

  const activeEscrows = escrows.filter((e: any) => e.status !== "completed" && e.status !== "released" && e.status !== "refunded" && e.status !== "cancelled");
  const disputedEscrows = escrows.filter((e: any) => e.status === "disputed");
  const totalInEscrow = activeEscrows.reduce((s: number, e: any) => s + e.amount, 0);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Escrow Management</h1>
        <p className="text-sm text-white/40 mt-1">Monitor and manage all escrow transactions</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total in Escrow", value: `KES ${totalInEscrow.toLocaleString()}`, color: "#06B6D4" },
          { label: "Active Escrows", value: activeEscrows.length.toString(), color: "#8B5CF6" },
          { label: "Total Transactions", value: escrows.length.toString(), color: "#F59E0B" },
          { label: "Disputed", value: disputedEscrows.length.toString(), color: "#EF4444" },
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

      {escrows.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <Shield className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No escrow transactions yet</p>
          <p className="text-[11px] text-white/15 mt-1">Escrow transactions will appear when buyers place orders</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((escrow: any) => {
            const buyer = getUser(escrow.buyerId);
            const seller = getUser(escrow.sellerId);
            return (
              <div key={escrow._id} className="p-5 rounded-xl border border-white/5 bg-[#0A0A12] hover:border-white/10 transition-all">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${escrow.status === "completed" || escrow.status === "released" ? "bg-nx-emerald/10 text-nx-emerald" : escrow.status === "disputed" ? "bg-red-400/10 text-red-400" : escrow.status === "funded" ? "bg-nx-cyan/10 text-nx-cyan" : "bg-nx-gold/10 text-nx-gold"}`}>
                        {escrow.status}
                      </span>
                    </div>
                    <p className="text-white/70 font-medium mb-1">{escrow.title}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/30">
                      <span>Buyer: {buyer?.name || "Unknown"}</span>
                      <span>Seller: {seller?.name || seller?.businessName || "Unknown"}</span>
                    </div>
                    {expandedId === escrow._id && (
                      <div className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
                        <p className="text-white/40">Description: <span className="text-white/70">{escrow.description || "—"}</span></p>
                        <p className="text-white/40">Conditions: <span className="text-white/70">{escrow.conditions || "—"}</span></p>
                        <p className="text-white/40">Release condition: <span className="text-white/70">{escrow.releaseCondition || "Buyer approval"}</span></p>
                        <p className="text-white/40">Inspection period: <span className="text-white/70">{escrow.inspectionPeriodHours}h</span></p>
                        <p className="text-white/40">Seller commission ({escrow.commissionRate}%): <span className="text-white/70">KES {(escrow.platformFee ?? 0).toLocaleString()}</span></p>
                        {escrow.buyerFee != null && <p className="text-white/40">Buyer protection fee: <span className="text-white/70">KES {escrow.buyerFee.toLocaleString()}</span></p>}
                        <p className="text-white/40">Transport: <span className="text-white/70">{escrow.transportRequired ? `${escrow.transportPartner || "Nexora"} — KES ${(escrow.transportFee ?? 0).toLocaleString()}` : "Buyer pickup"}</span></p>
                        <p className="text-white/40">Created: <span className="text-white/70">{new Date(escrow.createdAt).toLocaleString()}</span></p>
                        {escrow.fundedAt && <p className="text-white/40">Funded: <span className="text-white/70">{new Date(escrow.fundedAt).toLocaleString()}</span></p>}
                        {escrow.deliveredAt && <p className="text-white/40">Delivered: <span className="text-white/70">{new Date(escrow.deliveredAt).toLocaleString()}</span></p>}
                        {escrow.releasedAt && <p className="text-white/40">Released: <span className="text-white/70">{new Date(escrow.releasedAt).toLocaleString()}</span></p>}
                        {escrow.aiRiskScore != null && <p className="text-white/40">AI risk score: <span className={escrow.aiRiskLevel === "high" || escrow.aiRiskLevel === "critical" ? "text-red-400" : "text-white/70"}>{escrow.aiRiskScore} ({escrow.aiRiskLevel || "unknown"})</span></p>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">KES {escrow.amount?.toLocaleString()}</p>
                      <p className="text-[10px] text-white/25">{escrow.currency}</p>
                    </div>
                    <button
                      onClick={() => setExpandedId(expandedId === escrow._id ? null : escrow._id)}
                      className="p-2 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors"
                      title={expandedId === escrow._id ? "Hide escrow details" : "View escrow details"}
                    >
                      {expandedId === escrow._id ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
