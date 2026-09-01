import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { Users, Search, Eye, Mail, CheckCircle2 } from "lucide-react";

export default function AdminBuyers() {
  const allUsers = useQuery(api.users.getAllUsers);
  const [search, setSearch] = useState("");

  const users = allUsers ?? [];
  const buyers = users.filter((u: any) => u.role === "buyer" || (!u.role || u.role === "buyer"));

  const filtered = buyers.filter((b: any) =>
    !search || (b.name || "").toLowerCase().includes(search.toLowerCase()) || (b.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Buyers</h1>
        <p className="text-sm text-white/40 mt-1">Manage all buyer accounts — {buyers.length} total</p>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search buyers..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0A0A12] border border-white/5 text-sm text-white placeholder-white/20 focus:border-nx-violet/30 focus:outline-none" />
      </div>

      {buyers.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <Users className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No buyers yet</p>
          <p className="text-[11px] text-white/15 mt-1">Buyers will appear here once users register</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Buyer</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Purchases</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map((b: any) => (
                  <tr key={b._id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-nx-cyan/15 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-nx-cyan">{(b.name || "U")[0]}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5"><p className="text-sm text-white/70">{b.name || "Unknown"}</p>{b.kycStatus === "verified" && <CheckCircle2 className="w-3 h-3 text-nx-emerald" />}</div>
                          <p className="text-[10px] text-white/25">{b.email || ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-xs text-white/40">{b.totalPurchases || 0}</td>
                    <td className="px-4 py-3.5"><span className="text-[10px] px-2 py-0.5 rounded bg-nx-emerald/10 text-nx-emerald font-medium">Active</span></td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03]"><Eye className="w-3.5 h-3.5" /></button>
                        <button className="p-1.5 rounded text-white/20 hover:text-nx-cyan hover:bg-nx-cyan/5"><Mail className="w-3.5 h-3.5" /></button>
                      </div>
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
