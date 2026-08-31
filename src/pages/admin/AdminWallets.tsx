import AdminLayout from "./AdminLayout";
import { Wallet, Eye, Search, TrendingUp, ArrowUpRight, ArrowDownLeft } from "lucide-react";

const wallets = [
  { id: "USR-002", name: "TechZone Kenya", role: "Seller", available: "KES 125,400", escrow: "KES 78,500", pending: "KES 34,200", total: "KES 2,450,000" },
  { id: "USR-005", name: "Grace Fashion House", role: "Seller", available: "KES 45,200", escrow: "KES 12,800", pending: "KES 8,400", total: "KES 890,000" },
  { id: "USR-002b", name: "PhoneWorld", role: "Seller", available: "KES 89,000", escrow: "KES 23,400", pending: "KES 15,600", total: "KES 1,230,000" },
  { id: "USR-001", name: "Edwin Kamau", role: "Buyer", available: "KES 15,400", escrow: "KES 22,000", pending: "KES 0", total: "KES 245,000" },
  { id: "USR-004", name: "Peter Mwangi", role: "Buyer", available: "KES 8,200", escrow: "KES 45,000", pending: "KES 0", total: "KES 156,000" },
];

export default function AdminWallets() {
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Wallet Management</h1>
        <p className="text-sm text-white/40 mt-1">Monitor all buyer and seller wallet balances</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Platform Balance", value: "KES 248.5M" },
          { label: "In Escrow", value: "KES 48.3M" },
          { label: "Available for Withdrawal", value: "KES 142.8M" },
          { label: "Pending", value: "KES 57.4M" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-nx-violet" />
          <h3 className="text-sm font-semibold text-white">All Wallets</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">User</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Role</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Available</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">In Escrow</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Pending</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden lg:table-cell">Total</th>
                <th className="text-right px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {wallets.map(w => (
                <tr key={w.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-nx-violet/15 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-nx-violet">{w.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm text-white/70">{w.name}</p>
                        <p className="text-[10px] text-white/20">{w.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><span className={`text-[10px] px-2 py-0.5 rounded font-medium ${w.role === "Seller" ? "bg-nx-violet/10 text-nx-violet" : "bg-nx-cyan/10 text-nx-cyan"}`}>{w.role}</span></td>
                  <td className="px-4 py-3.5"><p className="text-xs text-nx-emerald font-medium">{w.available}</p></td>
                  <td className="px-4 py-3.5 hidden md:table-cell"><p className="text-xs text-nx-gold">{w.escrow}</p></td>
                  <td className="px-4 py-3.5 hidden md:table-cell"><p className="text-xs text-white/40">{w.pending}</p></td>
                  <td className="px-4 py-3.5 hidden lg:table-cell"><p className="text-xs text-white/50">{w.total}</p></td>
                  <td className="px-4 py-3.5 text-right"><button className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors"><Eye className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
