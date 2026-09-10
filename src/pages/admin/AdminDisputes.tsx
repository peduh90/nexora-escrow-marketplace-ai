import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import {
  Scale, Eye, MessageSquare, AlertTriangle, Loader2,
  CheckCircle2, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminDisputes() {
  const allDisputes = useQuery(api.admin.getAllDisputes);
  const allUsers = useQuery(api.admin.getAllUsers);
  const allEscrows = useQuery(api.admin.getAllEscrows);
  const resolveDispute = useMutation(api.admin.resolveDispute);
  const [tab, setTab] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const disputes = allDisputes ?? [];
  const users = allUsers ?? [];
  const escrows = allEscrows ?? [];
  const getUser = (id: string) => users.find((u: any) => u._id === id);
  const getEscrow = (id: string) => escrows.find((e: any) => e._id === id);

  const filtered = disputes.filter((d: any) => {
    if (tab === "Open" && d.status !== "open") return false;
    if (tab === "Under Review" && d.status !== "under_review") return false;
    if (tab === "Resolved" && d.status !== "resolved") return false;
    return true;
  });

  const openDisputes = disputes.filter((d: any) => d.status === "open").length;
  const underReview = disputes.filter((d: any) => d.status === "under_review").length;
  const resolved = disputes.filter((d: any) => d.status === "resolved").length;

  const startResolve = (d: any) => {
    setResolvingId(d._id);
    setResolution("");
    setRefundAmount(d.refundAmount ? String(d.refundAmount) : "");
  };

  const submitResolve = async (d: any) => {
    if (!resolution.trim()) {
      toast.error("Enter a resolution decision first");
      return;
    }
    setSubmitting(true);
    try {
      const amount = refundAmount.trim() ? Number(refundAmount) : undefined;
      await resolveDispute({
        disputeId: d._id,
        resolution: resolution.trim(),
        refundAmount: amount && amount > 0 ? amount : undefined,
      });
      toast.success("Dispute resolved");
      setResolvingId(null);
      setResolution("");
      setRefundAmount("");
    } catch (err: any) {
      toast.error(err?.message || "Could not resolve dispute");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dispute Resolution</h1>
        <p className="text-sm text-white/40 mt-1">Review, resolve and refund escrow disputes</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Open Disputes", value: openDisputes.toString(), color: "#EF4444" },
          { label: "Under Review", value: underReview.toString(), color: "#F59E0B" },
          { label: "Resolved", value: resolved.toString(), color: "#10B981" },
          { label: "Total", value: disputes.length.toString(), color: "#8B5CF6" },
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

      {disputes.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <Scale className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No disputes yet</p>
          <p className="text-[11px] text-white/15 mt-1">Disputes will appear here when buyers or sellers file issues</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d: any) => {
            const filer = getUser(d.filedBy);
            const escrow = getEscrow(d.escrowId);
            const isExpanded = expandedId === d._id;
            const isResolving = resolvingId === d._id;
            const isOpen = d.status === "open" || d.status === "under_review";
            return (
              <div key={d._id} className="p-5 rounded-xl border border-white/5 bg-[#0A0A12] hover:border-white/10 transition-all">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${d.status === "resolved" ? "bg-nx-emerald/10 text-nx-emerald" : d.status === "under_review" ? "bg-nx-gold/10 text-nx-gold" : "bg-red-400/10 text-red-400"}`}>{d.status}</span>
                      {escrow && (
                        <span className="text-[10px] text-white/25">
                          Escrow: {escrow.title} — KES {escrow.amount?.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-white/70 font-medium mb-1">{d.reason}</p>
                    {d.description && <p className="text-[11px] text-white/30 mb-2">{d.description}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/25">
                      <span>Filed by: {filer?.name || filer?.email || "Unknown"}</span>
                      <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                      {d.resolution && <span>Resolution: {d.resolution}</span>}
                      {d.refundAmount ? <span className="text-amber-400/70">Refunded: KES {d.refundAmount.toLocaleString()}</span> : null}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {d.aiRecommendation && (
                      <div className="p-3 rounded-lg bg-nx-violet/5 border border-nx-violet/10">
                        <div className="flex items-center gap-1.5 mb-1">
                          <AlertTriangle className="w-3 h-3 text-nx-violet" />
                          <span className="text-[10px] font-medium text-nx-violet">AI Recommendation</span>
                        </div>
                        <p className="text-xs text-white/60">{d.aiRecommendation}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : d._id)}
                        className="p-2 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors"
                        title={isExpanded ? "Hide details" : "View details"}
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      {isOpen && (
                        <button
                          onClick={() => (isResolving ? setResolvingId(null) : startResolve(d))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isResolving ? "bg-white/[0.03] text-white/40" : "bg-nx-violet hover:bg-nx-violet/80 text-white"}`}
                        >
                          {isResolving ? "Cancel" : "Resolve"}
                        </button>
                      )}
                      {d.status === "resolved" && (
                        <span className="flex items-center gap-1 text-[10px] text-nx-emerald px-2 py-1 rounded bg-nx-emerald/5">
                          <CheckCircle2 className="w-3 h-3" /> Closed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/25 mb-2">Linked Escrow</p>
                      {escrow ? (
                        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1.5 text-xs">
                          <p className="text-white/70">{escrow.title}</p>
                          <p className="text-white/30">Amount: KES {escrow.amount?.toLocaleString()} · Status: {escrow.status}</p>
                          <p className="text-white/30">Buyer: {getUser(escrow.buyerId)?.name || getUser(escrow.buyerId)?.email || "Unknown"}</p>
                          <p className="text-white/30">Seller: {getUser(escrow.sellerId)?.businessName || getUser(escrow.sellerId)?.name || "Unknown"}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-white/25">Escrow record not found</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/25 mb-2">Evidence</p>
                      {d.evidence && d.evidence.length > 0 ? (
                        <div className="space-y-1.5">
                          {d.evidence.map((ev: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-white/50">
                              <MessageSquare className="w-3 h-3 text-white/20 shrink-0" />
                              <span className="truncate">{ev}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-white/25">No evidence files attached</p>
                      )}
                    </div>
                  </div>
                )}

                {isResolving && isOpen && (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-white/25 block mb-1.5">Resolution decision</label>
                      <textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder="e.g. Item not as described — refund buyer in full from escrow"
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/40 resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-white/25 block mb-1.5">
                        Refund amount (KES) — leave empty to release funds to the seller
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        placeholder="0"
                        className="w-full md:w-56 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-nx-violet/40"
                      />
                      {escrow && (
                        <p className="text-[10px] text-white/25 mt-1">Escrow holds KES {escrow.amount?.toLocaleString()}</p>
                      )}
                    </div>
                    <button
                      onClick={() => submitResolve(d)}
                      disabled={submitting || !resolution.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-nx-violet hover:bg-nx-violet/80 text-white text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Confirm resolution
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
