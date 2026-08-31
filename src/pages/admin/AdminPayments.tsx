import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { CreditCard, Search, Eye, CheckCircle2, XCircle, Clock, ArrowUpRight, ArrowDownLeft, Wallet, Receipt } from "lucide-react";

const payments = [
  { id: "PAY-9821", type: "M-Pesa", direction: "In", from: "Edwin Kamau", to: "Escrow", amount: "KES 22,000", status: "Completed", date: "Apr 5, 2025", ref: "QJK4X29BML" },
  { id: "PAY-9820", type: "M-Pesa", direction: "In", from: "Peter Mwangi", to: "Escrow", amount: "KES 45,000", status: "Completed", date: "Apr 5, 2025", ref: "PLM7Y18ABC" },
  { id: "PAY-9819", type: "Escrow Release", direction: "Out", from: "Escrow", to: "FashionHub KE", amount: "KES 8,075", status: "Completed", date: "Apr 4, 2025", ref: "NX-ESC-4827" },
  { id: "PAY-9818", type: "Stripe", direction: "In", from: "Michael Chen", to: "Escrow", amount: "KES 185,000", status: "Completed", date: "Apr 4, 2025", ref: "pi_3Nx8k2..." },
  { id: "PAY-9817", type: "Platform Fee", direction: "In", from: "System", to: "Nexora", amount: "KES 425", status: "Completed", date: "Apr 4, 2025", ref: "NX-FEE-9819" },
  { id: "PAY-9816", type: "Withdrawal", direction: "Out", from: "TechZone Kenya", to: "M-Pesa", amount: "KES 50,000", status: "Processing", date: "Apr 4, 2025", ref: "WD-2847" },
];

export default function AdminPayments() {
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Payment Management</h1>
        <p className="text-sm text-white/40 mt-1">Monitor all platform payments, M-Pesa, Stripe, and wallet transactions</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Volume", value: "KES 2.4B", color: "#10B981" },
          { label: "Today's Volume", value: "KES 12.8M", color: "#8B5CF6" },
          { label: "Pending", value: "KES 3.2M", color: "#F59E0B" },
          { label: "Failed", value: "7", color: "#EF4444" },
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
          <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider">Transaction</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider hidden md:table-cell">From → To</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="text-xs text-white/60 font-medium">{p.id}</p>
                    <p className="text-[10px] text-white/20 font-mono">{p.ref}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${p.type === "M-Pesa" ? "bg-nx-emerald/10 text-nx-emerald" : p.type === "Stripe" ? "bg-nx-violet/10 text-nx-violet" : p.type === "Escrow Release" ? "bg-nx-cyan/10 text-nx-cyan" : "bg-nx-gold/10 text-nx-gold"}`}>{p.type}</span>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-1 text-[11px] text-white/30">
                      <span>{p.from}</span>
                      <ArrowUpRight className={`w-3 h-3 ${p.direction === "In" ? "text-nx-emerald rotate-0" : "text-nx-gold rotate-90"}`} />
                      <span>{p.to}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className={`text-xs font-medium ${p.direction === "In" ? "text-nx-emerald" : "text-nx-gold"}`}>{p.direction === "In" ? "+" : "-"}{p.amount}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${p.status === "Completed" ? "bg-nx-emerald/10 text-nx-emerald" : p.status === "Processing" ? "bg-nx-gold/10 text-nx-gold" : "bg-red-400/10 text-red-400"}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
