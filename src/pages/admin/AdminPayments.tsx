import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { CreditCard, Eye } from "lucide-react";

export default function AdminPayments() {
  const walletTxs = useQuery(api.wallet.getWalletTransactions);
  const transactions = walletTxs ?? [];

  const totalDeposits = transactions.filter(t => t.type === "deposit" && t.status === "completed").reduce((s, t) => s + t.amount, 0);
  const pendingAmount = transactions.filter(t => t.status === "pending" || t.status === "processing").reduce((s, t) => s + t.amount, 0);
  const completedCount = transactions.filter(t => t.status === "completed").length;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Payment Management</h1>
        <p className="text-sm text-white/40 mt-1">Monitor all platform payments, M-Pesa, and wallet transactions</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Deposits", value: `KES ${totalDeposits.toLocaleString()}` },
          { label: "Total Transactions", value: transactions.length.toString() },
          { label: "Pending", value: `KES ${pendingAmount.toLocaleString()}` },
          { label: "Completed", value: completedCount.toString() },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-nx-violet" />
          <h3 className="text-sm font-semibold text-white">Transaction History</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="py-16 flex flex-col items-center">
            <CreditCard className="w-8 h-8 text-white/10 mb-3" />
            <p className="text-sm text-white/30">No transactions yet</p>
            <p className="text-[11px] text-white/15 mt-1">Payment transactions will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Reference</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {transactions.slice(0, 50).map(tx => (
                  <tr key={tx._id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-white/60 font-medium">{tx.reference}</p>
                      <p className="text-[10px] text-white/20">{tx.description}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        tx.type === "deposit" ? "bg-nx-emerald/10 text-nx-emerald" :
                        tx.type === "withdrawal" ? "bg-nx-gold/10 text-nx-gold" :
                        tx.type === "escrow_fund" ? "bg-nx-violet/10 text-nx-violet" :
                        tx.type === "escrow_release" ? "bg-nx-cyan/10 text-nx-cyan" :
                        "bg-white/5 text-white/40"
                      }`}>{tx.type.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-white/60 font-medium">{tx.currency} {tx.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        tx.status === "completed" ? "bg-nx-emerald/10 text-nx-emerald" :
                        tx.status === "processing" || tx.status === "pending" ? "bg-nx-gold/10 text-nx-gold" :
                        "bg-red-400/10 text-red-400"
                      }`}>{tx.status}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
