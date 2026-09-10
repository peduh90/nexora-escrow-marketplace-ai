import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import { Users, Search, Eye, Mail, CheckCircle2, Clock, ChevronUp, ChevronDown, ExternalLink } from "lucide-react";

export default function AdminSellers() {
  const allUsers = useQuery(api.admin.getAllUsers);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const users = allUsers ?? [];

  // A seller is anyone with the seller role, a business name, or a pending
  // seller registration (still completing verification). This guarantees that
  // a brand-new seller registration (e.g. Femuki) shows up here immediately,
  // before their role is assigned.
  const isSeller = (u: any) =>
    u.role === "seller" || !!u.businessName || u.pendingRole === "seller";

  const sellers = users.filter(isSeller);

  const filtered = sellers.filter((s: any) =>
    !search ||
    (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.businessName || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = sellers.filter((s: any) => {
    const status = s.accountStatus || (s.role ? "active" : "pending");
    return status === "pending";
  }).length;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Sellers</h1>
        <p className="text-sm text-white/40 mt-1">
          Manage all seller accounts — {sellers.length} total
          {pendingCount > 0 ? ` · ${pendingCount} completing verification` : ""}
        </p>
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
          <p className="text-[11px] text-white/15 mt-1">Sellers will appear here the moment users register as sellers</p>
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
                {filtered.map((s: any) => {
                  const status = s.accountStatus || (s.role ? "active" : "pending");
                  const requested = s.pendingRole || s.role || "seller";
                  const isExpanded = expandedId === s._id;
                  const listingCount = s.listingCount ?? 0;
                  const orderCount = s.orderCount ?? 0;
                  return (
                    <tr key={s._id} className="hover:bg-white/[0.01] transition-colors align-top">
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
                        {isExpanded && (
                          <div className="mt-3 ml-11 p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1.5">
                            <p className="text-[10px] text-white/50">Requested role: <span className="text-white/80">{requested}</span></p>
                            <p className="text-[10px] text-white/50">Store type: <span className="text-white/80">{s.businessType || "Not specified"}</span></p>
                            <p className="text-[10px] text-white/50">Location: <span className="text-white/80">{[s.town, s.county, s.country].filter(Boolean).join(", ") || "Not set"}</span></p>
                            <p className="text-[10px] text-white/50">Phone: <span className="text-white/80">{s.phone || "Not set"}</span></p>
                            <p className="text-[10px] text-white/50">Listings: <span className="text-white/80">{listingCount}</span></p>
                            <p className="text-[10px] text-white/50">Orders: <span className="text-white/80">{orderCount}</span></p>
                            <p className="text-[10px] text-white/50">Total earned: <span className="text-white/80">KES {(s.totalEarned ?? 0).toLocaleString()}</span></p>
                            <p className="text-[10px] text-white/50">Wallet balance: <span className="text-white/80">KES {(s.walletBalance ?? 0).toLocaleString()}</span></p>
                            {s.storeDescription && (
                              <p className="text-[10px] text-white/50">About: <span className="text-white/70">{s.storeDescription}</span></p>
                            )}
                            <a
                              href={`/seller/${s._id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-nx-cyan hover:text-nx-cyan/80 mt-1"
                            >
                              View public store profile <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${s.kycStatus === "verified" ? "bg-nx-emerald/10 text-nx-emerald" : s.kycStatus === "pending" ? "bg-nx-gold/10 text-nx-gold" : "bg-white/5 text-white/30"}`}>
                          {s.kycStatus === "verified" ? "Verified" : s.kycStatus === "pending" ? "Pending" : "Not Started"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-white/40">{s.sellerTier || "Standard"}</td>
                      <td className="px-4 py-3.5">
                        {status === "pending" ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 font-medium flex items-center gap-1 w-fit" title={`Completing registration — requested role: ${requested}`}>
                            <Clock className="w-3 h-3" /> Verifying
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-nx-emerald/10 text-nx-emerald font-medium flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" />Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : s._id)}
                            className="p-1.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.03] transition-colors"
                            title={isExpanded ? "Hide details" : "View seller details"}
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          {s.email && (
                            <a
                              href={`mailto:${s.email}?subject=${encodeURIComponent("Nexora Market — seller account")}`}
                              className="p-1.5 rounded text-white/20 hover:text-nx-cyan hover:bg-nx-cyan/5 transition-colors"
                              title={`Email ${s.businessName || s.name || "seller"}`}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
