import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { CreditCard, Search, ArrowUpRight, ArrowDownRight, XCircle, CheckCircle2, Clock, Loader2, RefreshCw, Undo2, Smartphone, Wallet, Landmark } from "lucide-react";

const typeMeta: Record<string, { label: string; color: string; icon: typeof ArrowUpRight }> = {
  deposit: { label: "Deposit", color: "text-nx-emerald", icon: ArrowUpRight },
  withdrawal: { label: "Withdrawal", color: "text-amber-400", icon: ArrowDownRight },
  escrow_fund: { label: "Escrow Fund", color: "text-nx-cyan", icon: ArrowUpRight },
  escrow_release: { label: "Escrow Release", color: "text-nx-emerald", icon: ArrowUpRight },
  commission: { label: "Commission", color: "text-nx-violet", icon: ArrowDownRight },
  transport_fee: { label: "Transport Fee", color: "text-white/40", icon: ArrowDownRight },
  transfer: { label: "Transfer", color: "text-white/40", icon: ArrowUpRight },
  refund: { label: "Refund", color: "text-red-400", icon: ArrowDownRight },
  subscription: { label: "Subscription", color: "text-white/40", icon: ArrowDownRight },
};

const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "text-amber-400", bg: "bg-amber-400/10" },
  processing: { label: "Processing", color: "text-nx-cyan", bg: "bg-nx-cyan/10" },
  completed: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  failed: { label: "Failed", color: "text-red-400", bg: "bg-red-400/10" },
};

const providerMeta: Record<string, { label: string; icon: typeof CreditCard; color: string }> = {
  mpesa: { label: "M-Pesa", icon: Smartphone, color: "text-emerald-400" },
  airtel_money: { label: "Airtel Money", icon: Smartphone, color: "text-red-400" },
  card: { label: "Card (legacy Flutterwave)", icon: Landmark, color: "text-nx-cyan" },
  flutterwave: { label: "Flutterwave Kenya", icon: Landmark, color: "text-emerald-400" },
};

