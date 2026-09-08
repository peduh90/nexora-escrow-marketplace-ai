import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { Users, Search, Shield, CheckCircle2, Eye, Ban, Mail } from "lucide-react";

export default function AdminUsers() {
  const allUsers = useQuery(api.admin.getAllUsers);
  const counts = useQuery(api.admin.getUserCounts);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const users = (allUsers ?? []).filter((u: any) => u.email && u.email.includes("@") && u.name !== "Guest User");

  // Determine effective role: prefer role field, fall back to businessName (seller) or buyer
  const effectiveRole = (u: any) => {
    if (u.role === "admin") return "admin";
    if (u.role === "seller") return "seller";
    if (u.role === "freelancer") return "freelancer";
    if (u.role === "driver") return "driver";
    if (u.businessName) return "seller";
    return "buyer";
  };
  const filtered = users.filter((u: any) => {
    const role = effectiveRole(u);
    if (filter === "Buyers" && role !== "buyer") return false;
    if (filter === "Sellers" && role !== "seller") return false;
    if (filter === "Freelancers" && role !== "freelancer") return false;
    if (filter === "Admins" && role !== "admin") return false;
    if (search && !(u.name || "").toLowerCase().includes(search.toLowerCase()) && !(u.email || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const buyerCount = counts?.buyers ?? users.filter((u: any) => effectiveRole(u) === "buyer").length;
  const sellerCount = counts?.sellers ?? users.filter((u: any) => effectiveRole(u) === "seller").length;
  const freelancerCount = counts?.freelancers ?? users.filter((u: any) => effectiveRole(u) === "freelancer").length;
  const adminCount = counts?.admins ?? users.filter((u: any) => effectiveRole(u) === "admin").length;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-sm text-white/40 mt-1">Manage all platform users — {counts?.total ?? users.length} total</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Users", value: (counts?.total ?? users.length).toString(), color: "#8B5CF6" },
          { label: "Buyers", value: (counts?.buyers ?? buyerCount).toString(), color: "#06B6D4" },
          { label: "Sellers", value: (counts?.sellers ?? sellerCount).toString(), color: "#10B981" },
          { label: "Freelancers", value: freelancerCount.toString(), color: "#10B981" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl border border-white/5 bg-[#0A0A12]">
            <p className="text-[10px] text-white/30 uppercase">{s.label}</p>
            <p className="text-xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0A0A12] border border-white/5 text-sm text-white placeholder-white/20 focus:border-nx-violet/30 focus:outline-none" />
        </div>
        <div className="flex gap-1">
          {["All", "Buyers", "Sellers", "Freelancers", "Admins"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-nx-violet/10 text-nx-violet" : "text-white/30 hover:text-white/50 bg-[#0A0A12] border border-white/5"}`}>{f}</button>
          ))}
        </div>
      </div>

      {users.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <Users className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No users yet</p>
          <p className="text-[11px] text-white/15 mt-1">Users will appear here once they register</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">User</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">Role</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden lg:table-cell">Location</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">KYC</th>
                  <th className="text-right px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map((user: any) => (
                  <tr key={user._id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-nx-violet/15 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-nx-violet">{(user.name || user.email?.split("@")[0] || "U").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm text-white/70 font-medium">{user.name || user.email?.split("@")[0] || "Unknown"}</p>
                            {user.kycStatus === "verified" && <CheckCircle2 className="w-3 h-3 text-nx-emerald" />}
                          </div>
                          <p className="text-[10px] text-white/25">{user.email || ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {(() => {
                        const status = (user as any).accountStatus || ((user as any).role ? "active" : "pending");
                        const requested = (user as any).pendingRole || effectiveRole(user);
                        if (status === "pending") {
                          return (
                            <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-amber-400/10 text-amber-400" title={`Awaiting verification — requested role: ${requested}`}>
                              ⏳ {requested} (pending)
                            </span>
                          );
                        }
                        const r = effectiveRole(user);
                        return (<span className={`text-[10px] px-2 py-0.5 rounded font-medium ${r === "seller" ? "bg-nx-violet/10 text-nx-violet" : r === "admin" ? "bg-nx-gold/10 text-nx-gold" : r === "freelancer" ? "bg-emerald-500/10 text-emerald-400" : "bg-nx-cyan/10 text-nx-cyan"}`}>{r}</span>);
                      })()}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <p className="text-[10px] text-white/25">{[user.county, user.town].filter(Boolean).join(", ") || "—"}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${user.kycStatus === "verified" ? "bg-nx-emerald/10 text-nx-emerald" : user.kycStatus === "pending" ? "bg-nx-gold/10 text-nx-gold" : "bg-white/5 text-white/30"}`}>
                        {user.kycStatus === "verified" ? "Verified" : user.kycStatus === "pending" ? "Pending" : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors" title="View"><Eye className="w-3.5 h-3.5" /></button>
                        <button className="p-1.5 rounded text-white/20 hover:text-nx-cyan hover:bg-nx-cyan/5 transition-colors" title="Message"><Mail className="w-3.5 h-3.5" /></button>
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
