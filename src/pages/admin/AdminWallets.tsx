import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { Wallet, Search, Eye } from "lucide-react";

export default function AdminWallets() {
  const allUsers = useQuery(api.admin.getAllUsers);
  const allEscrows = useQuery(api.admin.getAllEscrows);
  const allTransactions = useQuery(api.wallet.getWalletTransactions);
  const [search, setSearch] = useState("");

  const users = allUsers ?? [];
  const escrows = allEscrows ?? [];
  const transactions = allTransactions ?? [];

  // Calculate real platform financial metrics
  const totalInEscrow = escrows
    .filter((e: any) => ["funded", "active", "delivery", "inspection"].includes(e.status))
    .reduce((sum: number, e: any) => sum + e.amount, 0);

  const totalCompleted = escrows
    .filter((e: any) => ["released", "completed"].includes(e.status))
    .reduce((sum: number, e: any) => sum + e.amount, 0);

  // Build per-user wallet summaries from real data
  const userWallets = users
    .filter((u: any) => u.role === "buyer" || u.role === "seller")
    .map((u: any) => {
      const userTxs = transactions.filter((t: any) => t.userId === u._id);
      const userEscrows = escrows.filter(
        (e: any) => (u.role === "buyer" && e.buyerId === u._id) || (u.role === "seller" && e.sellerId === u._id)
      );
      const completed = userEscrows
        .filter((e: any) => ["released", "completed"].includes(e.status))
        .reduce((sum: number, e: any) => sum + e.amount, 0);
      const pending = userEscrows
        .filter((e: any) => ["funded", "active", "delivery", "inspection"].includes(e.status))
        .reduce((sum: number, e: any) => sum + e.amount, 0);
      const totalWithdrawn = userTxs
        .filter((t: any) => t.type === "withdrawal" && t.status === "completed")
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      return {
        id: u._id,
        name: u.name || u.email || "Unknown",
        role: u.role,
        escrowBalance: pending,
        totalCompleted: completed,
        totalWithdrawn,
        txCount: userTxs.length,
      };
    })
    .filter((w: any) => w.txCount > 0 || w.escrowBalance > 0);

  const filtered = userWallets.filter(
    (w: any) => !search || w.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Wallet Management</h1>
        <p className="text-sm text-white/40 mt-1">Monitor all buyer and seller wallet balances</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total In Escrow", value: `KES ${totalInEscrow.toLocaleString()}` },
          { label: "Total Completed", value: `KES ${totalCompleted.toLocaleString()}` },
          { label: "Active Users", value: userWallets.length.toString() },
          { label: "Total Transactions", value: transactions.length.toString() },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search wallets..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0A0A12] border border-white/5 text-sm text-white placeholder-white/20 focus:border-nx-violet/30 focus:outline-none"
        />
      </div>

      {userWallets.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <Wallet className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No wallet activity yet</p>
          <p className="text-[11px] text-white/15 mt-1">Wallet balances will appear once users transact</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">User</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Role</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">In Escrow</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Completed</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Withdrawn</th>
                  <th className="text-right px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map((w: any) => (
                  <tr key={w.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-nx-violet/15 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-nx-violet">{w.name[0]?.toUpperCase()}</span>
                        </div>
                        <span className="text-sm text-white/70">{w.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${w.role === "seller" ? "bg-nx-cyan/10 text-nx-cyan" : "bg-nx-emerald/10 text-nx-emerald"}`}>
                        {w.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-white/50">KES {w.escrowBalance.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-xs text-white/40 hidden md:table-cell">KES {w.totalCompleted.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-xs text-white/40 hidden md:table-cell">KES {w.totalWithdrawn.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
