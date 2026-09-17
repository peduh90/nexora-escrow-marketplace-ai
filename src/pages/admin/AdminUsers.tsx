import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import AdminLayout from "./AdminLayout";
import {
  Users, Search, CheckCircle2, Ban, RotateCcw, Loader2, ShieldAlert, MapPin,
} from "lucide-react";

const OWNER_EMAIL = "murimiedwin227@gmail.com";

export default function AdminUsers() {
  const navigate = useNavigate();
  const allUsers = useQuery(api.admin.getAllUsers);
  const counts = useQuery(api.admin.getUserCounts);
  const setUserSuspended = useMutation(api.admin.setUserSuspended);
  // ?q= deep-link support — the AdminLayout topbar search navigates here.
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [suspending, setSuspending] = useState<{ id: string; name: string } | null>(null);
  const [reason, setReason] = useState("");

  const users = (allUsers ?? []).filter((u: any) => u.email && u.email.includes("@") && u.name !== "Guest User");

  // Determine effective role: prefer role field, fall back to businessName (seller),
  // a pending seller registration, or buyer. Pending registrations are shown
  // with their requested role so new sellers are never mistaken for buyers.
  const effectiveRole = (u: any) => {
    if (u.role === "admin") return "admin";
    if (u.role === "seller" || u.businessName || u.pendingRole === "seller") return "seller";
    // A freelancer is a person: role assigned by the freelance join flow OR a
    // completed freelance profile. The two must agree with the stat card.
    if (u.role === "freelancer" || u.freelanceTitle) return "freelancer";
    if (u.role === "employer") return "employer";
    if (u.role === "driver") return "driver";
    return "buyer";
  };
  const filtered = users.filter((u: any) => {
    const role = effectiveRole(u);
    switch (filter) {
      // ─── Marketplace groups: every seller appears in its role group;
      //     the listing counts only enrich the rows, never hide people. ───
      case "Product Sellers":
        if (role !== "seller") return false;
        break;
      case "Digital Sellers":
        if (role !== "seller" || (u.freelanceListings ?? 0) === 0) return false;
        break;
      case "Freelancers":
        if (role !== "freelancer") return false;
        break;
      case "Employers":
        if (role !== "employer") return false;
        break;
      case "Buyers":
        if (role !== "buyer") return false;
        break;
      case "Service Providers":
        if (!u.serviceType) return false;
        break;
      case "Transport Providers":
        if (!u.transportType) return false;
        break;
      case "AI Taskers":
        if (!(u.aiTasksPosted > 0) && !(u.aiTasksWorked > 0)) return false;
        break;
      case "Creators":
        if (!u.creatorStatus) return false;
        break;
      case "Suspended":
        if (u.accountStatus !== "suspended") return false;
        break;
      case "Admins":
        if (role !== "admin") return false;
        break;
    }
    if (search && !(u.name || "").toLowerCase().includes(search.toLowerCase()) && !(u.email || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const buyerCount = counts?.buyers ?? users.filter((u: any) => effectiveRole(u) === "buyer").length;
  const sellerCount = counts?.sellers ?? users.filter((u: any) => effectiveRole(u) === "seller").length;
  const freelancerCount = counts?.freelancers ?? users.filter((u: any) => effectiveRole(u) === "freelancer").length;
  const employerCount = counts?.employers ?? users.filter((u: any) => effectiveRole(u) === "employer").length;
  const suspendedCount = users.filter((u: any) => u.accountStatus === "suspended").length;
  // Service/transport providers (any marketplace role — provider is a layer,
  // not a separate account type).
  const providerCount = counts?.serviceProviders ?? users.filter((u: any) => u.serviceType || u.transportType).length;
  // Marketplace-group counts for the dedicated filter tabs. Product Sellers
  // counts ALL seller accounts (with or without listings yet) so the number
  // in the tab always matches the rows beneath it.
  const productSellerCount = users.filter((u: any) => effectiveRole(u) === "seller").length;
  const digitalSellerCount = users.filter((u: any) => effectiveRole(u) === "seller" && (u.freelanceListings ?? 0) > 0).length;
  const transportCount = users.filter((u: any) => !!u.transportType).length;
  const aiTaskerCount = users.filter((u: any) => u.aiTasksPosted > 0 || u.aiTasksWorked > 0).length;
  const creatorCount = users.filter((u: any) => !!u.creatorStatus).length;

  const handleSuspend = async () => {
    if (!suspending) return;
    setBusyId(suspending.id);
    try {
      await setUserSuspended({ userId: suspending.id, suspended: true, reason: reason.trim() || undefined });
      toast.success(`${suspending.name} has been suspended`);
    } catch (err: any) {
      toast.error(err?.message || "Could not suspend user");
    } finally {
      setBusyId(null);
      setSuspending(null);
      setReason("");
    }
  };

  const handleReinstate = async (u: any) => {
    setBusyId(u._id);
    try {
      await setUserSuspended({ userId: u._id, suspended: false });
      toast.success(`${u.name || u.email} has been reinstated`);
    } catch (err: any) {
      toast.error(err?.message || "Could not reinstate user");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-sm text-white/40 mt-1">Manage all platform users — {counts?.total ?? users.length} total</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total Users", value: (counts?.total ?? users.length).toString(), color: "#8B5CF6" },
          { label: "Buyers", value: buyerCount.toString(), color: "#06B6D4" },
          { label: "Product Sellers", value: sellerCount.toString(), color: "#10B981" },
          { label: "Freelancers", value: freelancerCount.toString(), color: "#34D399" },
          { label: "Employers", value: employerCount.toString(), color: "#F59E0B" },
          { label: "Service Providers", value: providerCount.toString(), color: "#22D3EE" },
          { label: "Digital Sellers", value: digitalSellerCount.toString(), color: "#A78BFA" },
          { label: "Transport", value: transportCount.toString(), color: "#38BDF8" },
          { label: "AI Taskers", value: aiTaskerCount.toString(), color: "#818CF8" },
          { label: "Creators", value: creatorCount.toString(), color: "#E879F9" },
          { label: "Suspended", value: suspendedCount.toString(), color: "#EF4444" },
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
          <input value={search} onChange={e => { setSearch(e.target.value); setSearchParams(e.target.value ? { q: e.target.value } : {}); }} placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0A0A12] border border-white/5 text-sm text-white placeholder-white/20 focus:border-nx-violet/30 focus:outline-none" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["All", "Buyers", "Product Sellers", "Digital Sellers", "Freelancers", "Employers", "Service Providers", "Transport Providers", "AI Taskers", "Creators", "Suspended", "Admins"].map(f => (
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
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden lg:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden lg:table-cell">Location</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden lg:table-cell">Freelance</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase hidden xl:table-cell">Service</th>
                  <th className="text-left px-4 py-3 text-[10px] font-medium text-white/30 uppercase">KYC</th>
                  <th className="text-right px-4 py-3 text-[10px] font-medium text-white/30 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map((user: any) => {
                  const suspended = user.accountStatus === "suspended";
                  const isOwnerAccount = user.email === OWNER_EMAIL || effectiveRole(user) === "admin";
                  return (
                  <tr key={user._id} className={`hover:bg-white/[0.01] transition-colors ${suspended ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-nx-violet/15 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-nx-violet">{(user.name || user.email?.split("@")[0] || "U").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm text-white/70 font-medium">{user.name || user.email?.split("@")[0] || "Unknown"}</p>
                            {user.kycStatus === "verified" && <CheckCircle2 className="w-3 h-3 text-nx-emerald" />}
                            {suspended && <Ban className="w-3 h-3 text-red-400" />}
                          </div>
                          <p className="text-[10px] text-white/25">{user.email || ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {(() => {
                        const status = (user as any).accountStatus || ((user as any).role ? "active" : "pending");
                        const requested = (user as any).pendingRole || effectiveRole(user);
                        if (suspended) {
                          return (
                            <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-red-400/10 text-red-400" title={user.suspensionReason || "Suspended"}>
                              ⛔ suspended
                            </span>
                          );
                        }
                        if (status === "pending") {
                          return (
                            <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-amber-400/10 text-amber-400" title={`Awaiting verification — requested role: ${requested}`}>
                              ⏳ {requested} (pending)
                            </span>
                          );
                        }
                        const r = effectiveRole(user);
                        return (<span className={`text-[10px] px-2 py-0.5 rounded font-medium ${r === "seller" ? "bg-nx-violet/10 text-nx-violet" : r === "admin" ? "bg-nx-gold/10 text-nx-gold" : r === "freelancer" ? "bg-emerald-500/10 text-emerald-400" : r === "employer" ? "bg-amber-500/10 text-amber-400" : "bg-nx-cyan/10 text-nx-cyan"}`}>{r}</span>);
                      })()}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {user.phone ? (
                        <a
                          href={`tel:${user.phone}`}
                          className="text-[10px] text-white/60 hover:text-nx-cyan transition-colors tabular-nums"
                          title="Call the registered number"
                        >
                          {user.phone}
                        </a>
                      ) : (
                        <span className="text-[10px] text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <p className="text-[10px] text-white/25">{[user.county, user.town].filter(Boolean).join(", ") || "—"}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {user.freelanceTitle ? (
                        <button
                          onClick={() => navigate("/admin/freelancers")}
                          title={`Freelance profile — ${user.freelanceTitle} · ${(user.freelanceSkills || []).slice(0, 3).join(", ")}`}
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20 transition-colors"
                        >
                          {user.freelanceTitle}{user.freelanceVerified ? " ✓" : ""}
                        </button>
                      ) : (
                        <span className="text-[10px] text-white/15">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      {user.aiTasksPosted > 0 || user.aiTasksWorked > 0 ? (
                        <button
                          onClick={() => setFilter("AI Taskers")}
                          title={`${user.aiTasksPosted || 0} posted · ${user.aiTasksWorked || 0} worked`}
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium bg-indigo-400/10 text-indigo-300 hover:bg-indigo-400/20 transition-colors"
                        >
                          AI · {user.aiTasksPosted || 0}p/{user.aiTasksWorked || 0}w
                        </button>
                      ) : user.serviceType || user.transportType ? (
                        <button
                          onClick={() => navigate("/admin/services")}
                          title="Open Services & Transport management"
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20 transition-colors"
                        >
                          <MapPin className="w-3 h-3" />
                          {user.serviceType ? `${user.serviceType}${user.serviceVerified ? " ✓" : " ·"}` : `${user.transportType}${user.transportVerified ? " ✓" : " ·"}`}
                        </button>
                      ) : (
                        <span className="text-[10px] text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${user.kycStatus === "verified" ? "bg-nx-emerald/10 text-nx-emerald" : user.kycStatus === "pending" ? "bg-nx-gold/10 text-nx-gold" : "bg-white/5 text-white/30"}`}>
                        {user.kycStatus === "verified" ? "Verified" : user.kycStatus === "pending" ? "Pending" : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {suspended ? (
                          <button
                            onClick={() => handleReinstate(user)}
                            disabled={busyId === user._id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-nx-emerald/10 text-nx-emerald text-[11px] font-medium hover:bg-nx-emerald/20 transition-colors disabled:opacity-50"
                            title="Reinstate account"
                          >
                            {busyId === user._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                            Reinstate
                          </button>
                        ) : isOwnerAccount ? (
                          <span className="text-[10px] text-nx-gold/60 px-2 py-1 flex items-center gap-1" title="Admin accounts cannot be suspended">
                            <ShieldAlert className="w-3 h-3" /> Protected
                          </span>
                        ) : (
                          <button
                            onClick={() => { setSuspending({ id: user._id, name: user.name || user.email }); setReason(""); }}
                            disabled={busyId === user._id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-400/10 text-red-400 text-[11px] font-medium hover:bg-red-400/20 transition-colors disabled:opacity-50"
                            title="Suspend account"
                          >
                            <Ban className="w-3 h-3" /> Suspend
                          </button>
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

      {/* Suspend confirmation dialog */}
      {suspending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => !busyId && setSuspending(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-red-400/15 bg-[#0A0A12] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-400/10 flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Suspend {suspending.name}?</h3>
                <p className="text-[11px] text-white/35">They will be locked out of all panels and unable to place orders.</p>
              </div>
            </div>
            <label className="block text-xs text-white/40 mb-1.5">Reason (shown to the user)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Repeated fraudulent listings"
              autoFocus
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-red-400/40 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setSuspending(null)}
                disabled={!!busyId}
                className="flex-1 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-white/50 text-sm font-medium hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={!!busyId}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busyId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