const unifiedStatusMeta: Record<string, { label: string; color: string; bg: string }> = {
  initiated: { label: "Initiated", color: "text-white/50", bg: "bg-white/5" },
  awaiting_confirmation: { label: "Awaiting", color: "text-amber-400", bg: "bg-amber-400/10" },
  paid: { label: "Paid ✓", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  failed: { label: "Failed", color: "text-red-400", bg: "bg-red-400/10" },
  cancelled: { label: "Cancelled", color: "text-white/40", bg: "bg-white/5" },
  expired: { label: "Expired", color: "text-amber-400", bg: "bg-amber-400/10" },
  reversed: { label: "Reversed", color: "text-red-400", bg: "bg-red-400/10" },
  disputed: { label: "Disputed", color: "text-amber-400", bg: "bg-amber-400/10" },
  refunded: { label: "Refunded", color: "text-nx-cyan", bg: "bg-nx-cyan/10" },
  partially_refunded: { label: "Partial refund", color: "text-nx-cyan", bg: "bg-nx-cyan/10" },
};

export default function AdminPayments() {
  const transactions = useQuery(api.admin.getAllWalletTransactions);
  const users = useQuery(api.admin.getAllUsers);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  // ── Unified payment engine (M-Pesa / Airtel Money / Card) ──
  const unified = useQuery(api.paymentStore.listTransactions, { limit: 100 });
  const unifiedStats = useQuery(api.paymentStore.paymentStats, {});
  const webhookEvents = useQuery(api.paymentStore.listWebhookEvents, { limit: 50 });
  const refundTx = useMutation(api.paymentStore.requestRefund);
  const executeRefund = useAction(api.payments.executeRefund as any);
  const reconcile = useAction(api.payments.reconcilePending as any);
  const [refunding, setRefunding] = useState<string | null>(null);
  const [sweeping, setSweeping] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleRefund = async (tx: any) => {
    const amount = Number(tx.feeSnapshot?.totalCharge ?? tx.amount);
    if (!confirm(`Refund KES ${amount.toLocaleString()} to the ${providerMeta[tx.provider]?.label || tx.provider} payer?`)) return;
    setRefunding(tx._id);
    setNotice(null);
    try {
      const refundId = await refundTx({ paymentTxId: tx._id, amount, reason: "Admin refund from Payments panel" });
      await executeRefund({ refundId: String(refundId) });
      setNotice(`Refund of KES ${amount.toLocaleString()} executed via ${providerMeta[tx.provider]?.label || tx.provider}.`);
    } catch (err: any) {
      setNotice(err.message || "Refund failed.");
    } finally {
      setRefunding(null);
    }
  };

  const handleSweep = async () => {
    setSweeping(true);
    setNotice(null);
    try {
      const r = await reconcile({});
      setNotice(`Reconciliation swept ${r.checked} pending payment(s) — ${r.resolved} resolved.`);
    } catch (err: any) {
      setNotice(err.message || "Sweep failed.");
    } finally {
      setSweeping(false);
    }
  };

  const txs = transactions ?? [];
  const userList = users ?? [];

  const getUser = (id: string) =>
    userList.find((u: any) => u._id === id)?.name ||
    userList.find((u: any) => u._id === id)?.businessName ||
    "Unknown";

  const enriched = txs.map((t: any) => ({
    ...t,
    userName: getUser(t.userId),
  }));

  const filtered = enriched.filter((t: any) => {
    if (filter !== "All" && t.type !== filter) return false;
    if (search && !t.userName.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase()) && !t.reference.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Payments & Wallet Transactions</h1>
        <p className="text-sm text-white/40 mt-1">
          Audit all wallet activity across the platform
        </p>
      </div>

      {/* ─── UNIFIED COLLECTIONS (M-Pesa · Airtel Money · Card) ─── */}
      <div className="rounded-xl border border-nx-violet/20 bg-gradient-to-b from-nx-violet/[0.06] to-transparent p-4 mb-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2"><CreditCard className="w-4 h-4 text-nx-violet" /> Unified Collections</h2>
            <p className="text-[11px] text-white/40 mt-0.5">Every checkout payment — verified server-side before orders fund escrow</p>
          </div>
          <button onClick={handleSweep} disabled={sweeping}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-nx-violet/10 text-nx-violet hover:bg-nx-violet/20 transition-colors flex items-center gap-1.5 disabled:opacity-50">
            {sweeping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Reconcile pending
          </button>
        </div>

        {notice && (
          <div className="mb-3 p-2.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/70">{notice}</div>
        )}

        {/* Provider breakdown */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {["mpesa", "airtel_money", "card", "flutterwave"].map((p) => {
            const meta = providerMeta[p];
            const stat = unifiedStats?.byProvider?.[p];
            const Icon = meta.icon;
            return (
              <div key={p} className="p-3 rounded-lg border border-white/5 bg-[#0A0A12]">
                <p className={`text-[10px] uppercase flex items-center gap-1.5 ${meta.color}`}><Icon className="w-3.5 h-3.5" /> {meta.label}</p>
                <p className="text-lg font-bold text-white mt-1">KES {(stat?.volume ?? 0).toLocaleString()}</p>
                <p className="text-[11px] text-white/30">{stat?.paid ?? 0} paid · {stat?.failed ?? 0} failed · {stat?.pending ?? 0} pending</p>
              </div>
            );
          })}
          <div className="p-3 rounded-lg border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] uppercase text-white/40 flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> All providers</p>
            <p className="text-lg font-bold text-white mt-1">{unifiedStats?.total ?? 0}</p>
            <p className="text-[11px] text-white/30">total payment attempts</p>
          </div>
        </div>

        {/* Unified transactions table */}
        {!unified || unified.length === 0 ? (
          <div className="py-8 flex flex-col items-center text-center">
            <CreditCard className="w-6 h-6 text-white/10 mb-2" />
            <p className="text-xs text-white/30">No unified payment attempts yet</p>
            <p className="text-[10px] text-white/20 mt-1">M-Pesa remains sandbox/LIVE capable independently; Flutterwave appears after server configuration</p>
          </div>
        ) : (
          <div className="rounded-lg border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-left px-3 py-2 text-[10px] font-medium text-white/30 uppercase">Reference / Tx</th>
                    <th className="text-left px-3 py-2 text-[10px] font-medium text-white/30 uppercase">Provider</th>
                    <th className="text-left px-3 py-2 text-[10px] font-medium text-white/30 uppercase">Amount</th>
                    <th className="text-left px-3 py-2 text-[10px] font-medium text-white/30 uppercase">Status</th>
                    <th className="text-left px-3 py-2 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Order / Escrow</th>
                    <th className="text-left px-3 py-2 text-[10px] font-medium text-white/30 uppercase hidden lg:table-cell">Reconciliation</th>
                    <th className="text-right px-3 py-2 text-[10px] font-medium text-white/30 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {unified.map((t: any) => {
                    const meta = providerMeta[t.provider] || { label: t.provider, icon: CreditCard, color: "text-white/50" };
                    const st = unifiedStatusMeta[t.status] || { label: t.status, color: "text-white/50", bg: "bg-white/5" };
                    const Icon = meta.icon;
                    const refundable = t.status === "paid" && !(t.refundedAmount >= (t.feeSnapshot?.totalCharge ?? t.amount));
                    return (
                      <tr key={t._id} className="border-b border-white/[0.03] last:border-0">
                        <td className="px-3 py-2.5 text-[11px] text-white/60 font-mono"><p>{t.reference}</p><p className="text-[9px] text-white/25 mt-0.5">tx {t.providerTransactionId || "pending"}</p></td>
                        <td className="px-3 py-2.5 text-xs">
                          <span className={`flex items-center gap-1.5 ${meta.color}`}><Icon className="w-3.5 h-3.5" /> {meta.label}</span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-white font-medium">KES {(t.feeSnapshot?.totalCharge ?? t.amount).toLocaleString()}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${st.bg} ${st.color}`}>{st.label}</span>
                          {t.status === "paid" && t.escrowId && <p className="text-[10px] text-white/25 mt-0.5">escrow #{String(t.escrowId).slice(-6)}</p>}
                          {t.failureReason && <p className="text-[10px] text-red-400/60 mt-0.5 max-w-[180px] truncate">{t.failureReason}</p>}
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-white/40 hidden md:table-cell"><p>{t.orderId || "—"}</p><p className="text-[9px] text-white/25">{t.escrowId ? `escrow ${String(t.escrowId).slice(-6)}` : t.status === "paid" ? "unlinked" : "—"}</p></td>
                        <td className="px-3 py-2.5 text-[11px] text-white/40 hidden lg:table-cell"><p>{t.providerStatus || "awaiting provider"}</p><p className="text-[9px] text-white/25">{t.verifiedAt ? "server verified" : t.webhookReceivedAt ? "webhook seen" : "not verified"}</p></td>
                        <td className="px-3 py-2.5 text-right">
                          {refundable ? (
                            <button onClick={() => handleRefund(t)} disabled={refunding === t._id}
                              className="px-2 py-1 rounded-md text-[10px] font-medium bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors inline-flex items-center gap-1 disabled:opacity-50">
                              {refunding === t._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Undo2 className="w-3 h-3" />} Refund
                            </button>
                          ) : (
                            <span className="text-[10px] text-white/20">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Transactions", value: txs.length.toString() },
          { label: "Completed", value: txs.filter((t: any) => t.status === "completed").length.toString() },
          { label: "Pending", value: txs.filter((t: any) => t.status === "pending").length.toString() },
          { label: "Failed", value: txs.filter((t: any) => t.status === "failed").length.toString() },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, reference, or description..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0A0A12] border border-white/5 text-sm text-white placeholder-white/20 focus:border-nx-violet/30 focus:outline-none"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["All", "deposit", "withdrawal", "escrow_fund", "escrow_release", "commission", "transport_fee", "transfer", "refund", "subscription"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-nx-violet/10 text-nx-violet"
                  : "text-white/30 hover:text-white/50 bg-[#0A0A12] border border-white/5"
              }`}
            >
              {typeMeta[f]?.label || f}
            </button>
          ))}
        </div>
      </div>

      {txs.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <CreditCard className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No wallet transactions yet</p>
          <p className="text-[11px] text-white/15 mt-1">Wallet activity will appear here once users transact</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">User</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden lg:table-cell">Description</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Reference</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map((tx: any) => {
                  const type = typeMeta[tx.type] ?? { label: tx.type, color: "text-white/40", icon: Clock };
                  const status = statusMeta[tx.status] ?? { label: tx.status, color: "text-white/40", bg: "bg-white/5" };
                  return (
                    <tr key={tx._id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-white/60 truncate max-w-[160px]">{tx.userName}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${type.color} ${type.color.includes("text-nx") ? "bg-white/5" : "bg-white/5"}`}>
                          {type.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-white/60 font-medium">
                          {tx.type === "deposit" || tx.type === "escrow_release" || tx.type === "escrow_fund" || tx.type === "refund" ? "+" : "-"}
                          {" "}KES {Math.abs(tx.amount || 0).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${status.color} ${status.bg}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <p className="text-xs text-white/40 truncate max-w-[200px]">{tx.description}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <p className="text-xs text-white/40 font-mono truncate max-w-[140px]">{tx.reference}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <p className="text-xs text-white/40">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "—"}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <CreditCard className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">
            {search ? "No transactions match your search" : "No transactions yet"}
          </p>
          <p className="text-[11px] text-white/15 mt-1">Wallet activity will appear here once users transact</p>
        </div>
      )}
    </AdminLayout>
  );
}
