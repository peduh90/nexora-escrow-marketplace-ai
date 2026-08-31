import AdminLayout from "./AdminLayout";
import { Wallet, Search, Eye, CheckCircle2, Clock, XCircle, ArrowDownLeft } from "lucide-react";

const withdrawals = [
  { id: "WD-2847", seller: "TechZone Kenya", amount: "KES 50,000", method: "M-Pesa", phone: "0712***456", status: "Processing", requested: "2 hours ago" },
  { id: "WD-2846", seller: "Grace Fashion House", amount: "KES 25,000", method: "M-Pesa", phone: "0723***789", status: "Completed", requested: "1 day ago" },
  { id: "WD-2845", seller: "PhoneWorld", amount: "KES 100,000", method: "Bank", phone: "KCB ****4567", status: "Pending", requested: "3 hours ago" },
  { id: "WD-2844", seller: "AutoHub Kenya", amount: "KES 250,000", method: "Bank", phone: "Equifax ****8901", status: "Completed", requested: "2 days ago" },
];

export default function AdminWithdrawals() {
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Withdrawal Management</h1>
        <p className="text-sm text-white/40 mt-1">Process and monitor seller withdrawal requests</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Pending", value: "KES 150,000", sub: "8 requests" },
          { label: "Processing", value: "KES 50,000", sub: "3 requests" },
          { label: "Completed Today", value: "KES 325,000", sub: "12 requests" },
          { label: "Total Withdrawn", value: "KES 42.8M", sub: "Since launch" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
            <p className="text-[10px] text-white/25">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-nx-violet" />
          <h3 className="text-sm font-semibold text-white">Withdrawal Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">ID</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Seller</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Method</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {withdrawals.map(w => (
                <tr key={w.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-4 py-3.5 text-xs font-mono text-white/40">{w.id}</td>
                  <td className="px-4 py-3.5 text-sm text-white/60">{w.seller}</td>
                  <td className="px-4 py-3.5 text-sm text-white/70 font-medium">{w.amount}</td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${w.method === "M-Pesa" ? "bg-nx-emerald/10 text-nx-emerald" : "bg-nx-cyan/10 text-nx-cyan"}`}>{w.method}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${w.status === "Completed" ? "bg-nx-emerald/10 text-nx-emerald" : w.status === "Processing" ? "bg-nx-gold/10 text-nx-gold" : "bg-nx-violet/10 text-nx-violet"}`}>{w.status}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {w.status === "Pending" && <button className="p-1.5 rounded text-nx-emerald hover:bg-nx-emerald/10 transition-colors"><CheckCircle2 className="w-3.5 h-3.5" /></button>}
                      {w.status === "Pending" && <button className="p-1.5 rounded text-red-400 hover:bg-red-400/10 transition-colors"><XCircle className="w-3.5 h-3.5" /></button>}
                      <button className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                    </div>
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
