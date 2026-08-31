import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Users, Search, Filter, MoreVertical, Shield, CheckCircle2, XCircle, Eye, Ban, Mail } from "lucide-react";

const sampleUsers = [
  { id: "USR-001", name: "Edwin Kamau", email: "edwin@email.com", role: "Buyer", status: "Active", joined: "Jan 15, 2025", orders: 18, spent: "KES 245,000", verified: true },
  { id: "USR-002", name: "TechZone Kenya", email: "techzone@email.com", role: "Seller", status: "Active", joined: "Dec 3, 2024", orders: 734, spent: "KES 2.4M earned", verified: true },
  { id: "USR-003", name: "Sarah Wanjiku", email: "sarah@email.com", role: "Seller", status: "Pending KYC", joined: "Mar 22, 2025", orders: 0, spent: "KES 0", verified: false },
  { id: "USR-004", name: "Peter Mwangi", email: "peter@email.com", role: "Buyer", status: "Active", joined: "Feb 8, 2025", orders: 12, spent: "KES 156,000", verified: true },
  { id: "USR-005", name: "Grace Fashion House", email: "grace@email.com", role: "Seller", status: "Active", joined: "Jan 28, 2025", orders: 89, spent: "KES 890,000 earned", verified: true },
  { id: "USR-006", name: "James Odhiambo", email: "james@email.com", role: "Seller", status: "Suspended", joined: "Nov 15, 2024", orders: 23, spent: "KES 340,000 earned", verified: false },
  { id: "USR-007", name: "Lucy Wambui", email: "lucy@email.com", role: "Buyer", status: "Active", joined: "Apr 1, 2025", orders: 5, spent: "KES 78,000", verified: true },
  { id: "USR-008", name: "Michael Chen", email: "michael@email.com", role: "Buyer", status: "Active", joined: "Mar 10, 2025", orders: 22, spent: "KES 567,000", verified: true },
];

export default function AdminUsers() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = sampleUsers.filter(u => {
    if (filter === "Buyers" && u.role !== "Buyer") return false;
    if (filter === "Sellers" && u.role !== "Seller") return false;
    if (filter === "Suspended" && u.status !== "Suspended") return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-sm text-white/40 mt-1">Manage all platform users — {sampleUsers.length.toLocaleString()} total</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Users", value: "52,847", color: "#8B5CF6" },
          { label: "Active Buyers", value: "42,312", color: "#06B6D4" },
          { label: "Verified Sellers", value: "3,245", color: "#10B981" },
          { label: "Suspended", value: "89", color: "#EF4444" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0A0A12] border border-white/5 text-sm text-white placeholder-white/20 focus:border-nx-violet/30 focus:outline-none" />
        </div>
        <div className="flex gap-1">
          {["All", "Buyers", "Sellers", "Suspended"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-nx-violet/10 text-nx-violet" : "text-white/30 hover:text-white/50 bg-[#0A0A12] border border-white/5"}`}>{f}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider hidden md:table-cell">Role</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider hidden lg:table-cell">Activity</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                <th className="text-right px-4 py-3 text-[10px] font-medium text-white/30 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-nx-violet/15 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-nx-violet">{user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm text-white/70 font-medium">{user.name}</p>
                          {user.verified && <CheckCircle2 className="w-3 h-3 text-nx-emerald" />}
                        </div>
                        <p className="text-[10px] text-white/25">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${user.role === "Seller" ? "bg-nx-violet/10 text-nx-violet" : "bg-nx-cyan/10 text-nx-cyan"}`}>{user.role}</span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <p className="text-xs text-white/40">{user.orders} orders</p>
                    <p className="text-[10px] text-white/25">{user.spent}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${user.status === "Active" ? "bg-nx-emerald/10 text-nx-emerald" : user.status === "Pending KYC" ? "bg-nx-gold/10 text-nx-gold" : "bg-red-400/10 text-red-400"}`}>{user.status}</span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-[10px] text-white/25">{user.joined}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors" title="View"><Eye className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 rounded text-white/20 hover:text-nx-cyan hover:bg-nx-cyan/5 transition-colors" title="Message"><Mail className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 rounded text-white/20 hover:text-red-400 hover:bg-red-400/5 transition-colors" title="Ban"><Ban className="w-3.5 h-3.5" /></button>
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
