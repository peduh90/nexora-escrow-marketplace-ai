import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { Users, Search, Eye, Mail, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";

export default function AdminSellers() {
  const allUsers = useQuery(api.users.getAllUsers);
  const reviewSeller = useMutation(api.admin.reviewSellerApproval);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const users = allUsers ?? [];
  const sellers = users.filter((u: any) => u.role === "seller");

  const filtered = sellers.filter((s: any) =>
    !search || (s.name || "").toLowerCase().includes(search.toLowerCase()) || (s.businessName || "").toLowerCase().includes(search.toLowerCase()) || (s.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (s: any) => {
    const st = s.sellerStatus || "approved";
    if (st === "pending") return <span className="text-[10px] px-2 py-0.5 rounded bg-nx-gold/10 text-nx-gold font-medium flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>;
    if (st === "rejected") return <span className="text-[10px] px-2 py-0.5 rounded bg-red-400/10 text-red-400 font-medium">Rejected</span>;
    return <span className="text-[10px] px-2 py-0.5 rounded bg-nx-emerald/10 text-nx-emerald font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Approved</span>;
  };

  const handleDecision = async (userId: string, status: "approved" | "rejected") => {
    setBusy(`seller-${userId}`);
    try {
      await reviewSeller({ userId, status });
    } catch (err) {
      console.error("Seller review failed:", err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Sellers</h1>
        <p className="text-sm text-white/40 mt-1">Manage all seller accounts — {sellers.length} total</p>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sellers..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0A0A12] border border-white/5 text-sm text-white placeholder-white/20 focus:border-nx-violet/30 focus:outline-none" />
      </div>

      {sellers.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] py-16 flex flex-col items-center">
          <Users className="w-8 h-8 text-white/10 mb-3" />
          <p className="text-sm text-white/30">No sellers yet</p>
          <p className="text-[11px] text-white/15 mt-1">Sellers will appear here once users register as sellers</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-[#0A0A12] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Seller</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden md:table-cell">KYC</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden lg:table-cell">Tier</th>
                <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map((s: any) => (
                  <tr key={s._id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-nx-violet/15 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-nx-violet">{(s.name || "S")[0]}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5"><p className="text-sm text-white/70">{s.businessName || s.name || "Unknown"}</p>{s.kycStatus === "verified" && <CheckCircle2 className="w-3 h-3 text-nx-emerald" />}</div>
                          <p className="text-[10px] text-white/25">{s.email || ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${s.kycStatus === "verified" ? "bg-nx-emerald/10 text-nx-emerald" : s.kycStatus === "pending" ? "bg-nx-gold/10 text-nx-gold" : "bg-white/5 text-white/30"}`}>
                        {s.kycStatus === "verified" ? "Verified" : s.kycStatus === "pending" ? "Pending" : "Not Started"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-white/40">{s.sellerTier || "Standard"}</td>
                    <td className="px-4 py-3.5">{statusBadge(s)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(s.sellerStatus === "pending" || s.sellerStatus === "rejected") && (
                          <button
                            onClick={() => handleDecision(s._id, "approved")}
                            disabled={busy === `seller-${s._id}`}
                            className="p-1.5 rounded text-nx-emerald/60 hover:text-nx-emerald hover:bg-nx-emerald/10 transition-colors disabled:opacity-50"
                            title="Approve store"
                          >
                            {busy === `seller-${s._id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        {s.sellerStatus === "pending" && (
                          <button
                            onClick={() => handleDecision(s._id, "rejected")}
                            disabled={busy === `seller-${s._id}`}
                            className="p-1.5 rounded text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                            title="Reject store"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
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
