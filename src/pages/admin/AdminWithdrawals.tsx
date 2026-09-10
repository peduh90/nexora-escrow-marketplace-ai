import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { Wallet, Search, Eye, ChevronUp } from "lucide-react";

export default function AdminWithdrawals() {
  const allTransactions = useQuery(api.wallet.getWalletTransactions);
  const allUsers = useQuery(api.admin.getAllUsers);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const transactions = allTransactions ?? [];
  const users = allUsers ?? [];
  const getUser = (id: string) => users.find((u: any) => u._id === id);

  const withdrawals = transactions.filter((t: any) => t.type === "withdrawal");
  const pending = withdrawals.filter((w: any) => w.status === "pending");
  const processing = withdrawals.filter((w: any) => w.status === "processing");
  const completed = withdrawals.filter((w: any) => w.status === "completed");
  const pendingAmount = pending.reduce((s: number, w: any) => s + w.amount, 0);
  const processingAmount = processing.reduce((s: number, w: any) => s + w.amount, 0);
  const completedAmount = completed.reduce((s: number, w: any) => s + w.amount, 0);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Withdrawal Management</h1>
        <p className="text-sm text-white/40 mt-1">Process and monitor seller withdrawal requests</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Pending", value: `KES ${pendingAmount.toLocaleString()}`, sub: `${pending.length} requests`, color: "#F59E0B" },
          { label: "Processing", value: `KES ${processingAmount.toLocaleString()}`, sub: `${processing.length} requests`, color: "#06B6D4" },
          { label: "Completed", value: `KES ${completedAmount.toLocaleString()}`, sub: `${completed.length} requests`, color: "#10B981" },
          { label: "Total Requests", value: withdrawals.length.toString(), sub: "All time", color: "#8B5CF6" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
            <p className="text-[10px] text-white/25">{s.sub}</p>
          </div>
        ))}
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
                {withdrawals.map((w: any) => {
                  const user = getUser(w.userId);
                  const isExpanded = expandedId === w._id;
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
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : w._id)}
                          className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors"
                          title={isExpanded ? "Hide withdrawal details" : "View withdrawal details"}
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
