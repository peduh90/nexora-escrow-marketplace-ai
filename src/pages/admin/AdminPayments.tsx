import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { CreditCard, Search, ArrowUpRight, ArrowDownRight, XCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";

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

export default function AdminPayments() {
  const transactions = useQuery(api.admin.getAllWalletTransactions);
  const users = useQuery(api.users.getAllUsers);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

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
