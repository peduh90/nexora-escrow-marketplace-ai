import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { Wallet, Search, Eye, ChevronUp, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function AdminWithdrawals() {
  const allTransactions = useQuery(api.admin.getAllWalletTransactions);
  const allUsers = useQuery(api.admin.getAllUsers);
  const reviewWithdrawal = useMutation(api.admin.reviewWithdrawal);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("Pending");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; ref: string } | null>(null);
  const [note, setNote] = useState("");

  const transactions = allTransactions ?? [];
  const users = allUsers ?? [];
  const getUser = (id: string) => users.find((u: any) => u._id === id);

  const withdrawals = transactions.filter((t: any) => t.type === "withdrawal");
  const pending = withdrawals.filter((w: any) => w.status === "pending");
  const processing = withdrawals.filter((w: any) => w.status === "processing");
  const completed = withdrawals.filter((w: any) => w.status === "completed");
  const failed = withdrawals.filter((w: any) => w.status === "failed");
  const pendingAmount = pending.reduce((s: number, w: any) => s + w.amount, 0);
  const processingAmount = processing.reduce((s: number, w: any) => s + w.amount, 0);
  const completedAmount = completed.reduce((s: number, w: any) => s + w.amount, 0);

  const filtered = withdrawals.filter((w: any) => {
    if (filter === "Pending" && w.status !== "pending") return false;
    if (filter === "Processing" && w.status !== "processing") return false;
    if (filter === "Completed" && w.status !== "completed") return false;
    if (filter === "Rejected" && w.status !== "failed") return false;
    if (search) {
      const u = getUser(w.userId);
      const q = search.toLowerCase();
      if (
        !(u?.name || "").toLowerCase().includes(q) &&
        !(u?.email || "").toLowerCase().includes(q) &&
        !w.reference.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const act = async (transactionId: string, approve: boolean, reasonNote?: string) => {
    setBusyId(transactionId);
    try {
      await reviewWithdrawal({ transactionId, approve, note: reasonNote });
      toast.success(
        approve
          ? "Marked as paid — the user has been notified"
          : "Rejected — amount auto-refunded to the user's wallet"
      );
      setRejectTarget(null);
      setNote("");
    } catch (e: any) {
      toast.error(e?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Withdrawal Management</h1>
        <p className="text-sm text-white/40 mt-1">
          Approve M-Pesa payouts and reject with automatic wallet refund — every action audit-logged
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Pending", value: `KES ${pendingAmount.toLocaleString()}`, sub: `${pending.length} requests`, color: "#F59E0B" },
          { label: "Processing", value: `KES ${processingAmount.toLocaleString()}`, sub: `${processing.length} requests`, color: "#06B6D4" },
          { label: "Completed", value: `KES ${completedAmount.toLocaleString()}`, sub: `${completed.length} paid out`, color: "#10B981" },
          { label: "Rejected", value: failed.length.toString(), sub: "auto-refunded to wallets", color: "#EF4444" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
            <p className="text-[10px] text-white/25">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, email or reference..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0A0A12] border border-white/5 text-sm text-white placeholder-white/20 focus:border-nx-violet/30 focus:outline-none"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["Pending", "Processing", "Completed", "Rejected", "All"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-nx-violet/15 border border-nx-violet/40 text-nx-violet"
                  : "bg-white/[0.02] border border-white/5 text-white/40 hover:text-white/70"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {withdrawals.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <Wallet className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No withdrawal requests yet</p>
          <p className="text-[11px] text-white/15 mt-1">Withdrawal requests will appear here</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-nx-violet" />
            <h3 className="text-sm font-semibold text-white">Withdrawal Requests</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 ml-auto">{filtered.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">User</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Reference</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map((w: any) => {
                  const user = getUser(w.userId);
                  const isExpanded = expandedId === w._id;
                  const canAct = w.status === "pending" || w.status === "processing";
                  return (
                    <tr key={w._id} className="hover:bg-white/[0.01] transition-colors align-top">
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-white/70">{user?.name || user?.email || "Unknown"}</span>
                        {isExpanded && (
                          <div className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1.5 text-[11px]">
                            <p className="text-white/40">Reference: <span className="text-white/70">{w.reference}</span></p>
                            <p className="text-white/40">Description: <span className="text-white/70">{w.description || "—"}</span></p>
                            <p className="text-white/40">Currency: <span className="text-white/70">{w.currency}</span></p>
                            <p className="text-white/40">Requested: <span className="text-white/70">{new Date(w.createdAt).toLocaleString()}</span></p>
                            {user && <p className="text-white/40">Wallet balance now: <span className="text-white/70">KES {(user.walletBalance ?? 0).toLocaleString()}</span></p>}
                            {user && <p className="text-white/40">Contact: <span className="text-white/70">{user.email} {user.phone ? `· ${user.phone}` : ""}</span></p>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-white/70 font-medium">KES {w.amount.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-[11px] text-white/30 hidden md:table-cell">{w.reference}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${w.status === "completed" ? "bg-nx-emerald/10 text-nx-emerald" : w.status === "processing" ? "bg-nx-cyan/10 text-nx-cyan" : w.status === "failed" ? "bg-red-400/10 text-red-400" : "bg-nx-gold/10 text-nx-gold"}`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canAct && (
                            <>
                              <button
                                onClick={() => act(w._id, true)}
                                disabled={busyId === w._id}
                                className="p-1.5 rounded text-white/30 hover:text-nx-emerald hover:bg-nx-emerald/10 transition-colors disabled:opacity-40"
                                title="Mark as paid to M-Pesa"
                              >
                                {busyId === w._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => setRejectTarget({ id: w._id, ref: w.reference })}
                                disabled={busyId === w._id}
                                className="p-1.5 rounded text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                                title="Reject — auto-refunds the wallet"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : w._id)}
                            className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors"
                            title={isExpanded ? "Hide withdrawal details" : "View withdrawal details"}
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject modal — explain the auto-refund */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setRejectTarget(null)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0A0A12] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" /> Reject withdrawal?
            </h3>
            <p className="text-xs text-white/40 mt-2">
              <span className="text-white/70 font-medium">{rejectTarget.ref}</span> — the deducted amount will be
              <span className="text-emerald-300 font-semibold"> automatically refunded</span> to the user's wallet and they will be notified.
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason (shared with the user)..."
              rows={3}
              className="mt-3 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-red-400/40 placeholder:text-white/20"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setRejectTarget(null)} className="flex-1 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-sm hover:text-white transition-colors">
                Cancel
              </button>
              <button
                onClick={() => act(rejectTarget.id, false, note || undefined)}
                disabled={busyId === rejectTarget.id}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-400 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {busyId === rejectTarget.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Reject &amp; Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
