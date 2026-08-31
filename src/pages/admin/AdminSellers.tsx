import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Users, Search, Eye, Mail, Shield, Ban, CheckCircle2 } from "lucide-react";

const sellers = [
  { id: "USR-002", name: "TechZone Kenya", email: "techzone@email.com", status: "Active", verified: true, products: 128, sales: 734, revenue: "KES 2.4M", rating: 4.8 },
  { id: "USR-003", name: "Sarah Wanjiku", email: "sarah@email.com", status: "Pending KYC", verified: false, products: 0, sales: 0, revenue: "KES 0", rating: 0 },
  { id: "USR-005", name: "Grace Fashion House", email: "grace@email.com", status: "Active", verified: true, products: 67, sales: 89, revenue: "KES 890,000", rating: 4.5 },
  { id: "USR-006", name: "James Odhiambo", email: "james@email.com", status: "Suspended", verified: false, products: 12, sales: 23, revenue: "KES 340,000", rating: 3.2 },
];

export default function AdminSellers() {
  const [search, setSearch] = useState("");
  const filtered = sellers.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Sellers</h1>
        <p className="text-sm text-white/40 mt-1">Manage all seller accounts — 3,245 total</p>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sellers..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0A0A12] border border-white/5 text-sm text-white placeholder-white/20 focus:border-nx-violet/30 focus:outline-none" />
      </div>
      <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/5">
              <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Seller</th>
              <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Products</th>
              <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Revenue</th>
              <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden lg:table-cell">Rating</th>
              <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Status</th>
              <th className="text-right px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-nx-violet/15 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-nx-violet">{s.name[0]}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5"><p className="text-sm text-white/70">{s.name}</p>{s.verified && <CheckCircle2 className="w-3 h-3 text-nx-emerald" />}</div>
                        <p className="text-[10px] text-white/25">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell text-xs text-white/40">{s.products}</td>
                  <td className="px-4 py-3.5 hidden md:table-cell text-xs text-white/50">{s.revenue}</td>
                  <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-nx-gold">{s.rating > 0 ? `${s.rating} ★` : "—"}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${s.status === "Active" ? "bg-nx-emerald/10 text-nx-emerald" : s.status === "Pending KYC" ? "bg-nx-gold/10 text-nx-gold" : "bg-red-400/10 text-red-400"}`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03]"><Eye className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 rounded text-white/20 hover:text-nx-cyan hover:bg-nx-cyan/5"><Mail className="w-3.5 h-3.5" /></button>
                      {s.status === "Suspended" && <button className="p-1.5 rounded text-white/20 hover:text-nx-emerald hover:bg-nx-emerald/5"><CheckCircle2 className="w-3.5 h-3.5" /></button>}
                      {s.status === "Active" && <button className="p-1.5 rounded text-white/20 hover:text-red-400 hover:bg-red-400/5"><Ban className="w-3.5 h-3.5" /></button>}
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
